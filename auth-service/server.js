
import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import {open} from 'sqlite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({origin: process.env.CORS_ORIGIN || 'http://localhost:8080', credentials:true}));

const DB_PATH = process.env.DB_PATH || '../data/app.db';
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

async function db(){
  return open({filename:DB_PATH, driver:sqlite3.Database});
}

// bootstrap roles + admin on start
(async()=>{
  const conn = await db();
  await conn.exec(`CREATE TABLE IF NOT EXISTS roles(id INTEGER PRIMARY KEY AUTOINCREMENT, nombre TEXT UNIQUE);
                   CREATE TABLE IF NOT EXISTS usuarios(id INTEGER PRIMARY KEY AUTOINCREMENT, username TEXT UNIQUE, password_hash TEXT, estado TEXT DEFAULT 'ACTIVO');
                   CREATE TABLE IF NOT EXISTS usuarios_roles(usuario_id INTEGER, rol_id INTEGER, PRIMARY KEY(usuario_id, rol_id));`);
  const roles = ['ADMIN','EDITOR','USUARIO'];
  for(const r of roles){ await conn.run('INSERT OR IGNORE INTO roles(nombre) VALUES (?)', r); }
  const adminUser = process.env.ADMIN_USER || 'admin';
  const adminPass = process.env.ADMIN_PASS || 'admin123';
  const u = await conn.get('SELECT * FROM usuarios WHERE username=?', adminUser);
  if(!u){
    const hash = bcrypt.hashSync(adminPass, 10);
    const ins = await conn.run('INSERT INTO usuarios(username,password_hash) VALUES (?,?)', adminUser, hash);
    const adminRole = await conn.get('SELECT id FROM roles WHERE nombre="ADMIN"');
    await conn.run('INSERT INTO usuarios_roles(usuario_id,rol_id) VALUES (?,?)', ins.lastID, adminRole.id);
    console.log('Admin creado:', adminUser);
  }
})();

function sign(user){
  return jwt.sign({sub:user.id, username:user.username, role:user.role}, JWT_SECRET, {expiresIn:'2d'});
}

app.post('/login', async (req,res)=>{
  const {username,password} = req.body||{};
  const conn = await db();
  const u = await conn.get('SELECT * FROM usuarios WHERE username=?', username);
  if(!u) return res.status(401).send('Credenciales inválidas');
  const ok = bcrypt.compareSync(password, u.password_hash||'');
  if(!ok) return res.status(401).send('Credenciales inválidas');
  const roleRow = await conn.get('SELECT r.nombre FROM roles r JOIN usuarios_roles ur ON ur.rol_id=r.id WHERE ur.usuario_id=? LIMIT 1', u.id);
  const token = sign({id:u.id, username:u.username, role: roleRow?.nombre || 'USUARIO'});
  res.cookie('token', token, {httpOnly:true, sameSite:'Lax', secure:false, maxAge: 2*24*60*60*1000});
  res.json({ok:true});
});

app.post('/logout', (req,res)=>{ res.clearCookie('token'); res.json({ok:true}); });

function auth(req,res,next){
  const token = req.cookies.token;
  if(!token) return res.status(401).send('No autenticado');
  try{ req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch{ return res.status(401).send('Sesión inválida'); }
}

app.get('/me', auth, (req,res)=>{ res.json({username:req.user.username, role:req.user.role}); });

const port = process.env.PORT||4001;
app.listen(port, ()=> console.log('auth-service en puerto', port));
