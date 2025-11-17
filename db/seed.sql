-- Seed data for the new schema (Postgres)

-- Roles
INSERT INTO rol (nombre_rol, descripcion, creado_en)
VALUES
('admin', 'Administrador del sistema', now()),
('chofer', 'Chofer de vehiculos', now()),
('usuario', 'Usuario regular', now())
ON CONFLICT (nombre_rol) DO NOTHING;

-- Personas
INSERT INTO persona (cedula, nombres, apellidos, telefono, email, direccion, fecha_nacimiento, creado_en)
VALUES
('12345678', 'Gabriel', 'Jimenez', '+59170000000', 'gabriel@example.com', 'Calle Falsa 123', '1990-01-01', now()),
('87654321', 'Maria', 'Perez', '+59170000001', 'maria@example.com', 'Avenida Siempre Viva 742', '1985-05-10', now())
ON CONFLICT (cedula) DO NOTHING;

-- Usuarios (map persons to users)
-- password_hash placeholders (store real hashes in production)
INSERT INTO usuario (id_persona, username, password_hash, creado_en)
SELECT p.id_persona, lower(substring(p.nombres,1,1) || p.apellidos) || '_user', 'pbkdf2$placeholder', now()
FROM persona p
WHERE p.cedula IN ('12345678','87654321')
ON CONFLICT (id_persona) DO NOTHING;

-- Link usuarios to roles (assign admin to Gabriel)
WITH u AS (SELECT id_usuario FROM usuario u JOIN persona p ON u.id_persona = p.id_persona WHERE p.cedula = '12345678'),
     r AS (SELECT id_rol FROM rol WHERE nombre_rol = 'admin')
INSERT INTO usuario_rol (id_usuario, id_rol, creado_en)
SELECT (SELECT id_usuario FROM u), (SELECT id_rol FROM r), now()
ON CONFLICT DO NOTHING;

-- Sindicatos
INSERT INTO sindicato (nombre, contacto, direccion, creado_en)
VALUES
('Sindicato 16 de Julio', '+59170001111', 'Zona Norte', now()),
('Sindicato Max Paredes', '+59170002222', 'Centro', now())
ON CONFLICT (nombre) DO NOTHING;

-- Lineas
INSERT INTO linea (id_sindicato, nombre, codigo, color_argb, creado_en)
SELECT s.id_sindicato, 'Linea Roja', 'ROJA', '#FF0000', now() FROM sindicato s WHERE s.nombre = 'Sindicato 16 de Julio'
ON CONFLICT DO NOTHING;

INSERT INTO linea (id_sindicato, nombre, codigo, color_argb, creado_en)
SELECT s.id_sindicato, 'Linea Azul', 'AZUL', '#0000FF', now() FROM sindicato s WHERE s.nombre = 'Sindicato Max Paredes'
ON CONFLICT DO NOTHING;

-- Recorridos
INSERT INTO recorrido (id_linea, nombre, sentido, creado_en)
SELECT l.id_linea, 'Recorrido Central - Ida', 'IDA', now() FROM linea l WHERE l.codigo = 'ROJA'
ON CONFLICT DO NOTHING;

INSERT INTO recorrido (id_linea, nombre, sentido, creado_en)
SELECT l.id_linea, 'Recorrido Central - Vuelta', 'VUELTA', now() FROM linea l WHERE l.codigo = 'ROJA'
ON CONFLICT DO NOTHING;

-- Vehiculos
INSERT INTO vehiculo (id_linea, placa, tipo, capacidad, modelo, marca, ano, creado_en)
SELECT l.id_linea, 'ABC-123', 'BUS', 40, '2020', 'Mercedes', 2020, now() FROM linea l WHERE l.codigo = 'ROJA'
ON CONFLICT DO NOTHING;

INSERT INTO vehiculo (id_linea, placa, tipo, capacidad, modelo, marca, ano, creado_en)
SELECT l.id_linea, 'XYZ-987', 'MINIBUS', 20, '2018', 'Toyota', 2018, now() FROM linea l WHERE l.codigo = 'AZUL'
ON CONFLICT DO NOTHING;

-- Paradas (example sequence for 'Recorrido Central - Ida')
WITH rec AS (SELECT id_recorrido FROM recorrido WHERE nombre LIKE 'Recorrido Central - Ida' LIMIT 1)
INSERT INTO parada (id_recorrido, nombre, lat, lon, secuencia, tipo_parada, creado_en)
SELECT (SELECT id_recorrido FROM rec), 'Parada Inicio', -16.50000000, -68.12000000, 1, 'INICIO', now()
ON CONFLICT DO NOTHING;

INSERT INTO parada (id_recorrido, nombre, lat, lon, secuencia, tipo_parada, creado_en)
SELECT (SELECT id_recorrido FROM rec), 'Parada Intermedia', -16.50500000, -68.13000000, 2, 'INTERMEDIA', now()
ON CONFLICT DO NOTHING;

INSERT INTO parada (id_recorrido, nombre, lat, lon, secuencia, tipo_parada, creado_en)
SELECT (SELECT id_recorrido FROM rec), 'Parada Fin', -16.51000000, -68.14000000, 3, 'FIN', now()
ON CONFLICT DO NOTHING;

-- Asignaciones (assign vehiculo ABC-123 to Maria's user as chofer)
WITH v AS (SELECT id_vehiculo FROM vehiculo WHERE placa = 'ABC-123' LIMIT 1),
     u AS (SELECT u.id_usuario FROM usuario u JOIN persona p ON u.id_persona = p.id_persona WHERE p.cedula = '87654321' LIMIT 1)
INSERT INTO asignacion_vehiculo (id_vehiculo, id_usuario, fecha_asignacion, creado_en)
SELECT (SELECT id_vehiculo FROM v), (SELECT id_usuario FROM u), now()::date, now()
ON CONFLICT DO NOTHING;

-- Reportes sample
WITH reporter AS (SELECT u.id_usuario FROM usuario u JOIN persona p ON u.id_persona = p.id_persona WHERE p.cedula = '12345678'),
     l AS (SELECT id_linea FROM linea WHERE codigo = 'ROJA' LIMIT 1),
     r AS (SELECT id_recorrido FROM recorrido WHERE nombre LIKE 'Recorrido Central - Ida' LIMIT 1),
     v2 AS (SELECT id_vehiculo FROM vehiculo WHERE placa = 'ABC-123' LIMIT 1)
INSERT INTO reporte (id_usuario, id_linea, id_recorrido, id_vehiculo, tipo_reporte, descripcion, lat, lon, creado_en)
SELECT (SELECT id_usuario FROM reporter), (SELECT id_linea FROM l), (SELECT id_recorrido FROM r), (SELECT id_vehiculo FROM v2), 'INCIDENCIA', 'Detección de problema en servicio', -16.50500000, -68.13000000, now()
ON CONFLICT DO NOTHING;

-- End of seed
