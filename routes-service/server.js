import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'fs';
import dotenv from 'dotenv';
import pg from 'pg'; 

// Importante: Asegúrate de que apunte al .env en la carpeta raíz 'Gps-Backed'
dotenv.config({ path: '../.env' }); 

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({ origin: '*' }));

// ------------------------------------------------------------------
// CONFIGURACIÓN DE CONEXIÓN CON POSTGRESQL (Igual que lines-service)
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

function distMeters(a,b){ // haversine
  const toRad = d=> d*Math.PI/180; const R=6371000;
  const dLat = toRad(b.lat-a.lat); const dLng = toRad(b.lng-a.lng);
  const lat1 = toRad(a.lat); const lat2 = toRad(b.lat);
  const x = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(x));
}

// Asegurar esquema al arrancar (solo para fines de verificación)
(async()=>{
  let client;
  try {
    client = await getClient();
    // Este servicio SOLO consulta, no crea tablas, pero mantenemos la lógica de DB.
    const schema = fs.readFileSync(new URL('./schema.sql', import.meta.url), 'utf8');
    await client.query(schema.toString());
    
    console.log('✅ routes-service conectado y esquema asegurado.');

  } catch(e) {
    console.error('❌ Error al inicializar la DB del routes-service:', e.stack);
  } finally {
      if(client) client.release();
  }
})();


// ------------------------------------------------------------------
// ENDPOINTS
// ------------------------------------------------------------------

// Sugiere puntos de interés
app.get('/suggest', async (req,res)=>{
  const q = (req.query.q||'').toLowerCase();
  const base = [
    {nombre:'Miraflores', lat:-16.507, lng:-68.119},
    {nombre:'Cementerio General', lat:-16.505, lng:-68.148},
    {nombre:'Terminal de Buses La Paz', lat:-16.491, lng:-68.147},
    {nombre:'San Pedro', lat:-16.499, lng:-68.136},
    {nombre:'Sopocachi', lat:-16.521, lng:-68.123},
    {nombre:'Villa Fátima', lat:-16.486, lng:-68.108},
    {nombre:'Villa Copacabana', lat:-16.511, lng:-68.087},
    {nombre:'Obrajes', lat:-16.542, lng:-68.080},
    {nombre:'Calacoto', lat:-16.560, lng:-68.081},
    {nombre:'Achumani', lat:-16.575, lng:-68.077},
    {nombre:'Zona Sur', lat:-16.560, lng:-68.083},
    {nombre:'Estación Central (Teleférico)', lat:-16.497, lng:-68.136},
    {nombre:'Irpavi (Teleférico Verde)', lat:-16.548, lng:-68.071}
  ];
  const hits = base.filter(d=> d.nombre.toLowerCase().includes(q)).slice(0,5);
  res.json({hits});
});

// Busca líneas cercanas
app.get('/near', async (req,res)=>{
  try {
    const lat = parseFloat(req.query.lat); 
    const lng = parseFloat(req.query.lng); 
    const radius = parseFloat(req.query.radius||300);
    
    if (isNaN(lat) || isNaN(lng)) {
        return res.status(400).json({ error: "Latitud y longitud inválidas." });
    }

    const conn = await db();
    // Obtener todas las líneas usando la vista v_lineas que creamos en lines-service
    const rsRes = await conn.query('SELECT * FROM v_lineas');
    const rs = rsRes.rows;
    const result = [];
    
    for(const r of rs){
      // Consultar paradas (usando $1)
      const paradasRes = await conn.query('SELECT id,nombre,lat,lng,orden FROM paradas WHERE linea_id=$1', [r.id]);
      const paradas = paradasRes.rows;

      // Consultar recorrido (usando $1)
      const recRes = await conn.query('SELECT lat,lng,orden FROM recorrido_puntos WHERE linea_id=$1', [r.id]);
      const rec = recRes.rows;
      
      // Verificar cercanía (lógica inalterada)
      const nearStop = paradas.find(p=> distMeters({lat,lng},{lat:p.lat,lng:p.lng})<=radius);
      const nearRoute = rec.find(p=> distMeters({lat,lng},{lat:p.lat,lng:p.lng})<=radius*1.2);
      
      if(nearStop || nearRoute){ 
        result.push({...r, paradas, recorrido: rec}); 
      }
    }
    res.json({routes: result});
  } catch(e) {
      console.error('Error en /near:', e);
      res.status(500).json({error: e.message}); 
  }
});

// Exporta datos en formato GeoJSON
app.get('/export/geojson', async (req,res)=>{
  try {
    const conn = await db();
    const rsRes = await conn.query('SELECT * FROM v_lineas');
    const rs = rsRes.rows;
    const features = [];
    
    for(const r of rs){
      // 1. Recorrido
      const recRes = await conn.query('SELECT lat,lng,orden FROM recorrido_puntos WHERE linea_id=$1 ORDER BY orden', [r.id]);
      const rec = recRes.rows;
      
      if(rec.length){
        features.push({type:'Feature', properties:{tipo:'recorrido', linea_id:r.id, nombre:r.nombre, sindicato:r.sindicato}, geometry:{type:'LineString', coordinates: rec.map(p=>[p.lng,p.lat])}});
      }
      
      // 2. Paradas
      const paradasRes = await conn.query('SELECT nombre,lat,lng FROM paradas WHERE linea_id=$1', [r.id]);
      const paradas = paradasRes.rows;
      
      for(const p of paradas){
        features.push({type:'Feature', properties:{tipo:'parada', linea_id:r.id, nombre:p.nombre}, geometry:{type:'Point', coordinates:[p.lng,p.lat]}});
      }
    }
    res.setHeader('Content-Type','application/geo+json');
    res.send(JSON.stringify({type:'FeatureCollection', features}));
  } catch(e) {
      console.error('Error en /export/geojson:', e);
      res.status(500).json({error: e.message});
  }
});

// Estima tiempo de llegada (ETA)
app.get('/eta', async (req,res)=>{
  try {
    const linea_id = parseInt(req.query.linea_id); 
    const parada_id = parseInt(req.query.parada_id);
    
    if (isNaN(linea_id)) {
        return res.status(400).json({ error: "ID de línea inválido." });
    }
    
    const conn = await db();
    // Consulta PostgreSQL (usando $1)
    const lineaRes = await conn.query('SELECT id, frecuencia_min FROM lineas WHERE id=$1', [linea_id]);
    const linea = lineaRes.rows[0];
    
    if(!linea) return res.status(404).send('Línea no encontrada');
    
    // Sin datos en tiempo real: estimación simple por frecuencia (lógica inalterada)
    const freq = Math.max(2, linea.frecuencia_min||10);
    const now = new Date();
    const mins = freq - (now.getMinutes() % freq);
    
    res.json({linea_id, parada_id, eta_min: mins, note:'Estimación basada en frecuencia por falta de datos en tiempo real'});
  } catch(e) {
      console.error('Error en /eta:', e);
      res.status(500).json({error: e.message});
  }
});

const port = process.env.PORT||4003;
// Bind explícito a 0.0.0.0 para asegurar accesibilidad vía IPv4
app.listen(port, '0.0.0.0', ()=> console.log(`Servidor routes-service escuchando en http://0.0.0.0:${port}`));

