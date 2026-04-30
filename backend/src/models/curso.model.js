const { pool } = require('../config/db');

const CursoModel = {

  /**
   * Browse: listado paginado con filtros
   * @param {Object} filtros - { busqueda, id_estado, page, limit }
   */
  async findAll({ busqueda, id_estado, page = 1, limit = 10 }) {
    const offset   = (page - 1) * limit;
    const params      = [];
    const countParams = [];

    let whereClause = 'WHERE 1=1';

    if (busqueda && busqueda.trim()) {
      const termino = `%${busqueda.trim()}%`;
      whereClause += ` AND (c.nombre LIKE ? OR c.descripcion LIKE ?)`;
      params.push(termino, termino);
      countParams.push(termino, termino);
    }

    if (id_estado) {
      whereClause += ` AND c.id_curso_estado = ?`;
      params.push(parseInt(id_estado));
      countParams.push(parseInt(id_estado));
    }

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total FROM cursos c ${whereClause}`,
      countParams
    );
    const total = countRows[0].total;

    const [rows] = await pool.execute(
      `SELECT
         c.id,
         c.nombre,
         c.descripcion,
         c.fecha_inicio,
         c.cantidad_horas,
         c.inscriptos_max,
         c.id_curso_estado,
         ce.descripcion          AS estado,
         c.fecha_hora_modificacion,
         CONCAT(u.apellido, ', ', u.nombre) AS usuario_modificacion,
         COUNT(i.id)             AS inscriptos_actuales
       FROM cursos c
       INNER JOIN cursos_estados ce ON ce.id = c.id_curso_estado
       LEFT JOIN  usuarios u        ON u.id  = c.id_usuario_modificacion
       LEFT JOIN  inscripciones i   ON i.id_curso = c.id
                                   AND i.id_inscripcion_estado = (
                                     SELECT id FROM inscripciones_estados
                                     WHERE descripcion = 'Inscripto' LIMIT 1
                                   )
       ${whereClause}
       GROUP BY c.id
       ORDER BY c.fecha_inicio DESC, c.nombre ASC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return { data: rows, total };
  },

  /**
   * Read: obtener curso completo por ID
   */
  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT
         c.id,
         c.nombre,
         c.descripcion,
         c.fecha_inicio,
         c.cantidad_horas,
         c.inscriptos_max,
         c.id_curso_estado,
         ce.descripcion          AS estado,
         c.fecha_hora_modificacion,
         c.id_usuario_modificacion,
         CONCAT(u.apellido, ', ', u.nombre) AS usuario_modificacion,
         COUNT(i.id)             AS inscriptos_actuales
       FROM cursos c
       INNER JOIN cursos_estados ce ON ce.id = c.id_curso_estado
       LEFT JOIN  usuarios u        ON u.id  = c.id_usuario_modificacion
       LEFT JOIN  inscripciones i   ON i.id_curso = c.id
                                   AND i.id_inscripcion_estado = (
                                     SELECT id FROM inscripciones_estados
                                     WHERE descripcion = 'Inscripto' LIMIT 1
                                   )
       WHERE c.id = ?
       GROUP BY c.id`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Add: crear curso
   */
  async create(
    { nombre, descripcion, fecha_inicio, cantidad_horas, inscriptos_max, id_curso_estado },
    id_usuario
  ) {
    const [result] = await pool.execute(
      `INSERT INTO cursos
         (nombre, descripcion, fecha_inicio, cantidad_horas,
          inscriptos_max, id_curso_estado,
          id_usuario_modificacion, fecha_hora_modificacion)
       VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
      [
        nombre.trim(), descripcion?.trim() || null,
        fecha_inicio, cantidad_horas,
        inscriptos_max, id_curso_estado, id_usuario,
      ]
    );
    return result.insertId;
  },

  /**
   * Edit: actualizar curso
   */
  async update(
    id,
    { nombre, descripcion, fecha_inicio, cantidad_horas, inscriptos_max, id_curso_estado },
    id_usuario
  ) {
    const [result] = await pool.execute(
      `UPDATE cursos
       SET nombre                  = ?,
           descripcion             = ?,
           fecha_inicio            = ?,
           cantidad_horas          = ?,
           inscriptos_max          = ?,
           id_curso_estado         = ?,
           id_usuario_modificacion = ?,
           fecha_hora_modificacion = NOW()
       WHERE id = ?`,
      [
        nombre.trim(), descripcion?.trim() || null,
        fecha_inicio, cantidad_horas,
        inscriptos_max, id_curso_estado,
        id_usuario, id,
      ]
    );
    return result.affectedRows > 0;
  },

  /**
   * Delete: soft delete cambiando estado a "Inactivo"
   */
  async softDelete(id, id_estado_inactivo, id_usuario) {
    const [result] = await pool.execute(
      `UPDATE cursos
       SET id_curso_estado         = ?,
           id_usuario_modificacion = ?,
           fecha_hora_modificacion = NOW()
       WHERE id = ?`,
      [id_estado_inactivo, id_usuario, id]
    );
    return result.affectedRows > 0;
  },

  /**
   * Verificar cupo disponible para inscripción
   */
  async getCupoDisponible(id_curso) {
    const [rows] = await pool.execute(
      `SELECT
         c.inscriptos_max,
         COUNT(i.id) AS inscriptos_actuales,
         (c.inscriptos_max - COUNT(i.id)) AS cupo_disponible
       FROM cursos c
       LEFT JOIN inscripciones i ON i.id_curso = c.id
                                AND i.id_inscripcion_estado = (
                                  SELECT id FROM inscripciones_estados
                                  WHERE descripcion = 'Inscripto' LIMIT 1
                                )
       WHERE c.id = ?
       GROUP BY c.id`,
      [id_curso]
    );
    return rows[0] || null;
  },

  /**
   * Obtener inscriptos de un curso (para lista en diploma / PDF)
   */
  async getInscriptos(id_curso) {
    const [rows] = await pool.execute(
      `SELECT
         e.id,
         e.documento,
         e.apellido,
         e.nombre,
         e.email,
         i.fecha_hora_inscripcion,
         ie.descripcion AS estado_inscripcion
       FROM inscripciones i
       INNER JOIN estudiantes e         ON e.id = i.id_estudiante
       INNER JOIN inscripciones_estados ie ON ie.id = i.id_inscripcion_estado
       WHERE i.id_curso = ?
       ORDER BY e.apellido, e.nombre`,
      [id_curso]
    );
    return rows;
  },
};

module.exports = CursoModel;