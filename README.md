# DB Tool - Herramienta de Base de Datos Online

Una aplicación web educativa para que estudiantes aprendan y practiquen SQL mediante constructores visuales y ejecución de sentencias DDL y DML.

## 🚀 Características

### 🎓 Modo Visual (Ideal para Estudiantes)
- ✅ **Constructor visual de tablas (DDL)** - Crea tablas sin escribir código
- ✅ **Constructor visual de datos (DML)** - Inserta, consulta, actualiza y elimina datos con formularios
- ✅ **Visualización de esquemas** - Ve la estructura de tus tablas con tipos de datos, claves primarias y restricciones
- ✅ **Generación automática de SQL** - Aprende SQL viendo el código generado

### 💻 Modo SQL (Para Práctica Avanzada)
- ✅ **Editor SQL completo** - Escribe y ejecuta sentencias DDL y DML
- ✅ **Soporte completo de SQLite** - CREATE, ALTER, DROP, INSERT, UPDATE, DELETE, SELECT
- ✅ **Resultados en tabla** - Visualiza los resultados de tus consultas
- ✅ **Múltiples bases de datos** - Crea y gestiona varias bases de datos simultáneamente

### 🎨 Interfaz Moderna
- ✅ **Diseño intuitivo** con React y TailwindCSS
- ✅ **Visualización de tablas tipo tarjetas** - Ve todas tus tablas y su estructura de un vistazo
- ✅ **Feedback visual** - Mensajes de éxito y error claros
- ✅ **Responsive** - Funciona en cualquier dispositivo

## 📋 Requisitos Previos

- Node.js (v16 o superior)
- npm o yarn

## 🛠️ Instalación

1. Instalar dependencias del backend:
```bash
npm install
```

2. Instalar dependencias del frontend:
```bash
cd client
npm install
cd ..
```

## 🎯 Uso

### Modo Desarrollo

Ejecutar tanto el servidor backend como el frontend:

```bash
npm run dev
```

Esto iniciará:
- Backend en `http://localhost:3001`
- Frontend en `http://localhost:3000`

### Modo Producción

1. Construir el frontend:
```bash
npm run build
```

2. Iniciar el servidor:
```bash
npm start
```

## 📚 Guía de Uso

### 🎯 Modo Visual (Recomendado para Estudiantes)

#### 1. Crear una Tabla (DDL Visual)
1. Selecciona **Modo Visual** → **DDL (Crear Tablas)**
2. Escribe el nombre de la tabla (ej: `estudiantes`)
3. Agrega columnas con el botón **+ Agregar**:
   - `id` → tipo `INTEGER` → marca como 🔑 Primary Key
   - `nombre` → tipo `TEXT` → marca NOT NULL
   - `email` → tipo `TEXT` → marca UNIQUE
   - `edad` → tipo `INTEGER`
4. Click en **Generar CREATE TABLE**
5. Revisa el SQL generado y haz click en **Ejecutar SQL**

#### 2. Insertar Datos (DML Visual)
1. Selecciona **Modo Visual** → **DML (Datos)** → **INSERT**
2. Selecciona la tabla donde insertar
3. Llena los campos del formulario
4. Click en **Generar INSERT**
5. Ejecuta el SQL generado

#### 3. Consultar Datos (DML Visual)
1. Selecciona **DML** → **SELECT**
2. Elige la tabla y las columnas a mostrar
3. Opcionalmente agrega condiciones WHERE
4. Click en **Generar SELECT** y ejecuta

### 💻 Modo SQL (Práctica Avanzada)

#### Crear una tabla
```sql
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE,
    edad INTEGER
);
```

#### Insertar datos
```sql
INSERT INTO usuarios (nombre, email, edad) 
VALUES ('Juan Pérez', 'juan@example.com', 30);
```

#### Consultar datos
```sql
SELECT * FROM usuarios WHERE edad > 25;
```

#### Actualizar datos
```sql
UPDATE usuarios SET edad = 31 WHERE nombre = 'Juan Pérez';
```

#### Eliminar datos
```sql
DELETE FROM usuarios WHERE id = 1;
```

## 🏗️ Estructura del Proyecto

```
db-tool/
├── server/
│   └── index.js          # API Express con endpoints de base de datos
├── client/
│   ├── src/
│   │   ├── App.jsx       # Componente principal de React
│   │   ├── main.jsx      # Punto de entrada de React
│   │   └── index.css     # Estilos con TailwindCSS
│   ├── index.html
│   ├── package.json
│   └── vite.config.js
├── package.json
└── README.md
```

## 🔌 API Endpoints

- `POST /api/databases` - Crear nueva base de datos
- `GET /api/databases` - Listar todas las bases de datos
- `DELETE /api/databases/:id` - Eliminar base de datos
- `POST /api/databases/:id/execute` - Ejecutar consulta SQL
- `GET /api/databases/:id/tables` - Listar tablas de una base de datos
- `GET /api/databases/:id/tables/:tableName/schema` - Obtener esquema de una tabla

## 🎨 Tecnologías Utilizadas

### Backend
- Express.js - Framework web
- better-sqlite3 - Motor de base de datos SQLite
- CORS - Manejo de peticiones cross-origin
- UUID - Generación de identificadores únicos

### Frontend
- React - Biblioteca de UI
- Vite - Build tool y dev server
- TailwindCSS - Framework de estilos
- Lucide React - Iconos
- Axios - Cliente HTTP

## 📝 Notas

- Las bases de datos se crean en memoria (`:memory:`), por lo que los datos se pierden al eliminar la base de datos o reiniciar el servidor
- Soporta todas las características de SQLite
- Ideal para pruebas, aprendizaje y prototipado rápido

## �️ Panel de Administración

La aplicación incluye un panel de administración para gestionar las bases de datos en entornos de clase.

### Acceso al Panel Admin

1. Click en el botón **"Admin"** en la esquina superior derecha
2. Ingresa las credenciales configuradas en las variables de entorno
3. Podrás eliminar todas las bases de datos creadas

### Configuración de Credenciales

Crea un archivo `.env` en la raíz del proyecto:

```bash
ADMIN_USERNAME=tu_usuario
ADMIN_PASSWORD=tu_contraseña_segura
```

**Valores por defecto** (si no configuras variables de entorno):
- Usuario: `admin`
- Contraseña: `admin123`

⚠️ **IMPORTANTE**: Cambia estas credenciales en producción.

### Para Railway/Producción

Configura las variables de entorno en Railway:
1. Ve a tu proyecto en Railway
2. Settings → Variables
3. Agrega `ADMIN_USERNAME` y `ADMIN_PASSWORD`

## 🔒 Seguridad

Esta herramienta está diseñada para uso educativo. Para uso en producción:
- ✅ Cambia las credenciales de administrador
- ✅ Usa HTTPS
- ⚠️ Las bases de datos son compartidas entre todos los usuarios
- ⚠️ No hay aislamiento de sesiones (ideal para demos en clase)

**Recomendación para clase**: Usa el panel admin para limpiar las bases de datos entre sesiones de clase.

## 📄 Licencia

MIT
