require('dotenv').config();

module.exports = {
  // Порт сервера
  port: process.env.PORT || 3000,
  
  // Настройки базы данных
  db: {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'online_testing',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || '',
  },
  
  // JWT настройки
  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret_change_in_production',
    expire: process.env.JWT_EXPIRE || '1d',
  },
  
  // Режим работы
  nodeEnv: process.env.NODE_ENV || 'development',
};
