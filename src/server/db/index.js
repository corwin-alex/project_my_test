const { Pool } = require('pg');
const config = require('../config');

// Создаем пул подключений к базе данных
const pool = new Pool({
  host: config.db.host,
  port: config.db.port,
  database: config.db.database,
  user: config.db.user,
  password: config.db.password,
  max: 20, // Максимальное количество подключений в пуле
  idleTimeoutMillis: 30000, // Время простоя подключения
  connectionTimeoutMillis: 2000, // Таймаут подключения
});

// Проверка подключения при старте
pool.on('connect', () => {
  console.log('Подключение к базе данных установлено');
});

pool.on('error', (err) => {
  console.error('Ошибка подключения к базе данных:', err);
});

module.exports = pool;
