const { validationResult } = require('express-validator');
const EstudianteService = require('../services/estudiante.service');

// Helper para responder errores de validación
const responderValidacion = (res, errores) =>
  res.status(400).json({
    success: false,
    message: 'Datos de entrada inválidos',
    errors: errores.array(),
  });

const EstudianteController = {

  /**
   * GET /api/estudiantes
   * Query params: busqueda, documento, activo, page, limit
   */
  async browse(req, res, next) {
    try {
      const resultado = await EstudianteService.listar(req.query);
      return res.status(200).json({ success: true, ...resultado });
    } catch (error) {
      next(error);
    }
  },

  /**
   * GET /api/estudiantes/:id
   */
  async read(req, res, next) {
    try {
      const estudiante = await EstudianteService.obtenerPorId(
        parseInt(req.params.id)
      );
      return res.status(200).json({ success: true, data: estudiante });
    } catch (error) {
      next(error);
    }
  },

  /**
   * POST /api/estudiantes
   */
  async add(req, res, next) {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) return responderValidacion(res, errores);

      const estudiante = await EstudianteService.crear(
        req.body,
        req.usuario.id
      );
      return res.status(201).json({
        success: true,
        message: 'Estudiante creado exitosamente',
        data: estudiante,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PUT /api/estudiantes/:id
   */
  async edit(req, res, next) {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) return responderValidacion(res, errores);

      const estudiante = await EstudianteService.actualizar(
        parseInt(req.params.id),
        req.body,
        req.usuario.id_usuario
      );
      return res.status(200).json({
        success: true,
        message: 'Estudiante actualizado exitosamente',
        data: estudiante,
      });
    } catch (error) {
      next(error);
    }
  },

  /**
   * DELETE /api/estudiantes/:id
   * Soft delete
   */
  async delete(req, res, next) {
    try {
      const resultado = await EstudianteService.eliminar(
        parseInt(req.params.id),
        req.usuario.id
      );
      return res.status(200).json({ success: true, data: resultado });
    } catch (error) {
      next(error);
    }
  },

  /**
   * PATCH /api/estudiantes/:id/restaurar
   */
  async restore(req, res, next) {
    try {
      const estudiante = await EstudianteService.restaurar(
        parseInt(req.params.id),
        req.usuario.id
      );
      return res.status(200).json({
        success: true,
        message: 'Estudiante restaurado exitosamente',
        data: estudiante,
      });
    } catch (error) {
      next(error);
    }
  },
};

module.exports = EstudianteController;