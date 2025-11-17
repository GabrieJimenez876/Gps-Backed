-- =====================================================
-- SEED DATA - GPS APP Database
-- PostgreSQL compatible
-- =====================================================
-- This script populates the database with realistic sample data
-- for testing and development purposes.
-- Usage: psql -d gps_app_db -f seed.sql

-- =====================================================
-- 1. INSERT ROLES (must be first, no dependencies)
-- =====================================================
INSERT INTO rol (id_rol, nombre_rol, descripcion, creado_en, estado)
VALUES
  (1, 'ADMINISTRADOR', 'Acceso total al sistema', NOW(), TRUE),
  (2, 'GERENTE', 'Gestión de líneas y recorridos', NOW(), TRUE),
  (3, 'CHOFER', 'Operación de vehículos', NOW(), TRUE),
  (4, 'PASAJERO', 'Usuario pasajero del sistema', NOW(), TRUE),
  (5, 'SUPERVISOR', 'Supervisión de operaciones', NOW(), TRUE);

-- =====================================================
-- 2. INSERT PERSONAS (base data)
-- =====================================================
INSERT INTO persona (id_persona, cedula, nombres, apellidos, telefono, email, direccion, fecha_nacimiento, creado_en, estado)
VALUES
  (1, '1234567-LP', 'Carlos', 'Administrador', '+591-2-1234567', 'carlos@gpsapp.com', 'Calle Comercio 123, La Paz', '1985-05-15', NOW(), TRUE),
  (2, '2345678-LP', 'María', 'Gerente', '+591-2-2345678', 'maria@gpsapp.com', 'Avenida 6 de Agosto 456, La Paz', '1988-03-22', NOW(), TRUE),
  (3, '3456789-LP', 'Juan', 'Chofer Pérez', '+591-7-1111111', 'juan.perez@email.com', 'Zona Sopocachi 789, La Paz', '1990-07-10', NOW(), TRUE),
  (4, '4567890-LP', 'Roberto', 'Chofer Sánchez', '+591-7-2222222', 'roberto.sanchez@email.com', 'Zona San Miguel 234, La Paz', '1992-11-18', NOW(), TRUE),
  (5, '5678901-LP', 'Ana', 'Chofer García', '+591-7-3333333', 'ana.garcia@email.com', 'Zona Villa Fatima 567, La Paz', '1995-09-25', NOW(), TRUE),
  (6, '6789012-LP', 'Pedro', 'Supervisor', '+591-2-3333333', 'pedro@gpsapp.com', 'Calle Potosí 890, La Paz', '1987-02-14', NOW(), TRUE),
  (7, '7890123-LP', 'Luis', 'Pasajero Uno', '+591-7-4444444', 'luis.p1@email.com', 'Zona Miraflores 111, La Paz', '1998-01-30', NOW(), TRUE),
  (8, '8901234-LP', 'Sofia', 'Pasajera Dos', '+591-7-5555555', 'sofia.p2@email.com', 'Zona Obrajes 222, La Paz', '2000-06-12', NOW(), TRUE)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 3. INSERT USUARIOS (with hashed passwords)
