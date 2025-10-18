// backend/db.js

const { Pool } = require('pg');
require('dotenv').config();

// 1. Cria uma nova instância do Pool de conexões usando as variáveis de ambiente
const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

// 2. Exporta um objeto com um método 'query'.
//    Qualquer arquivo que importar 'db.js' poderá usar este método
//    para se comunicar com o banco de dados de forma segura e eficiente.
module.exports = {
  query: (text, params) => pool.query(text, params),
};