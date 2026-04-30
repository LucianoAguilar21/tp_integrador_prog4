const { pool } = require('../config/db');

const DashboardModel = {

  async getMetricas() {
    // ── Totales generales ─────────────────────────────────────────────────────
    const [totales] = await pool.execute(
      `SELECT
         (SELECT COUNT(*) FROM estudiantes WHERE activo = 1)
           AS total_estudiantes,
         (SELECT COUNT(*) FROM estudiantes WHERE activo = 0)
           AS total_estudiantes_inactivos,
         (SELECT COUNT(*) FROM cursos)
           AS total_cursos,
         (SELECT COUNT(*) FROM cursos c
          INNER JOIN cursos_estados ce ON ce.id = c.id_curso_estado
          WHERE ce.descripcion = 'Activo')
           AS cursos_activos,
         (SELECT COUNT(*) FROM cursos c
          INNER JOIN cursos_estados ce ON ce.id = c.id_curso_estado
          WHERE ce.descripcion = 'Finalizado')
           AS cursos_finalizados,
         (SELECT COUNT(*) FROM inscripciones)
           AS total_inscripciones,
         (SELECT COUNT(*) FROM inscripciones i
          INNER JOIN inscripciones_estados ie ON ie.id = i.id_inscripcion_estado
          WHERE ie.descripcion = 'Inscripto')
           AS inscripciones_activas,
         (SELECT COUNT(*) FROM inscripciones i
          INNER JOIN inscripciones_estados ie ON ie.id = i.id_inscripcion_estado
          WHERE ie.descripcion = 'Aprobado')
           AS inscripciones_aprobadas,
         (SELECT COUNT(*) FROM inscripciones i
          INNER JOIN inscripciones_estados ie ON ie.id = i.id_inscripcion_estado
          WHERE ie.descripcion = 'Cancelado')
           AS inscripciones_canceladas`
    );

    // ── Cursos activos con cupo ───────────────────────────────────────────────
    const [cursosActivos] = await pool.execute(
      `SELECT
         c.id,
         c.nombre,
         c.fecha_inicio,
         c.cantidad_horas,
         c.inscriptos_max,
         COUNT(i.id)                              AS inscriptos_actuales,
         (c.inscriptos_max - COUNT(i.id))         AS cupo_disponible,
         ROUND(COUNT(i.id) / c.inscriptos_max * 100, 1) AS porcentaje_ocupacion
       FROM cursos c
       INNER JOIN cursos_estados ce ON ce.id = c.id_curso_estado
                                    AND ce.descripcion = 'Activo'
       LEFT JOIN inscripciones i    ON i.id_curso = c.id
                                    AND i.id_inscripcion_estado = (
                                      SELECT id FROM inscripciones_estados
                                      WHERE descripcion = 'Inscripto' LIMIT 1
                                    )
       GROUP BY c.id
       ORDER BY c.fecha_inicio ASC`
    );

    // ── Últimas inscripciones (actividad reciente) ────────────────────────────
    const [ultimasInscripciones] = await pool.execute(
      `SELECT
         i.id,
         CONCAT(e.apellido, ', ', e.nombre) AS estudiante,
         c.nombre                           AS curso,
         i.fecha_hora_inscripcion,
         ie.descripcion                     AS estado
       FROM inscripciones i
       INNER JOIN estudiantes          e  ON e.id  = i.id_estudiante
       INNER JOIN cursos               c  ON c.id  = i.id_curso
       INNER JOIN inscripciones_estados ie ON ie.id = i.id_inscripcion_estado
       ORDER BY i.fecha_hora_inscripcion DESC
       LIMIT 10`
    );

    return {
      totales:              totales[0],
      cursos_activos:       cursosActivos,
      ultimas_inscripciones: ultimasInscripciones,
    };
  },
};

module.exports = DashboardModel;