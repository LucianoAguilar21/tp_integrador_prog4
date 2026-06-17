
const { pool } = require('../config/db');

const CursoEstadoModel = {

  async findAll() {
    const { rows } = await pool.query(
      `SELECT id_curso_estado, descripcion
       FROM cursos_estados
       WHERE es_activo = 1
       ORDER BY id_curso_estado`
    );
    return rows;
  },

  async exists(id) {
    const { rows } = await pool.query(
      `SELECT id_curso_estado FROM cursos_estados WHERE id_curso_estado = $1 AND es_activo = 1`,
      [id]
    );
    return rows.length > 0;
  },

  async getIdActivo() {
    const { rows } = await pool.query(
      `SELECT id_curso_estado FROM cursos_estados
       WHERE descripcion = 'Activo' AND es_activo = 1
       LIMIT 1`
    );
    return rows[0]?.id_curso_estado || null;
  },

  async findByDescripcion(descripcion) {
    const { rows } = await pool.query(
      `SELECT id_curso_estado, descripcion FROM cursos_estados
       WHERE descripcion ILIKE $1 AND es_activo = 1
       LIMIT 1`,
      [descripcion]
    );
    return rows[0] || null;
  },
};

module.exports = CursoEstadoModel;