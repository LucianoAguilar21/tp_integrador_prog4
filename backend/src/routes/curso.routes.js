const { Router } = require('express');
const { body, param } = require('express-validator');
const CursoController = require('../controllers/curso.controller');
const authMiddleware  = require('../middlewares/auth.middleware');

const router = Router();
router.use(authMiddleware);

// ─── Validaciones ─────────────────────────────────────────────────────────────

const validarId = param('id')
  .isInt({ min: 1 })
  .withMessage('El ID debe ser un número entero positivo');

const camposCurso = [
  body('nombre')
    .trim()
    .notEmpty().withMessage('El nombre es requerido')
    .isLength({ max: 200 }).withMessage('Nombre: máximo 200 caracteres'),

  body('descripcion')
    .optional({ nullable: true })
    .trim()
    .isLength({ max: 2000 }).withMessage('Descripción: máximo 2000 caracteres'),

  body('fecha_inicio')
    .notEmpty().withMessage('La fecha de inicio es requerida')
    .isDate().withMessage('Formato de fecha inválido (YYYY-MM-DD)'),

  body('cantidad_horas')
    .notEmpty().withMessage('La cantidad de horas es requerida')
    .isInt({ min: 1, max: 9999 }).withMessage('Horas: entre 1 y 9999'),

  body('inscriptos_max')
    .notEmpty().withMessage('El cupo máximo es requerido')
    .isInt({ min: 1, max: 9999 }).withMessage('Cupo: entre 1 y 9999'),

  body('id_curso_estado')
    .notEmpty().withMessage('El estado del curso es requerido')
    .isInt({ min: 1 }).withMessage('Estado inválido'),
];

// ─── Rutas ────────────────────────────────────────────────────────────────────

router.get('/estados',                           CursoController.estados);
router.get('/',                                  CursoController.browse);
router.get('/:id',          [validarId],         CursoController.read);
router.post('/',            camposCurso,         CursoController.add);
router.put('/:id',          [validarId, ...camposCurso], CursoController.edit);
router.delete('/:id',       [validarId],         CursoController.delete);
router.get('/:id/inscriptos',[validarId],        CursoController.inscriptos);

// PDFs
router.get('/:id/pdf/listado',                   [validarId], CursoController.pdfListado);
router.get('/:id/pdf/diploma/:id_estudiante',
  [validarId, param('id_estudiante').isInt({ min: 1 })],
  CursoController.pdfDiploma
);

module.exports = router;