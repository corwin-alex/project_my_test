const pool = require('../db');

// SQL-запрос для создания таблицы пользователей
const createUsersTable = `
  CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'student')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

// SQL-запрос для создания таблицы тестов
const createTestsTable = `
  CREATE TABLE IF NOT EXISTS tests (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    is_active BOOLEAN DEFAULT TRUE
  );
`;

// SQL-запрос для создания таблицы вопросов
const createQuestionsTable = `
  CREATE TABLE IF NOT EXISTS questions (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) DEFAULT 'single',
    points INTEGER DEFAULT 1,
    order_num INTEGER DEFAULT 0
  );
`;

// SQL-запрос для создания таблицы вариантов ответов
const createAnswersTable = `
  CREATE TABLE IF NOT EXISTS answers (
    id SERIAL PRIMARY KEY,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    answer_text TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    order_num INTEGER DEFAULT 0
  );
`;

// SQL-запрос для создания таблицы результатов тестирования
const createResultsTable = `
  CREATE TABLE IF NOT EXISTS test_results (
    id SERIAL PRIMARY KEY,
    test_id INTEGER REFERENCES tests(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    score INTEGER DEFAULT 0,
    max_score INTEGER DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(20) DEFAULT 'in_progress'
  );
`;

// SQL-запрос для создания таблицы ответов пользователя
const createUserAnswersTable = `
  CREATE TABLE IF NOT EXISTS user_answers (
    id SERIAL PRIMARY KEY,
    result_id INTEGER REFERENCES test_results(id) ON DELETE CASCADE,
    question_id INTEGER REFERENCES questions(id) ON DELETE CASCADE,
    answer_id INTEGER REFERENCES answers(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
`;

// Функция инициализации базы данных
async function initDatabase() {
  try {
    console.log('Инициализация базы данных...');
    
    await pool.query(createUsersTable);
    console.log('Таблица users создана');
    
    await pool.query(createTestsTable);
    console.log('Таблица tests создана');
    
    await pool.query(createQuestionsTable);
    console.log('Таблица questions создана');
    
    await pool.query(createAnswersTable);
    console.log('Таблица answers создана');
    
    await pool.query(createResultsTable);
    console.log('Таблица test_results создана');
    
    await pool.query(createUserAnswersTable);
    console.log('Таблица user_answers создана');
    
    // Создаем админа по умолчанию если его нет
    const bcrypt = require('bcryptjs');
    const adminExists = await pool.query(
      'SELECT id FROM users WHERE role = $1',
      ['admin']
    );
    
    if (adminExists.rows.length === 0) {
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await pool.query(
        'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)',
        ['admin', 'admin@example.com', hashedPassword, 'admin']
      );
      console.log('Пользователь admin создан (пароль: admin123)');
    }
    
    console.log('База данных успешно инициализирована');
  } catch (error) {
    console.error('Ошибка инициализации базы данных:', error);
    throw error;
  }
}

module.exports = { initDatabase };
