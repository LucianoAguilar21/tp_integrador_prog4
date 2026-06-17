

const { pool } = require('../config/db');

const InscripcionEstadoModel = {

  async findAll() {
    const { rows } = await pool.query(
      `SELECT id_inscripcion_estado, descripcion
       FROM inscripciones_estados
       WHERE es_activo = 1
       ORDER BY id_inscripcion_estado`
    );
    return rows;
  },

  async exists(id) {
    const { rows } = await pool.query(
      `SELECT id_inscripcion_estado FROM inscripciones_estados WHERE id_inscripcion_estado = $1 AND es_activo = 1`,
      [id]
    );
    return rows.length > 0;
  },

  async getIdPorDescripcion(descripcion) {
    const { rows } = await pool.query(
      `SELECT id_inscripcion_estado FROM inscripciones_estados
       WHERE descripcion ILIKE $1 AND es_activo = 1
       LIMIT 1`,
      [descripcion]
    );
    return rows[0]?.id_inscripcion_estado || null;
  },
};

module.exports = InscripcionEstadoModel;