const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+00:00',
});

// Verificación de conexión al iniciar
const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log(`Base de datos conectada: ${process.env.DB_NAME}`);
    connection.release();
  } catch (error) {
    console.error(' Error al conectar con la base de datos:', error.message);
    process.exit(1); // Falla rápido si no hay DB
  }
};

module.exports = { pool, testConnection };