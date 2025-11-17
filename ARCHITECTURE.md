# 🏗️ ARQUITECTURA DEL SISTEMA - GPS App

Documentación de la arquitectura, flujos y componentes del sistema GPS App.

---

## 📊 Diagrama de Componentes

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND LAYER                           │
├──────────────────┬──────────────────┬──────────────────────┤
│  React/Vue.js    │   Flutter Web    │   Flutter Native     │
│  (Web)           │   (Web Browser)  │   (Mobile)           │
└────────┬─────────┴────────┬─────────┴──────────┬───────────┘
         │                  │                    │
         └──────────────────┼────────────────────┘
                            │
                ┌───────────▼────────────┐
                │   API Gateway / CORS   │
                │   (localhost:3001)     │
                └───────────┬────────────┘
                            │
         ┌──────────────────┼──────────────────┐
         │                  │                  │
    ┌────▼──────┐    ┌─────▼──────┐   ┌──────▼────┐
    │Auth Svc   │    │Lines Svc   │   │Routes Svc │
    │(JWT)      │    │(Lines API) │   │(Routes)   │
    │Port 3001  │    │Port 3002   │   │Port 3003  │
    └────┬──────┘    └─────┬──────┘   └──────┬────┘
         │                 │                 │
         └─────────────────┼─────────────────┘
                           │
        ┌──────────────────▼──────────────────┐
        │    PostgreSQL Database             │
        │    (gps_app_db)                    │
        │    Port 5432                        │
        └───────────────────────────────────┘
```

---

## 🗄️ Arquitectura de Base de Datos

### Grupos de Tablas

#### 1. **Autenticación & Autorización**
- `persona` - Información personal
- `usuario` - Cuentas de login
- `rol` - Roles disponibles
- `usuario_rol` - Asignación de roles

#### 2. **Gestión de Transporte**
- `sindicato` - Cooperativas
- `linea` - Líneas de transporte
- `recorrido` - Rutas específicas
- `parada` - Paradas de autobús
- `vehiculo` - Buses/minibuses

#### 3. **Operaciones**
- `asignacion_vehiculo` - Asignación de choferes
- `reporte` - Reportes e incidencias

### Relaciones Principales

```
PERSONA (1) ──────── (1) USUARIO
  │                      │
  │                      ├── (N) USUARIO_ROL (N) ── ROL
  │                      │
  │                      └── (N) REPORTE
  │
  └─ creado_por ◄── (1) USUARIO

SINDICATO (1) ──────── (N) LINEA (1) ──────── (N) RECORRIDO (1) ──────── (N) PARADA
                                   │                      │
                                   └──────── (N) VEHICULO │
                                   │                      │
                                   └──────── (N) REPORTE ◄┘
                                            │
                                            └── USUARIO (1)

VEHICULO (1) ──────── (N) ASIGNACION_VEHICULO (N) ── USUARIO (chofer)
```

---

## 🔐 Flujo de Autenticación JWT

### 1. Login Flow

```
┌──────────────┐
│  Frontend    │
│  (username,  │
│  password)   │
└──────┬───────┘
       │
       │ POST /auth/login
       ▼
┌────────────────────────┐
│  Auth Service          │
│  1. Buscar usuario     │
│  2. Verificar password │
│  3. Cargar roles       │
└──────┬─────────────────┘
       │
       │ Generar tokens
       ▼
┌────────────────────────┐
│  JWT Token             │
│  ┌─────────────────┐   │
│  │ Header:         │   │
│  │ {"alg":"HS256"} │   │
│  ├─────────────────┤   │
│  │ Payload:        │   │
│  │ {               │   │
│  │  id_usuario: 1, │   │
│  │  username,      │   │
│  │  roles: [],     │   │
│  │  exp: ...       │   │
│  │ }               │   │
│  ├─────────────────┤   │
│  │ Signature:      │   │
│  │ HMAC(secret)    │   │
│  └─────────────────┘   │
└────────┬────────────────┘
         │
         │ accessToken + refreshToken
         ▼
    ┌──────────────┐
    │  Frontend    │
    │  (guardar    │
    │   token)     │
    └──────────────┘
```

### 2. Request Flow (Protegido)

```
┌──────────────────────────┐
│  Frontend               │
│  Authorization header:  │
│  Bearer <accessToken>   │
└──────┬───────────────────┘
       │
       │ GET /auth/me
       ▼
┌──────────────────────────┐
│  Middleware              │
│  authenticateToken()     │
│  1. Extraer token header │
│  2. Verificar firma      │
│  3. Verificar expiración │
└──────┬───────────────────┘
       │
       ├─ Inválido ──▶ 401/403 Error
       │
       └─ Válido ──▶
              ▼
        ┌─────────────────┐
        │  Handler        │
        │  (protegido)    │
        └─────────────────┘
```

### 3. Token Refresh Flow

```
┌──────────────────┐
│  refreshToken    │
│  expirado        │
└──────┬───────────┘
       │
       │ POST /auth/refresh
       ▼
┌─────────────────────────┐
│  Auth Service           │
│  1. Verificar refresh   │
│  2. Generar nuevo token │
└──────┬──────────────────┘
       │
       ▼
   Nuevo accessToken
