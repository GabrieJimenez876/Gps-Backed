
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS roles(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT UNIQUE NOT NULL
);
CREATE TABLE IF NOT EXISTS usuarios(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  estado TEXT DEFAULT 'ACTIVO'
);
CREATE TABLE IF NOT EXISTS usuarios_roles(
  usuario_id INTEGER,
  rol_id INTEGER,
  PRIMARY KEY(usuario_id, rol_id),
  FOREIGN KEY(usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
  FOREIGN KEY(rol_id) REFERENCES roles(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS sindicatos(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT UNIQUE NOT NULL
);
CREATE TABLE IF NOT EXISTS lineas(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sindicato_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  numero INTEGER,
  frecuencia_min INTEGER DEFAULT 10,
  estado TEXT DEFAULT 'ACTIVO',
  usuario_creacion TEXT, fecha_creacion TEXT,
  usuario_modificacion TEXT, fecha_modificacion TEXT,
  FOREIGN KEY(sindicato_id) REFERENCES sindicatos(id)
);
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

-- Auditoría (historial de cambios)
CREATE TABLE IF NOT EXISTS auditoria_lineas(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  linea_id INTEGER,
  accion TEXT,
  datos TEXT,
  usuario TEXT,
  fecha TEXT DEFAULT (datetime('now'))
);

-- Conductores y vehículos
CREATE TABLE IF NOT EXISTS conductores(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  nombre TEXT NOT NULL,
  licencia TEXT,
  estado TEXT DEFAULT 'ACTIVO'
);
CREATE TABLE IF NOT EXISTS vehiculos(
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  placa TEXT UNIQUE NOT NULL,
  capacidad INTEGER,
  estado TEXT DEFAULT 'ACTIVO'
);
CREATE TABLE IF NOT EXISTS linea_conductor(
  linea_id INTEGER, conductor_id INTEGER,
  PRIMARY KEY(linea_id,conductor_id),
  FOREIGN KEY(linea_id) REFERENCES lineas(id) ON DELETE CASCADE,
  FOREIGN KEY(conductor_id) REFERENCES conductores(id) ON DELETE CASCADE
);
CREATE TABLE IF NOT EXISTS linea_vehiculo(
  linea_id INTEGER, vehiculo_id INTEGER,
  PRIMARY KEY(linea_id,vehiculo_id),
  FOREIGN KEY(linea_id) REFERENCES lineas(id) ON DELETE CASCADE,
  FOREIGN KEY(vehiculo_id) REFERENCES vehiculos(id) ON DELETE CASCADE
);

-- Vistas de ayuda
CREATE VIEW IF NOT EXISTS v_lineas AS
SELECT l.id, s.nombre AS sindicato, l.nombre, l.numero, l.estado, l.frecuencia_min,
       l.usuario_creacion, l.fecha_creacion, l.usuario_modificacion, l.fecha_modificacion
FROM lineas l JOIN sindicatos s ON s.id=l.sindicato_id;
