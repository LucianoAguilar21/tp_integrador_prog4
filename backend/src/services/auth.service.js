const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/usuario.model');

const AuthService = {
  /**
   * Autentica un usuario y devuelve token JWT
   * @param {string} nombre_usuario
   * @param {string} contrasena - contraseña en texto plano
   * @returns {{ token: string, usuario: Object }}
   * @throws {Error} si credenciales inválidas
   */
  async login(nombre_usuario, contrasena) {
    // 1. Buscar usuario (incluye hash para comparar)
    const usuario = await UsuarioModel.findByUsername(nombre_usuario);

    // 2. Usar el mismo mensaje genérico para no revelar si el usuario existe
    const ERROR_CREDENCIALES = 'Credenciales inválidas';

    if (!usuario) {
      // Ejecutar bcrypt igualmente para evitar timing attacks
      await bcrypt.compare(contrasena, '$2b$12$invalidhashtopreventtimingattack');
      throw Object.assign(new Error(ERROR_CREDENCIALES), { statusCode: 401 });
    }

    // 3. Verificar contraseña
    const contrasenaValida = await bcrypt.compare(contrasena, usuario.contraseña);
    if (!contrasenaValida) {
      throw Object.assign(new Error(ERROR_CREDENCIALES), { statusCode: 401 });
    }

    // 4. Construir payload del token (sin datos sensibles)
    const payload = {
      sub: usuario.id,
      nombre_usuario: usuario.nombre_usuario,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
    };

    // 5. Firmar token
    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
      issuer: 'facultad-inscripciones',
    });

    // 6. Devolver token y datos públicos del usuario (sin hash)
    const { contraseña: _omitido, ...usuarioPublico } = usuario;
    return { token, usuario: usuarioPublico };
  },

  /**
   * Registra un nuevo usuario (uso interno / admin)
   * @param {Object} data - { apellido, nombre, nombre_usuario, contrasena }
   * @returns {{ id: number, nombre_usuario: string }}
   * @throws {Error} si el nombre_usuario ya existe
   */
  async registrar({ apellido, nombre, nombre_usuario, contrasena }) {
    const yaExiste = await UsuarioModel.existsByUsername(nombre_usuario);
    if (yaExiste) {
      throw Object.assign(
        new Error(`El nombre de usuario '${nombre_usuario}' ya está en uso`),
        { statusCode: 409 }
      );
    }

    const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
    const contrasena_hash = await bcrypt.hash(contrasena, saltRounds);

    const id = await UsuarioModel.create({
      apellido,
      nombre,
      nombre_usuario,
      contrasena_hash,
    });

    return { id, nombre_usuario };
  },
};

module.exports = AuthService;