
# GPS App - Sistema de Transporte La Paz

Este proyecto es una **aplicación móvil y web** para visualizar rutas de **minibuses en La Paz**, Bolivia, con autenticación segura basada en **JWT** y base de datos PostgreSQL.

---

## 🧱 Estructura del Proyecto

```
├── app.py                    # Script Python auxiliar
├── auth-service/             # Servicio de autenticación (JWT)
│   ├── server.js
│   └── package.json
├── lines-service/            # Servicio de líneas de transporte
├── routes-service/           # Servicio de recorridos
├── config/                   # Configuraciones
│   ├── db_config.json       # Configuración de BD
│   └── jwt_config.json      # Configuración JWT
├── db/                       # Scripts de base de datos
│   ├── schema.dbml          # Diagrama DBML
│   ├── schema.sql           # Esquema PostgreSQL
│   ├── seed.sql             # Datos de prueba
│   └── init_db.py           # Script de inicialización
├── scripts/                  # Utilidades
└── README.md
```

---

## 🗺️ Tecnologías Utilizadas

### 🖥️ Frontend
- **Flutter** (Android, iOS y Web)
- **HTML5 + CSS3**
- **Leaflet.js** (visualización de mapas)
- **OpenStreetMap** (mapas libres)

### 🛠️ Backend
- **Node.js** + **Express**
- **PostgreSQL** + **PostGIS** (opcional)
- **JWT (JSON Web Tokens)** para autenticación segura
- **bcryptjs** para hashing de contraseñas
- **pg** (driver PostgreSQL)

---

## 🚀 Funcionalidades Principales

- ✅ Visualización de rutas de minibuses en La Paz
- ✅ Autenticación segura con JWT
- ✅ Ubicación GPS en tiempo real
- ✅ Consulta de paradas cercanas
- ✅ Información de sindicatos y recorridos
- ✅ Gestión de vehículos y choferes
- ✅ Sistema de reportes e incidencias
- ✅ Panel administrativo
- ✅ Compatible con Flutter Web

---

## 👤 Usuarios de Prueba

| Usuario | Contraseña | Rol | Permisos |
|---------|-----------|-----|----------|
| `admin` | `admin123` | ADMINISTRADOR | Acceso total |
| `maria_gerente` | `manager123` | GERENTE | Gestión de líneas |
| `juan_chofer` | `chofer123` | CHOFER | Operación de vehículos |
| `luis_user` | `user123` | PASAJERO | Lectura de rutas |

---

## 📦 Estructura de Base de Datos

### Tablas Principales

| Tabla | Descripción |
|-------|-------------|
| `persona` | Información personal (nombres, contacto, etc.) |
| `usuario` | Cuentas de login con autenticación |
| `rol` | Roles disponibles del sistema |
| `usuario_rol` | Asignación de roles a usuarios |
| `sindicato` | Cooperativas de transporte |
| `linea` | Líneas de transporte |
| `recorrido` | Rutas específicas (ida/vuelta) |
| `parada` | Paradas de autobús |
| `vehiculo` | Buses y minibuses |
| `asignacion_vehiculo` | Asignación de choferes a vehículos |
| `reporte` | Reportes de incidencias |

---

## 🛠️ Requisitos Previos

- **Node.js** v16+
- **PostgreSQL** 13+
- **Python** 3.8+ (para script de inicialización)
- **PostGIS** (opcional, para funciones geoespaciales)
- **Git**

---

## ⚙️ Instalación Paso a Paso

### 1. Clonar el Repositorio

```bash
git clone https://github.com/GabrieJimenez876/Gps-Backed.git
cd Gps-Backed
```

### 2. Crear Base de Datos PostgreSQL

```powershell
# Conectar como usuario postgres
psql -U postgres

# Dentro de psql:
CREATE DATABASE gps_app_db;
CREATE EXTENSION IF NOT EXISTS postgis;
\q
```

### 3. Configurar Variables de Entorno

Copia los archivos de configuración:

```powershell
# Copiar configuración BD (personaliza según tu entorno)
cp config/db_config.example.json config/db_config.json

# Copiar configuración JWT
cp config/jwt_config.example.json config/jwt_config.json
```

Edita `config/db_config.json`:

```json
{
  "DB_TYPE": "postgres",
  "PGHOST": "localhost",
  "PGPORT": 5432,
  "PGDATABASE": "gps_app_db",
  "PGUSER": "postgres",
  "PGPASSWORD": "tu_contraseña",
  "PGSSLMODE": "disable"
}
```

