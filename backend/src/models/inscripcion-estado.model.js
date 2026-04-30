const { pool } = require('../config/db');

const InscripcionEstadoModel = {

  async findAll() {
    const [rows] = await pool.execute(
      `SELECT id, descripcion
       FROM inscripciones_estados
       WHERE es_activo = 1
       ORDER BY id`
    );
    return rows;
  },

  async exists(id) {
    const [rows] = await pool.execute(
      `SELECT id FROM inscripciones_estados WHERE id = ? AND es_activo = 1`,
      [id]
    );
    return rows.length > 0;
  },

  /**
   * Obtener ID de un estado por nombre exacto
   * @param {string} descripcion  - 'Inscripto' | 'Cancelado' | 'Aprobado'
   */
  async getIdPorDescripcion(descripcion) {
    const [rows] = await pool.execute(
      `SELECT id FROM inscripciones_estados
       WHERE descripcion = ? AND es_activo = 1
       LIMIT 1`,
      [descripcion]
    );
    return rows[0]?.id || null;
  },
};

module.exports = InscripcionEstadoModel;