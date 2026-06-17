

const { pool } = require('../config/db');

const InscripcionModel = {

  async findAll({ id_curso, id_estudiante, id_estado, page = 1, limit = 10 }) {
    const pageNum  = parseInt(page, 10)  || 1;
    const limitNum = parseInt(limit, 10) || 10;
    const offset   = (pageNum - 1) * limitNum;

    const params      = [];
    const countParams = [];
    let paramIndex = 1;

    let whereClause = 'WHERE 1=1';

    if (id_curso) {
      whereClause += ` AND i.id_curso = $${paramIndex++}`;
      params.push(parseInt(id_curso, 10));
      countParams.push(parseInt(id_curso, 10));
    }

    if (id_estudiante) {
      whereClause += ` AND i.id_estudiante = $${paramIndex++}`;
      params.push(parseInt(id_estudiante, 10));
      countParams.push(parseInt(id_estudiante, 10));
    }

    if (id_estado) {
      whereClause += ` AND i.id_inscripcion_estado = $${paramIndex++}`;
      params.push(parseInt(id_estado, 10));
      countParams.push(parseInt(id_estado, 10));
    }

    const { rows: countRows } = await pool.query(
      `SELECT COUNT(*) AS total
       FROM inscripciones i ${whereClause}`,
      countParams
    );
    const total = parseInt(countRows[0].total, 10);

    const limitParamIdx  = paramIndex++;
    const offsetParamIdx = paramIndex++;

    const { rows } = await pool.query(
      `SELECT
         i.id_inscripcion,
         i.id_curso,
         c.nombre                              AS curso,
         c.fecha_inicio,
         c.cantidad_horas,
         i.id_estudiante,
         CONCAT(e.apellido, ', ', e.nombres)   AS estudiante,
         e.documento,
         e.email,
         i.fecha_hora_inscripcion,
         i.id_inscripcion_estado,
         ie.descripcion                        AS estado,
         i.fecha_hora_modificacion,
         CONCAT(u.apellido, ', ', u.nombre)   AS usuario_modificacion
       FROM inscripciones i
       INNER JOIN cursos               c  ON c.id_curso       = i.id_curso
       INNER JOIN estudiantes          e  ON e.id_estudiante  = i.id_estudiante
       INNER JOIN inscripciones_estados ie ON ie.id_inscripcion_estado = i.id_inscripcion_estado
       LEFT JOIN  usuarios             u  ON u.id_usuario     = i.id_usuario_modificacion
       ${whereClause}
       ORDER BY i.fecha_hora_inscripcion DESC
       LIMIT $${limitParamIdx} OFFSET $${offsetParamIdx}`,
      [...params, limitNum, offset]
    );

    return { data: rows, total };
  },

  async findById(id) {
    const idNum = Number(id);
    if (!Number.isInteger(idNum) || idNum < 1) {
      return null;
    }

    const { rows } = await pool.query(
      `SELECT
         i.id_inscripcion,
         i.id_curso,
         c.nombre                              AS curso,
         c.fecha_inicio,
         c.cantidad_horas,
         i.id_estudiante,
         CONCAT(e.apellido, ', ', e.nombres)   AS estudiante,
         e.documento,
         e.apellido                            AS estudiante_apellido,
         e.nombres                              AS estudiante_nombre,
         e.email,
         i.fecha_hora_inscripcion,
         i.id_inscripcion_estado,
         ie.descripcion                        AS estado,
         i.fecha_hora_modificacion,
         CONCAT(u.apellido, ', ', u.nombre)   AS usuario_modificacion
       FROM inscripciones i
       INNER JOIN cursos               c  ON c.id_curso       = i.id_curso
       INNER JOIN estudiantes          e  ON e.id_estudiante  = i.id_estudiante
       INNER JOIN inscripciones_estados ie ON ie.id_inscripcion_estado = i.id_inscripcion_estado
       LEFT JOIN  usuarios             u  ON u.id_usuario     = i.id_usuario_modificacion
       WHERE i.id_inscripcion = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async existeInscripcionActiva(id_curso, id_estudiante, id_estado_inscripto) {
    const { rows } = await pool.query(
      `SELECT id_inscripcion FROM inscripciones
       WHERE id_curso = $1
         AND id_estudiante = $2
         AND id_inscripcion_estado = $3
       LIMIT 1`,
      [id_curso, id_estudiante, id_estado_inscripto]
    );
    return rows.length > 0;
  },

  async create({ id_curso, id_estudiante, id_estado_inscripto, id_usuario }) {
    const client = await pool.connect();

    try {
      await client.query('BEGIN');

      const { rows: cursoRows } = await client.query(
        `SELECT id_curso, inscriptos_max, id_curso_estado
         FROM cursos
         WHERE id_curso = $1
         FOR UPDATE`,
        [id_curso]
      );

      if (cursoRows.length === 0) {
        throw Object.assign(new Error('Curso no encontrado'), { statusCode: 404 });
      }

      const curso = cursoRows[0];

      const { rows: estadoRows } = await client.query(
        `SELECT descripcion FROM cursos_estados WHERE id_curso_estado = $1 LIMIT 1`,
        [curso.id_curso_estado]
      );
      const estadoCurso = estadoRows[0]?.descripcion?.toLowerCase();

      if (estadoCurso !== 'INSCRIPCIÓN ABIERTA'.toLowerCase()) {
        throw Object.assign(
          new Error(`No se pueden realizar inscripciones: el curso está ${estadoRows[0]?.descripcion}`),
          { statusCode: 422 }
        );
      }

      const { rows: dupRows } = await client.query(
        `SELECT id_inscripcion FROM inscripciones
         WHERE id_curso = $1
           AND id_estudiante = $2
           AND id_inscripcion_estado = $3
         LIMIT 1`,
        [id_curso, id_estudiante, id_estado_inscripto]
      );

      if (dupRows.length > 0) {
        throw Object.assign(
          new Error('El estudiante ya se encuentra inscripto en este curso'),
          { statusCode: 409 }
        );
      }

      const { rows: cupoRows } = await client.query(
        `SELECT COUNT(*)::int AS inscriptos_actuales
         FROM inscripciones
         WHERE id_curso = $1
           AND id_inscripcion_estado = $2`,
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

      const { rows: insertRows } = await client.query(
        `INSERT INTO inscripciones
           (id_curso, id_estudiante, fecha_hora_inscripcion,
            id_inscripcion_estado, id_usuario_modificacion, fecha_hora_modificacion)
         VALUES ($1, $2, NOW(), $3, $4, NOW())
         RETURNING id_inscripcion`,
        [id_curso, id_estudiante, id_estado_inscripto, id_usuario]
      );

      await client.query('COMMIT');
      return insertRows[0].id_inscripcion;

    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },

  async cancelar(id, id_estado_cancelado, id_usuario) {
    const { rowCount } = await pool.query(
      `UPDATE inscripciones
       SET id_inscripcion_estado    = $1,
           id_usuario_modificacion  = $2,
           fecha_hora_modificacion  = NOW()
       WHERE id_inscripcion = $3
         AND id_inscripcion_estado != $4`,
      [id_estado_cancelado, id_usuario, id, id_estado_cancelado]
    );
    return rowCount > 0;
  },

  async aprobar(id, id_estado_aprobado, id_usuario) {
    const { rowCount } = await pool.query(
      `UPDATE inscripciones
       SET id_inscripcion_estado   = $1,
           id_usuario_modificacion = $2,
           fecha_hora_modificacion = NOW()
       WHERE id_inscripcion = $3`,
      [id_estado_aprobado, id_usuario, id]
    );
    return rowCount > 0;
  },
};

module.exports = InscripcionModel;