### 4. Inicializar Base de Datos

Usando Python (recomendado):

```powershell
python db/init_db.py
```

O manualmente:

```powershell
psql -U postgres -d gps_app_db -f db/schema.sql
psql -U postgres -d gps_app_db -f db/seed.sql
```

### 5. Instalar Dependencias del Auth Service

```powershell
cd auth-service
npm install
```

### 6. Iniciar el Servidor de Autenticación

```powershell
npm start
# El servidor correrá en http://localhost:3001
```

---

## 🔐 API de Autenticación (JWT)

### Endpoints Disponibles

#### Login
```http
POST /auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "admin123"
}
```

**Respuesta:**
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

#### Verificar Token
```http
POST /auth/verify
Content-Type: application/json

{
  "token": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Obtener Usuario Actual (Protegido)
```http
GET /auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

#### Refrescar Token
```http
POST /auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
}
```

#### Logout
```http
POST /auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## 🔑 Configuración JWT

El archivo `config/jwt_config.json` define:

```json
{
  "JWT": {
    "SECRET_KEY": "tu-clave-secreta-super-segura",
    "ALGORITHM": "HS256",
    "ACCESS_TOKEN_EXPIRE_MINUTES": 30,
    "REFRESH_TOKEN_EXPIRE_DAYS": 7
  }
}
```

⚠️ **IMPORTANTE:** Cambia `SECRET_KEY` en producción.

---

## 📊 Datos de Ejemplo

El script `db/seed.sql` inserta:

- **8 Personas** (usuarios con información personal)
- **8 Usuarios** (cuentas con login)
- **5 Roles** (ADMIN, GERENTE, CHOFER, PASAJERO, SUPERVISOR)
- **4 Sindicatos** (cooperativas)
- **6 Líneas** (rutas de transporte)
- **12 Recorridos** (ida/vuelta)
- **10 Vehículos** (buses)
- **26 Paradas** (puntos de parada)
- **10 Asignaciones** (choferes asignados)
- **5 Reportes** (incidencias)

---

## 🎯 Integración con Frontend (GPs-Fronted)

### Conexión desde Vue.js / React / Flutter

Ejemplo en JavaScript/Fetch:

```javascript
// Login
const response = await fetch('http://localhost:3001/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'admin',
    password: 'admin123'
  })
});

const data = await response.json();
const { accessToken, user } = data;

// Guardar token (localStorage o secure storage)
localStorage.setItem('authToken', accessToken);

// Usar en peticiones posteriores
const meResponse = await fetch('http://localhost:3001/auth/me', {
  headers: {
    'Authorization': `Bearer ${accessToken}`
  }
});
```

---

## 📝 Variables de Entorno

Crea un archivo `.env` en la raíz:

```env
# Base de Datos
PGHOST=localhost
PGPORT=5432
PGDATABASE=gps_app_db
PGUSER=postgres
PGPASSWORD=tu_contraseña

# JWT
JWT_SECRET=cambiar-esta-clave-secreta

# Servidor
PORT=3001
CORS_ORIGIN=http://localhost:3000
```

---

## 🧪 Pruebas

### Probar endpoints con curl

```bash
# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}'

# Health check
curl http://localhost:3001/health
```

O usa Postman/Insomnia.

---

## 🐛 Troubleshooting

### Error de conexión a BD
- Verifica que PostgreSQL esté corriendo: `psql -U postgres`
- Revisa las credenciales en `config/db_config.json`
- Asegúrate que la BD `gps_app_db` existe

### Token inválido
- Verifica que `JWT_SECRET` coincida entre auth-service y cliente
- Comprueba que el token no haya expirado
- Usa `/auth/refresh` para obtener un nuevo token

### CORS errors
- Actualiza `CORS_ORIGIN` en `config/jwt_config.json`
- Asegúrate que el frontend hace peticiones a `http://localhost:3001`

---

## 📚 Documentación Adicional

- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [JWT.io](https://jwt.io/)
- [bcryptjs](https://github.com/dcodeIO/bcrypt.js)

---

## 📬 Contacto

¿Tienes dudas o quieres contribuir?

📧 **Email:** gabriel.jimenez@example.com  
🐙 **GitHub:** [@GabrieJimenez876](https://github.com/GabrieJimenez876)

---

## 📝 Licencia

Este proyecto es de código abierto bajo la licencia **MIT**.

---

**Última actualización:** Noviembre 17, 2025  
**Versión:** 2.0
