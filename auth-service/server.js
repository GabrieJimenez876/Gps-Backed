import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Configuration
dotenv.config();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

// Load JWT Config
const loadJWTConfig = () => {
  try {
    const configPath = path.join(__dirname, '..', 'config', 'jwt_config.json');
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    console.warn('JWT config file not found, using defaults');
    return {
      JWT: {
        SECRET_KEY: process.env.JWT_SECRET || 'cambiar-esta-clave-secreta',
        ALGORITHM: 'HS256',
        ACCESS_TOKEN_EXPIRE_MINUTES: 30,
        REFRESH_TOKEN_EXPIRE_DAYS: 7,
        ISSUER: 'gps-app-system'
      }
    };
  }
};

const jwtConfig = loadJWTConfig();

// Load DB Config
const loadDBConfig = () => {
  try {
    const configPath = path.join(__dirname, '..', 'config', 'db_config.json');
    return JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    console.error('DB config file not found');
    return null;
  }
};

const dbConfig = loadDBConfig();

// Database Pool
const pool = new Pool({
  host: dbConfig?.PGHOST || process.env.PGHOST || 'localhost',
  port: dbConfig?.PGPORT || process.env.PGPORT || 5432,
  database: dbConfig?.PGDATABASE || process.env.PGDATABASE || 'gps_app_db',
  user: dbConfig?.PGUSER || process.env.PGUSER || 'postgres',
  password: dbConfig?.PGPASSWORD || process.env.PGPASSWORD || 'password123'
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// Middleware
app.use(cors());
app.use(express.json());

// JWT Helper Functions
const generateTokens = (usuario) => {
  const accessTokenExpiry = new Date();
  accessTokenExpiry.setMinutes(
    accessTokenExpiry.getMinutes() + (jwtConfig.JWT.ACCESS_TOKEN_EXPIRE_MINUTES || 30)
  );

  const refreshTokenExpiry = new Date();
  refreshTokenExpiry.setDate(
    refreshTokenExpiry.getDate() + (jwtConfig.JWT.REFRESH_TOKEN_EXPIRE_DAYS || 7)
  );

  const payload = {
    id_usuario: usuario.id_usuario,
    username: usuario.username,
    id_persona: usuario.id_persona,
    roles: usuario.roles || [],
    exp: Math.floor(accessTokenExpiry.getTime() / 1000)
  };

  const accessToken = jwt.sign(
    payload,
    jwtConfig.JWT.SECRET_KEY,
    {
      algorithm: jwtConfig.JWT.ALGORITHM,
      issuer: jwtConfig.JWT.ISSUER,
      subject: usuario.id_usuario.toString()
    }
  );

  const refreshPayload = {
    id_usuario: usuario.id_usuario,
    exp: Math.floor(refreshTokenExpiry.getTime() / 1000)
  };

  const refreshToken = jwt.sign(
    refreshPayload,
    jwtConfig.JWT.SECRET_KEY,
    { algorithm: jwtConfig.JWT.ALGORITHM }
  );

  return { accessToken, refreshToken, expiresIn: jwtConfig.JWT.ACCESS_TOKEN_EXPIRE_MINUTES * 60 };
};

const verifyToken = (token) => {
  try {
    return jwt.verify(token, jwtConfig.JWT.SECRET_KEY, {
      algorithms: [jwtConfig.JWT.ALGORITHM],
      issuer: jwtConfig.JWT.ISSUER
    });
  } catch (error) {
    return null;
  }
};

// Middleware: Verify JWT
const authenticateToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
};

// Routes

// Health Check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'auth-service',
    timestamp: new Date().toISOString()
  });
});

