const express = require('express');
const router = express.Router();
const pool = require('../db');
const { authenticateToken, isAdmin } = require('../middleware/auth');

// Получить все тесты (доступно всем авторизованным)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT t.*, u.username as creator_name FROM tests t LEFT JOIN users u ON t.created_by = u.id ORDER BY t.created_at DESC'
    );
    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения тестов:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Получить один тест с вопросами и ответами
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Получаем информацию о тесте
    const testResult = await pool.query(
      'SELECT * FROM tests WHERE id = $1',
      [id]
    );
    
    if (testResult.rows.length === 0) {
      return res.status(404).json({ message: 'Тест не найден' });
    }
    
    const test = testResult.rows[0];
    
    // Если это админ - показываем правильные ответы, если студент во время теста - скрываем
    const showCorrectAnswers = req.user.role === 'admin';
    
    // Получаем вопросы
    const questionsResult = await pool.query(
      'SELECT * FROM questions WHERE test_id = $1 ORDER BY order_num',
      [id]
    );
    
    const questions = questionsResult.rows;
    
    // Для каждого вопроса получаем ответы
    for (let question of questions) {
      const answersResult = await pool.query(
        'SELECT id, answer_text, is_correct, order_num FROM answers WHERE question_id = $1 ORDER BY order_num',
        [question.id]
      );
      
      // Если не админ, скрываем поле is_correct
      if (!showCorrectAnswers) {
        question.answers = answersResult.rows.map(a => ({
          id: a.id,
          answer_text: a.answer_text,
          order_num: a.order_num,
        }));
      } else {
        question.answers = answersResult.rows;
      }
    }
    
    res.json({ ...test, questions });
  } catch (error) {
    console.error('Ошибка получения теста:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Создать тест (только админ)
router.post('/', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { title, description } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'Название теста обязательно' });
    }
    
    const result = await pool.query(
      'INSERT INTO tests (title, description, created_by) VALUES ($1, $2, $3) RETURNING *',
      [title, description, req.user.id]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка создания теста:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Обновить тест (только админ)
router.put('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, is_active } = req.body;
    
    const result = await pool.query(
      'UPDATE tests SET title = COALESCE($1, title), description = COALESCE($2, description), is_active = COALESCE($3, is_active) WHERE id = $4 RETURNING *',
      [title, description, is_active, id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Тест не найден' });
    }
    
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Ошибка обновления теста:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

// Удалить тест (только админ)
router.delete('/:id', authenticateToken, isAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await pool.query('DELETE FROM tests WHERE id = $1 RETURNING *', [id]);
    
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Тест не найден' });
    }
    
    res.json({ message: 'Тест удален' });
  } catch (error) {
    console.error('Ошибка удаления теста:', error);
    res.status(500).json({ message: 'Ошибка сервера' });
  }
});

module.exports = router;
