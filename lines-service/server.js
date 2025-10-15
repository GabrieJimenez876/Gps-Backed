
import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import {open} from 'sqlite';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import dotenv from 'dotenv';
import Joi from 'joi';
dotenv.config();

const app = express();
app.use(express.json({limit:'2mb'}));
app.use(cookieParser());
app.use(cors({origin: process.env.CORS_ORIGIN || 'http://localhost:8080', credentials:true}));

const DB_PATH = process.env.DB_PATH || '../data/app.db';
const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

async function db(){ return open({filename:DB_PATH, driver:sqlite3.Database}); }

function auth(req,res,next){
  const token = req.cookies.token; if(!token) return res.status(401).send('No autenticado');
  try{ req.user = jwt.verify(token, JWT_SECRET); next(); }catch{ return res.status(401).send('Sesión inválida'); }
}
function onlyEditor(req,res,next){ if(['ADMIN','EDITOR'].includes(req.user.role)) return next(); return res.status(403).send('Sin permiso'); }

// Ensure schema on boot
(async()=>{
  const conn = await db();
  const schema = fs.readFileSync(new URL('./schema.sql', import.meta.url));
  await conn.exec(schema.toString());
  // datos base
  await conn.run('INSERT OR IGNORE INTO sindicatos(nombre) VALUES (?), (?), (?)', 'Villa Victoria','Simón Bolívar','San Cristóbal');
})();

const lineaSchema = Joi.object({
  sindicato: Joi.string().min(2).required(),
  nombre: Joi.string().min(1).required(),
  numero: Joi.number().integer().allow(null),
  calles: Joi.array().items(Joi.string()).min(5).required(),
  frecuencia_min: Joi.number().integer().min(2).max(60).default(10),
  recorrido: Joi.array().items(Joi.object({lat:Joi.number().required(), lng:Joi.number().required()})).min(2).required(),
  paradas: Joi.array().items(Joi.object({lat:Joi.number().required(), lng:Joi.number().required(), nombre:Joi.string().allow('')})).default([])
});

app.post('/lineas', auth, onlyEditor, async (req,res)=>{
  const val = await lineaSchema.validateAsync(req.body);
  const conn = await db();
  const tx = await conn.exec('BEGIN');
  try{
    let s = await conn.get('SELECT id FROM sindicatos WHERE nombre=?', val.sindicato);
    if(!s){ const ins = await conn.run('INSERT INTO sindicatos(nombre) VALUES (?)', val.sindicato); s = {id: ins.lastID}; }
    const now = new Date().toISOString();
    const insL = await conn.run('INSERT INTO lineas(sindicato_id,nombre,numero,frecuencia_min,estado,usuario_creacion,fecha_creacion) VALUES (?,?,?,?,?,?,?)', s.id, val.nombre, val.numero, val.frecuencia_min, 'ACTIVO', req.user.username, now);
    const lid = insL.lastID;
    let ord=0; for(const p of val.recorrido){ await conn.run('INSERT INTO recorrido_puntos(linea_id,lat,lng,orden) VALUES (?,?,?,?)', lid, p.lat, p.lng, ++ord); }
    ord=0; for(const p of val.paradas){ await conn.run('INSERT INTO paradas(linea_id,nombre,lat,lng,orden) VALUES (?,?,?,?,?)', lid, p.nombre||null, p.lat, p.lng, ++ord); }
    await conn.run('INSERT INTO auditoria_lineas(linea_id,accion,datos,usuario) VALUES (?,?,?,?)', lid, 'CREAR', JSON.stringify(val), req.user.username);
    await conn.exec('COMMIT');
    res.json({ok:true, id: lid});
  }catch(e){ await conn.exec('ROLLBACK'); res.status(400).send(e.message); }
});

app.get('/lineas', async (req,res)=>{
  const conn = await db();
  const rows = await conn.all('SELECT * FROM v_lineas');
  const items = [];
  for(const r of rows){
    const paradas = await conn.all('SELECT nombre,lat,lng,orden FROM paradas WHERE linea_id=? ORDER BY orden', r.id);
    const rec = await conn.all('SELECT lat,lng,orden FROM recorrido_puntos WHERE linea_id=? ORDER BY orden', r.id);
    const calles = (await conn.all('SELECT DISTINCT substr(datos,1,1) as dummy FROM auditoria_lineas WHERE linea_id=? LIMIT 0', r.id)); // placeholder to keep API
    items.push({...r, paradas, recorrido: rec, calles: (req.query.includeCalles==='1'? (JSON.parse((await conn.get('SELECT datos FROM auditoria_lineas WHERE linea_id=? ORDER BY id DESC LIMIT 1', r.id))?.datos||'{}').calles||[]): [] )});
  }
  res.json({items});
});

const port = process.env.PORT||4002;
app.listen(port, ()=> console.log('lines-service en puerto', port));
