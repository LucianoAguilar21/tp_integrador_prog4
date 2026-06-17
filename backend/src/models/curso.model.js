const { pool } = require('../config/db');

const CursoModel = {

  /**
   * Browse: listado paginado con filtros
   * @param {Object} filtros - { busqueda, id_estado, page, limit }
   */

  async findAll({ busqueda, id_estado, page = 1, limit = 10 }) {
    const pageNum  = parseInt(page, 10)  || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offset   = (pageNum - 1) * limitNum;

    const params      = [];
    const countParams = [];
    let paramIndex = 1;

    let whereClause = 'WHERE 1=1';

    if (busqueda && busqueda.trim()) {
      const termino = `%${busqueda.trim()}%`;
      whereClause += ` AND (c.nombre ILIKE $${paramIndex++} OR c.descripcion ILIKE $${paramIndex++})`;
      params.push(termino, termino);
      countParams.push(termino, termino);
    }

    if (id_estado) {
      whereClause += ` AND c.id_curso_estado = $${paramIndex++}`;
      params.push(parseInt(id_estado, 10));
      countParams.push(parseInt(id_estado, 10));
    }

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) AS total FROM cursos c ${whereClause}`,
      countParams
    );
    const total = parseInt(countRows[0].total, 10);

    const limitParamIdx  = paramIndex++;
    const offsetParamIdx = paramIndex++;

    const { rows } = await pool.query(
      `SELECT
         c.id_curso,
         c.nombre,
         c.descripcion,
         c.fecha_inicio,
         c.cantidad_horas,
         c.inscriptos_max,
         c.id_curso_estado,
         ce.descripcion          AS estado,
         c.fecha_hora_modificacion,
         CONCAT(u.apellido, ', ', u.nombre) AS usuario_modificacion,
         COUNT(i.id_inscripcion) AS inscriptos_actuales
       FROM cursos c
       INNER JOIN cursos_estados ce ON ce.id_curso_estado = c.id_curso_estado
       LEFT JOIN  usuarios u        ON u.id_usuario = c.id_usuario_modificacion
       LEFT JOIN  inscripciones i   ON i.id_curso = c.id_curso
                                   AND i.id_inscripcion_estado = (
                                     SELECT id_inscripcion_estado FROM inscripciones_estados
                                     WHERE descripcion = 'Inscripto' LIMIT 1
                                   )
       ${whereClause}
       GROUP BY c.id_curso, c.nombre, c.descripcion, c.fecha_inicio, c.cantidad_horas,
                c.inscriptos_max, c.id_curso_estado, ce.descripcion,
                c.fecha_hora_modificacion, u.apellido, u.nombre
       ORDER BY c.fecha_inicio DESC, c.nombre ASC
       LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}`,
      [...params, limitNum, offset]
    );

    return { data: rows, total };
  },


  /**
   * Read: obtener curso completo por ID
   */
  async findById(id) {
    const { rows } = await pool.query(
      `SELECT
         c.id_curso,
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
         COUNT(i.id_inscripcion)             AS inscriptos_actuales
       FROM cursos c
       INNER JOIN cursos_estados ce ON ce.id_curso_estado = c.id_curso_estado
       LEFT JOIN  usuarios u        ON u.id_usuario = c.id_usuario_modificacion
       LEFT JOIN  inscripciones i   ON i.id_curso = c.id_curso
                                   AND i.id_inscripcion_estado = (
                                     SELECT id_inscripcion_estado FROM inscripciones_estados
                                     WHERE descripcion = 'Inscripto' LIMIT 1
                                   )
       WHERE c.id_curso = $1
       GROUP BY  
          c.id_curso,
          ce.descripcion,
          u.apellido,
          u.nombre`,
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
    const result = await pool.query(
      `INSERT INTO cursos
         (nombre, descripcion, fecha_inicio, cantidad_horas,
          inscriptos_max, id_curso_estado,
          id_usuario_modificacion, fecha_hora_modificacion)
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
       RETURNING id_curso`,
      [
        nombre.trim(), descripcion?.trim() || null,
        fecha_inicio, cantidad_horas,
        inscriptos_max, id_curso_estado, id_usuario,
      ]
    );
    return result.rows[0]?.id_curso || null;
  },

  /**
   * Edit: actualizar curso
   */
  async update(
    id,
    { nombre, descripcion, fecha_inicio, cantidad_horas, inscriptos_max, id_curso_estado },
    id_usuario
  ) {
    const result = await pool.query(
      `UPDATE cursos
       SET nombre                  = $1,
           descripcion             = $2,
           fecha_inicio            = $3,
           cantidad_horas          = $4,
           inscriptos_max          = $5,
           id_curso_estado         = $6,
           id_usuario_modificacion = $7,
           fecha_hora_modificacion = NOW()
       WHERE id_curso = $8`,
      [
        nombre.trim(), descripcion?.trim() || null,
        fecha_inicio, cantidad_horas,
        inscriptos_max, id_curso_estado,
        id_usuario, id,
      ]
    );
    return result.rowCount > 0;
  },

  /**
   * Delete: soft delete cambiando estado a "Inactivo"
   */
  async softDelete(id, id_estado_inactivo, id_usuario) {
    const result = await pool.query(
      `UPDATE cursos
       SET id_curso_estado         = $1,
           id_usuario_modificacion = $2,
           fecha_hora_modificacion = NOW()
       WHERE id_curso = $3`,
      [id_estado_inactivo, id_usuario, id]
    );
    return result.rowCount > 0;
  },

  /**
   * Verificar cupo disponible para inscripción
   */
  async getCupoDisponible(id_curso) {
    const { rows } = await pool.query(
      `SELECT
         c.inscriptos_max,
         COUNT(i.id_inscripcion) AS inscriptos_actuales,
         (c.inscriptos_max - COUNT(i.id_inscripcion)) AS cupo_disponible
       FROM cursos c
       LEFT JOIN inscripciones i ON i.id_curso = c.id_curso
                                AND i.id_inscripcion_estado = (
                                  SELECT id_inscripcion_estado FROM inscripciones_estados
                                  WHERE descripcion = 'Inscripto' LIMIT 1
                                )
       WHERE c.id_curso = $1
       GROUP BY c.id_curso`,
      [id_curso]
    );
    return rows[0] || null;
  },

  /**
   * Obtener inscriptos de un curso (para lista en diploma / PDF)
   */
  async getInscriptos(id_curso) {
    const { rows } = await pool.query(
      `SELECT
         e.id_estudiante,
         e.documento,
         e.apellido,
         e.nombres,
         e.email,
         i.fecha_hora_inscripcion,
         ie.descripcion AS estado_inscripcion
       FROM inscripciones i
       INNER JOIN estudiantes e         ON e.id_estudiante = i.id_estudiante
       INNER JOIN inscripciones_estados ie ON ie.id_inscripcion_estado = i.id_inscripcion_estado
       WHERE i.id_curso = $1
       ORDER BY e.apellido, e.nombres`,
      [id_curso]
    );
    return rows;
  },
};

module.exports = CursoModel;