
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

// Asegurar esquema al arrancar
(async()=>{
  const conn = await db();
  const schema = fs.readFileSync(new URL('./schema.sql', import.meta.url));
  await conn.exec(schema.toString());
  // datos base (semillas)
  await conn.run('INSERT OR IGNORE INTO sindicatos(nombre) VALUES (?), (?), (?)', 'Villa Victoria','Simón Bolívar','San Cristóbal');
})();

const lineaSchema = Joi.object({
  sindicato: Joi.string().min(2).required(),
  nombre: Joi.string().min(1).required(),
  clave: Joi.string().min(1).optional(),
  numero: Joi.number().integer().allow(null),
  frecuencia_min: Joi.number().integer().min(1).max(120).default(10),
  recorrido: Joi.array().items(Joi.object({lat:Joi.number().required(), lng:Joi.number().required()})).min(1).required(),
  paradas: Joi.array().items(Joi.object({lat:Joi.number().required(), lng:Joi.number().required(), nombre:Joi.string().allow('')})).default([])
});

// Crear línea (requiere autenticación)
app.post('/lineas', auth, onlyEditor, async (req,res)=>{
  try{
    const val = await lineaSchema.validateAsync(req.body);
    const conn = await db();
    await conn.exec('BEGIN');
    let s = await conn.get('SELECT id FROM sindicatos WHERE nombre=?', val.sindicato);
    if(!s){ const ins = await conn.run('INSERT INTO sindicatos(nombre) VALUES (?)', val.sindicato); s = {id: ins.lastID}; }
    const now = new Date().toISOString();
    const insL = await conn.run('INSERT INTO lineas(sindicato_id,nombre,clave,numero,frecuencia_min,estado,usuario_creacion,fecha_creacion) VALUES (?,?,?,?,?,?,?,?)', s.id, val.nombre, val.clave||null, val.numero, val.frecuencia_min, 'ACTIVO', req.user.username, now);
    const lid = insL.lastID;
    let ord=0; for(const p of val.recorrido){ await conn.run('INSERT INTO recorrido_puntos(linea_id,lat,lng,orden) VALUES (?,?,?,?)', lid, p.lat, p.lng, ++ord); }
    ord=0; for(const p of val.paradas){ await conn.run('INSERT INTO paradas(linea_id,nombre,lat,lng,orden) VALUES (?,?,?,?,?)', lid, p.nombre||null, p.lat, p.lng, ++ord); }
    await conn.run('INSERT INTO auditoria_lineas(linea_id,accion,datos,usuario) VALUES (?,?,?,?)', lid, 'CREAR', JSON.stringify(val), req.user.username);
    await conn.exec('COMMIT');
    res.json({ok:true, id: lid});
  }catch(e){ try{ await db().then(c=>c.exec('ROLLBACK')); }catch{}; res.status(400).json({error: e.message}); }
});

// Listar líneas (público)
app.get('/lineas', async (req,res)=>{
  try{
    const conn = await db();
    const rows = await conn.all('SELECT * FROM v_lineas');
    const items = [];
    for(const r of rows){
      const paradas = await conn.all('SELECT id,nombre,lat,lng,orden FROM paradas WHERE linea_id=? ORDER BY orden', r.id);
      const rec = await conn.all('SELECT lat,lng,orden FROM recorrido_puntos WHERE linea_id=? ORDER BY orden', r.id);
      items.push({...r, paradas, recorrido: rec});
    }
    res.json({items});
  }catch(e){ res.status(500).json({error: e.message}); }
});

// Obtener una línea por clave o id
app.get('/lineas/:key', async (req,res)=>{
  try{
    const key = req.params.key;
    const conn = await db();
    let r = null;
    if(/^[0-9]+$/.test(key)) r = await conn.get('SELECT * FROM v_lineas WHERE id=?', parseInt(key));
    else r = await conn.get('SELECT * FROM v_lineas WHERE clave=?', key);
    if(!r) return res.status(404).json({error:'No encontrada'});
    const paradas = await conn.all('SELECT id,nombre,lat,lng,orden FROM paradas WHERE linea_id=? ORDER BY orden', r.id);
    const rec = await conn.all('SELECT lat,lng,orden FROM recorrido_puntos WHERE linea_id=? ORDER BY orden', r.id);
    res.json({...r, paradas, recorrido: rec});
  }catch(e){ res.status(500).json({error: e.message}); }
});

// Actualizar línea
app.put('/lineas/:id', auth, onlyEditor, async (req,res)=>{
  try{
    const id = parseInt(req.params.id);
    const val = await lineaSchema.validateAsync(req.body);
    const conn = await db();
    await conn.exec('BEGIN');
    let s = await conn.get('SELECT id FROM sindicatos WHERE nombre=?', val.sindicato);
    if(!s){ const ins = await conn.run('INSERT INTO sindicatos(nombre) VALUES (?)', val.sindicato); s = {id: ins.lastID}; }
    await conn.run('UPDATE lineas SET sindicato_id=?, nombre=?, clave=?, numero=?, frecuencia_min=?, usuario_modificacion=?, fecha_modificacion=? WHERE id=?', s.id, val.nombre, val.clave||null, val.numero, val.frecuencia_min, req.user.username, new Date().toISOString(), id);
    await conn.run('DELETE FROM recorrido_puntos WHERE linea_id=?', id);
    await conn.run('DELETE FROM paradas WHERE linea_id=?', id);
    let ord=0; for(const p of val.recorrido){ await conn.run('INSERT INTO recorrido_puntos(linea_id,lat,lng,orden) VALUES (?,?,?,?)', id, p.lat, p.lng, ++ord); }
    ord=0; for(const p of val.paradas){ await conn.run('INSERT INTO paradas(linea_id,nombre,lat,lng,orden) VALUES (?,?,?,?,?)', id, p.nombre||null, p.lat, p.lng, ++ord); }
    await conn.run('INSERT INTO auditoria_lineas(linea_id,accion,datos,usuario) VALUES (?,?,?,?)', id, 'MODIFICAR', JSON.stringify(val), req.user.username);
    await conn.exec('COMMIT');
    res.json({ok:true});
  }catch(e){ try{ await db().then(c=>c.exec('ROLLBACK')); }catch{}; res.status(400).json({error:e.message}); }
});

// Eliminar línea
app.delete('/lineas/:id', auth, onlyEditor, async (req,res)=>{
  try{
    const id = parseInt(req.params.id);
    const conn = await db();
    await conn.run('DELETE FROM lineas WHERE id=?', id);
    await conn.run('INSERT INTO auditoria_lineas(linea_id,accion,datos,usuario) VALUES (?,?,?,?)', id, 'ELIMINAR', '', req.user.username);
    res.json({ok:true});
  }catch(e){ res.status(500).json({error:e.message}); }
});

// Listado de sindicatos
app.get('/sindicatos', async (req,res)=>{
  try{ const conn = await db(); const s = await conn.all('SELECT id,nombre FROM sindicatos ORDER BY nombre'); res.json({items: s}); }
  catch(e){ res.status(500).json({error: e.message}); }
});

const port = process.env.PORT||4002;
app.listen(port, ()=> console.log('lines-service en puerto', port));
