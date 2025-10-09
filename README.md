

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
