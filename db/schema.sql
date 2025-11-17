-- PostgreSQL schema generated from DBML specification

-- NOTE: This script targets PostgreSQL. Adjust types if you use a different DB.

CREATE SCHEMA IF NOT EXISTS gps_app;
SET search_path = gps_app, public;

-- PERSONA
CREATE TABLE IF NOT EXISTS persona (
  id_persona SERIAL PRIMARY KEY,
  cedula VARCHAR(64) UNIQUE,
  nombres VARCHAR(200),
  apellidos VARCHAR(200),
  telefono VARCHAR(50),
  email VARCHAR(200),
  direccion TEXT,
  fecha_nacimiento DATE,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now(),
  creado_por INTEGER,
  modificado_en TIMESTAMP WITH TIME ZONE,
  modificado_por INTEGER,
  estado BOOLEAN DEFAULT TRUE
);

-- USUARIO
CREATE TABLE IF NOT EXISTS usuario (
  id_usuario SERIAL PRIMARY KEY,
  id_persona INTEGER UNIQUE NOT NULL REFERENCES persona(id_persona) ON DELETE RESTRICT,
  username VARCHAR(150) UNIQUE,
  password_hash VARCHAR(255),
  ultimo_login TIMESTAMP WITH TIME ZONE,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now(),
  creado_por INTEGER,
  modificado_en TIMESTAMP WITH TIME ZONE,
  modificado_por INTEGER,
  estado BOOLEAN DEFAULT TRUE
);

-- ROL
CREATE TABLE IF NOT EXISTS rol (
  id_rol SERIAL PRIMARY KEY,
  nombre_rol VARCHAR(150) UNIQUE,
  descripcion TEXT,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now(),
  creado_por INTEGER,
  modificado_en TIMESTAMP WITH TIME ZONE,
  modificado_por INTEGER,
  estado BOOLEAN DEFAULT TRUE
);

-- USUARIO_ROL
CREATE TABLE IF NOT EXISTS usuario_rol (
  id_usuario_rol SERIAL PRIMARY KEY,
  id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  id_rol INTEGER NOT NULL REFERENCES rol(id_rol) ON DELETE CASCADE,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now(),
  creado_por INTEGER,
  modificado_en TIMESTAMP WITH TIME ZONE,
  modificado_por INTEGER,
  estado BOOLEAN DEFAULT TRUE
);

-- SINDICATO
CREATE TABLE IF NOT EXISTS sindicato (
  id_sindicato SERIAL PRIMARY KEY,
  nombre VARCHAR(200) UNIQUE,
  contacto VARCHAR(100),
  direccion TEXT,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now(),
  creado_por INTEGER,
  modificado_en TIMESTAMP WITH TIME ZONE,
  modificado_por INTEGER,
  estado BOOLEAN DEFAULT TRUE
);

-- LINEA
CREATE TABLE IF NOT EXISTS linea (
  id_linea SERIAL PRIMARY KEY,
  id_sindicato INTEGER NOT NULL REFERENCES sindicato(id_sindicato) ON DELETE RESTRICT,
  nombre VARCHAR(200),
  codigo VARCHAR(100) UNIQUE,
  color_argb VARCHAR(20),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now(),
  creado_por INTEGER,
  modificado_en TIMESTAMP WITH TIME ZONE,
  modificado_por INTEGER,
  estado BOOLEAN DEFAULT TRUE
);

-- RECORRIDO
CREATE TABLE IF NOT EXISTS recorrido (
  id_recorrido SERIAL PRIMARY KEY,
  id_linea INTEGER NOT NULL REFERENCES linea(id_linea) ON DELETE CASCADE,
  nombre VARCHAR(200),
  sentido VARCHAR(50), -- 'IDA'/'VUELTA'
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now(),
  creado_por INTEGER,
  modificado_en TIMESTAMP WITH TIME ZONE,
  modificado_por INTEGER,
  estado BOOLEAN DEFAULT TRUE
);