-- Note: These use bcrypt format (for demonstration, use a real hash function in production)
-- Passwords: admin123, manager123, chofer123, chofer123, chofer123, super123, user123, user123
-- For production, hash passwords using bcrypt before insertion
-- =====================================================
INSERT INTO usuario (id_usuario, id_persona, username, password_hash, creado_en, estado)
VALUES
  (1, 1, 'admin', '$2b$12$K8H9L7M6N5O4P3Q2R1S0T.abcdefghijklmnopqrstuvwxyz12345', NOW(), TRUE),
  (2, 2, 'maria_gerente', '$2b$12$K8H9L7M6N5O4P3Q2R1S0T.abcdefghijklmnopqrstuvwxyz12346', NOW(), TRUE),
  (3, 3, 'juan_chofer', '$2b$12$K8H9L7M6N5O4P3Q2R1S0T.abcdefghijklmnopqrstuvwxyz12347', NOW(), TRUE),
  (4, 4, 'roberto_chofer', '$2b$12$K8H9L7M6N5O4P3Q2R1S0T.abcdefghijklmnopqrstuvwxyz12348', NOW(), TRUE),
  (5, 5, 'ana_chofer', '$2b$12$K8H9L7M6N5O4P3Q2R1S0T.abcdefghijklmnopqrstuvwxyz12349', NOW(), TRUE),
  (6, 6, 'pedro_supervisor', '$2b$12$K8H9L7M6N5O4P3Q2R1S0T.abcdefghijklmnopqrstuvwxyz12350', NOW(), TRUE),
  (7, 7, 'luis_user', '$2b$12$K8H9L7M6N5O4P3Q2R1S0T.abcdefghijklmnopqrstuvwxyz12351', NOW(), TRUE),
  (8, 8, 'sofia_user', '$2b$12$K8H9L7M6N5O4P3Q2R1S0T.abcdefghijklmnopqrstuvwxyz12352', NOW(), TRUE)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 4. INSERT USUARIO_ROL (role assignments)
-- =====================================================
INSERT INTO usuario_rol (id_usuario_rol, id_usuario, id_rol, creado_en, creado_por, estado)
VALUES
  (1, 1, 1, NOW(), 1, TRUE),  -- Carlos = ADMINISTRADOR
  (2, 2, 2, NOW(), 1, TRUE),  -- María = GERENTE
  (3, 3, 3, NOW(), 1, TRUE),  -- Juan = CHOFER
  (4, 4, 3, NOW(), 1, TRUE),  -- Roberto = CHOFER
  (5, 5, 3, NOW(), 1, TRUE),  -- Ana = CHOFER
  (6, 6, 5, NOW(), 1, TRUE),  -- Pedro = SUPERVISOR
  (7, 7, 4, NOW(), 1, TRUE),  -- Luis = PASAJERO
  (8, 8, 4, NOW(), 1, TRUE)   -- Sofia = PASAJERO
ON CONFLICT DO NOTHING;

-- =====================================================
-- 5. INSERT SINDICATO (cooperatives)
-- =====================================================
INSERT INTO sindicato (id_sindicato, nombre, contacto, direccion, creado_en, creado_por, estado)
VALUES
  (1, 'Sindicato 16 de Julio', 'Lic. Fernando Mendoza', 'Calle Comercio 123, La Paz', NOW(), 1, TRUE),
  (2, 'Sindicato Max Paredes', 'Sr. Roberto Soto', 'Calle Potosí 456, La Paz', NOW(), 1, TRUE),
  (3, 'Sindicato Obrajes', 'Sra. Patricia Rojas', 'Avenida Toma 789, La Paz', NOW(), 1, TRUE),
  (4, 'Sindicato Villa Fatima', 'Sr. Jorge Quispe', 'Calle Hermanos Manchego 234, La Paz', NOW(), 1, TRUE)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 6. INSERT LINEA (transit lines)
-- =====================================================
INSERT INTO linea (id_linea, id_sindicato, nombre, codigo, color_argb, creado_en, creado_por, estado)
VALUES
  (1, 1, 'Línea Roja Centro', 'L-001', '#FFE74C3C', NOW(), 1, TRUE),
  (2, 1, 'Línea Azul Sur', 'L-002', '#FF3498DB', NOW(), 1, TRUE),
  (3, 2, 'Línea Verde Este', 'L-003', '#FF2ECC71', NOW(), 1, TRUE),
  (4, 2, 'Línea Amarilla Oeste', 'L-004', '#FFF39C12', NOW(), 1, TRUE),
  (5, 3, 'Línea Naranja Obrajes', 'L-005', '#FFE67E22', NOW(), 1, TRUE),
  (6, 4, 'Línea Púrpura Villa', 'L-006', '#FF9B59', NOW(), 1, TRUE)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 7. INSERT RECORRIDO (routes within lines)
