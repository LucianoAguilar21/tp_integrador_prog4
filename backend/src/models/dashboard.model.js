
const { pool } = require('../config/db');

const DashboardModel = {

  async getMetricas() {
    const { rows: totales } = await pool.query(
      `SELECT
         (SELECT COUNT(*) FROM estudiantes WHERE activo = 1)::int
           AS total_estudiantes,
         (SELECT COUNT(*) FROM estudiantes WHERE activo = 0)::int
           AS total_estudiantes_inactivos,
         (SELECT COUNT(*) FROM cursos)
           AS total_cursos,
         (SELECT COUNT(*) FROM cursos c
          INNER JOIN cursos_estados ce ON ce.id_curso_estado = c.id_curso_estado
          WHERE ce.descripcion = 'INSCRIPCIÓN ABIERTA')::int
           AS cursos_activos,
         (SELECT COUNT(*) FROM cursos c
          INNER JOIN cursos_estados ce ON ce.id_curso_estado = c.id_curso_estado
          WHERE ce.descripcion = 'Finalizado')::int
           AS cursos_finalizados,
         (SELECT COUNT(*) FROM inscripciones)::int
           AS total_inscripciones,
         (SELECT COUNT(*) FROM inscripciones i
          INNER JOIN inscripciones_estados ie ON ie.id_inscripcion_estado = i.id_inscripcion_estado
          WHERE ie.descripcion ILIKE 'CONFIRMADA'
            AND ie.es_activo = 1)::int
           AS inscripciones_activas,
         (SELECT COUNT(*) FROM inscripciones i
          INNER JOIN inscripciones_estados ie ON ie.id_inscripcion_estado = i.id_inscripcion_estado
          WHERE ie.descripcion ILIKE 'CONFIRMADA'
            AND ie.es_activo = 1)::int
           AS inscripciones_aprobadas,
         (SELECT COUNT(*) FROM inscripciones i
          INNER JOIN inscripciones_estados ie ON ie.id_inscripcion_estado = i.id_inscripcion_estado
          WHERE ie.descripcion = 'CANCELADA')::int
           AS inscripciones_canceladas`
    );

    const { rows: cursosActivos } = await pool.query(
      `SELECT
         c.id_curso,
         c.nombre,
         c.fecha_inicio,
         c.cantidad_horas,
         c.inscriptos_max,
         COUNT(i.id_inscripcion)::int                                       AS inscriptos_actuales,
         (c.inscriptos_max - COUNT(i.id_inscripcion)::int)                  AS cupo_disponible,
         ROUND(COUNT(i.id_inscripcion)::numeric / c.inscriptos_max * 100, 1) AS porcentaje_ocupacion
       FROM cursos c
       INNER JOIN cursos_estados ce ON ce.id_curso_estado = c.id_curso_estado
                                    AND ce.descripcion = 'INSCRIPCIÓN ABIERTA'
       LEFT JOIN inscripciones i    ON i.id_curso = c.id_curso
                                    AND i.id_inscripcion_estado = (
                                      SELECT id_inscripcion_estado FROM inscripciones_estados
                                      WHERE descripcion = 'CONFIRMADA' LIMIT 1
                                    )
       GROUP BY c.id_curso
       ORDER BY c.fecha_inicio ASC`
    );

    const { rows: ultimasInscripciones } = await pool.query(
      `SELECT
         i.id_inscripcion,
         CONCAT(e.apellido, ', ', e.nombres) AS estudiante,
         c.nombre                           AS curso,
         i.fecha_hora_inscripcion,
         ie.descripcion                     AS estado
       FROM inscripciones i
       INNER JOIN estudiantes          e  ON e.id_estudiante = i.id_estudiante
       INNER JOIN cursos               c  ON c.id_curso = i.id_curso
       INNER JOIN inscripciones_estados ie ON ie.id_inscripcion_estado = i.id_inscripcion_estado
       ORDER BY i.fecha_hora_inscripcion DESC
       LIMIT 10`
    );

    return {
      totales:               totales[0],
      cursos_activos:        cursosActivos,
      ultimas_inscripciones: ultimasInscripciones,
    };
  },
};

module.exports = DashboardModel;