const { pool } = require('../config/db');

const InscripcionModel = {

  /**
   * Browse: listado paginado con filtros
   */
  async findAll({ id_curso, id_estudiante, id_estado, page = 1, limit = 10 }) {
    const offset      = (page - 1) * limit;
    const params      = [];
    const countParams = [];

    let whereClause = 'WHERE 1=1';

    if (id_curso) {
      whereClause += ` AND i.id_curso = ?`;
      params.push(parseInt(id_curso));
      countParams.push(parseInt(id_curso));
    }

    if (id_estudiante) {
      whereClause += ` AND i.id_estudiante = ?`;
      params.push(parseInt(id_estudiante));
      countParams.push(parseInt(id_estudiante));
    }

    if (id_estado) {
      whereClause += ` AND i.id_inscripcion_estado = ?`;
      params.push(parseInt(id_estado));
      countParams.push(parseInt(id_estado));
    }

    const [countRows] = await pool.execute(
      `SELECT COUNT(*) AS total
       FROM inscripciones i ${whereClause}`,
      countParams
    );
    const total = countRows[0].total;

    const [rows] = await pool.execute(
      `SELECT
         i.id,
         i.id_curso,
         c.nombre                              AS curso,
         c.fecha_inicio,
         c.cantidad_horas,
         i.id_estudiante,
         CONCAT(e.apellido, ', ', e.nombre)   AS estudiante,
         e.documento,
         e.email,
         i.fecha_hora_inscripcion,
         i.id_inscripcion_estado,
         ie.descripcion                        AS estado,
         i.fecha_hora_modificacion,
         CONCAT(u.apellido, ', ', u.nombre)   AS usuario_modificacion
       FROM inscripciones i
       INNER JOIN cursos               c  ON c.id  = i.id_curso
       INNER JOIN estudiantes          e  ON e.id  = i.id_estudiante
       INNER JOIN inscripciones_estados ie ON ie.id = i.id_inscripcion_estado
       LEFT JOIN  usuarios             u  ON u.id  = i.id_usuario_modificacion
       ${whereClause}
       ORDER BY i.fecha_hora_inscripcion DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    return { data: rows, total };
  },

  /**
   * Read: obtener inscripción por ID
   */
  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT
         i.id,
         i.id_curso,
         c.nombre                              AS curso,
         c.fecha_inicio,
         c.cantidad_horas,
         i.id_estudiante,
         CONCAT(e.apellido, ', ', e.nombre)   AS estudiante,
         e.documento,
         e.apellido                            AS estudiante_apellido,
         e.nombre                              AS estudiante_nombre,
         e.email,
         i.fecha_hora_inscripcion,
         i.id_inscripcion_estado,
         ie.descripcion                        AS estado,
         i.fecha_hora_modificacion,
         CONCAT(u.apellido, ', ', u.nombre)   AS usuario_modificacion
       FROM inscripciones i
       INNER JOIN cursos               c  ON c.id  = i.id_curso
       INNER JOIN estudiantes          e  ON e.id  = i.id_estudiante
       INNER JOIN inscripciones_estados ie ON ie.id = i.id_inscripcion_estado
       LEFT JOIN  usuarios             u  ON u.id  = i.id_usuario_modificacion
       WHERE i.id = ?`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Verificar si ya existe inscripción activa para curso+estudiante
   */
  async existeInscripcionActiva(id_curso, id_estudiante, id_estado_inscripto) {
    const [rows] = await pool.execute(
      `SELECT id FROM inscripciones
       WHERE id_curso = ?
         AND id_estudiante = ?
         AND id_inscripcion_estado = ?
       LIMIT 1`,
      [id_curso, id_estudiante, id_estado_inscripto]
    );
    return rows.length > 0;
  },

  /**
   * Crear inscripción dentro de una transacción
   * Incluye bloqueo optimista para evitar race conditions de cupo
   */
  async create({ id_curso, id_estudiante, id_estado_inscripto, id_usuario }) {
    const connection = await pool.getConnection();

    try {
      await connection.beginTransaction();

      // ── 1. Bloquear fila del curso para lectura consistente ────────────────
      const [cursoRows] = await connection.execute(
        `SELECT id, inscriptos_max, id_curso_estado
         FROM cursos
         WHERE id = ?
         FOR UPDATE`,
        [id_curso]
      );

      if (cursoRows.length === 0) {
        throw Object.assign(new Error('Curso no encontrado'), { statusCode: 404 });
      }

      const curso = cursoRows[0];

      // ── 2. Verificar que el curso esté en estado "Activo" ─────────────────
      const [estadoRows] = await connection.execute(
        `SELECT descripcion FROM cursos_estados WHERE id = ? LIMIT 1`,
        [curso.id_curso_estado]
      );
      const estadoCurso = estadoRows[0]?.descripcion?.toLowerCase();

      if (estadoCurso !== 'activo') {
        throw Object.assign(
          new Error(`No se pueden realizar inscripciones: el curso está ${estadoRows[0]?.descripcion}`),
          { statusCode: 422 }
        );
      }

      // ── 3. Verificar inscripción duplicada ────────────────────────────────
      const [dupRows] = await connection.execute(
        `SELECT id FROM inscripciones
         WHERE id_curso = ?
           AND id_estudiante = ?
           AND id_inscripcion_estado = ?
         LIMIT 1`,
        [id_curso, id_estudiante, id_estado_inscripto]
      );

      if (dupRows.length > 0) {
        throw Object.assign(
          new Error('El estudiante ya se encuentra inscripto en este curso'),
          { statusCode: 409 }
        );
      }

      // ── 4. Verificar cupo disponible ──────────────────────────────────────
      const [cupoRows] = await connection.execute(
        `SELECT COUNT(*) AS inscriptos_actuales
         FROM inscripciones
         WHERE id_curso = ?
           AND id_inscripcion_estado = ?`,
        [id_curso, id_estado_inscripto]
      );

      const inscriptosActuales = cupoRows[0].inscriptos_actuales;

      if (inscriptosActuales >= curso.inscriptos_max) {
        throw Object.assign(
          new Error(
            `El curso no tiene cupo disponible ` +
            `(${inscriptosActuales}/${curso.inscriptos_max} inscriptos)`
          ),
          { statusCode: 422 }
        );
      }

      // ── 5. Insertar inscripción ───────────────────────────────────────────
      const [result] = await connection.execute(
        `INSERT INTO inscripciones
           (id_curso, id_estudiante, fecha_hora_inscripcion,
            id_inscripcion_estado, id_usuario_modificacion, fecha_hora_modificacion)
         VALUES (?, ?, NOW(), ?, ?, NOW())`,
        [id_curso, id_estudiante, id_estado_inscripto, id_usuario]
      );

      await connection.commit();
      return result.insertId;

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  /**
   * Cancelar inscripción (soft delete → estado Cancelado)
   */
  async cancelar(id, id_estado_cancelado, id_usuario) {
    const [result] = await pool.execute(
      `UPDATE inscripciones
       SET id_inscripcion_estado    = ?,
           id_usuario_modificacion  = ?,
           fecha_hora_modificacion  = NOW()
       WHERE id = ?
         AND id_inscripcion_estado != ?`,
      [id_estado_cancelado, id_usuario, id, id_estado_cancelado]
    );
    return result.affectedRows > 0;
  },

  /**
   * Cambiar estado a Aprobado
   */
  async aprobar(id, id_estado_aprobado, id_usuario) {
    const [result] = await pool.execute(
      `UPDATE inscripciones
       SET id_inscripcion_estado   = ?,
           id_usuario_modificacion = ?,
           fecha_hora_modificacion = NOW()
       WHERE id = ?`,
      [id_estado_aprobado, id_usuario, id]
    );
    return result.affectedRows > 0;
  },
};

module.exports = InscripcionModel;