const { validationResult } = require('express-validator');
const InscripcionService   = require('../services/inscripcion.service');

const responderValidacion = (res, errores) =>
  res.status(400).json({
    success: false,
    message: 'Datos de entrada inválidos',
    errors:  errores.array(),
  });

const InscripcionController = {

  // GET /api/inscripciones/estados
  async estados(req, res, next) {
    try {
      const data = await InscripcionService.listarEstados();
      return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  },

  // GET /api/inscripciones
  async browse(req, res, next) {
    try {
      const resultado = await InscripcionService.listar(req.query);
      return res.status(200).json({ success: true, ...resultado });
    } catch (error) { next(error); }
  },

  // GET /api/inscripciones/:id
  async read(req, res, next) {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) return responderValidacion(res, errores);

      const inscripcion = await InscripcionService.obtenerPorId(
        parseInt(req.params.id, 10)
      );
      return res.status(200).json({ success: true, data: inscripcion });
    } catch (error) { next(error); }
  },

  // POST /api/inscripciones
  async add(req, res, next) {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) return responderValidacion(res, errores);

      const inscripcion = await InscripcionService.inscribir(
        req.body,
        req.usuario.id_usuario
      );
      return res.status(201).json({
        success: true,
        message: 'Inscripción realizada exitosamente',
        data:    inscripcion,
      });
    } catch (error) { next(error); }
  },

  // PATCH /api/inscripciones/:id/cancelar
  async cancelar(req, res, next) {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) return responderValidacion(res, errores);

      const inscripcion = await InscripcionService.cancelar(
        parseInt(req.params.id, 10),
        req.usuario.id_usuario
      );
      return res.status(200).json({
        success: true,
        message: 'Inscripción cancelada exitosamente',
        data:    inscripcion,
      });
    } catch (error) { next(error); }
  },

  // PATCH /api/inscripciones/:id/aprobar
  async aprobar(req, res, next) {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) return responderValidacion(res, errores);

      const inscripcion = await InscripcionService.aprobar(
        parseInt(req.params.id, 10),
        req.usuario.id_usuario
      );
      return res.status(200).json({
        success: true,
        message: 'Inscripción aprobada exitosamente',
        data:    inscripcion,
      });
    } catch (error) { next(error); }
  },

  // GET /api/inscripciones/:id/diploma
  async diploma(req, res, next) {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) return responderValidacion(res, errores);

      const { pdfStream, curso, estudiante } =
        await InscripcionService.generarDiploma(parseInt(req.params.id, 10));

      const nombreArchivo = `diploma-${estudiante.apellido
        .replace(/[^a-zA-Z]/g, '-')
        .toLowerCase()}-${curso.id}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${nombreArchivo}"`);

      pdfStream.pipe(res);
    } catch (error) { next(error); }
  },
};

module.exports = InscripcionController;