// const bcrypt = require('bcrypt');
// const jwt = require('jsonwebtoken');
// const UsuarioModel = require('../models/usuario.model');

// const AuthService = {
//   /**
//    * Autentica un usuario y devuelve token JWT
//    * @param {string} nombre_usuario
//    * @param {string} contrasena - contraseña en texto plano
//    * @returns {{ token: string, usuario: Object }}
//    * @throws {Error} si credenciales inválidas
//    */
  
//   // async login(nombre_usuario, contrasena) {
//   async login(nombre_usuario, contrasena) {
//     console.log('hash de contraseña recibido en login:', await bcrypt.hash(contrasena, 12)); // Debug: Verificar contraseña recibida
//     // 1. Buscar usuario (incluye hash para comparar)
//     const usuario = await UsuarioModel.findByUsername(nombre_usuario);
//     console.log('Usuario encontrado:', usuario); // Debug: Verificar resultado de la consulta
//     // 2. Usar el mismo mensaje genérico para no revelar si el usuario existe
//     const ERROR_CREDENCIALES = 'Credenciales inválidas';

//     if (!usuario) {
//       // Ejecutar bcrypt igualmente para evitar timing attacks
//       await bcrypt.compare(contrasena, usuario.contrasena);
//       throw Object.assign(new Error(ERROR_CREDENCIALES), { statusCode: 401 });
//     }

//     // 3. Verificar contraseña
//     const contrasenaValida = await bcrypt.compare(contrasena, usuario.contraseña);
//     if (!contrasenaValida) {
//       throw Object.assign(new Error(ERROR_CREDENCIALES), { statusCode: 401 });
//     }

//     // 4. Construir payload del token (sin datos sensibles)
//     const payload = {
//       sub: usuario.id,
//       nombre_usuario: usuario.nombre_usuario,
//       nombre: usuario.nombre,
//       apellido: usuario.apellido,
//     };

//     // 5. Firmar token
//     const token = jwt.sign(payload, process.env.JWT_SECRET, {
//       expiresIn: process.env.JWT_EXPIRES_IN || '8h',
//       issuer: 'facultad-inscripciones',
//     });

//     // 6. Devolver token y datos públicos del usuario (sin hash)
//     const { contraseña: _omitido, ...usuarioPublico } = usuario;
//     return { token, usuario: usuarioPublico };
//   },

//   /**
//    * Registra un nuevo usuario (uso interno / admin)
//    * @param {Object} data - { apellido, nombre, nombre_usuario, contrasena }
//    * @returns {{ id: number, nombre_usuario: string }}
//    * @throws {Error} si el nombre_usuario ya existe
//    */
//   async registrar({ apellido, nombre, nombre_usuario, contrasena }) {
//     const yaExiste = await UsuarioModel.existsByUsername(nombre_usuario);
//     if (yaExiste) {
//       throw Object.assign(
//         new Error(`El nombre de usuario '${nombre_usuario}' ya está en uso`),
//         { statusCode: 409 }
//       );
//     }

//     const saltRounds = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;
//     const contrasena_hash = await bcrypt.hash(contrasena, saltRounds);

//     const id = await UsuarioModel.create({
//       apellido,
//       nombre,
//       nombre_usuario,
//       contrasena_hash,
//     });

//     return { id, nombre_usuario };
//   },
// };

// module.exports = AuthService;


const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/usuario.model');

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;

// Hash fijo (no corresponde a ningún usuario real), generado una sola vez al
// iniciar el servidor con el mismo costo que los hashes reales. Se usa para
// que comparar contra un usuario inexistente tarde lo mismo que comparar
// contra uno real, evitando que el tiempo de respuesta delate si el
// nombre_usuario existe o no.
const HASH_DUMMY = bcrypt.hashSync('usuario_no_existe', SALT_ROUNDS);

const AuthService = {
  /**
   * Autentica un usuario y devuelve token JWT
   * @param {string} nombre_usuario
   * @param {string} contrasena - contraseña en texto plano
   * @returns {{ token: string, usuario: Object }}
   * @throws {Error} si credenciales inválidas
   */
  async login(nombre_usuario, contrasena) {
    const usuario = await UsuarioModel.findByUsername(nombre_usuario);
    const ERROR_CREDENCIALES = 'Credenciales inválidas';

    if (!usuario) {
      await bcrypt.compare(contrasena, HASH_DUMMY);
      throw Object.assign(new Error(ERROR_CREDENCIALES), { statusCode: 401 });
    }
    // let contrasenia_hash = await bcrypt.hash(contrasena, SALT_ROUNDS);
    // console.log('Hash de contraseña recibido en login:', contrasenia_hash); //  Verificar contraseña recibida
    const contrasenaValida = await bcrypt.compare(contrasena, usuario.contrasenia);
    if (!contrasenaValida) {
      throw Object.assign(new Error(ERROR_CREDENCIALES), { statusCode: 401 });
    }

    const payload = {
      sub: usuario.id_usuario,
      nombre_usuario: usuario.nombre_usuario,
      nombre: usuario.nombre,
      apellido: usuario.apellido,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
      issuer: 'facultad-inscripciones',
    });

    const { contrasenia: _omitido, ...usuarioPublico } = usuario;
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

    const contrasena_hash = await bcrypt.hash(contrasena, SALT_ROUNDS);

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