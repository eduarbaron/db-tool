# 📚 Ejemplos de Sentencias DDL en SQLite

Este documento contiene ejemplos prácticos de sentencias DDL (Data Definition Language) para usar en la herramienta DB Tool.

## 📋 Tabla de Contenidos

1. [CREATE TABLE - Crear Tablas](#create-table)
2. [ALTER TABLE - Modificar Tablas](#alter-table)
3. [DROP TABLE - Eliminar Tablas](#drop-table)
4. [Tipos de Datos](#tipos-de-datos)
5. [Constraints (Restricciones)](#constraints)
6. [Relaciones entre Tablas](#relaciones)
7. [Ejemplos Completos](#ejemplos-completos)

---

## CREATE TABLE

### Ejemplo Básico

```sql
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE,
    edad INTEGER
);
```

### Con PRIMARY KEY AUTOINCREMENT

```sql
CREATE TABLE productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    precio REAL,
    stock INTEGER DEFAULT 0
);
```

### Con Múltiples Constraints

```sql
CREATE TABLE empleados (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    salario REAL CHECK(salario > 0),
    fecha_contratacion TEXT DEFAULT (date('now')),
    departamento_id INTEGER,
    FOREIGN KEY (departamento_id) REFERENCES departamentos(id)
);
```

---

## ALTER TABLE

### Agregar Columna

```sql
ALTER TABLE usuarios 
ADD COLUMN telefono TEXT;
```

### Renombrar Tabla

```sql
ALTER TABLE usuarios 
RENAME TO clientes;
```

### Renombrar Columna

```sql
ALTER TABLE clientes 
RENAME COLUMN nombre TO nombre_completo;
```

---

## DROP TABLE

### Eliminar Tabla

```sql
DROP TABLE IF EXISTS productos;
```

---

## Tipos de Datos

SQLite tiene 5 tipos de datos principales:

### INTEGER - Números Enteros

```sql
CREATE TABLE contadores (
    id INTEGER PRIMARY KEY,
    contador INTEGER,
    año INTEGER,
    mes INTEGER CHECK(mes BETWEEN 1 AND 12)
);
```

### REAL - Números Decimales

```sql
CREATE TABLE precios (
    id INTEGER PRIMARY KEY,
    producto TEXT,
    precio REAL,
    descuento REAL DEFAULT 0.0,
    precio_final REAL
);
```

### TEXT - Cadenas de Texto

```sql
CREATE TABLE articulos (
    id INTEGER PRIMARY KEY,
    titulo TEXT NOT NULL,
    contenido TEXT,
    autor TEXT,
    fecha_publicacion TEXT  -- Formato: 'YYYY-MM-DD'
);
```

### BLOB - Datos Binarios

```sql
CREATE TABLE archivos (
    id INTEGER PRIMARY KEY,
    nombre TEXT,
    tipo TEXT,
    contenido BLOB
);
```

### NUMERIC - Flexible

```sql
CREATE TABLE mediciones (
    id INTEGER PRIMARY KEY,
    valor NUMERIC,
    unidad TEXT
);
```

---

## Constraints

### PRIMARY KEY

```sql
CREATE TABLE categorias (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL
);
```

### UNIQUE

```sql
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL
);
```

### NOT NULL

```sql
CREATE TABLE pedidos (
    id INTEGER PRIMARY KEY,
    cliente_id INTEGER NOT NULL,
    fecha TEXT NOT NULL,
    total REAL NOT NULL
);
```

### CHECK

```sql
CREATE TABLE productos (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL,
    precio REAL CHECK(precio > 0),
    stock INTEGER CHECK(stock >= 0),
    categoria TEXT CHECK(categoria IN ('Electrónica', 'Ropa', 'Alimentos'))
);
```

### DEFAULT

```sql
CREATE TABLE tareas (
    id INTEGER PRIMARY KEY,
    titulo TEXT NOT NULL,
    completada INTEGER DEFAULT 0,
    fecha_creacion TEXT DEFAULT (datetime('now')),
    prioridad TEXT DEFAULT 'media'
);
```

### FOREIGN KEY

```sql
CREATE TABLE comentarios (
    id INTEGER PRIMARY KEY,
    articulo_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    contenido TEXT NOT NULL,
    fecha TEXT DEFAULT (date('now')),
    FOREIGN KEY (articulo_id) REFERENCES articulos(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);
```

---

## Relaciones

### Relación Uno a Muchos (1:N)

```sql
-- Tabla padre
CREATE TABLE departamentos (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL,
    ubicacion TEXT
);

-- Tabla hija
CREATE TABLE empleados (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL,
    departamento_id INTEGER,
    FOREIGN KEY (departamento_id) REFERENCES departamentos(id)
);
```

### Relación Muchos a Muchos (N:M)

```sql
-- Tabla 1
CREATE TABLE estudiantes (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE
);

-- Tabla 2
CREATE TABLE cursos (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL,
    creditos INTEGER
);

-- Tabla intermedia
CREATE TABLE inscripciones (
    id INTEGER PRIMARY KEY,
    estudiante_id INTEGER NOT NULL,
    curso_id INTEGER NOT NULL,
    fecha_inscripcion TEXT DEFAULT (date('now')),
    calificacion REAL,
    FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id),
    FOREIGN KEY (curso_id) REFERENCES cursos(id),
    UNIQUE(estudiante_id, curso_id)
);
```

---

## Ejemplos Completos

### Sistema de Biblioteca

```sql
-- Tabla de autores
CREATE TABLE autores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    nacionalidad TEXT,
    fecha_nacimiento TEXT
);

-- Tabla de libros
CREATE TABLE libros (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titulo TEXT NOT NULL,
    isbn TEXT UNIQUE,
    autor_id INTEGER NOT NULL,
    año_publicacion INTEGER,
    genero TEXT,
    disponible INTEGER DEFAULT 1,
    FOREIGN KEY (autor_id) REFERENCES autores(id)
);

-- Tabla de usuarios
CREATE TABLE usuarios_biblioteca (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefono TEXT,
    fecha_registro TEXT DEFAULT (date('now'))
);

-- Tabla de préstamos
CREATE TABLE prestamos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    libro_id INTEGER NOT NULL,
    usuario_id INTEGER NOT NULL,
    fecha_prestamo TEXT DEFAULT (date('now')),
    fecha_devolucion TEXT,
    devuelto INTEGER DEFAULT 0,
    FOREIGN KEY (libro_id) REFERENCES libros(id),
    FOREIGN KEY (usuario_id) REFERENCES usuarios_biblioteca(id)
);
```

### Sistema de Tienda Online

```sql
-- Categorías de productos
CREATE TABLE categorias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL UNIQUE,
    descripcion TEXT
);

-- Productos
CREATE TABLE productos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    precio REAL NOT NULL CHECK(precio > 0),
    stock INTEGER DEFAULT 0 CHECK(stock >= 0),
    categoria_id INTEGER,
    activo INTEGER DEFAULT 1,
    FOREIGN KEY (categoria_id) REFERENCES categorias(id)
);

-- Clientes
CREATE TABLE clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    telefono TEXT,
    direccion TEXT,
    fecha_registro TEXT DEFAULT (date('now'))
);

-- Pedidos
CREATE TABLE pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    cliente_id INTEGER NOT NULL,
    fecha TEXT DEFAULT (datetime('now')),
    total REAL NOT NULL,
    estado TEXT DEFAULT 'pendiente' CHECK(estado IN ('pendiente', 'procesando', 'enviado', 'entregado', 'cancelado')),
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);

-- Detalle de pedidos
CREATE TABLE detalle_pedidos (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    pedido_id INTEGER NOT NULL,
    producto_id INTEGER NOT NULL,
    cantidad INTEGER NOT NULL CHECK(cantidad > 0),
    precio_unitario REAL NOT NULL,
    subtotal REAL NOT NULL,
    FOREIGN KEY (pedido_id) REFERENCES pedidos(id),
    FOREIGN KEY (producto_id) REFERENCES productos(id)
);
```

### Sistema Escolar

```sql
-- Estudiantes
CREATE TABLE estudiantes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    fecha_nacimiento TEXT,
    email TEXT UNIQUE,
    telefono TEXT
);

-- Profesores
CREATE TABLE profesores (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    apellido TEXT NOT NULL,
    especialidad TEXT,
    email TEXT UNIQUE NOT NULL
);

-- Materias
CREATE TABLE materias (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    codigo TEXT UNIQUE NOT NULL,
    creditos INTEGER CHECK(creditos > 0),
    profesor_id INTEGER,
    FOREIGN KEY (profesor_id) REFERENCES profesores(id)
);

-- Inscripciones
CREATE TABLE inscripciones (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    estudiante_id INTEGER NOT NULL,
    materia_id INTEGER NOT NULL,
    periodo TEXT NOT NULL,
    calificacion REAL CHECK(calificacion BETWEEN 0 AND 100),
    estado TEXT DEFAULT 'cursando' CHECK(estado IN ('cursando', 'aprobado', 'reprobado', 'retirado')),
    FOREIGN KEY (estudiante_id) REFERENCES estudiantes(id),
    FOREIGN KEY (materia_id) REFERENCES materias(id),
    UNIQUE(estudiante_id, materia_id, periodo)
);
```

---

## 💡 Tips y Buenas Prácticas

### 1. Siempre usa PRIMARY KEY
```sql
-- ✅ Bien
CREATE TABLE usuarios (
    id INTEGER PRIMARY KEY,
    nombre TEXT
);

-- ❌ Mal
CREATE TABLE usuarios (
    nombre TEXT
);
```

### 2. Usa NOT NULL para campos obligatorios
```sql
CREATE TABLE productos (
    id INTEGER PRIMARY KEY,
    nombre TEXT NOT NULL,  -- Campo obligatorio
    descripcion TEXT       -- Campo opcional
);
```

### 3. Valida datos con CHECK
```sql
CREATE TABLE empleados (
    id INTEGER PRIMARY KEY,
    edad INTEGER CHECK(edad >= 18 AND edad <= 65),
    salario REAL CHECK(salario > 0)
);
```

### 4. Usa FOREIGN KEY para mantener integridad
```sql
CREATE TABLE pedidos (
    id INTEGER PRIMARY KEY,
    cliente_id INTEGER NOT NULL,
    FOREIGN KEY (cliente_id) REFERENCES clientes(id)
);
```

### 5. Nombra tablas en plural
```sql
-- ✅ Bien
CREATE TABLE usuarios (...);
CREATE TABLE productos (...);

-- ❌ Evitar
CREATE TABLE usuario (...);
CREATE TABLE producto (...);
```

---

## 🎯 Ejercicios Prácticos

### Ejercicio 1: Blog Simple
Crea las tablas para un blog con:
- Autores
- Posts
- Comentarios

### Ejercicio 2: Sistema de Inventario
Crea las tablas para:
- Proveedores
- Productos
- Compras

### Ejercicio 3: Red Social
Crea las tablas para:
- Usuarios
- Posts
- Likes
- Seguidores

---

## 📚 Recursos Adicionales

- [SQLite Official Documentation](https://www.sqlite.org/docs.html)
- [SQLite Data Types](https://www.sqlite.org/datatype3.html)
- [SQLite Constraints](https://www.sqlite.org/lang_createtable.html#constraints)

---

**¡Prueba estos ejemplos en la herramienta DB Tool!** 🚀
