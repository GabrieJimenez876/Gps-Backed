import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import dotenv from 'dotenv';
import Joi from 'joi';
import pg from 'pg'; 

// Importante: Asegúrate de que apunte al .env en la carpeta raíz 'Gps-Backed'
dotenv.config({ path: '../.env' }); 

const app = express();
app.use(express.json({limit:'2mb'}));
app.use(cookieParser());
// Habilitar CORS permisivo para desarrollo
app.use(cors({ origin: '*' }));

const JWT_SECRET = process.env.JWT_SECRET || 'devsecret';

// ------------------------------------------------------------------
// CONFIGURACIÓN DE CONEXIÓN CON POSTGRESQL
// ------------------------------------------------------------------
const { Pool } = pg; 

const pool = new Pool({
    user: process.env.PG_USER,
    host: process.env.PG_HOST,
    database: process.env.PG_DATABASE,
    password: process.env.PG_PASSWORD,
    port: process.env.PG_PORT,
});

async function db(){ return pool; }
async function getClient(){ return pool.connect(); }
// ------------------------------------------------------------------


function auth(req,res,next){
  const token = req.cookies.token; if(!token) return res.status(401).send('No autenticado');
  try{ req.user = jwt.verify(token, JWT_SECRET); next(); }catch{ return res.status(401).send('Sesión inválida'); }
}
function onlyEditor(req,res,next){ if(['ADMIN','EDITOR'].includes(req.user.role)) return next(); return res.status(403).send('Sin permiso'); }

// Asegurar esquema al arrancar
(async()=>{
  let client;
  try {
    client = await getClient();
    const schema = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
    
    // Ejecutamos el esquema completo. Esto requiere que schema.sql contenga comandos SQL válidos para PG.
    await client.query(schema.toString());
    
    console.log('✅ lines-service conectado y esquema asegurado.');

  } catch(e) {
    console.error('❌ Error al inicializar la DB del lines-service:', e.stack);
  } finally {
      if(client) client.release();
  }
})();

// ------------------------------------------------------------------
// ENDPOINTS
// ------------------------------------------------------------------

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
  let client;
  try{
    const val = await lineaSchema.validateAsync(req.body);
    client = await getClient(); 
    await client.query('BEGIN'); // Inicia Transacción
    
    // 1. Obtener Sindicato
    let sRes = await client.query('SELECT id FROM sindicatos WHERE nombre=$1', [val.sindicato]);
    let s = sRes.rows[0];
    
    if(!s){ 
      // 2. Insertar Sindicato
      const insRes = await client.query('INSERT INTO sindicatos(nombre) VALUES ($1) RETURNING id', [val.sindicato]); 
      s = insRes.rows[0]; 
    }
    
    const now = new Date().toISOString();
    
    // 3. Insertar Línea
    const insLRes = await client.query(`
        INSERT INTO lineas(sindicato_id,nombre,clave,numero,frecuencia_min,estado,usuario_creacion,fecha_creacion) 
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING id`, 
        [s.id, val.nombre, val.clave||null, val.numero, val.frecuencia_min, 'ACTIVO', req.user.username, now]
    );
    const lid = insLRes.rows[0].id;
    
    // 4. Insertar Recorrido
    let ord=0; 
    for(const p of val.recorrido){ 
        await client.query('INSERT INTO recorrido_puntos(linea_id,lat,lng,orden) VALUES ($1,$2,$3,$4)', [lid, p.lat, p.lng, ++ord]); 
    }
    
    // 5. Insertar Paradas
    ord=0; 
    for(const p of val.paradas){ 
        await client.query('INSERT INTO paradas(linea_id,nombre,lat,lng,orden) VALUES ($1,$2,$3,$4,$5)', [lid, p.nombre||null, p.lat, p.lng, ++ord]); 
    }
    
    // 6. Insertar Auditoría
    await client.query('INSERT INTO auditoria_lineas(linea_id,accion,datos,usuario) VALUES ($1,$2,$3,$4)', 
        [lid, 'CREAR', JSON.stringify(val), req.user.username]);
    
    await client.query('COMMIT'); // Finaliza Transacción
    res.json({ok:true, id: lid});
  }catch(e){ 
      if (client) {
          try{ await client.query('ROLLBACK'); }catch(rollbackErr){ console.error('Error durante ROLLBACK:', rollbackErr); }
      }
      res.status(400).json({error: e.message}); 
  } finally {
      if (client) client.release(); // Liberar el cliente
  }
});

