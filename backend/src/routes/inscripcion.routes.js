const { Router } = require('express');
const { body, param } = require('express-validator');
const InscripcionController = require('../controllers/inscripcion.controller');
const authMiddleware        = require('../middlewares/auth.middleware');

const router = Router();
router.use(authMiddleware);

const validarId = param('id')
  .isInt({ min: 1 })
  .withMessage('El ID debe ser un número entero positivo');

const camposInscripcion = [
  body('id_curso')
    .notEmpty().withMessage('El curso es requerido')
    .isInt({ min: 1 }).withMessage('ID de curso inválido'),

  body('id_estudiante')
    .notEmpty().withMessage('El estudiante es requerido')
    .isInt({ min: 1 }).withMessage('ID de estudiante inválido'),
];

// Estados
router.get('/estados', InscripcionController.estados);

// BREAD (sin Edit)
router.get('/',    InscripcionController.browse);
router.get('/:id', [validarId], InscripcionController.read);
router.post('/',   camposInscripcion, InscripcionController.add);

// Cambios de estado
router.patch('/:id/cancelar', [validarId], InscripcionController.cancelar);
router.patch('/:id/aprobar',  [validarId], InscripcionController.aprobar);

// Diploma
router.get('/:id/diploma', [validarId], InscripcionController.diploma);

module.exports = router;