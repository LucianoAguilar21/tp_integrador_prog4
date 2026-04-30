const { pool } = require('../config/db');

const CursoEstadoModel = {

  /**
   * Obtener todos los estados activos
   */
  async findAll() {
    const [rows] = await pool.execute(
      `SELECT id, descripcion
       FROM cursos_estados
       WHERE es_activo = 1
       ORDER BY id`
    );
    return rows;
  },

  /**
   * Verificar si un estado existe y está activo
   */
  async exists(id) {
    const [rows] = await pool.execute(
      `SELECT id FROM cursos_estados WHERE id = ? AND es_activo = 1`,
      [id]
    );
    return rows.length > 0;
  },

  /**
   * Obtener ID del estado "Activo" (para validaciones de inscripción)
   */
  async getIdActivo() {
    const [rows] = await pool.execute(
      `SELECT id FROM cursos_estados
       WHERE descripcion = 'Activo' AND es_activo = 1
       LIMIT 1`
    );
    return rows[0]?.id || null;
  },
};

module.exports = CursoEstadoModel;