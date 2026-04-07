const jwt = require('jsonwebtoken');
const config = require('../config');

// Middleware для проверки JWT токена
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ message: 'Требуется авторизация' });
  }

  jwt.verify(token, config.jwt.secret, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Неверный или истекший токен' });
    }
    req.user = user;
    next();
  });
}

// Middleware для проверки роли администратора
function isAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Доступ запрещен. Требуются права администратора' });
  }
  next();
}

// Middleware для проверки роли студента
function isStudent(req, res, next) {
  if (!req.user || req.user.role !== 'student') {
    return res.status(403).json({ message: 'Доступ запрещен. Требуются права студента' });
  }
  next();
}

module.exports = { authenticateToken, isAdmin, isStudent };
