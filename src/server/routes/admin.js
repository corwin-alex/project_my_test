const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Получить все результаты тестирований (только админ)
router.get('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT tr.*, t.title as test_title, u.username as student_name 
       FROM test_results tr 
       JOIN tests t ON tr.test_id = t.id 
       JOIN users u ON tr.user_id = u.id 
       ORDER BY tr.completed_at DESC`
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения результатов:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить детализацию по конкретному результату
router.get('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Получаем основную информацию
    const resultInfo = await pool.query(
      `SELECT tr.*, t.title as test_title, u.username as student_name 
       FROM test_results tr 
       JOIN tests t ON tr.test_id = t.id 
       JOIN users u ON tr.user_id = u.id 
       WHERE tr.id = $1`,
      [id]
    );
    
    if (resultInfo.rows.length === 0) {
      return res.status(404).json({ message: 'Результат не найден' });
    }
    
    // Получаем ответы пользователя
    const userAnswers = await pool.query(
      `SELECT ua.*, q.question_text, a.answer_text as user_answer, 
              correct_a.answer_text as correct_answer, q.points
       FROM user_answers ua
       JOIN questions q ON ua.question_id = q.id
       LEFT JOIN answers a ON ua.answer_id = a.id
       LEFT JOIN answers correct_a ON correct_a.question_id = q.id AND correct_a.is_correct = TRUE
       WHERE ua.result_id = $1`,
      [id]
    );
    
    res.json({
      ...resultInfo.rows[0],
      answers: userAnswers.rows,
    });
  } catch (error) {
    console.error('Ошибка получения детализации:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;
