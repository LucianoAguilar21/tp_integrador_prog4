const { Router } = require('express');
const authRoutes = require('./auth.routes');
const estudianteRoutes = require('./estudiante.routes'); // ← NUEVO
const cursoRoutes      = require('./curso.routes');      // ← NUEVO
const inscripcionRoutes = require('./inscripcion.routes');  // ← NUEVO
const dashboardRoutes   = require('./dashboard.routes');    // ← NUEVO


const router = Router();

// Montar routers por dominio
router.use('/auth', authRoutes);
router.use('/estudiantes', estudianteRoutes); // ← NUEVO
router.use('/cursos',      cursoRoutes);                 // ← NUEVO
router.use('/inscripciones', inscripcionRoutes);  // ← NUEVO
router.use('/dashboard',     dashboardRoutes);    // ← NUEVO

// Health check
router.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API funcionando correctamente',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

module.exports = router;    