// Login
app.post('/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const client = await pool.connect();
    try {
      // Fetch user with roles
      const userResult = await client.query(`
        SELECT 
          u.id_usuario,
          u.id_persona,
          u.username,
          u.password_hash,
          u.estado,
          p.nombres,
          p.apellidos,
          p.email,
          array_agg(DISTINCT r.nombre_rol) as roles
        FROM usuario u
        JOIN persona p ON u.id_persona = p.id_persona
        LEFT JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario
        LEFT JOIN rol r ON ur.id_rol = r.id_rol
        WHERE u.username = $1 AND u.estado = true
        GROUP BY u.id_usuario, p.id_persona
      `, [username]);

      if (userResult.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const usuario = userResult.rows[0];

      // Verify password
      const passwordValid = await bcrypt.compare(password, usuario.password_hash);
      if (!passwordValid) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      // Update last login
      await client.query(
        'UPDATE usuario SET ultimo_login = NOW() WHERE id_usuario = $1',
        [usuario.id_usuario]
      );

      // Generate tokens
      const tokens = generateTokens(usuario);

      res.json({
        success: true,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresIn: tokens.expiresIn,
        user: {
          id_usuario: usuario.id_usuario,
          id_persona: usuario.id_persona,
          username: usuario.username,
          nombres: usuario.nombres,
          apellidos: usuario.apellidos,
          email: usuario.email,
          roles: usuario.roles.filter(r => r !== null)
        }
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Refresh Token
app.post('/auth/refresh', (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const decoded = verifyToken(refreshToken);
    if (!decoded) {
      return res.status(403).json({ error: 'Invalid refresh token' });
    }

    // Generate new access token
    const payload = {
      id_usuario: decoded.id_usuario,
      exp: Math.floor((Date.now() + (jwtConfig.JWT.ACCESS_TOKEN_EXPIRE_MINUTES * 60 * 1000)) / 1000)
    };

    const newAccessToken = jwt.sign(
      payload,
      jwtConfig.JWT.SECRET_KEY,
      { algorithm: jwtConfig.JWT.ALGORITHM }
    );

    res.json({
      success: true,
      accessToken: newAccessToken,
      expiresIn: jwtConfig.JWT.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    });
  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(500).json({ error: 'Token refresh failed' });
  }
});

// Verify Token
app.post('/auth/verify', (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token required' });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return res.status(403).json({ valid: false });
    }

    res.json({
      valid: true,
      user: decoded
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(403).json({ valid: false });
  }
});

// Get Current User (Protected)
app.get('/auth/me', authenticateToken, async (req, res) => {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(`
        SELECT 
          u.id_usuario,
          u.id_persona,
          u.username,
          p.nombres,
          p.apellidos,
          p.email,
          p.cedula,
          p.telefono,
          array_agg(DISTINCT r.nombre_rol) as roles
        FROM usuario u
        JOIN persona p ON u.id_persona = p.id_persona
        LEFT JOIN usuario_rol ur ON u.id_usuario = ur.id_usuario
        LEFT JOIN rol r ON ur.id_rol = r.id_rol
        WHERE u.id_usuario = $1
        GROUP BY u.id_usuario, p.id_persona
      `, [req.user.id_usuario]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'User not found' });
      }

      const usuario = result.rows[0];
      res.json({
        id_usuario: usuario.id_usuario,
        id_persona: usuario.id_persona,
        username: usuario.username,
        nombres: usuario.nombres,
        apellidos: usuario.apellidos,
        email: usuario.email,
        cedula: usuario.cedula,
        telefono: usuario.telefono,
        roles: usuario.roles.filter(r => r !== null)
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Logout (optional - mainly client-side)
app.post('/auth/logout', authenticateToken, (req, res) => {
  // Token invalidation would be handled by client discarding token
  // Or implement token blacklist if needed
  res.json({ success: true, message: 'Logged out successfully' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start Server
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Auth Service running on http://localhost:${PORT}`);
  console.log(`JWT Config: ${jwtConfig.JWT.ALGORITHM} - ${jwtConfig.JWT.ACCESS_TOKEN_EXPIRE_MINUTES}min expiry`);
  console.log(`DB: ${dbConfig?.PGDATABASE || 'gps_app_db'}`);
  console.log(`${'='.repeat(60)}\n`);
});

export default app;

