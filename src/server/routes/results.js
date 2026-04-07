const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isStudent } = require('../middleware/auth');

// Начать тестирование
router.post('/start', authenticateToken, isStudent, async (req, res) => {
  try {
    const { test_id } = req.body;
    
    if (!test_id) {
      return res.status(400).json({ message: 'test_id обязателен' });
    }
    
    // Проверяем, есть ли уже активное тестирование
    const existingResult = await pool.query(
      'SELECT id FROM test_results WHERE test_id = $1 AND user_id = $2 AND status = $3',
      [test_id, req.user.id, 'in_progress']
    );
    
    if (existingResult.rows.length > 0) {
      return res.status(400).json({ 
        message: 'У вас уже есть активное тестирование по этому тесту',
        result_id: existingResult.rows[0].id
      });
    }
    
    // Получаем максимальный балл теста
    const maxScoreResult = await pool.query(
      'SELECT COALESCE(SUM(points), 0) as max_score FROM questions WHERE test_id = $1',
      [test_id]
    );
    
    const max_score = parseInt(maxScoreResult.rows[0].max_score);
    
    // Создаем запись о результате
    const result = await pool.query(
      `INSERT INTO test_results (test_id, user_id, max_score, status) 
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [test_id, req.user.id, max_score, 'in_progress']
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка начала тестирования:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Завершить тестирование и автоматическая оценка
router.post('/complete', authenticateToken, isStudent, async (req, res) => {
  try {
    const { result_id, answers } = req.body;
    
    if (!result_id || !answers) {
      return res.status(400).json({ message: 'result_id и answers обязательны' });
    }
    
    // Получаем информацию о тестировании
    const resultInfo = await pool.query(
      'SELECT * FROM test_results WHERE id = $1 AND user_id = $2',
      [result_id, req.user.id]
    );
    
    if (resultInfo.rows.length === 0) {
      return res.status(404).json({ message: 'Тестирование не найдено' });
    }
    
    const testResult = resultInfo.rows[0];
    
    if (testResult.status === 'completed') {
      return res.status(400).json({ message: 'Тестирование уже завершено' });
    }
    
    let score = 0;
    
    // Обрабатываем каждый ответ
    for (const answer of answers) {
      const { question_id, answer_id } = answer;
      
      // Сохраняем ответ пользователя
      await pool.query(
        'INSERT INTO user_answers (result_id, question_id, answer_id) VALUES ($1, $2, $3)',
        [result_id, question_id, answer_id || null]
      );
      
      // Проверяем правильность ответа
      if (answer_id) {
        const correctAnswer = await pool.query(
          'SELECT q.points FROM answers a JOIN questions q ON a.question_id = q.id WHERE a.id = $1 AND a.is_correct = TRUE',
          [answer_id]
        );
        
        if (correctAnswer.rows.length > 0) {
          score += parseInt(correctAnswer.rows[0].points);
        }
      }
    }
    
    // Вычисляем процент
    const percentage = testResult.max_score > 0 
      ? ((score / testResult.max_score) * 100).toFixed(2) 
      : 0;
    
    // Обновляем результат тестирования
    const updatedResult = await pool.query(
      `UPDATE test_results 
       SET score = $1, percentage = $2, status = $3, completed_at = CURRENT_TIMESTAMP 
       WHERE id = $4 RETURNING *`,
      [score, percentage, 'completed', result_id]
    );
    
    res.json({
      message: 'Тестирование завершено',
      result: updatedResult.rows[0],
    });
  } catch (error) {
    console.error('Ошибка завершения тестирования:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить результаты студента
router.get('/my-results', authenticateToken, isStudent, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT tr.*, t.title as test_title 
       FROM test_results tr 
       JOIN tests t ON tr.test_id = t.id 
       WHERE tr.user_id = $1 
       ORDER BY tr.completed_at DESC`,
      [req.user.id]
    );
    
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения результатов:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить все результаты (только для админа - будет в другом роуте)
module.exports = router;
