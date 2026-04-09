# Guía de Despliegue en Railway

## 📦 Preparación Completada

El proyecto ya está configurado para Railway con:
- ✅ Scripts de build optimizados
- ✅ Servidor Express sirviendo el frontend
- ✅ Configuración `railway.json`
- ✅ Variables de entorno documentadas

## 🚀 Pasos para Desplegar

### 1. Crear Repositorio en GitHub (Tu Cuenta Personal)

```bash
# Inicializar Git
git init

# Agregar todos los archivos
git add .

# Primer commit
git commit -m "Initial commit: DB Tool - Herramienta educativa de bases de datos"

# Crear repo en GitHub y conectar (reemplaza con tu usuario)
git remote add origin https://github.com/TU_USUARIO/db-tool.git

# Push al repo
git branch -M main
git push -u origin main
```

### 2. Desplegar en Railway

**Opción A: Desde GitHub (Recomendado)**
1. Ve a [railway.app](https://railway.app)
2. Login con tu cuenta
3. Click en "New Project"
4. Selecciona "Deploy from GitHub repo"
5. Conecta tu cuenta de GitHub
6. Selecciona el repositorio `db-tool`
7. Railway detectará automáticamente la configuración

**Opción B: Railway CLI**
```bash
npm i -g @railway/cli
railway login
railway init
railway up
```

### 3. Configurar Variables de Entorno en Railway

1. Ve a tu proyecto en Railway
2. Click en "Variables"
3. Agrega las siguientes variables:

```
ADMIN_USERNAME=tu_usuario_admin
ADMIN_PASSWORD=tu_contraseña_segura
NODE_ENV=production
```

⚠️ **IMPORTANTE**: Cambia las credenciales por defecto.

### 4. Verificar Despliegue

Railway te dará una URL como: `https://db-tool-production.up.railway.app`

Verifica:
- ✅ La app carga correctamente
- ✅ Puedes crear bases de datos
- ✅ El panel admin funciona con tus credenciales
- ✅ Puedes crear tablas y ejecutar SQL

## 💰 Costos Estimados

Con el plan Hobby ($5/mes):
- Uso esperado: $2-3/mes para clase
- Sobran recursos para 30-50 estudiantes simultáneos

## 🔧 Mantenimiento

### Limpiar bases de datos entre clases
1. Accede al panel Admin
2. Login con tus credenciales
3. Click en "Eliminar todas las bases de datos"

### Actualizar la app
```bash
git add .
git commit -m "Descripción de cambios"
git push
```

Railway desplegará automáticamente los cambios.

## 📝 Notas

- Las bases de datos son compartidas entre todos los usuarios
- Ideal para demostraciones en clase
- Para uso individual, los estudiantes pueden clonar y correr localmente
