const { Router } = require('express');
const { body } = require('express-validator');
const AuthController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');

const router = Router();

// Reglas de validación reutilizables
const loginValidation = [
  body('nombre_usuario')
    .trim()
    .notEmpty()
    .withMessage('El nombre de usuario es requerido')
    .isLength({ max: 100 })
    .withMessage('Nombre de usuario demasiado largo'),
  body('contrasena')
    .notEmpty()
    .withMessage('La contraseña es requerida')
    .isLength({ min: 6 })
    .withMessage('La contraseña debe tener al menos 6 caracteres'),
];

const registerValidation = [
  body('apellido')
    .trim()
    .notEmpty()
    .withMessage('El apellido es requerido')
    .isLength({ max: 100 }),
  body('nombre')
    .trim()
    .notEmpty()
    .withMessage('El nombre es requerido')
    .isLength({ max: 100 }),
  body('nombre_usuario')
    .trim()
    .notEmpty()
    .withMessage('El nombre de usuario es requerido')
    .isLength({ min: 3, max: 50 })
    .withMessage('El nombre de usuario debe tener entre 3 y 50 caracteres')
    .matches(/^[a-zA-Z0-9._]+$/)
    .withMessage('Solo se permiten letras, números, puntos y guiones bajos'),
  body('contrasena')
    .notEmpty()
    .withMessage('La contraseña es requerida')
    .isLength({ min: 6 })
    .withMessage('Mínimo 6 caracteres')
    .matches(/\d/)
    .withMessage('Debe contener al menos un número'),
];

// Rutas públicas
router.post('/login', loginValidation, AuthController.login);
router.post('/register', registerValidation, AuthController.register);

// Rutas protegidas
router.get('/me', authMiddleware, AuthController.me);

module.exports = router;