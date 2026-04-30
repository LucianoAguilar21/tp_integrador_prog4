const jwt = require('jsonwebtoken');
const UsuarioModel = require('../models/usuario.model');

const authMiddleware = async (req, res, next) => {
  try {
    // 1. Extraer token del header
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de autenticación no proporcionado',
      });
    }

    const token = authHeader.split(' ')[1];

    // 2. Verificar y decodificar token
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        issuer: 'facultad-inscripciones',
      });
    } catch (jwtError) {
      const mensaje =
        jwtError.name === 'TokenExpiredError'
          ? 'El token ha expirado'
          : 'Token inválido';
      return res.status(401).json({ success: false, message: mensaje });
    }

    // 3. Verificar que el usuario aún existe en DB (protege ante cuentas eliminadas)
    const usuario = await UsuarioModel.findById(decoded.sub);
    if (!usuario) {
      return res.status(401).json({
        success: false,
        message: 'Usuario no encontrado',
      });
    }

    // 4. Inyectar usuario en la request
    req.usuario = usuario;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = authMiddleware;