-- VEHICULO
CREATE TABLE IF NOT EXISTS vehiculo (
  id_vehiculo SERIAL PRIMARY KEY,
  id_linea INTEGER NOT NULL REFERENCES linea(id_linea) ON DELETE SET NULL,
  placa VARCHAR(50) UNIQUE,
  tipo VARCHAR(100),
  capacidad INTEGER,
  modelo VARCHAR(100),
  marca VARCHAR(100),
  ano INTEGER,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now(),
  creado_por INTEGER,
  modificado_en TIMESTAMP WITH TIME ZONE,
  modificado_por INTEGER,
  estado BOOLEAN DEFAULT TRUE
);

-- PARADA
CREATE TABLE IF NOT EXISTS parada (
  id_parada SERIAL PRIMARY KEY,
  id_recorrido INTEGER NOT NULL REFERENCES recorrido(id_recorrido) ON DELETE CASCADE,
  nombre VARCHAR(200),
  lat DECIMAL(10,8),
  lon DECIMAL(11,8),
  secuencia INTEGER,
  tipo_parada VARCHAR(50), -- 'INICIO'/'INTERMEDIA'/'FIN'
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now(),
  creado_por INTEGER,
  modificado_en TIMESTAMP WITH TIME ZONE,
  modificado_por INTEGER,
  estado BOOLEAN DEFAULT TRUE
);

-- REPORTE
CREATE TABLE IF NOT EXISTS reporte (
  id_reporte SERIAL PRIMARY KEY,
  id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE SET NULL,
  id_linea INTEGER REFERENCES linea(id_linea) ON DELETE SET NULL,
  id_recorrido INTEGER REFERENCES recorrido(id_recorrido) ON DELETE SET NULL,
  id_vehiculo INTEGER REFERENCES vehiculo(id_vehiculo) ON DELETE SET NULL,
  tipo_reporte VARCHAR(100), -- 'INCIDENCIA','SUGERENCIA','PROBLEMA'
  descripcion TEXT,
  estado_reporte VARCHAR(50) DEFAULT 'PENDIENTE',
  lat DECIMAL(10,8),
  lon DECIMAL(11,8),
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now(),
  creado_por INTEGER,
  modificado_en TIMESTAMP WITH TIME ZONE,
  modificado_por INTEGER,
  estado BOOLEAN DEFAULT TRUE
);

-- ASIGNACION_VEHICULO
CREATE TABLE IF NOT EXISTS asignacion_vehiculo (
  id_asignacion SERIAL PRIMARY KEY,
  id_vehiculo INTEGER NOT NULL REFERENCES vehiculo(id_vehiculo) ON DELETE CASCADE,
  id_usuario INTEGER NOT NULL REFERENCES usuario(id_usuario) ON DELETE CASCADE,
  fecha_asignacion DATE,
  fecha_fin DATE,
  creado_en TIMESTAMP WITH TIME ZONE DEFAULT now(),
  creado_por INTEGER,
  modificado_en TIMESTAMP WITH TIME ZONE,
  modificado_por INTEGER,
  estado BOOLEAN DEFAULT TRUE
);

-- After all main objects, add FK constraints for audit columns pointing to usuario(id_usuario)
-- (do not fail creation if usuario not yet populated)
ALTER TABLE persona
  ADD CONSTRAINT fk_persona_creado_por FOREIGN KEY (creado_por) REFERENCES usuario(id_usuario) ON DELETE SET NULL;
ALTER TABLE persona
  ADD CONSTRAINT fk_persona_modificado_por FOREIGN KEY (modificado_por) REFERENCES usuario(id_usuario) ON DELETE SET NULL;

ALTER TABLE rol
  ADD CONSTRAINT fk_rol_creado_por FOREIGN KEY (creado_por) REFERENCES usuario(id_usuario) ON DELETE SET NULL;
