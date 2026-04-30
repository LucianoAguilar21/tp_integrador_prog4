const { pool } = require('../config/db');

const EstudianteModel = {

  /**
   * Browse: lista paginada con filtros opcionales
   * @param {Object} filtros - { busqueda, documento, activo, page, limit }
   * @returns {{ data: Array, total: number }}
   */
  async findAll({ busqueda, documento, activo, page = 1, limit = 10 }) {
    const offset = (page - 1) * limit;
    const params = [];
    const countParams = [];

    let whereClause = 'WHERE 1=1';

    // Filtro por texto general (nombre, apellido, email)
    if (busqueda && busqueda.trim()) {
      const termino = `%${busqueda.trim()}%`;
      whereClause += ` AND (
        e.nombre        LIKE ? OR
        e.apellido      LIKE ? OR
        e.email         LIKE ?
      )`;
      params.push(termino, termino, termino);
      countParams.push(termino, termino, termino);
    }

    // Filtro por documento exacto
    if (documento && documento.trim()) {
      whereClause += ` AND e.documento LIKE ?`;
      const docTerm = `%${documento.trim()}%`;
      params.push(docTerm);
      countParams.push(docTerm);
    }

    // Filtro por estado activo (por defecto solo activos)
    if (activo !== undefined && activo !== null && activo !== '') {
      whereClause += ` AND e.activo = ?`;
      params.push(activo);
      countParams.push(activo);
    } else {
      whereClause += ` AND e.activo = 1`;
    }

    // Query de conteo total (para paginación)
    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM estudiantes e
       ${whereClause}`,
      countParams
    );
    const total = countRows[0].total;

    // Query principal con JOIN para traer modificador
    const [rows] = await pool.execute(
      `SELECT
         e.id,
         e.documento,
         e.apellido,
         e.nombre,
         e.email,
         e.fecha_nacimiento,
         e.activo,
         e.fecha_hora_modificacion,
         CONCAT(u.apellido, ', ', u.nombre) AS usuario_modificacion
       FROM estudiantes e
       LEFT JOIN usuarios u ON u.id = e.id_usuario_modificacion
       ${whereClause}
       ORDER BY e.apellido ASC, e.nombre ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return { data: rows, total };
  },

  /**
   * Read: obtener estudiante por ID
   * @param {number} id
   * @returns {Object|null}
   */
  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT
         e.id,
         e.documento,
         e.apellido,
         e.nombre,
         e.email,
         e.fecha_nacimiento,
         e.activo,
         e.fecha_hora_modificacion,
         e.id_usuario_modificacion,
         CONCAT(u.apellido, ', ', u.nombre) AS usuario_modificacion
       FROM estudiantes e
       LEFT JOIN usuarios u ON u.id = e.id_usuario_modificacion
       WHERE e.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Verifica si ya existe un documento (para validar unicidad)
   * @param {string} documento
   * @param {number|null} excludeId - ID a excluir en edición
   * @returns {boolean}
   */
  async existsByDocumento(documento, excludeId = null) {
    let query = `SELECT id FROM estudiantes WHERE documento = ?`;
    const params = [documento];
    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }
    const [rows] = await pool.execute(query, params);
    return rows.length > 0;
  },

  /**
   * Verifica si ya existe un email (para validar unicidad)
   * @param {string} email
   * @param {number|null} excludeId
   * @returns {boolean}
   */
  async existsByEmail(email, excludeId = null) {
    let query = `SELECT id FROM estudiantes WHERE email = ?`;
    const params = [email];
    if (excludeId) {
      query += ` AND id != ?`;
      params.push(excludeId);
    }
    const [rows] = await pool.execute(query, params);
    return rows.length > 0;
  },

  /**
   * Add: crear nuevo estudiante
   * @param {Object} data
   * @param {number} id_usuario
   * @returns {number} ID insertado
   */
  async create({ documento, apellido, nombre, email, fecha_nacimiento }, id_usuario) {
    const [result] = await pool.execute(
      `INSERT INTO estudiantes
         (documento, apellido, nombre, email, fecha_nacimiento, activo,
          id_usuario_modificacion, fecha_hora_modificacion)
       VALUES (?, ?, ?, ?, ?, 1, ?, NOW())`,
      [documento, apellido.trim(), nombre.trim(), email.toLowerCase().trim(),
       fecha_nacimiento, id_usuario]
    );
    return result.insertId;
  },

  /**
   * Edit: actualizar datos del estudiante
   * @param {number} id
   * @param {Object} data
   * @param {number} id_usuario
   * @returns {boolean} true si se actualizó
   */
  async update(id, { documento, apellido, nombre, email, fecha_nacimiento }, id_usuario) {
    const [result] = await pool.execute(
      `UPDATE estudiantes
       SET documento                = ?,
           apellido                 = ?,
           nombre                   = ?,
           email                    = ?,
           fecha_nacimiento         = ?,
           id_usuario_modificacion  = ?,
           fecha_hora_modificacion  = NOW()
       WHERE id = ? AND activo = 1`,
      [documento, apellido.trim(), nombre.trim(), email.toLowerCase().trim(),
       fecha_nacimiento, id_usuario, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Delete: soft delete (marca activo = 0)
   * @param {number} id
   * @param {number} id_usuario
   * @returns {boolean}
   */
  async softDelete(id, id_usuario) {
    const [result] = await pool.execute(
      `UPDATE estudiantes
       SET activo                  = 0,
           id_usuario_modificacion = ?,
           fecha_hora_modificacion = NOW()
       WHERE id = ? AND activo = 1`,
      [id_usuario, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Restaurar estudiante desactivado
   * @param {number} id
   * @param {number} id_usuario
   * @returns {boolean}
   */
  async restore(id, id_usuario) {
    const [result] = await pool.execute(
      `UPDATE estudiantes
       SET activo                  = 1,
           id_usuario_modificacion = ?,
           fecha_hora_modificacion = NOW()
       WHERE id = ? AND activo = 0`,
      [id_usuario, id]
    );
    return result.affectedRows > 0;
  },
};

module.exports = EstudianteModel;