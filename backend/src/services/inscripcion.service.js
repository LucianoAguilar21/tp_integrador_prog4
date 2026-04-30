const InscripcionModel       = require('../models/inscripcion.model');
const InscripcionEstadoModel = require('../models/inscripcion-estado.model');
const CursoModel             = require('../models/curso.model');
const EstudianteModel        = require('../models/estudiante.model');
const PdfService             = require('./pdf.service');

const crearError = (mensaje, statusCode = 400) =>
  Object.assign(new Error(mensaje), { statusCode });

const InscripcionService = {

  async listarEstados() {
    return await InscripcionEstadoModel.findAll();
  },

  async listar({ id_curso, id_estudiante, id_estado, page, limit }) {
    const paginaActual   = Math.max(1, parseInt(page)  || 1);
    const itemsPorPagina = Math.min(100, Math.max(1, parseInt(limit) || 10));

    const { data, total } = await InscripcionModel.findAll({
      id_curso,
      id_estudiante,
      id_estado,
      page:  paginaActual,
      limit: itemsPorPagina,
    });

    return {
      data,
      paginacion: {
        total,
        pagina:          paginaActual,
        limite:          itemsPorPagina,
        total_paginas:   Math.ceil(total / itemsPorPagina),
        tiene_anterior:  paginaActual > 1,
        tiene_siguiente: paginaActual < Math.ceil(total / itemsPorPagina),
      },
    };
  },

  async obtenerPorId(id) {
    const inscripcion = await InscripcionModel.findById(id);
    if (!inscripcion) throw crearError('Inscripción no encontrada', 404);
    return inscripcion;
  },

  async inscribir({ id_curso, id_estudiante }, id_usuario) {
    // ── Verificar existencia de curso y estudiante ────────────────────────────
    const curso = await CursoModel.findById(id_curso);
    if (!curso) throw crearError('Curso no encontrado', 404);

    const estudiante = await EstudianteModel.findById(id_estudiante);
    if (!estudiante) throw crearError('Estudiante no encontrado', 404);

    if (!estudiante.activo) {
      throw crearError('No se puede inscribir un estudiante inactivo', 422);
    }

    // ── Obtener ID del estado "Inscripto" ─────────────────────────────────────
    const id_estado_inscripto = await InscripcionEstadoModel
      .getIdPorDescripcion('Inscripto');

    if (!id_estado_inscripto) {
      throw crearError('Estado "Inscripto" no configurado en el sistema', 500);
    }

    // ── La transacción + validaciones de cupo/duplicado están en el model ─────
    const id = await InscripcionModel.create({
      id_curso,
      id_estudiante,
      id_estado_inscripto,
      id_usuario,
    });

    return await InscripcionModel.findById(id);
  },

  async cancelar(id, id_usuario) {
    const inscripcion = await InscripcionModel.findById(id);
    if (!inscripcion) throw crearError('Inscripción no encontrada', 404);

    if (inscripcion.estado.toLowerCase() === 'cancelado') {
      throw crearError('La inscripción ya se encuentra cancelada', 400);
    }

    const id_estado_cancelado = await InscripcionEstadoModel
      .getIdPorDescripcion('Cancelado');

    if (!id_estado_cancelado) {
      throw crearError('Estado "Cancelado" no configurado en el sistema', 500);
    }

    const cancelada = await InscripcionModel.cancelar(id, id_estado_cancelado, id_usuario);
    if (!cancelada) throw crearError('No se pudo cancelar la inscripción', 500);

    return await InscripcionModel.findById(id);
  },

  async aprobar(id, id_usuario) {
    const inscripcion = await InscripcionModel.findById(id);
    if (!inscripcion) throw crearError('Inscripción no encontrada', 404);

    if (inscripcion.estado.toLowerCase() !== 'inscripto') {
      throw crearError(
        `Solo se pueden aprobar inscripciones en estado "Inscripto". ` +
        `Estado actual: "${inscripcion.estado}"`,
        422
      );
    }

    const id_estado_aprobado = await InscripcionEstadoModel
      .getIdPorDescripcion('Aprobado');

    if (!id_estado_aprobado) {
      throw crearError('Estado "Aprobado" no configurado en el sistema', 500);
    }

    await InscripcionModel.aprobar(id, id_estado_aprobado, id_usuario);
    return await InscripcionModel.findById(id);
  },

  async generarDiploma(id) {
    const inscripcion = await InscripcionModel.findById(id);
    if (!inscripcion) throw crearError('Inscripción no encontrada', 404);

    if (inscripcion.estado.toLowerCase() !== 'aprobado') {
      throw crearError(
        'Solo se pueden generar diplomas para inscripciones aprobadas',
        422
      );
    }

    // Estructurar datos para el generador de PDF
    const curso = {
      id:             inscripcion.id_curso,
      nombre:         inscripcion.curso,
      fecha_inicio:   inscripcion.fecha_inicio,
      cantidad_horas: inscripcion.cantidad_horas,
    };

    const estudiante = {
      id:        inscripcion.id_estudiante,
      apellido:  inscripcion.estudiante_apellido,
      nombre:    inscripcion.estudiante_nombre,
      documento: inscripcion.documento,
    };

    return { pdfStream: PdfService.generarDiplomaEstudiante(curso, estudiante), curso, estudiante };
  },
};

module.exports = InscripcionService;