const express = require('express');
const path = require('path');
const cors = require('cors');
const config = require('./config');
const { initDatabase } = require('./models/database');

// Импортируем роуты
const authRoutes = require('./routes/auth');
const testRoutes = require('./routes/tests');
const questionRoutes = require('./routes/questions');
const resultRoutes = require('./routes/results');
const adminRoutes = require('./routes/admin');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Раздаем статические файлы из папки public (собранный фронтенд)
app.use(express.static(path.join(__dirname, '../public')));

// API роуты
app.use('/api/auth', authRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/results', resultRoutes);
app.use('/api/admin', adminRoutes);

// Для SPA - все остальные запросы направляем на index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Глобальный обработчик ошибок
app.use((err, req, res, next) => {
  console.error('Ошибка:', err);
  res.status(500).json({ message: 'Внутренняя ошибка сервера' });
});

// Запуск сервера
async function startServer() {
  try {
    // Инициализируем базу данных
    await initDatabase();
    
    const PORT = config.port;
    app.listen(PORT, () => {
      console.log(`Сервер запущен на порту ${PORT}`);
      console.log(`Режим работы: ${config.nodeEnv}`);
    });
  } catch (error) {
    console.error('Не удалось запустить сервер:', error);
    process.exit(1);
  }
}

startServer();

module.exports = app;