```

---

## 🎯 Seguridad por Capas

### Capa 1: Autenticación
- ✅ Hashing con bcrypt (12 rounds)
- ✅ JWT con expiración
- ✅ Refresh tokens

### Capa 2: Autorización
- ✅ Role-based access control (RBAC)
- ✅ Roles asignables a usuarios
- ✅ Permisos por rol

### Capa 3: Auditoría
- ✅ Registro de quién crea/modifica datos
- ✅ Timestamps de creación/modificación
- ✅ Campos `creado_por`, `modificado_por`

### Capa 4: Transporte
- ✅ HTTPS en producción (no HTTP)
- ✅ CORS configurado
- ✅ Rate limiting (futuro)

---

## 📡 API Endpoints

### Autenticación (sin protección)
```
POST   /auth/login          - Login usuario
POST   /auth/refresh        - Refrescar token
POST   /auth/verify         - Verificar token
GET    /health              - Health check
```

### Protegidos (requieren token)
```
GET    /auth/me             - Usuario actual
POST   /auth/logout         - Logout
```

### Servicios (próximos)
```
GET    /lines               - Listar líneas
GET    /lines/:id           - Detalle línea
GET    /routes              - Listar recorridos
GET    /vehicles            - Listar vehículos
POST   /reports             - Crear reporte
GET    /stops               - Listar paradas
```

---

## 📊 Flujo de Datos - Caso de Uso Real

### Caso: Pasajero busca línea cercana

```
1. Usuario abre App
   ↓
2. App obtiene ubicación GPS
   ↓
3. App hace POST /auth/login con credenciales
   ↓
4. Backend retorna accessToken y refreshToken
   ↓
5. App guarda tokens en localStorage
   ↓
6. App consulta GET /lines (con token en header)
   ↓
7. Auth middleware verifica token JWT
   ↓
8. Si válido → Lines Service retorna líneas cercanas
   ↓
9. Si expirado → App usa refreshToken para obtener nuevo token
   ↓
10. App muestra líneas en mapa
```

---

## 🗂️ Estructura de Archivos

```
Gps-Backed/
├── auth-service/
│   ├── server.js          # Servidor principal
│   ├── package.json       # Dependencias
│   └── Dockerfile         # Para Docker
├── lines-service/
│   ├── server.js          # API de líneas
│   └── package.json
├── routes-service/
│   ├── server.js          # API de recorridos
│   └── package.json
├── db/
│   ├── schema.sql         # DDL (Create tables)
│   ├── schema.dbml        # Diagrama DBML
│   ├── seed.sql           # DML (Insert data)
│   └── init_db.py         # Script Python inicialización
├── config/
│   ├── db_config.json     # Configuración BD
│   ├── db_config.example.json
│   ├── jwt_config.json    # Configuración JWT
│   └── jwt_config.example.json
├── scripts/
│   ├── api-client.js      # SDK cliente JavaScript
│   └── test-auth.js       # Tests de autenticación
├── .env                   # Variables de entorno
├── .env.example           # Template .env
├── README.md              # Documentación principal
├── SETUP.md               # Guía de instalación
├── CHANGES.md             # Registro de cambios
├── docker-compose.yml     # Composición de servicios
└── setup-quick.js         # Script de setup automático
```

---

## 🔄 Ciclo de Vida de una Solicitud

### Solicitud Protegida

```
1. CLIENTE
   └─ GET /auth/me
      └─ Header: Authorization: Bearer <token>

2. SERVIDOR
   ├─ Recibe petición
   └─ Middleware: authenticateToken()
      ├─ Extrae token del header
      ├─ Verifica firma (HMAC-SHA256)
      ├─ Verifica expiración
      ├─ Si error → 401/403
      └─ Si ok → req.user = decoded

3. HANDLER
   ├─ Acceso a req.user
   ├─ Query a BD si es necesario
   └─ Retorna respuesta

4. CLIENTE
   ├─ Recibe JSON con datos
   └─ Actualiza UI
```

---

## 🚀 Escalabilidad

### Actual
- Monolito de autenticación
- BD centralizada
- Conexión directa a DB

### Próximas Mejoras
- Caché con Redis
- Separación de servicios (microservicios)
- Load balancer
- Replicación de DB (master-slave)
- API Gateway
- Message queue (RabbitMQ/Kafka)

---

## 📈 Métricas y Monitoreo

### Métricas de Negocio
- Total usuarios activos
- Usuarios por rol
- Líneas disponibles
- Paradas cubiertas
- Reportes diarios

### Métricas Técnicas
- Tiempo de respuesta API
- Errores 4xx/5xx
- Conexiones DB
- Uso de CPU/memoria
- Tokens generados/revocados

### Logs a Monitoreador
```
Errores: stacktrace, user_id, timestamp
Login: username, status, timestamp, ip
API calls: method, path, duration, status_code
DB queries: query, duration, rows_affected
```

---

## 🔒 Seguridad - Consideraciones

### ✅ Implementado
- Bcrypt para passwords
- JWT con expiración
- Roles y permisos
- Auditoría (creado_por)
- Timestamps

### ⚠️ A Considerar en Producción
- [ ] HTTPS obligatorio
- [ ] Rate limiting en login
- [ ] CORS restringido
- [ ] CSRF protection
- [ ] SQL injection prevention (usar parameterized queries)
- [ ] XSS protection
- [ ] Refresh token rotation
- [ ] Token blacklist para logout
- [ ] Monitoring de intentos fallidos
- [ ] Backups automáticos
- [ ] Encriptación de datos sensibles

---

## 📚 Referencias

- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [OWASP Authentication](https://owasp.org/www-community/attacks/Authentication)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-syntax.html)
- [Express.js Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Última actualización:** Noviembre 17, 2025  
**Versión:** 2.0
