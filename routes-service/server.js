
import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';
import {open} from 'sqlite';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use(cors({origin: process.env.CORS_ORIGIN || 'http://localhost:8080', credentials:true}));

const DB_PATH = process.env.DB_PATH || '../data/app.db';

async function db(){ return open({filename:DB_PATH, driver:sqlite3.Database}); }

function distMeters(a,b){ // haversine
  const toRad = d=> d*Math.PI/180; const R=6371000;
  const dLat = toRad(b.lat-a.lat); const dLng = toRad(b.lng-a.lng);
  const lat1 = toRad(a.lat); const lat2 = toRad(b.lat);
  const x = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLng/2)**2;
  return 2*R*Math.asin(Math.sqrt(x));
}

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

app.get('/near', async (req,res)=>{
  const lat = parseFloat(req.query.lat); const lng = parseFloat(req.query.lng); const radius = parseFloat(req.query.radius||300);
  const conn = await db();
  const rs = await conn.all('SELECT * FROM v_lineas');
  const result = [];
  for(const r of rs){
    const paradas = await conn.all('SELECT id,nombre,lat,lng,orden FROM paradas WHERE linea_id=?', r.id);
    const rec = await conn.all('SELECT lat,lng,orden FROM recorrido_puntos WHERE linea_id=?', r.id);
    const nearStop = paradas.find(p=> distMeters({lat,lng},{lat:p.lat,lng:p.lng})<=radius);
    const nearRoute = rec.find(p=> distMeters({lat,lng},{lat:p.lat,lng:p.lng})<=radius*1.2);
    if(nearStop || nearRoute){ result.push({...r, paradas, recorrido: rec}); }
  }
  res.json({routes: result});
});

app.get('/export/geojson', async (req,res)=>{
  const conn = await db();
  const rs = await conn.all('SELECT * FROM v_lineas');
  const features = [];
  for(const r of rs){
    const rec = await conn.all('SELECT lat,lng,orden FROM recorrido_puntos WHERE linea_id=? ORDER BY orden', r.id);
    if(rec.length){
      features.push({type:'Feature', properties:{tipo:'recorrido', linea_id:r.id, nombre:r.nombre, sindicato:r.sindicato}, geometry:{type:'LineString', coordinates: rec.map(p=>[p.lng,p.lat])}});
    }
    const paradas = await conn.all('SELECT nombre,lat,lng FROM paradas WHERE linea_id=?', r.id);
    for(const p of paradas){
      features.push({type:'Feature', properties:{tipo:'parada', linea_id:r.id, nombre:p.nombre}, geometry:{type:'Point', coordinates:[p.lng,p.lat]}});
    }
  }
  res.setHeader('Content-Type','application/geo+json');
  res.send(JSON.stringify({type:'FeatureCollection', features}));
});

app.get('/eta', async (req,res)=>{
  const linea_id = parseInt(req.query.linea_id); const parada_id = parseInt(req.query.parada_id);
  const conn = await db();
  const linea = await conn.get('SELECT id, frecuencia_min FROM lineas WHERE id=?', linea_id);
  if(!linea) return res.status(404).send('Línea no encontrada');
  // Sin datos en tiempo real: estimación simple por frecuencia
  const freq = Math.max(2, linea.frecuencia_min||10);
  const now = new Date();
  const mins = freq - (now.getMinutes() % freq);
  res.json({linea_id, parada_id, eta_min: mins, note:'Estimación basada en frecuencia por falta de datos en tiempo real'});
});

const port = process.env.PORT||4003;
app.listen(port, ()=> console.log('routes-service en puerto', port));
