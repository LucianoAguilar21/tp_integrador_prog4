# Sistema de Inscripciones - Facultad

Aplicación web para la gestión de inscripciones.

## Estructura del proyecto

```
.
├── backend/        # API REST (Node.js)
├── frontend/       # Interfaz web
```

---

# Backend

## Requisitos

- Node.js
- Postgresql

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
DB_PORT=5432
DB_USER=postgres
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

Importar el dump inicial disponible en:

https://campus.uner.edu.ar/fcad/pluginfile.php?file=%2F131543%2Fmod_resource%2Fcontent%2F5%2F01-Creaci%C3%B3n%20y%20datos%20iniciales.sql

### INSERT DE DATOS
```sql

-- Estado aprobado para diploma
INSERT INTO public.inscripciones_estados (id_inscripcion_estado,descripcion,es_activo) VALUES (3,'APROBADO',2)

INSERT INTO public.cursos 
(id_curso, nombre, descripcion, fecha_inicio, cantidad_horas, inscriptos_max, id_curso_estado, id_usuario_modificacion, fecha_hora_modificacion)
VALUES
(1,'Programación Web con React','Desarrollo de aplicaciones web modernas utilizando JavaScript, React y consumo de APIs REST.','2026-04-20',60,30,1,1,'2026-04-12 09:00:00'),
(2,'Introducción a la Inteligencia Artificial','Conceptos básicos de inteligencia artificial, machine learning y aplicaciones prácticas con Python.','2026-05-05',50,25,1,1,'2026-04-12 09:10:00'),
(3,'Seguridad Informática y Ethical Hacking','Fundamentos de ciberseguridad, análisis de vulnerabilidades y técnicas de hacking ético.','2026-05-10',70,20,1,1,'2026-04-12 09:20:00'),
(4,'Bases de Datos SQL y NoSQL','Diseño, consulta y optimización de bases de datos relacionales y no relacionales.','2026-04-25',55,35,1,1,'2026-04-12 09:30:00'),
(5,'Desarrollo Backend con Node.js y NestJS','Construcción de APIs robustas utilizando Node.js, NestJS y bases de datos SQL.','2026-05-15',65,30,1,1,'2026-04-12 09:40:00');

INSERT INTO public.cursos_estados 
(id_curso_estado, descripcion, es_activo)
VALUES
(1, 'BORRADOR', 1),
(2, 'INSCRIPCIÓN ABIERTA', 1),
(3, 'INSCRIPCIÓN CERRADA', 1),
(4, 'ELIMINADO', 0);

INSERT INTO public.estudiantes 
(id_estudiante, documento, apellido, nombres, email, fecha_nacimiento, activo, id_usuario_modificacion, fecha_hora_modificacion)
VALUES
(6, '35211111', 'GARCÍA', 'MATEO EMILIO', 'mateogarcia@gmail.com', '2000-02-15', 1, 1, '2023-03-06 17:30:00'),
(7, '28922222', 'TORRES', 'SANTIAGO JULIÁN', 'santiagotorres@gmail.com', '1994-05-10', 1, 1, '2023-03-07 18:15:00'),
(8, '38133333', 'GÓMEZ', 'LUISA LUCIANA', 'luisalopez@gmail.com', '2002-01-05', 1, 1, '2023-03-08 19:00:00'),
(9, '31944444', 'RIVAS', 'GABRIEL EDUARDO', 'gabrielrivas@gmail.com', '1997-09-25', 1, 1, '2023-03-09 20:45:00'),
(10, '34855555', 'MARTÍNEZ', 'VALENTINA SOFÍA', 'valentinamartinez@gmail.com', '2000-08-15', 1, 1, '2023-03-10 22:30:00');

INSERT INTO public.inscripciones_estados
(id_inscripcion_estado, descripcion, es_activo)
VALUES
(1, 'CONFIRMADA', 1),
(2, 'CANCELADA', 0);


INSERT INTO public.usuarios
(id_usuario, apellido, nombre, nombre_usuario, contrasenia, activo)
VALUES
(1, 'BIANCHI', 'LUCIANA', 'lbianchi', '$2b$12$D/kJQiRAwaah3y0Ufa8CT.i/AzkbfEdya5.LaKDqqMnNB8DkB2Wny', 1),
(2, 'FERNÁNDEZ', 'LORENZO', 'lfernandez', '$2b$12$D/kJQiRAwaah3y0Ufa8CT.i/AzkbfEdya5.LaKDqqMnNB8DkB2Wny', 1),
(3, 'RINCÓN', 'MATEO', 'mrincon', '$2b$12$D/kJQiRAwaah3y0Ufa8CT.i/AzkbfEdya5.LaKDqqMnNB8DkB2Wny', 1),
(4, 'DECHAT', 'GUILIANA', 'gdechat', '$2b$12$D/kJQiRAwaah3y0Ufa8CT.i/AzkbfEdya5.LaKDqqMnNB8DkB2Wny', 1),
(5, 'NOVELLO', 'IGNACIO', 'inovello', '$2b$12$D/kJQiRAwaah3y0Ufa8CT.i/AzkbfEdya5.LaKDqqMnNB8DkB2Wny', 1);
```
---

# Frontend

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
- Postgres

## Frontend
- HTML
- CSS
- JavaScript

---

# Notas

- Verificar que POSTGRESQL esté ejecutándose antes de iniciar el backend.
- El archivo `.env` no debe subirse al repositorio.
- Cambiar `JWT_SECRET` antes de usar en producción.

# Usuario para login
- lbianchi
- Admin123

- Hash: $2b$12$D/kJQiRAwaah3y0Ufa8CT.i/AzkbfEdya5.LaKDqqMnNB8DkB2Wny