-- =====================================================
INSERT INTO recorrido (id_recorrido, id_linea, nombre, sentido, creado_en, creado_por, estado)
VALUES
  (1, 1, 'Centro - Miraflores', 'IDA', NOW(), 1, TRUE),
  (2, 1, 'Miraflores - Centro', 'VUELTA', NOW(), 1, TRUE),
  (3, 2, 'Centro - Zona Sur', 'IDA', NOW(), 1, TRUE),
  (4, 2, 'Zona Sur - Centro', 'VUELTA', NOW(), 1, TRUE),
  (5, 3, 'Centro - Zona Este', 'IDA', NOW(), 1, TRUE),
  (6, 3, 'Zona Este - Centro', 'VUELTA', NOW(), 1, TRUE),
  (7, 4, 'Centro - Zona Oeste', 'IDA', NOW(), 1, TRUE),
  (8, 4, 'Zona Oeste - Centro', 'VUELTA', NOW(), 1, TRUE),
  (9, 5, 'Centro - Obrajes', 'IDA', NOW(), 1, TRUE),
  (10, 5, 'Obrajes - Centro', 'VUELTA', NOW(), 1, TRUE),
  (11, 6, 'Centro - Villa Fatima', 'IDA', NOW(), 1, TRUE),
  (12, 6, 'Villa Fatima - Centro', 'VUELTA', NOW(), 1, TRUE)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 8. INSERT VEHICULO (vehicles/buses)
-- =====================================================
INSERT INTO vehiculo (id_vehiculo, id_linea, placa, tipo, capacidad, modelo, marca, ano, creado_en, creado_por, estado)
VALUES
  (1, 1, 'LP-001-A', 'BUS', 45, 'Urbano 2020', 'Hino', 2020, NOW(), 1, TRUE),
  (2, 1, 'LP-002-A', 'BUS', 45, 'Urbano 2020', 'Hino', 2020, NOW(), 1, TRUE),
  (3, 2, 'LP-003-B', 'BUS', 40, 'Urbano 2019', 'Hyundai', 2019, NOW(), 1, TRUE),
  (4, 2, 'LP-004-B', 'BUS', 40, 'Urbano 2019', 'Hyundai', 2019, NOW(), 1, TRUE),
  (5, 3, 'LP-005-C', 'MINIBUS', 30, 'Minibus 2021', 'Toyota', 2021, NOW(), 1, TRUE),
  (6, 3, 'LP-006-C', 'MINIBUS', 30, 'Minibus 2021', 'Toyota', 2021, NOW(), 1, TRUE),
  (7, 4, 'LP-007-D', 'BUS', 50, 'Urbano 2018', 'Scania', 2018, NOW(), 1, TRUE),
  (8, 4, 'LP-008-D', 'BUS', 50, 'Urbano 2018', 'Scania', 2018, NOW(), 1, TRUE),
  (9, 5, 'LP-009-E', 'MINIBUS', 35, 'Minibus 2022', 'Toyota', 2022, NOW(), 1, TRUE),
  (10, 6, 'LP-010-F', 'BUS', 45, 'Urbano 2019', 'Hino', 2019, NOW(), 1, TRUE)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 9. INSERT PARADA (bus stops)
