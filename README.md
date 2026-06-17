# Sistema de Inscripciones - Facultad

Aplicación web para la gestión de inscripciones.

## Estructura del proyecto

```
.
├── backend/        # API REST (Node.js)
├── frontend/       # Interfaz web
└── dumpsql/        # Scripts de base de datos
```

---

# Backend

## Requisitos

- Node.js
- MySQL

## Instalación

Ingresar a la carpeta del backend:

```bash
cd backend
```

Instalar dependencias:

```bash
npm install
```

## Variables de entorno

Crear un archivo `.env` dentro de `backend/`:

```env
# Servidor
PORT=3000
NODE_ENV=development

# Base de datos
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=password
DB_NAME=facultad_inscripciones

# JWT
JWT_SECRET=cambia_esto_por_un_secreto_largo_y_seguro_min_32_chars
JWT_EXPIRES_IN=8h

# Bcrypt
BCRYPT_SALT_ROUNDS=12
```

## Ejecutar servidor

Modo desarrollo:

```bash
npm run dev
```

El backend quedará disponible en:

```
http://localhost:3000
```

---

# Base de datos

Crear la base de datos:

```sql
CREATE DATABASE facultad_inscripciones;
```

Importar el dump inicial:

```
dumpsql/01-Creacion y datos iniciales.sql
```

También disponible en:

https://campus.uner.edu.ar/fcad/pluginfile.php?file=%2F131543%2Fmod_resource%2Fcontent%2F5%2F01-Creaci%C3%B3n%20y%20datos%20iniciales.sql

---

# Frontend

El frontend es una aplicación estática.

Para ejecutarlo:

1. Abrir la carpeta `frontend`
2. Ejecutar con **Live Server** (extensión de VS Code)

La aplicación se abrirá en una dirección similar a:

```
http://127.0.0.1:5500
```

---

# Tecnologías

## Backend
- Node.js
- Express
- JWT
- Bcrypt
- MySQL

## Frontend
- HTML
- CSS
- JavaScript

---

# Notas

- Verificar que MySQL esté ejecutándose antes de iniciar el backend.
- El archivo `.env` no debe subirse al repositorio.
- Cambiar `JWT_SECRET` antes de usar en producción.