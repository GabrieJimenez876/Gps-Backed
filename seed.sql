-- Datos de Prueba para PostgreSQL
-- -----------------------------------------------------------------------------------
-- Inserta sindicatos
INSERT INTO sindicatos (nombre) VALUES 
('Sindicato 16 de Julio') ON CONFLICT DO NOTHING,
('Sindicato Max Paredes') ON CONFLICT DO NOTHING;

-- Inserta una línea
INSERT INTO lineas (sindicato_id, nombre, clave, numero, frecuencia_min, estado, usuario_creacion, fecha_creacion)
VALUES (
    (SELECT id FROM sindicatos WHERE nombre = 'Sindicato 16 de Julio'), -- sindicato_id
    'Línea Roja',                                                     -- nombre
    'ROJA',                                                           -- clave
    1,                                                                -- numero
    10,                                                               -- frecuencia_min
    'ACTIVO',                                                         -- estado
    'system_seed',                                                    -- usuario_creacion
    NOW()                                                             -- fecha_creacion
) RETURNING id;

-- Guarda el ID de la nueva línea para usarlo en las siguientes inserciones
-- (Si estás ejecutando esto comando por comando, puedes omitir esta línea, 
-- pero si lo ejecutas en bloque, PostgreSQL maneja esto bien en pgAdmin)

-- Insertar Puntos de Recorrido (Ejemplo: una ruta simple)
WITH LineaID AS (
    SELECT id FROM lineas WHERE nombre = 'Línea Roja' LIMIT 1
)
INSERT INTO recorrido_puntos (linea_id, lat, lng, orden) VALUES
((SELECT id FROM LineaID), -16.5000, -68.1200, 1), -- Punto 1 (Cerca de Miraflores)
((SELECT id FROM LineaID), -16.5050, -68.1350, 2), -- Punto 2
((SELECT id FROM LineaID), -16.5100, -68.1500, 3); -- Punto 3 (Cerca del Cementerio)

-- Insertar Paradas
WITH LineaID AS (
    SELECT id FROM lineas WHERE nombre = 'Línea Roja' LIMIT 1
)
INSERT INTO paradas (linea_id, nombre, lat, lng, orden) VALUES
((SELECT id FROM LineaID), 'Parada Miraflores', -16.5005, -68.1205, 1),
((SELECT id FROM LineaID), 'Parada Principal', -16.5070, -68.1400, 2);

-- Insertar Auditoría para la creación de la Línea Roja
WITH LineaID AS (
    SELECT id FROM lineas WHERE nombre = 'Línea Roja' LIMIT 1
)
INSERT INTO auditoria_lineas (linea_id, accion, datos, usuario) VALUES
((SELECT id FROM LineaID), 'CREAR', '{"nota": "Datos iniciales de prueba"}', 'system_seed');

-- -----------------------------------------------------------------------------------
-- Puedes añadir más líneas de bus aquí si lo deseas.
-- -----------------------------------------------------------------------------------
