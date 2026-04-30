const { validationResult } = require('express-validator');
const CursoService = require('../services/curso.service');
const PdfService   = require('../services/pdf.service');

const responderValidacion = (res, errores) =>
  res.status(400).json({
    success: false,
    message: 'Datos de entrada inválidos',
    errors:  errores.array(),
  });

const CursoController = {

  // GET /api/cursos/estados
  async estados(req, res, next) {
    try {
      const data = await CursoService.listarEstados();
      return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  },

  // GET /api/cursos
  async browse(req, res, next) {
    try {
      const resultado = await CursoService.listar(req.query);
      return res.status(200).json({ success: true, ...resultado });
    } catch (error) { next(error); }
  },

  // GET /api/cursos/:id
  async read(req, res, next) {
    try {
      const curso = await CursoService.obtenerPorId(parseInt(req.params.id));
      return res.status(200).json({ success: true, data: curso });
    } catch (error) { next(error); }
  },

  // POST /api/cursos
  async add(req, res, next) {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) return responderValidacion(res, errores);

      const curso = await CursoService.crear(req.body, req.usuario.id);
      return res.status(201).json({
        success: true,
        message: 'Curso creado exitosamente',
        data:    curso,
      });
    } catch (error) { next(error); }
  },

  // PUT /api/cursos/:id
  async edit(req, res, next) {
    try {
      const errores = validationResult(req);
      if (!errores.isEmpty()) return responderValidacion(res, errores);

      const curso = await CursoService.actualizar(
        parseInt(req.params.id), req.body, req.usuario.id
      );
      return res.status(200).json({
        success: true,
        message: 'Curso actualizado exitosamente',
        data:    curso,
      });
    } catch (error) { next(error); }
  },

  // DELETE /api/cursos/:id
  async delete(req, res, next) {
    try {
      const resultado = await CursoService.eliminar(
        parseInt(req.params.id), req.usuario.id
      );
      return res.status(200).json({ success: true, data: resultado });
    } catch (error) { next(error); }
  },

  // GET /api/cursos/:id/inscriptos
  async inscriptos(req, res, next) {
    try {
      const data = await CursoService.obtenerInscriptos(parseInt(req.params.id));
      return res.status(200).json({ success: true, data });
    } catch (error) { next(error); }
  },

  // GET /api/cursos/:id/pdf/listado
  async pdfListado(req, res, next) {
    try {
      const { curso, inscriptos } = await CursoService.obtenerInscriptos(
        parseInt(req.params.id)
      );

      // Nombre de archivo seguro (sin caracteres especiales)
      const nombreArchivo = `listado-${curso.nombre
        .replace(/[^a-zA-Z0-9]/g, '-')
        .toLowerCase()}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${nombreArchivo}"`
      );

      const pdfStream = PdfService.generarListadoInscriptos(curso, inscriptos);
      pdfStream.pipe(res);
    } catch (error) { next(error); }
  },

  // GET /api/cursos/:id/pdf/diploma/:id_estudiante
  async pdfDiploma(req, res, next) {
    try {
      const { curso, inscriptos } = await CursoService.obtenerInscriptos(
        parseInt(req.params.id)
      );

      const idEstudiante = parseInt(req.params.id_estudiante);
      const estudiante   = inscriptos.find((i) => i.id === idEstudiante);

      if (!estudiante) {
        return res.status(404).json({
          success: false,
          message: 'El estudiante no está inscripto en este curso',
        });
      }

      const nombreArchivo = `diploma-${estudiante.apellido
        .replace(/[^a-zA-Z]/g, '-')
        .toLowerCase()}-${curso.id}.pdf`;

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader(
        'Content-Disposition',
        `inline; filename="${nombreArchivo}"`
      );

      const pdfStream = PdfService.generarDiplomaEstudiante(curso, estudiante);
      pdfStream.pipe(res);
    } catch (error) { next(error); }
  },
};

module.exports = CursoController;