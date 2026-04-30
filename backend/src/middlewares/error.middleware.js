const errorMiddleware = (err, req, res, next) => {
  // Log completo del error en desarrollo
  if (process.env.NODE_ENV === 'development') {
    console.error('❌ Error:', err);
  } else {
    // En producción solo loguear errores no operacionales
    if (!err.statusCode) {
      console.error('❌ Error inesperado:', err);
    }
  }

  // Determinar código de estado
  const statusCode = err.statusCode || 500;

  // Mensaje seguro para producción (no exponer detalles internos en 500)
  const message =
    statusCode === 500 && process.env.NODE_ENV === 'production'
      ? 'Error interno del servidor'
      : err.message || 'Error interno del servidor';

  return res.status(statusCode).json({
    success: false,
    message,
    // Stack trace solo en desarrollo
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorMiddleware;