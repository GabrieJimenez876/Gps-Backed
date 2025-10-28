-- Tabla de sindicatos
CREATE TABLE IF NOT EXISTS syndicates (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    contact_number VARCHAR(20),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tabla de paradas
CREATE TABLE IF NOT EXISTS stops (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    address TEXT,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Modificar tabla de rutas existente
ALTER TABLE routes 
ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS schedule TEXT,
ADD COLUMN IF NOT EXISTS fare DECIMAL(10,2);

-- Tabla de relación rutas-paradas
CREATE TABLE IF NOT EXISTS routes_stops (
    route_id VARCHAR(36) REFERENCES routes(id),
    stop_id VARCHAR(36) REFERENCES stops(id),
    stop_order INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (route_id, stop_id)
);

-- Tabla de relación rutas-sindicatos
CREATE TABLE IF NOT EXISTS routes_syndicates (
    route_id VARCHAR(36) REFERENCES routes(id),
    syndicate_id VARCHAR(36) REFERENCES syndicates(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (route_id, syndicate_id)
);

-- Índices para búsqueda geoespacial
CREATE INDEX IF NOT EXISTS idx_stops_location ON stops USING gist (
    ll_to_earth(latitude, longitude)
);

-- Índices para mejorar el rendimiento de búsquedas
CREATE INDEX IF NOT EXISTS idx_routes_active ON routes(active);
CREATE INDEX IF NOT EXISTS idx_routes_stops_order ON routes_stops(stop_order);
CREATE INDEX IF NOT EXISTS idx_syndicates_name ON syndicates(name);