-- =====================================================
INSERT INTO parada (id_parada, id_recorrido, nombre, lat, lon, secuencia, tipo_parada, creado_en, creado_por, estado)
VALUES
  -- Recorrido 1: Centro - Miraflores (IDA)
  (1, 1, 'Terminal Centro', -16.50137, -68.12640, 1, 'INICIO', NOW(), 1, TRUE),
  (2, 1, 'Plaza Murillo', -16.50205, -68.12545, 2, 'INTERMEDIA', NOW(), 1, TRUE),
  (3, 1, 'Mercado Camacho', -16.50678, -68.10234, 3, 'INTERMEDIA', NOW(), 1, TRUE),
  (4, 1, 'Av. Mariscal Santa Cruz', -16.51234, -68.11567, 4, 'INTERMEDIA', NOW(), 1, TRUE),
  (5, 1, 'Miraflores Centro', -16.52456, -68.10789, 5, 'FIN', NOW(), 1, TRUE),
  
  -- Recorrido 2: Miraflores - Centro (VUELTA)
  (6, 2, 'Miraflores Centro', -16.52456, -68.10789, 1, 'INICIO', NOW(), 1, TRUE),
  (7, 2, 'Av. Mariscal Santa Cruz', -16.51234, -68.11567, 2, 'INTERMEDIA', NOW(), 1, TRUE),
  (8, 2, 'Mercado Camacho', -16.50678, -68.10234, 3, 'INTERMEDIA', NOW(), 1, TRUE),
  (9, 2, 'Plaza Murillo', -16.50205, -68.12545, 4, 'INTERMEDIA', NOW(), 1, TRUE),
  (10, 2, 'Terminal Centro', -16.50137, -68.12640, 5, 'FIN', NOW(), 1, TRUE),
  
  -- Recorrido 3: Centro - Zona Sur (IDA)
  (11, 3, 'Terminal Centro', -16.50137, -68.12640, 1, 'INICIO', NOW(), 1, TRUE),
  (12, 3, 'Av. del Ejercito', -16.53456, -68.12456, 2, 'INTERMEDIA', NOW(), 1, TRUE),
  (13, 3, 'Chasquipampa', -16.54789, -68.11234, 3, 'INTERMEDIA', NOW(), 1, TRUE),
  (14, 3, 'Zona Sur Terminal', -16.55678, -68.10456, 4, 'FIN', NOW(), 1, TRUE),
  
  -- Recorrido 4: Zona Sur - Centro (VUELTA)
  (15, 4, 'Zona Sur Terminal', -16.55678, -68.10456, 1, 'INICIO', NOW(), 1, TRUE),
  (16, 4, 'Chasquipampa', -16.54789, -68.11234, 2, 'INTERMEDIA', NOW(), 1, TRUE),
  (17, 4, 'Av. del Ejercito', -16.53456, -68.12456, 3, 'INTERMEDIA', NOW(), 1, TRUE),
  (18, 4, 'Terminal Centro', -16.50137, -68.12640, 4, 'FIN', NOW(), 1, TRUE),
  
  -- Recorrido 5: Centro - Zona Este (IDA)
  (19, 5, 'Terminal Centro', -16.50137, -68.12640, 1, 'INICIO', NOW(), 1, TRUE),
  (20, 5, 'Calle Mercado', -16.49876, -68.11234, 2, 'INTERMEDIA', NOW(), 1, TRUE),
  (21, 5, 'Av. Costanera', -16.48765, -68.09876, 3, 'INTERMEDIA', NOW(), 1, TRUE),
  (22, 5, 'Zona Este Terminal', -16.47654, -68.08765, 4, 'FIN', NOW(), 1, TRUE),
  
  -- Recorrido 6: Zona Este - Centro (VUELTA)
  (23, 6, 'Zona Este Terminal', -16.47654, -68.08765, 1, 'INICIO', NOW(), 1, TRUE),
  (24, 6, 'Av. Costanera', -16.48765, -68.09876, 2, 'INTERMEDIA', NOW(), 1, TRUE),
  (25, 6, 'Calle Mercado', -16.49876, -68.11234, 3, 'INTERMEDIA', NOW(), 1, TRUE),
  (26, 6, 'Terminal Centro', -16.50137, -68.12640, 4, 'FIN', NOW(), 1, TRUE)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 10. INSERT ASIGNACION_VEHICULO (driver assignments)
-- =====================================================
INSERT INTO asignacion_vehiculo (id_asignacion, id_vehiculo, id_usuario, fecha_asignacion, fecha_fin, creado_en, creado_por, estado)
VALUES
  (1, 1, 3, NOW()::date, NULL, NOW(), 1, TRUE),   -- Juan -> LP-001-A
  (2, 2, 4, NOW()::date, NULL, NOW(), 1, TRUE),   -- Roberto -> LP-002-A
  (3, 3, 5, NOW()::date, NULL, NOW(), 1, TRUE),   -- Ana -> LP-003-B
  (4, 4, 3, (NOW()::date + INTERVAL '1 day'), NULL, NOW(), 1, TRUE),   -- Juan (turnos)
  (5, 5, 4, NOW()::date, NULL, NOW(), 1, TRUE),   -- Roberto
  (6, 6, 5, NOW()::date, NULL, NOW(), 1, TRUE),   -- Ana
  (7, 7, 3, (NOW()::date + INTERVAL '2 days'), NULL, NOW(), 1, TRUE),   -- Juan
  (8, 8, 4, (NOW()::date + INTERVAL '2 days'), NULL, NOW(), 1, TRUE),   -- Roberto
  (9, 9, 5, (NOW()::date + INTERVAL '1 day'), NULL, NOW(), 1, TRUE),    -- Ana
  (10, 10, 3, (NOW()::date + INTERVAL '3 days'), NULL, NOW(), 1, TRUE)  -- Juan
