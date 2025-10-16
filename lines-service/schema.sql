
PRAGMA foreign_keys = ON;

-- Minimal schema focused on sindicatos, lineas, paradas y recorrido.
CREATE TABLE IF NOT EXISTS sindicatos(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS lineas(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sindicato_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  clave TEXT UNIQUE, -- friendly key used by frontends (e.g. 'amarilla')
  numero INTEGER,
  frecuencia_min INTEGER DEFAULT 10,
  estado TEXT DEFAULT 'ACTIVO',
  usuario_creacion TEXT, fecha_creacion TEXT,
  usuario_modificacion TEXT, fecha_modificacion TEXT,
  FOREIGN KEY(sindicato_id) REFERENCES sindicatos(id)
);

CREATE INDEX IF NOT EXISTS idx_lineas_clave ON lineas(clave);

CREATE TABLE IF NOT EXISTS paradas(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  linea_id INTEGER NOT NULL,
  nombre TEXT,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  orden INTEGER,
  FOREIGN KEY(linea_id) REFERENCES lineas(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS recorrido_puntos(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  linea_id INTEGER NOT NULL,
  lat REAL NOT NULL,
  lng REAL NOT NULL,
  orden INTEGER,
  FOREIGN KEY(linea_id) REFERENCES lineas(id) ON DELETE CASCADE
);

-- Auditoría simple para cambios de líneas
CREATE TABLE IF NOT EXISTS auditoria_lineas(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  linea_id INTEGER,
  accion TEXT,
  datos TEXT,
  usuario TEXT,
  fecha TEXT DEFAULT (datetime('now'))
);

-- View for convenience
CREATE VIEW IF NOT EXISTS v_lineas AS
SELECT l.id, s.nombre AS sindicato, l.nombre, l.clave, l.numero, l.estado, l.frecuencia_min,
       l.usuario_creacion, l.fecha_creacion, l.usuario_modificacion, l.fecha_modificacion
FROM lineas l JOIN sindicatos s ON s.id=l.sindicato_id;

-- Semillas de ejemplo coincidentes con las claves usadas por los frontends
INSERT OR IGNORE INTO sindicatos(nombre) VALUES ('Villa Victoria'), ('Simón Bolívar'), ('La Paz BUS');

-- Lines
INSERT OR IGNORE INTO lineas(id,sindicato_id,nombre,clave,numero,frecuencia_min,estado)
SELECT 1, (SELECT id FROM sindicatos WHERE nombre='Villa Victoria'), 'Línea 10', 'amarilla', 10, 8, 'ACTIVO' WHERE NOT EXISTS(SELECT 1 FROM lineas WHERE clave='amarilla');
INSERT OR IGNORE INTO lineas(id,sindicato_id,nombre,clave,numero,frecuencia_min,estado)
SELECT 2, (SELECT id FROM sindicatos WHERE nombre='Simón Bolívar'), 'Línea Verde', 'verde', 20, 12, 'ACTIVO' WHERE NOT EXISTS(SELECT 1 FROM lineas WHERE clave='verde');
INSERT OR IGNORE INTO lineas(id,sindicato_id,nombre,clave,numero,frecuencia_min,estado)
SELECT 3, (SELECT id FROM sindicatos WHERE nombre='La Paz BUS'), 'PumaKatari — Achumani', 'puma_achumani', 30, 15, 'ACTIVO' WHERE NOT EXISTS(SELECT 1 FROM lineas WHERE clave='puma_achumani');

-- Paradas & recorrido for 'amarilla' (sample coords taken from frontend)
INSERT OR IGNORE INTO paradas(linea_id,nombre,lat,lng,orden)
SELECT (SELECT id FROM lineas WHERE clave='amarilla'), 'Plaza Eguino', -16.493886, -68.140775, 1 WHERE NOT EXISTS(SELECT 1 FROM paradas WHERE linea_id=(SELECT id FROM lineas WHERE clave='amarilla') AND orden=1);
INSERT OR IGNORE INTO paradas(linea_id,nombre,lat,lng,orden)
SELECT (SELECT id FROM lineas WHERE clave='amarilla'), 'Calatayud', -16.494602, -68.148156, 2 WHERE NOT EXISTS(SELECT 1 FROM paradas WHERE linea_id=(SELECT id FROM lineas WHERE clave='amarilla') AND orden=2);

INSERT OR IGNORE INTO recorrido_puntos(linea_id,lat,lng,orden)
SELECT (SELECT id FROM lineas WHERE clave='amarilla'), -16.493886, -68.140775, 1 WHERE NOT EXISTS(SELECT 1 FROM recorrido_puntos WHERE linea_id=(SELECT id FROM lineas WHERE clave='amarilla') AND orden=1);
INSERT OR IGNORE INTO recorrido_puntos(linea_id,lat,lng,orden)
SELECT (SELECT id FROM lineas WHERE clave='amarilla'), -16.494602, -68.148156, 2 WHERE NOT EXISTS(SELECT 1 FROM recorrido_puntos WHERE linea_id=(SELECT id FROM lineas WHERE clave='amarilla') AND orden=2);

-- Minimal recorrido for verde and puma_achumani (demo)
INSERT OR IGNORE INTO recorrido_puntos(linea_id,lat,lng,orden)
SELECT (SELECT id FROM lineas WHERE clave='verde'), -16.495, -68.133, 1 WHERE NOT EXISTS(SELECT 1 FROM recorrido_puntos WHERE linea_id=(SELECT id FROM lineas WHERE clave='verde') AND orden=1);
INSERT OR IGNORE INTO recorrido_puntos(linea_id,lat,lng,orden)
SELECT (SELECT id FROM lineas WHERE clave='verde'), -16.493, -68.135, 2 WHERE NOT EXISTS(SELECT 1 FROM recorrido_puntos WHERE linea_id=(SELECT id FROM lineas WHERE clave='verde') AND orden=2);

INSERT OR IGNORE INTO recorrido_puntos(linea_id,lat,lng,orden)
SELECT (SELECT id FROM lineas WHERE clave='puma_achumani'), -16.56, -68.08, 1 WHERE NOT EXISTS(SELECT 1 FROM recorrido_puntos WHERE linea_id=(SELECT id FROM lineas WHERE clave='puma_achumani') AND orden=1);
INSERT OR IGNORE INTO recorrido_puntos(linea_id,lat,lng,orden)
SELECT (SELECT id FROM lineas WHERE clave='puma_achumani'), -16.575, -68.077, 2 WHERE NOT EXISTS(SELECT 1 FROM recorrido_puntos WHERE linea_id=(SELECT id FROM lineas WHERE clave='puma_achumani') AND orden=2);
