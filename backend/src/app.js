require('dotenv').config();
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { testConnection } = require('./config/db');
const routes = require('./routes/index');
const errorMiddleware = require('./middlewares/error.middleware');


const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middlewares globales ──────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logger HTTP (solo en desarrollo)
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// ─── Rutas de la API ───────────────────────────────────────────────────────────
app.use('/api', routes);

// ─── Ruta 404 ─────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Ruta no encontrada: ${req.method} ${req.originalUrl}`,
  });
});

// ─── Middleware de errores (SIEMPRE al final) ──────────────────────────────────
app.use(errorMiddleware);

// ─── Iniciar servidor ──────────────────────────────────────────────────────────
const startServer = async () => {
  await testConnection(); // Fallar rápido si no hay DB
  app.listen(PORT, () => {
    console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📌 Entorno: ${process.env.NODE_ENV || 'development'}`);
    console.log(`🔑 API Base: http://localhost:${PORT}/api`);
  });
};

startServer();

module.exports = app;