// Listar líneas (público)
app.get('/lineas', async (req,res)=>{
  try{
    const conn = await db();
    const rowsRes = await conn.query('SELECT * FROM v_lineas');
    const rows = rowsRes.rows;
    
    const items = [];
    for(const r of rows){
      const paradasRes = await conn.query('SELECT id,nombre,lat,lng,orden FROM paradas WHERE linea_id=$1 ORDER BY orden', [r.id]);
      const paradas = paradasRes.rows;
      
      const recRes = await conn.query('SELECT lat,lng,orden FROM recorrido_puntos WHERE linea_id=$1 ORDER BY orden', [r.id]);
      const rec = recRes.rows;
      
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
    let rRes;
    
    if(/^[0-9]+$/.test(key)) {
        rRes = await conn.query('SELECT * FROM v_lineas WHERE id=$1', [parseInt(key)]);
    } else {
        rRes = await conn.query('SELECT * FROM v_lineas WHERE clave=$1', [key]);
    }
    r = rRes.rows[0];
    
    if(!r) return res.status(404).json({error:'No encontrada'});
    
    const paradasRes = await conn.query('SELECT id,nombre,lat,lng,orden FROM paradas WHERE linea_id=$1 ORDER BY orden', [r.id]);
    const paradas = paradasRes.rows;
    
    const recRes = await conn.query('SELECT lat,lng,orden FROM recorrido_puntos WHERE linea_id=$1 ORDER BY orden', [r.id]);
    const rec = recRes.rows;
    
    res.json({...r, paradas, recorrido: rec});
  }catch(e){ res.status(500).json({error: e.message}); }
});

// Actualizar línea
app.put('/lineas/:id', auth, onlyEditor, async (req,res)=>{
  let client;
  try{
    const id = parseInt(req.params.id);
    const val = await lineaSchema.validateAsync(req.body);
    client = await getClient(); // Obtenemos un cliente para la transacción
    await client.query('BEGIN');
    
    // 1. Obtener Sindicato
    let sRes = await client.query('SELECT id FROM sindicatos WHERE nombre=$1', [val.sindicato]);
    let s = sRes.rows[0];
    
    if(!s){ 
      // 2. Insertar Sindicato
      const insRes = await client.query('INSERT INTO sindicatos(nombre) VALUES ($1) RETURNING id', [val.sindicato]); 
      s = insRes.rows[0]; 
    }
    
    // 3. Actualizar línea
    await client.query(`
        UPDATE lineas SET sindicato_id=$1, nombre=$2, clave=$3, numero=$4, frecuencia_min=$5, usuario_modificacion=$6, fecha_modificacion=$7 
        WHERE id=$8
    `, [s.id, val.nombre, val.clave||null, val.numero, val.frecuencia_min, req.user.username, new Date().toISOString(), id]);
    
    // 4. Eliminar puntos y paradas viejas
    await client.query('DELETE FROM recorrido_puntos WHERE linea_id=$1', [id]);
    await client.query('DELETE FROM paradas WHERE linea_id=$1', [id]);
    
    // 5. Insertar Recorrido nuevo
    let ord=0; 
    for(const p of val.recorrido){ 
        await client.query('INSERT INTO recorrido_puntos(linea_id,lat,lng,orden) VALUES ($1,$2,$3,$4)', [id, p.lat, p.lng, ++ord]); 
    }
    
    // 6. Insertar Paradas nuevas
    ord=0; 
    for(const p of val.paradas){ 
        await client.query('INSERT INTO paradas(linea_id,nombre,lat,lng,orden) VALUES ($1,$2,$3,$4,$5)', [id, p.nombre||null, p.lat, p.lng, ++ord]); 
    }
    
    // 7. Insertar Auditoría
    await client.query('INSERT INTO auditoria_lineas(linea_id,accion,datos,usuario) VALUES ($1,$2,$3,$4)', 
        [id, 'MODIFICAR', JSON.stringify(val), req.user.username]);
    
    await client.query('COMMIT');
    res.json({ok:true});
  }catch(e){ 
      if (client) {
          try{ await client.query('ROLLBACK'); }catch(rollbackErr){ console.error('Error durante ROLLBACK:', rollbackErr); }
      }
      res.status(400).json({error:e.message}); 
  } finally {
      if (client) client.release();
  }
});

// Eliminar línea
app.delete('/lineas/:id', auth, onlyEditor, async (req,res)=>{
  try{
    const id = parseInt(req.params.id);
    const conn = await db();
    await conn.query('DELETE FROM lineas WHERE id=$1', [id]);
    await conn.query('INSERT INTO auditoria_lineas(linea_id,accion,datos,usuario) VALUES ($1,$2,$3,$4)', [id, 'ELIMINAR', '', req.user.username]);
    res.json({ok:true});
  }catch(e){ res.status(500).json({error:e.message}); }
});

// Listado de sindicatos
app.get('/sindicatos', async (req,res)=>{
  try{ 
    const conn = await db(); 
    const sRes = await conn.query('SELECT id,nombre FROM sindicatos ORDER BY nombre');
    res.json({items: sRes.rows}); 
  }
  catch(e){ res.status(500).json({error: e.message}); }
});

const port = process.env.PORT||4002;
// Bind explícito a 0.0.0.0 para asegurar accesibilidad vía IPv4
app.listen(port, '0.0.0.0', ()=> console.log(`Servidor lines-service escuchando en http://0.0.0.0:${port}`));
