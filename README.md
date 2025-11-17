

Este proyecto tiene como objetivo desarrollar una **aplicación móvil y web** para visualizar rutas de **minibuses en La Paz**, Bolivia, utilizando tecnologías modernas, evitando el uso de PHP y MySQL.

---

## 🧱 Estructura del Proyecto

/api → Backend Node.js + Express
/db → Scripts SQL (PostgreSQL + PostGIS)
/flutter_app → Frontend móvil Flutter
/web → Frontend Web con HTML + Leaflet.js
README.md
---
## 🗺️ Tecnologías Utilizadas

### 🖥️ Frontend
- **Flutter** (Android, iOS y Web)
- **HTML5 + CSS3**
- **Leaflet.js** (visualización de mapas)
- **OpenStreetMap** (mapas libres, con soporte offline opcional)

### 🛠️ Backend
- **Node.js** + **Express**
- **PostgreSQL** + **PostGIS**
- **JWT (JSON Web Tokens)** para autenticación
---
## 🚀 Funcionalidades Principales

- Visualización de rutas de minibuses en La Paz
- Ubicación GPS en tiempo real (ubicación actual y destino)
- Consulta de paradas cercanas y líneas disponibles
- Información de sindicatos y recorridos por ruta
- Panel administrativo para gestión de rutas (en desarrollo)
- Compatible con Flutter Web para ejecución en navegador
---
## 👤 Usuario de Prueba

Usuario: admin
Contraseña: *implementacion de hash

## 📦 Archivos y Componentes Clave

| Archivo/Carpeta         | Descripción                                                                 |
|-------------------------|-----------------------------------------------------------------------------|
| `index.html`            | Mapa web interactivo (Leaflet.js + OpenStreetMap)                           |
| `mapa_page.dart`        | Página principal Flutter con visualización de rutas y GPS                   |
| `/api/`                 | Backend en Node.js para rutas, paradas, y autenticación                     |
| `/db/`                  | Scripts para crear base de datos en PostgreSQL con extensión PostGIS        |

---

## 🛠️ Requisitos Previos

Asegúrate de tener los siguientes programas instalados en tu sistema:

- [Node.js](https://nodejs.org/) v16+
- [PostgreSQL](https://www.postgresql.org/) 13+
- [PostGIS](https://postgis.net/) (extensión geoespacial para PostgreSQL)
- [Flutter SDK](https://docs.flutter.dev/get-started/install)
- [Git](https://git-scm.com/)

---

## ⚙️ Instalación Paso a Paso

### 1. Clonar el repositorio

```bash
git clone https://github.com/tuusuario/proyecto-gps-la-paz.git
cd proyecto-gps-la-paz
2. Configurar y ejecutar la base de datos
2.1 Crear base de datos en PostgreSQL
sql
Copiar código
CREATE DATABASE gps_la_paz;
\c gps_la_paz;
CREATE EXTENSION postgis;
2.2 Ejecutar los scripts de /db
Ejecuta los scripts SQL para crear tablas y poblar datos:

bash
Copiar código
psql -U tu_usuario -d gps_la_paz -f db/init.sql
Asegúrate de tener el archivo init.sql con las rutas, paradas y geometrías.

3. Instalar y levantar el backend
bash
Copiar código
cd api
npm install
npm start
El backend correrá en: http://localhost:3000

4. Ejecutar la aplicación Flutter
bash
Copiar código
cd flutter_app
flutter pub get
flutter run -d chrome
También puedes correrlo en Android/iOS si tienes configurado un emulador o dispositivo.

5. Ejecutar la versión web
Abre el archivo web/index.html directamente en tu navegador o usa una extensión como "Live Server" si estás en VSCode.

🔐 Configuración del Backend (Opcional)
Crea un archivo .env en /api con los siguientes valores:

env
Copiar código
PORT=3000
DB_HOST=localhost
DB_USER=tu_usuario
DB_PASSWORD=tu_contraseña
DB_NAME=gps_la_paz
JWT_SECRET=clave_secreta
📌 Notas Adicionales
Este proyecto no utiliza PHP ni MySQL.

Toda la información geográfica está limitada a la ciudad de La Paz, Bolivia.

El sistema es extensible y puede adaptarse a otras ciudades o sistemas de transporte.

Se recomienda implementar soporte offline usando tile server si el acceso a Internet es limitado.

📸 Capturas de Pantalla (opcional)
Agrega aquí imágenes de la app Flutter, mapa web, backend, etc.

📬 Contacto
¿Tienes dudas o quieres contribuir? ¡Contáctanos!

📧 Email: example@email.com

📍 Proyecto desarrollado en La Paz, Bolivia 🇧🇴

📝 Licencia
Este proyecto es de código abierto bajo la licencia MIT.

## 📂 Nueva base de datos (DBML + SQL)

He añadido una definición DBML y scripts SQL en la carpeta `db/` para la nueva estructura solicitada (tablas: persona, usuario, rol, usuario_rol, sindicato, linea, recorrido, vehiculo, parada, reporte, asignacion_vehiculo).

Archivos añadidos:
- `db/schema.dbml` — la definición DBML tal como la solicitaste.
- `db/schema.sql` — script PostgreSQL para crear las tablas y relaciones.
- `db/seed.sql` — datos de ejemplo para poblar roles, personas, usuarios, sindicatos, líneas, recorridos, paradas, vehículos, asignaciones y reportes.
- `config/db_config.example.json` — ejemplo de configuración de conexión.

Instrucciones rápidas (PostgreSQL):

1) Crear la base de datos y activar PostGIS si la necesitas:

```powershell
psql -U postgres -c "CREATE DATABASE gps_app_db;"
psql -U postgres -d gps_app_db -c "CREATE EXTENSION IF NOT EXISTS postgis;"
```

2) Ejecutar el schema (ajusta host/usuario/contraseña según tu entorno):

```powershell
psql -U postgres -d gps_app_db -f db/schema.sql
psql -U postgres -d gps_app_db -f db/seed.sql
```

3) Conectar el frontend `GPs-Fronted` (o el frontend de este repo) usando las credenciales en `config/db_config.example.json` (cópialo a `config/db_config.json` o usa variables de entorno según el frontend).

Notas:
- Los `password_hash` en `db/seed.sql` son marcadores de posición; reemplaza por hashes reales antes de usar en producción.
- Si usas SQLite para pruebas locales, necesitarás adaptar `db/schema.sql` (Postgres -> SQLite difiere en tipos y restricciones).

Si quieres, puedo:
- Añadir un script `db/init_db.py` que ejecute los scripts automáticamente (Postgres o SQLite).
- Integrar la configuración en el frontend `GPs-Fronted` (crear archivo de ejemplo o variables de entorno) y actualizar los endpoints.
