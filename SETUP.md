# 🚀 SETUP GUIDE - GPS App

Guía completa para configurar y ejecutar el sistema GPS App.

---

## 📋 Tabla de Contenidos

1. [Requisitos Previos](#requisitos-previos)
2. [Configuración de Base de Datos](#configuración-de-base-de-datos)
3. [Configuración del Backend](#configuración-del-backend)
4. [Pruebas](#pruebas)
5. [Integración con Frontend](#integración-con-frontend)
6. [Troubleshooting](#troubleshooting)

---

## ✅ Requisitos Previos

Asegúrate de tener instalado:

```bash
# Verificar versiones
node --version      # v16+ requerido
npm --version       # v7+
python --version    # v3.8+ (para scripts)
psql --version      # PostgreSQL 13+
```

### Instalación en Windows (PowerShell)

```powershell
# 1. Instalar PostgreSQL (si no está instalado)
# Descargar desde: https://www.postgresql.org/download/windows/

# 2. Instalar Node.js
# Descargar desde: https://nodejs.org/

# 3. Verificar PostgreSQL está corriendo
Get-Service postgres*
```

---

## 🗄️ Configuración de Base de Datos

### Paso 1: Crear Base de Datos

```powershell
# Abrir psql como administrador
psql -U postgres

# Dentro de psql, ejecutar:
CREATE DATABASE gps_app_db;
\connect gps_app_db
CREATE EXTENSION IF NOT EXISTS postgis;

# Ver base de datos creada
\l

# Salir
\q
```

### Paso 2: Inicializar Schema y Datos

**Opción A: Usando Python (recomendado)**

```powershell
# Desde la raíz del proyecto
python db/init_db.py
```

**Opción B: Manual con psql**

```powershell
# Crear tablas
psql -U postgres -d gps_app_db -f db/schema.sql

# Insertar datos de prueba
psql -U postgres -d gps_app_db -f db/seed.sql
```

### Paso 3: Verificar Datos

```powershell
# Conectar a la BD
psql -U postgres -d gps_app_db

# Ver tablas
\dt

# Contar registros
SELECT COUNT(*) as total_usuarios FROM usuario;
SELECT COUNT(*) as total_lineas FROM linea;
SELECT COUNT(*) as total_paradas FROM parada;

# Salir
\q
```

---

## ⚙️ Configuración del Backend

### Paso 1: Configurar Variables de Entorno

```powershell
# Copiar archivos de ejemplo
Copy-Item config\db_config.example.json config\db_config.json
Copy-Item config\jwt_config.example.json config\jwt_config.json

# Copiar .env.example a .env
Copy-Item .env.example .env
```

### Paso 2: Editar `config/db_config.json`

```json
{
  "DB_TYPE": "postgres",
  "PGHOST": "localhost",
  "PGPORT": 5432,
  "PGDATABASE": "gps_app_db",
  "PGUSER": "postgres",
  "PGPASSWORD": "tu_contraseña_aqui",
  "PGSSLMODE": "disable",
  "POOL_MIN": 2,
  "POOL_MAX": 10
}
```

### Paso 3: Editar `config/jwt_config.json`

```json
{
  "JWT": {
    "SECRET_KEY": "tu-clave-secreta-muy-segura-cambiar-en-produccion",
    "ALGORITHM": "HS256",
    "ACCESS_TOKEN_EXPIRE_MINUTES": 30,
    "REFRESH_TOKEN_EXPIRE_DAYS": 7,
    "ISSUER": "gps-app-system"
  }
}
```

### Paso 4: Instalar Dependencias del Auth Service

```powershell
cd auth-service
npm install
cd ..
```

### Paso 5: Iniciar el Auth Service

```powershell
# Terminal 1: Auth Service
cd auth-service
npm start

# Deberías ver:
# ============================================================
# Auth Service running on http://localhost:3001
# JWT Config: HS256 - 30min expiry
# DB: gps_app_db
# ============================================================
```

---

## 🧪 Pruebas

### Prueba 1: Health Check

```bash
curl http://localhost:3001/health
```

Respuesta esperada:
```json
{
  "status": "ok",
  "service": "auth-service",
  "timestamp": "2025-11-17T10:30:00.000Z"
}
```

### Prueba 2: Login

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'
```

Respuesta esperada:
```json
{
  "success": true,
  "accessToken": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "expiresIn": 1800,
  "user": {
    "id_usuario": 1,
    "username": "admin",
    "nombres": "Carlos",
    "apellidos": "Administrador",
    "roles": ["ADMINISTRADOR"]
  }
}
```

### Prueba 3: Usar Node Test Script

```powershell
node scripts/test-auth.js
```

### Prueba 4: Con Postman/Insomnia

1. Importar colección (si disponible)
2. Ejecutar endpoints en orden:
   - GET `/health`
   - POST `/auth/login` (admin/admin123)
   - GET `/auth/me` (con token)

---

## 🔗 Integración con Frontend

### Vue.js / React

Usar el SDK cliente:

```javascript
// 1. Importar
import { GPSAppClient } from './scripts/api-client.js'

// 2. Crear instancia
const api = new GPSAppClient('http://localhost:3001')

// 3. Login
const result = await api.login('admin', 'admin123')
console.log(result.user)

// 4. Verificar autenticación
if (api.isAuthenticated()) {
  const user = api.getUser()
  console.log(user.nombres)
}

// 5. Hacer peticiones protegidas
const currentUser = await api.getCurrentUser()

// 6. Logout
await api.logout()
```

### Flutter

Crear servicio similar:

```dart
class GPSAuthService {
  final String baseUrl = 'http://localhost:3001';
  String? _accessToken;
  
  Future<LoginResponse> login(String username, String password) async {
    final response = await http.post(
      Uri.parse('$baseUrl/auth/login'),
      headers: {'Content-Type': 'application/json'},
      body: jsonEncode({'username': username, 'password': password}),
    );
    
    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      _accessToken = data['accessToken'];
      return LoginResponse.fromJson(data);
    }
    throw Exception('Login failed');
  }
}
```

### Variables de Entorno (Frontend)

En tu archivo `.env.local` o `.env.development`:

```env
REACT_APP_API_URL=http://localhost:3001
REACT_APP_JWT_STORAGE=localStorage
VUE_APP_API_URL=http://localhost:3001
FLUTTER_API_URL=http://localhost:3001
```

---

## 🐛 Troubleshooting

### Error: "Cannot connect to database"

```powershell
# 1. Verificar que PostgreSQL está corriendo
pg_isready -h localhost -p 5432

# 2. Verificar credenciales en config/db_config.json
# 3. Crear BD si no existe
psql -U postgres -c "CREATE DATABASE gps_app_db;"
```

### Error: "ECONNREFUSED 127.0.0.1:3001"

```powershell
# 1. Verificar que el auth-service está corriendo
# 2. Verificar puertos disponibles
netstat -ano | findstr :3001

# 3. Si está en uso, cambiar puerto en auth-service/server.js
```

### Error: "Invalid credentials"

```powershell
# 1. Verificar que seed.sql se ejecutó
psql -U postgres -d gps_app_db -c "SELECT COUNT(*) FROM usuario;"

# 2. Verificar usuario admin existe
psql -U postgres -d gps_app_db -c "SELECT * FROM usuario WHERE username='admin';"

# 3. Si no existe, re-ejecutar seed.sql
psql -U postgres -d gps_app_db -f db/seed.sql
```

### Error: "Token expired"

```javascript
// Usar refresh token para obtener uno nuevo
const newToken = await api.refreshAccessToken()
```

### Error: CORS en frontend

Actualizar `config/jwt_config.json`:

```json
{
  "SECURITY": {
    "CORS_ORIGINS": [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://127.0.0.1:3000",
      "http://tu-dominio.com"
    ]
  }
}
```

---

## 📊 Usuarios de Prueba

| Usuario | Contraseña | Rol | Para Probar |
|---------|-----------|-----|-------------|
| admin | admin123 | ADMINISTRADOR | Acceso total |
| maria_gerente | manager123 | GERENTE | Gestión |
| juan_chofer | chofer123 | CHOFER | Operación |
| luis_user | user123 | PASAJERO | Cliente |

---

## 📝 Notas Importantes

- **Cambiar JWT_SECRET en producción** - no usar el default
- **Cambiar contraseñas de usuarios** después de deployment
- **Usar HTTPS en producción** - no solo HTTP
- **Validar permisos** en cada endpoint
- **Implementar rate limiting** para login attempts
- **Usar variables de entorno** para secretos (nunca hardcoded)

---

## 🔄 Ciclo de Desarrollo

```powershell
# Terminal 1: Base de datos (verificar que está corriendo)
# Terminal 2: Auth Service
cd auth-service
npm start

# Terminal 3: Frontend (cuando esté listo)
# cd frontend
# npm start  # o flutter run

# Ver logs
Get-Content auth.log -Tail 20
```

---

## ✅ Checklist de Setup Completo

- [ ] PostgreSQL instalado y corriendo
- [ ] Base de datos `gps_app_db` creada
- [ ] `db/schema.sql` ejecutado
- [ ] `db/seed.sql` ejecutado
- [ ] `config/db_config.json` configurado con credenciales correctas
- [ ] `config/jwt_config.json` actualizado (secret key único)
- [ ] `.env` copiado y personalizado (opcional pero recomendado)
- [ ] `npm install` ejecutado en `auth-service/`
- [ ] Auth service inicia sin errores (`npm start`)
- [ ] `curl http://localhost:3001/health` retorna 200
- [ ] Login funciona con `admin/admin123`
- [ ] Frontend puede acceder a la API

---

## 📚 Recursos Adicionales

- [PostgreSQL Documentation](https://www.postgresql.org/docs/)
- [Node.js Express Guide](https://expressjs.com/)
- [JWT.io - JWT Debugger](https://jwt.io/)
- [Postman - API Testing](https://www.postman.com/)

---

**¿Necesitas ayuda?** Revisar los logs del servidor y consultar troubleshooting arriba.

**Última actualización:** Noviembre 17, 2025
