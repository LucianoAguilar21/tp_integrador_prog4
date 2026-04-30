const CursoModel       = require('../models/curso.model');
const CursoEstadoModel = require('../models/curso-estado.model');

const crearError = (mensaje, statusCode = 400) =>
  Object.assign(new Error(mensaje), { statusCode });

const CursoService = {

  async listarEstados() {
    return await CursoEstadoModel.findAll();
  },

  async listar({ busqueda, id_estado, page, limit }) {
    const paginaActual   = Math.max(1, parseInt(page)  || 1);
    const itemsPorPagina = Math.min(100, Math.max(1, parseInt(limit) || 10));

    const { data, total } = await CursoModel.findAll({
      busqueda,
      id_estado,
      page:  paginaActual,
      limit: itemsPorPagina,
    });

    const totalPaginas = Math.ceil(total / itemsPorPagina);

    return {
      data,
      paginacion: {
        total,
        pagina:          paginaActual,
        limite:          itemsPorPagina,
        total_paginas:   totalPaginas,
        tiene_anterior:  paginaActual > 1,
        tiene_siguiente: paginaActual < totalPaginas,
      },
    };
  },

  async obtenerPorId(id) {
    const curso = await CursoModel.findById(id);
    if (!curso) throw crearError('Curso no encontrado', 404);
    return curso;
  },

  async crear(data, id_usuario) {
    const { id_curso_estado, inscriptos_max, cantidad_horas } = data;

    // Validar que el estado existe
    if (!(await CursoEstadoModel.exists(id_curso_estado))) {
      throw crearError('Estado de curso inválido', 400);
    }

    // Validaciones de negocio
    if (inscriptos_max < 1) {
      throw crearError('El cupo máximo debe ser al menos 1', 400);
    }
    if (cantidad_horas < 1) {
      throw crearError('La cantidad de horas debe ser al menos 1', 400);
    }

    const id = await CursoModel.create(data, id_usuario);
    return await CursoModel.findById(id);
  },

  async actualizar(id, data, id_usuario) {
    const existente = await CursoModel.findById(id);
    if (!existente) throw crearError('Curso no encontrado', 404);

    const { id_curso_estado, inscriptos_max, cantidad_horas } = data;

    if (!(await CursoEstadoModel.exists(id_curso_estado))) {
      throw crearError('Estado de curso inválido', 400);
    }

    // No permitir reducir cupo por debajo de inscriptos actuales
    if (inscriptos_max < existente.inscriptos_actuales) {
      throw crearError(
        `No se puede reducir el cupo a ${inscriptos_max}. ` +
        `Hay ${existente.inscriptos_actuales} estudiantes inscriptos.`,
        409
      );
    }

    if (cantidad_horas < 1) {
      throw crearError('La cantidad de horas debe ser al menos 1', 400);
    }

    const actualizado = await CursoModel.update(id, data, id_usuario);
    if (!actualizado) throw crearError('No se pudo actualizar el curso', 500);

    return await CursoModel.findById(id);
  },

  async eliminar(id, id_usuario) {
    const existente = await CursoModel.findById(id);
    if (!existente) throw crearError('Curso no encontrado', 404);

    // No eliminar si tiene inscriptos activos
    if (existente.inscriptos_actuales > 0) {
      throw crearError(
        `No se puede desactivar: hay ${existente.inscriptos_actuales} ` +
        `estudiante(s) inscripto(s)`,
        409
      );
    }

    // Obtener ID del estado "Inactivo"
    const estados = await CursoEstadoModel.findAll();
    const estadoInactivo = estados.find(
      (e) => e.descripcion.toLowerCase() === 'inactivo'
    );
    if (!estadoInactivo) throw crearError('Estado Inactivo no encontrado', 500);

    await CursoModel.softDelete(id, estadoInactivo.id, id_usuario);
    return { id, mensaje: 'Curso desactivado correctamente' };
  },

  async obtenerInscriptos(id) {
    const curso = await CursoModel.findById(id);
    if (!curso) throw crearError('Curso no encontrado', 404);
    const inscriptos = await CursoModel.getInscriptos(id);
    return { curso, inscriptos };
  },
};

module.exports = CursoService;