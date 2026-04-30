const { pool } = require('../config/db');

const UsuarioModel = {
  /**
   * Busca un usuario por nombre_usuario (para login)
   * @param {string} nombre_usuario
   * @returns {Object|null} usuario con hash de contraseña incluido
   */
  async findByUsername(nombre_usuario) {
    const [rows] = await pool.execute(
      `SELECT id, apellido, nombre, nombre_usuario, contraseña
       FROM usuarios
       WHERE nombre_usuario = ?
       LIMIT 1`,
      [nombre_usuario]
    );
    return rows[0] || null;
  },

  /**
   * Busca un usuario por ID (para middleware de auth)
   * @param {number} id
   * @returns {Object|null} usuario sin contraseña
   */
  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT id, apellido, nombre, nombre_usuario
       FROM usuarios
       WHERE id = ?
       LIMIT 1`,
      [id]
    );
    return rows[0] || null;
  },

  /**
   * Crea un nuevo usuario con contraseña hasheada
   * @param {Object} data - { apellido, nombre, nombre_usuario, contraseña_hash }
   * @returns {number} ID del usuario creado
   */
  async create({ apellido, nombre, nombre_usuario, contrasena_hash }) {
    const [result] = await pool.execute(
      `INSERT INTO usuarios (apellido, nombre, nombre_usuario, contraseña)
       VALUES (?, ?, ?, ?)`,
      [apellido, nombre, nombre_usuario, contrasena_hash]
    );
    return result.insertId;
  },

  /**
   * Verifica si un nombre_usuario ya existe
   * @param {string} nombre_usuario
   * @returns {boolean}
   */
  async existsByUsername(nombre_usuario) {
    const [rows] = await pool.execute(
      `SELECT id FROM usuarios WHERE nombre_usuario = ? LIMIT 1`,
      [nombre_usuario]
    );
    return rows.length > 0;
  },
};

module.exports = UsuarioModel;