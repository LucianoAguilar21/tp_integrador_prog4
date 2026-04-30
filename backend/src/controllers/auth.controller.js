const { validationResult } = require('express-validator');
const AuthService = require('../services/auth.service');

const AuthController = {
  /**
   * POST /api/auth/login
   */
  async login(req, res, next) {
    try {
      // Verificar errores de validación del middleware
      const errores = validationResult(req);
      if (!errores.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errores.array(),
        });
      }

      const { nombre_usuario, contrasena } = req.body;
      const resultado = await AuthService.login(nombre_usuario, contrasena);

      return res.status(200).json({
        success: true,
        message: 'Login exitoso',
        data: resultado,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/auth/register
   * Protegido: solo admins o uso inicial
   */
  async register(req, res, next) {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Datos de entrada inválidos',
          errors: errores.array(),
        });
      }

      const { apellido, nombre, nombre_usuario, contrasena } = req.body;
      const resultado = await AuthService.registrar({
        apellido,
        nombre,
        nombre_usuario,
        contrasena,
      });

      return res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: resultado,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/auth/me
   * Devuelve datos del usuario autenticado (req.usuario viene del middleware)
   */
  async me(req, res) {
    return res.status(200).json({
      success: true,
      data: req.usuario,
    });
  },
};

module.exports = AuthController;