ALTER TABLE rol
  ADD CONSTRAINT fk_rol_modificado_por FOREIGN KEY (modificado_por) REFERENCES usuario(id_usuario) ON DELETE SET NULL;

ALTER TABLE usuario_rol
  ADD CONSTRAINT fk_usuario_rol_creado_por FOREIGN KEY (creado_por) REFERENCES usuario(id_usuario) ON DELETE SET NULL;
ALTER TABLE usuario_rol
  ADD CONSTRAINT fk_usuario_rol_modificado_por FOREIGN KEY (modificado_por) REFERENCES usuario(id_usuario) ON DELETE SET NULL;

ALTER TABLE sindicato
  ADD CONSTRAINT fk_sindicato_creado_por FOREIGN KEY (creado_por) REFERENCES usuario(id_usuario) ON DELETE SET NULL;
ALTER TABLE sindicato
  ADD CONSTRAINT fk_sindicato_modificado_por FOREIGN KEY (modificado_por) REFERENCES usuario(id_usuario) ON DELETE SET NULL;

ALTER TABLE linea
  ADD CONSTRAINT fk_linea_creado_por FOREIGN KEY (creado_por) REFERENCES usuario(id_usuario) ON DELETE SET NULL;
ALTER TABLE linea
  ADD CONSTRAINT fk_linea_modificado_por FOREIGN KEY (modificado_por) REFERENCES usuario(id_usuario) ON DELETE SET NULL;

ALTER TABLE recorrido
  ADD CONSTRAINT fk_recorrido_creado_por FOREIGN KEY (creado_por) REFERENCES usuario(id_usuario) ON DELETE SET NULL;
ALTER TABLE recorrido
  ADD CONSTRAINT fk_recorrido_modificado_por FOREIGN KEY (modificado_por) REFERENCES usuario(id_usuario) ON DELETE SET NULL;

ALTER TABLE vehiculo
  ADD CONSTRAINT fk_vehiculo_creado_por FOREIGN KEY (creado_por) REFERENCES usuario(id_usuario) ON DELETE SET NULL;
ALTER TABLE vehiculo
  ADD CONSTRAINT fk_vehiculo_modificado_por FOREIGN KEY (modificado_por) REFERENCES usuario(id_usuario) ON DELETE SET NULL;

ALTER TABLE parada
  ADD CONSTRAINT fk_parada_creado_por FOREIGN KEY (creado_por) REFERENCES usuario(id_usuario) ON DELETE SET NULL;
ALTER TABLE parada
  ADD CONSTRAINT fk_parada_modificado_por FOREIGN KEY (modificado_por) REFERENCES usuario(id_usuario) ON DELETE SET NULL;

ALTER TABLE reporte
  ADD CONSTRAINT fk_reporte_creado_por FOREIGN KEY (creado_por) REFERENCES usuario(id_usuario) ON DELETE SET NULL;
ALTER TABLE reporte
  ADD CONSTRAINT fk_reporte_modificado_por FOREIGN KEY (modificado_por) REFERENCES usuario(id_usuario) ON DELETE SET NULL;

ALTER TABLE asignacion_vehiculo
  ADD CONSTRAINT fk_asignacion_creado_por FOREIGN KEY (creado_por) REFERENCES usuario(id_usuario) ON DELETE SET NULL;
ALTER TABLE asignacion_vehiculo
  ADD CONSTRAINT fk_asignacion_modificado_por FOREIGN KEY (modificado_por) REFERENCES usuario(id_usuario) ON DELETE SET NULL;

-- Indexes commonly used
CREATE INDEX IF NOT EXISTS idx_persona_cedula ON persona(cedula);
CREATE INDEX IF NOT EXISTS idx_usuario_username ON usuario(username);
CREATE INDEX IF NOT EXISTS idx_linea_codigo ON linea(codigo);
CREATE INDEX IF NOT EXISTS idx_parada_location ON parada USING gist (ll_to_earth(lat, lon));

-- End of schema
