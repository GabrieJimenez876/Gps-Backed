-- ESQUEMA LIMPIO PARA POSTGRESQL

-- Tablas base
CREATE TABLE IF NOT EXISTS sindicatos (
    id SERIAL PRIMARY KEY,
    nombre TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS lineas (
    id SERIAL PRIMARY KEY,
    sindicato_id INTEGER NOT NULL REFERENCES sindicatos(id), 
    nombre TEXT NOT NULL,
    clave TEXT UNIQUE, 
    numero INTEGER,
    frecuencia_min INTEGER DEFAULT 10,
    estado TEXT DEFAULT 'ACTIVO',
    usuario_creacion TEXT, 
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT now(), 
    usuario_modificacion TEXT, 
    fecha_modificacion TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_lineas_clave ON lineas(clave);

CREATE TABLE IF NOT EXISTS paradas (
    id SERIAL PRIMARY KEY,
    linea_id INTEGER NOT NULL REFERENCES lineas(id) ON DELETE CASCADE,
    nombre TEXT,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    orden INTEGER
);

CREATE TABLE IF NOT EXISTS recorrido_puntos (
    id SERIAL PRIMARY KEY,
    linea_id INTEGER NOT NULL REFERENCES lineas(id) ON DELETE CASCADE,
    lat REAL NOT NULL,
    lng REAL NOT NULL,
    orden INTEGER
);

-- Tabla de Auditoría
CREATE TABLE IF NOT EXISTS auditoria_lineas (
    id SERIAL PRIMARY KEY,
    linea_id INTEGER,
    accion TEXT,
    datos TEXT,
    usuario TEXT,
    fecha TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Vista de Conveniencia
CREATE OR REPLACE VIEW v_lineas AS
SELECT 
    l.id, 
    s.nombre AS sindicato, 
    l.nombre, 
    l.clave, 
    l.numero, 
    l.estado, 
    l.frecuencia_min,
    l.usuario_creacion, 
    l.fecha_creacion, 
    l.usuario_modificacion, 
    l.fecha_modificacion
FROM lineas l 
JOIN sindicatos s ON s.id = l.sindicato_id;

-- ----------------------------------------------------
-- SEMILLAS (SEED DATA)
-- ----------------------------------------------------

INSERT INTO sindicatos(nombre) VALUES 
('Villa Victoria'), 
('Simón Bolívar'), 
('La Paz BUS')
ON CONFLICT (nombre) DO NOTHING;

-- Lines
INSERT INTO lineas(sindicato_id,nombre,clave,numero,frecuencia_min,estado)
SELECT id, 'Línea 10', 'amarilla', 10, 8, 'ACTIVO' 
FROM sindicatos WHERE nombre='Villa Victoria'
ON CONFLICT (clave) DO NOTHING;

INSERT INTO lineas(sindicato_id,nombre,clave,numero,frecuencia_min,estado)
SELECT id, 'Línea Verde', 'verde', 20, 12, 'ACTIVO' 
FROM sindicatos WHERE nombre='Simón Bolívar'
ON CONFLICT (clave) DO NOTHING;

INSERT INTO lineas(sindicato_id,nombre,clave,numero,frecuencia_min,estado)
SELECT id, 'PumaKatari — Achumani', 'puma_achumani', 30, 15, 'ACTIVO' 
FROM sindicatos WHERE nombre='La Paz BUS'
ON CONFLICT (clave) DO NOTHING;

-- Índices únicos para simular INSERT OR IGNORE en paradas/recorridos
CREATE UNIQUE INDEX IF NOT EXISTS uidx_paradas_seed ON paradas (linea_id, orden);
CREATE UNIQUE INDEX IF NOT EXISTS uidx_recorrido_seed ON recorrido_puntos (linea_id, orden);


-- Paradas & recorrido for 'amarilla'
INSERT INTO paradas(linea_id,nombre,lat,lng,orden)
VALUES ((SELECT id FROM lineas WHERE clave='amarilla'), 'Plaza Eguino', -16.493886, -68.140775, 1)
ON CONFLICT (linea_id, orden) DO NOTHING;
INSERT INTO paradas(linea_id,nombre,lat,lng,orden)
VALUES ((SELECT id FROM lineas WHERE clave='amarilla'), 'Calatayud', -16.494602, -68.148156, 2)
ON CONFLICT (linea_id, orden) DO NOTHING;

INSERT INTO recorrido_puntos(linea_id,lat,lng,orden)
VALUES ((SELECT id FROM lineas WHERE clave='amarilla'), -16.493886, -68.140775, 1)
ON CONFLICT (linea_id, orden) DO NOTHING;
INSERT INTO recorrido_puntos(linea_id,lat,lng,orden)
VALUES ((SELECT id FROM lineas WHERE clave='amarilla'), -16.494602, -68.148156, 2)
ON CONFLICT (linea_id, orden) DO NOTHING;

-- Minimal recorrido for verde and puma_achumani
INSERT INTO recorrido_puntos(linea_id,lat,lng,orden)
VALUES ((SELECT id FROM lineas WHERE clave='verde'), -16.495, -68.133, 1)
ON CONFLICT (linea_id, orden) DO NOTHING;
INSERT INTO recorrido_puntos(linea_id,lat,lng,orden)
VALUES ((SELECT id FROM lineas WHERE clave='verde'), -16.493, -68.135, 2)
ON CONFLICT (linea_id, orden) DO NOTHING;

INSERT INTO recorrido_puntos(linea_id,lat,lng,orden)
VALUES ((SELECT id FROM lineas WHERE clave='puma_achumani'), -16.56, -68.08, 1)
ON CONFLICT (linea_id, orden) DO NOTHING;
INSERT INTO recorrido_puntos(linea_id,lat,lng,orden)
VALUES ((SELECT id FROM lineas WHERE clave='puma_achumani'), -16.575, -68.077, 2)
ON CONFLICT (linea_id, orden) DO NOTHING;