ON CONFLICT DO NOTHING;

-- =====================================================
-- 11. INSERT REPORTE (incident reports)
-- =====================================================
INSERT INTO reporte (id_reporte, id_usuario, id_linea, id_recorrido, id_vehiculo, tipo_reporte, descripcion, estado_reporte, lat, lon, creado_en, creado_por, estado)
VALUES
  (1, 7, 1, 1, 1, 'INCIDENCIA', 'Retraso de 15 minutos por tráfico', 'RESUELTO', -16.50205, -68.12545, NOW() - INTERVAL '2 hours', 1, TRUE),
  (2, 8, 2, 3, 3, 'SUGERENCIA', 'Agregar una parada en zona comercial', 'PENDIENTE', -16.53456, -68.12456, NOW() - INTERVAL '1 hour', 1, TRUE),
  (3, 7, 1, 1, 1, 'PROBLEMA', 'Acondicionamiento de aire no funciona', 'PENDIENTE', -16.51234, -68.11567, NOW() - INTERVAL '30 minutes', 1, TRUE),
  (4, 8, 3, 5, 5, 'INCIDENCIA', 'Accidente menor sin heridos', 'RESUELTO', -16.48765, -68.09876, NOW() - INTERVAL '1 day', 1, TRUE),
  (5, 7, 4, 7, 7, 'SUGERENCIA', 'Mejorar iluminación en parada nocturna', 'EN_PROGRESO', -16.50789, -68.13456, NOW() - INTERVAL '12 hours', 1, TRUE)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 12. UPDATE audit columns (creado_por/modificado_por)
-- =====================================================
-- Update personas to set creado_por = 1 where creado_por is NULL
UPDATE persona SET creado_por = 1 WHERE creado_por IS NULL;
UPDATE rol SET creado_por = 1 WHERE creado_por IS NULL;
UPDATE sindicato SET creado_por = 1 WHERE creado_por IS NULL;
UPDATE linea SET creado_por = 1 WHERE creado_por IS NULL;
UPDATE recorrido SET creado_por = 1 WHERE creado_por IS NULL;
UPDATE vehiculo SET creado_por = 1 WHERE creado_por IS NULL;
UPDATE parada SET creado_por = 1 WHERE creado_por IS NULL;
UPDATE reporte SET creado_por = 1 WHERE creado_por IS NULL;
UPDATE asignacion_vehiculo SET creado_por = 1 WHERE creado_por IS NULL;

-- =====================================================
-- SEED COMPLETE
-- =====================================================
-- Total inserted:
-- - 8 Personas (users/people)
-- - 8 Usuarios (login accounts)
-- - 8 Roles assignments
-- - 5 Roles
-- - 4 Sindicatos (cooperatives)
-- - 6 Líneas (transit lines)
-- - 12 Recorridos (routes)
-- - 10 Vehículos (vehicles/buses)
-- - 26 Paradas (bus stops)
-- - 10 Asignaciones de Vehículos (driver assignments)
-- - 5 Reportes (incident reports)
--
-- Default passwords (hashed with bcrypt):
-- admin / admin123
-- maria_gerente / manager123
-- juan_chofer / chofer123
-- roberto_chofer / chofer123
-- ana_chofer / chofer123
-- pedro_supervisor / super123
-- luis_user / user123
-- sofia_user / user123
--
-- WARNING: These are demo hashes - use real bcrypt hashes in production!
-- =====================================================
