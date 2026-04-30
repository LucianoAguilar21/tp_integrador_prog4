const { Router } = require('express');
const { body, param } = require('express-validator');
const EstudianteController = require('../controllers/estudiante.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = Router();

// Todas las rutas de estudiantes requieren autenticación
router.use(authMiddleware);

// ─── Validaciones reutilizables ───────────────────────────────────────────────

const validarId = param('id')
  .isInt({ min: 1 })
  .withMessage('El ID debe ser un número entero positivo');

const camposEstudiante = [
  body('documento')
    .trim()
    .notEmpty().withMessage('El documento es requerido')
    .isLength({ min: 6, max: 20 }).withMessage('Documento: entre 6 y 20 caracteres')
    .matches(/^[0-9A-Za-z\-]+$/).withMessage('Documento: solo letras, números y guiones'),

  body('apellido')
    .trim()
    .notEmpty().withMessage('El apellido es requerido')
    .isLength({ max: 100 }).withMessage('Apellido: máximo 100 caracteres'),

  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ max: 100 }).withMessage('Nombre: máximo 100 caracteres'),

  body('email')
    .trim()
    .notEmpty().withMessage('El email es requerido')
    .isEmail().withMessage('Email inválido')
    .isLength({ max: 150 }).withMessage('Email: máximo 150 caracteres')
    .normalizeEmail(),

  body('fecha_nacimiento')
    .notEmpty().withMessage('La fecha de nacimiento es requerida')
    .isDate().withMessage('Formato de fecha inválido (YYYY-MM-DD)')
    .custom((valor) => {
      const fecha = new Date(valor);
      const hoy = new Date();
      const edad = (hoy - fecha) / (365.25 * 24 * 60 * 60 * 1000);
      if (edad < 14) throw new Error('El estudiante debe tener al menos 14 años');
      if (edad > 100) throw new Error('Fecha de nacimiento inválida');
      return true;
    }),
];

// ─── Definición de rutas ──────────────────────────────────────────────────────

// Browse - Listar con filtros y paginación
router.get('/', EstudianteController.browse);

// Read - Obtener por ID
router.get('/:id', validarId, EstudianteController.read);

// Add - Crear nuevo
router.post('/', camposEstudiante, EstudianteController.add);

// Edit - Actualizar
router.put('/:id', [validarId, ...camposEstudiante], EstudianteController.edit);

// Delete - Soft delete
router.delete('/:id', validarId, EstudianteController.delete);

// Restore - Restaurar inactivo
router.patch('/:id/restaurar', validarId, EstudianteController.restore);

module.exports = router;