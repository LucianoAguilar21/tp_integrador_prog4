const EstudianteModel = require('../models/estudiante.model');

// Helper para crear errores con código HTTP
const crearError = (mensaje, statusCode = 400) => {
  return Object.assign(new Error(mensaje), { statusCode });
};

const EstudianteService = {

  /**
   * Browse: lista con filtros y paginación
   */
  async listar({ busqueda, documento, activo, page, limit }) {
    // Sanitizar y limitar paginación
    const paginaActual  = Math.max(1, parseInt(page)  || 1);
    const itemsPorPagina = Math.min(100, Math.max(1, parseInt(limit) || 10));

    // Convertir activo a booleano si viene como string
    let estadoActivo = undefined;
    if (activo === 'true'  || activo === '1')  estadoActivo = 1;
    if (activo === 'false' || activo === '0')  estadoActivo = 0;

    const { data, total } = await EstudianteModel.findAll({
      busqueda,
      documento,
      activo: estadoActivo,
      page:   paginaActual,
      limit:  itemsPorPagina,
    });

    // Construir metadata de paginación
    const totalPaginas = Math.ceil(total / itemsPorPagina);

    return {
      data,
      paginacion: {
        total,
        pagina:        paginaActual,
        limite:        itemsPorPagina,
        total_paginas: totalPaginas,
        tiene_anterior: paginaActual > 1,
        tiene_siguiente: paginaActual < totalPaginas,
      },
    };
  },

  /**
   * Read: obtener por ID con validación de existencia
   */
  async obtenerPorId(id) {
    const estudiante = await EstudianteModel.findById(id);
    if (!estudiante) {
      throw crearError('Estudiante no encontrado', 404);
    }
    return estudiante;
  },

  /**
   * Add: crear estudiante con validaciones de negocio
   */
  async crear(data, id_usuario) {
    const { documento, email } = data;

    // Validar unicidad de documento
    if (await EstudianteModel.existsByDocumento(documento)) {
      throw crearError(`Ya existe un estudiante con el documento ${documento}`, 409);
    }

    // Validar unicidad de email
    if (await EstudianteModel.existsByEmail(email)) {
      throw crearError(`El email ${email} ya está registrado`, 409);
    }

    const id = await EstudianteModel.create(data, id_usuario);
    return await EstudianteModel.findById(id);
  },

  /**
   * Edit: actualizar con validaciones
   */
  async actualizar(id, data, id_usuario) {
    // Verificar que existe y está activo
    const existente = await EstudianteModel.findById(id);
    if (!existente) {
      throw crearError('Estudiante no encontrado', 404);
    }
    if (!existente.activo) {
      throw crearError('No se puede editar un estudiante inactivo', 400);
    }

    const { documento, email } = data;

    // Validar unicidad excluyendo el registro actual
    if (await EstudianteModel.existsByDocumento(documento, id)) {
      throw crearError(`El documento ${documento} ya pertenece a otro estudiante`, 409);
    }
    if (await EstudianteModel.existsByEmail(email, id)) {
      throw crearError(`El email ${email} ya pertenece a otro estudiante`, 409);
    }

    const actualizado = await EstudianteModel.update(id, data, id_usuario);
    if (!actualizado) {
      throw crearError('No se pudo actualizar el estudiante', 500);
    }

    return await EstudianteModel.findById(id);
  },

  /**
   * Delete: soft delete con verificación
   */
  async eliminar(id, id_usuario) {
    const existente = await EstudianteModel.findById(id);
    if (!existente) {
      throw crearError('Estudiante no encontrado', 404);
    }
    if (!existente.activo) {
      throw crearError('El estudiante ya se encuentra inactivo', 400);
    }

    const eliminado = await EstudianteModel.softDelete(id, id_usuario);
    if (!eliminado) {
      throw crearError('No se pudo eliminar el estudiante', 500);
    }

    return { id, mensaje: 'Estudiante desactivado correctamente' };
  },

  /**
   * Restaurar estudiante inactivo
   */
  async restaurar(id, id_usuario) {
    const existente = await EstudianteModel.findById(id);
    if (!existente) {
      throw crearError('Estudiante no encontrado', 404);
    }
    if (existente.activo) {
      throw crearError('El estudiante ya se encuentra activo', 400);
    }

    await EstudianteModel.restore(id, id_usuario);
    return await EstudianteModel.findById(id);
  },
};

module.exports = EstudianteService;