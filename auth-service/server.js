import express from 'express';
import cors from 'cors';
// ELIMINAMOS: import sqlite3 from 'sqlite3';
// ELIMINAMOS: import {open} from 'sqlite';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg'; // <-- NUEVO: Importamos el driver de PostgreSQL

// Cargar .env de forma robusta (independiente del cwd). Asume que .env está
// en la raíz del proyecto (una carpeta arriba de auth-service).
const __dirname = dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: join(__dirname, '..', '.env') });

// DEBUG: imprimir estado de las variables de entorno relevantes (no imprimir la contraseña completa)
console.log('ENV DEBUG ->', {
  PG_HOST: process.env.PG_HOST,
  PG_PORT: process.env.PG_PORT,
  PG_USER: process.env.PG_USER,
  PG_DATABASE: process.env.PG_DATABASE,
  PG_PASSWORD_present: typeof process.env.PG_PASSWORD !== 'undefined' && process.env.PG_PASSWORD !== null && process.env.PG_PASSWORD !== '',
  CORS_ORIGIN: process.env.CORS_ORIGIN,
});

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: '*' }));

// ELIMINAMOS: const DB_PATH = process.env.DB_PATH || '../data/app.db';
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

// ------------------------------------------------------------------
// NUEVA CONFIGURACIÓN DE CONEXIÓN CON POSTGRESQL
// ------------------------------------------------------------------
const { Pool } = pg; 

const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});

// La función 'db' ahora devuelve el Pool, que usaremos para consultas.
async function db(){
  return pool;
}
// ------------------------------------------------------------------


// bootstrap roles + admin on start
(async()=>{
  const conn = await db(); // conn es ahora el Pool de pg
  
  // 1. CREACIÓN DE TABLAS (Sintaxis de PostgreSQL con SERIAL PRIMARY KEY)
  await conn.query(`
    CREATE TABLE IF NOT EXISTS roles(id SERIAL PRIMARY KEY, nombre TEXT UNIQUE);
    CREATE TABLE IF NOT EXISTS usuarios(id SERIAL PRIMARY KEY, username TEXT UNIQUE, password_hash TEXT, estado TEXT DEFAULT 'ACTIVO');
    CREATE TABLE IF NOT EXISTS usuarios_roles(
      usuario_id INTEGER REFERENCES usuarios(id), 
      rol_id INTEGER REFERENCES roles(id), 
      PRIMARY KEY(usuario_id, rol_id)
    );
  `);
  
  const roles = ['ADMIN','EDITOR','USUARIO'];
  for(const r of roles){ 
    // Usamos $1 y ON CONFLICT DO NOTHING (el equivalente a INSERT OR IGNORE)
    await conn.query('INSERT INTO roles(nombre) VALUES ($1) ON CONFLICT DO NOTHING', [r]); 
  }
  
  const adminUser = process.env.ADMIN_USER || 'admin';
  const adminPass = process.env.ADMIN_PASS || 'admin123';
  
  // 2. SELECT y acceso al primer resultado (.rows[0])
  const uRes = await conn.query('SELECT * FROM usuarios WHERE username=$1', [adminUser]);
  const u = uRes.rows[0]; 

  if(!u){
    const hash = bcrypt.hashSync(adminPass, 10);
    
    // 3. INSERT con RETURNING id para obtener el ID de la nueva fila.
    const insRes = await conn.query('INSERT INTO usuarios(username,password_hash) VALUES ($1,$2) RETURNING id', [adminUser, hash]);
    const userId = insRes.rows[0].id; // El ID se obtiene de insRes.rows[0].id
    
    // Obtenemos el ID del rol de Admin
    const adminRoleRes = await conn.query('SELECT id FROM roles WHERE nombre=$1', ['ADMIN']);
    const adminRole = adminRoleRes.rows[0];
    
    // 4. Insertamos en la tabla relacional
    await conn.query('INSERT INTO usuarios_roles(usuario_id,rol_id) VALUES ($1,$2)', [userId, adminRole.id]);
    
    console.log('Admin creado:', adminUser);
  }
})();

function sign(user){
  return jwt.sign({sub:user.id, username:user.username, role:user.role}, JWT_SECRET, {expiresIn:'2d'});
}

app.post('/login', async (req,res)=>{
  const {username,password} = req.body||{};
  const conn = await db();
  
  // CAMBIO AQUÍ: Usamos $1 y .rows[0] para SELECT
  const uRes = await conn.query('SELECT * FROM usuarios WHERE username=$1', [username]);
  const u = uRes.rows[0];
  
  if(!u) return res.status(401).send('Credenciales inválidas');
  const ok = bcrypt.compareSync(password, u.password_hash||'');
  if(!ok) return res.status(401).send('Credenciales inválidas');
  
  // CAMBIO AQUÍ: Usamos $1 y .rows[0] para SELECT
  const roleRowRes = await conn.query('SELECT r.nombre FROM roles r JOIN usuarios_roles ur ON ur.rol_id=r.id WHERE ur.usuario_id=$1 LIMIT 1', [u.id]);
  const roleRow = roleRowRes.rows[0];
  
  const token = sign({id:u.id, username:u.username, role: roleRow?.nombre || 'USUARIO'});
  res.cookie('token', token, {httpOnly:true, sameSite:'Lax', secure:false, maxAge: 2*24*60*60*1000});
  res.json({ok:true});
});

app.post('/logout', (req,res)=>{ res.clearCookie('token'); res.json({ok:true}); });

// Endpoint para registrar nuevos usuarios
app.post('/register', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) return res.status(400).json({ error: 'username and password required' });

  try {
    const conn = await db();
    // Verificar usuario existente
    const existsRes = await conn.query('SELECT id FROM usuarios WHERE username=$1', [username]);
    if (existsRes.rows[0]) {
      return res.status(409).json({ error: 'Usuario ya existe' });
    }

    // Crear usuario con hash
    const hash = bcrypt.hashSync(password, 10);
    const insRes = await conn.query('INSERT INTO usuarios(username,password_hash) VALUES ($1,$2) RETURNING id', [username, hash]);
    const userId = insRes.rows[0].id;

    // Asignar rol por defecto 'USUARIO' si existe
    const roleRes = await conn.query('SELECT id FROM roles WHERE nombre=$1 LIMIT 1', ['USUARIO']);
    const roleId = roleRes.rows[0]?.id;
    if (roleId) {
      await conn.query('INSERT INTO usuarios_roles(usuario_id,rol_id) VALUES ($1,$2)', [userId, roleId]);
    }

    return res.status(201).json({ ok: true });
  } catch (e) {
    console.error('Error en /register:', e);
    return res.status(500).json({ error: e.message });
  }
});

function auth(req,res,next){
  const token = req.cookies.token;
  if(!token) return res.status(401).send('No autenticado');
  try{ req.user = jwt.verify(token, JWT_SECRET); next(); }
  catch{ return res.status(401).send('Sesión inválida'); }
}

app.get('/me', auth, (req,res)=>{ res.json({username:req.user.username, role:req.user.role}); });

const port = process.env.PORT||4001;
// Bind explícito a 0.0.0.0 para asegurar accesibilidad vía IPv4 (evita problemas de binding IPv6-only)
app.listen(port, '0.0.0.0', ()=> console.log(`Servidor auth-service escuchando en http://0.0.0.0:${port}`));
