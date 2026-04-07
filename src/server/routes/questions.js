const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Добавить вопрос к тесту (только админ)
router.post('/questions', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { test_id, question_text, question_type, points, order_num } = req.body;
    
    if (!test_id || !question_text) {
      return res.status(400).json({ message: 'test_id и question_text обязательны' });
    }
    
    const result = await pool.query(
      `INSERT INTO questions (test_id, question_text, question_type, points, order_num) 
       VALUES ($1, $2, $3, $4, $5) RETURNING *`,
      [test_id, question_text, question_type || 'single', points || 1, order_num || 0]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка создания вопроса:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Добавить вариант ответа к вопросу (только админ)
router.post('/answers', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { question_id, answer_text, is_correct, order_num } = req.body;
    
    if (!question_id || !answer_text) {
      return res.status(400).json({ message: 'question_id и answer_text обязательны' });
    }
    
    const result = await pool.query(
      `INSERT INTO answers (question_id, answer_text, is_correct, order_num) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [question_id, answer_text, is_correct || false, order_num || 0]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка создания ответа:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;
