import React, { useState, useEffect } from 'react';

function AdminDashboard() {
  const [tests, setTests] = useState([]);
  const [results, setResults] = useState([]);
  const [activeTab, setActiveTab] = useState('tests');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Для создания теста
  const [newTest, setNewTest] = useState({ title: '', description: '' });
  const [creating, setCreating] = useState(false);
  
  // Для добавления вопроса
  const [selectedTest, setSelectedTest] = useState(null);
  const [newQuestion, setNewQuestion] = useState({
    question_text: '',
    points: 1,
  });
  const [newAnswers, setNewAnswers] = useState([
    { answer_text: '', is_correct: false },
    { answer_text: '', is_correct: false },
  ]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const [testsRes, resultsRes] = await Promise.all([
        fetch('/api/tests', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
        fetch('/api/admin', {
          headers: { 'Authorization': `Bearer ${token}` },
        }),
      ]);

      if (!testsRes.ok || !resultsRes.ok) {
        throw new Error('Ошибка загрузки данных');
      }

      const testsData = await testsRes.json();
      const resultsData = await resultsRes.json();
      
      setTests(testsData);
      setResults(resultsData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const createTest = async (e) => {
    e.preventDefault();
    setCreating(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(newTest),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message);
      }

      setNewTest({ title: '', description: '' });
      loadData();
    } catch (err) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const addQuestion = async (e) => {
    e.preventDefault();
    setError('');

    if (!selectedTest) return;

    try {
      const token = localStorage.getItem('token');
      
      // Создаем вопрос
      const qResponse = await fetch('/api/questions/questions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          test_id: selectedTest,
          ...newQuestion,
        }),
      });

      if (!qResponse.ok) {
        const data = await qResponse.json();
        throw new Error(data.message);
      }

      const questionData = await qResponse.json();

      // Создаем ответы
      for (const answer of newAnswers) {
        if (answer.answer_text.trim()) {
          await fetch('/api/questions/answers', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              question_id: questionData.id,
              ...answer,
            }),
          });
        }
      }

      setNewQuestion({ question_text: '', points: 1 });
      setNewAnswers([
        { answer_text: '', is_correct: false },
        { answer_text: '', is_correct: false },
      ]);
      loadData();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAnswerChange = (index, field, value) => {
    const updated = [...newAnswers];
    updated[index][field] = value;
    
    // Если устанавливаем is_correct в true, сбрасываем остальные
    if (field === 'is_correct' && value === true) {
      updated.forEach((a, i) => {
        if (i !== index) a.is_correct = false;
      });
    }
    
    setNewAnswers(updated);
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Загрузка...</span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4">Панель администратора</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      <ul className="nav nav-tabs mb-4">
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'tests' ? 'active' : ''}`}
            onClick={() => setActiveTab('tests')}
          >
            Тесты
          </button>
        </li>
        <li className="nav-item">
          <button
            className={`nav-link ${activeTab === 'results' ? 'active' : ''}`}
            onClick={() => setActiveTab('results')}
          >
            Результаты студентов
          </button>
        </li>
      </ul>

      {activeTab === 'tests' && (
        <div>
          <div className="card mb-4">
            <div className="card-body">
              <h4>Создать новый тест</h4>
              <form onSubmit={createTest}>
                <div className="mb-3">
                  <label className="form-label">Название теста</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newTest.title}
                    onChange={(e) => setNewTest({...newTest, title: e.target.value})}
                    required
                    disabled={creating}
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Описание</label>
                  <textarea
                    className="form-control"
                    value={newTest.description}
                    onChange={(e) => setNewTest({...newTest, description: e.target.value})}
                    rows="3"
                    disabled={creating}
                  />
                </div>
                <button type="submit" className="btn btn-primary" disabled={creating}>
                  {creating ? 'Создание...' : 'Создать тест'}
                </button>
              </form>
            </div>
          </div>

          <div className="card mb-4">
            <div className="card-body">
              <h4>Добавить вопрос к тесту</h4>
              <form onSubmit={addQuestion}>
                <div className="mb-3">
                  <label className="form-label">Выберите тест</label>
                  <select
                    className="form-select"
                    value={selectedTest || ''}
                    onChange={(e) => setSelectedTest(parseInt(e.target.value))}
                    required
                  >
                    <option value="">-- Выберите тест --</option>
                    {tests.map(t => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-3">
                  <label className="form-label">Текст вопроса</label>
                  <input
                    type="text"
                    className="form-control"
                    value={newQuestion.question_text}
                    onChange={(e) => setNewQuestion({...newQuestion, question_text: e.target.value})}
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="form-label">Баллы за вопрос</label>
                  <input
                    type="number"
                    className="form-control"
                    value={newQuestion.points}
                    onChange={(e) => setNewQuestion({...newQuestion, points: parseInt(e.target.value)})}
                    min="1"
                  />
                </div>
                
                <h5 className="mt-4">Варианты ответов</h5>
                {newAnswers.map((answer, index) => (
                  <div key={index} className="mb-2 d-flex align-items-center">
                    <input
                      type="text"
                      className="form-control me-2"
                      placeholder={`Вариант ${index + 1}`}
                      value={answer.answer_text}
                      onChange={(e) => handleAnswerChange(index, 'answer_text', e.target.value)}
                      required
                    />
                    <div className="form-check">
                      <input
                        type="radio"
                        className="form-check-input"
                        name="correct_answer"
                        checked={answer.is_correct}
                        onChange={(e) => handleAnswerChange(index, 'is_correct', e.target.checked)}
                      />
                      <label className="form-check-label">Правильный</label>
                    </div>
                  </div>
                ))}
                
                <button type="submit" className="btn btn-success mt-3">
                  Добавить вопрос
                </button>
              </form>
            </div>
          </div>

          <h4>Существующие тесты</h4>
          <div className="table-responsive">
            <table className="table table-striped">
              <thead>
                <tr>
                  <th>Название</th>
                  <th>Описание</th>
                  <th>Статус</th>
                  <th>Дата создания</th>
                </tr>
              </thead>
              <tbody>
                {tests.map(test => (
                  <tr key={test.id}>
                    <td>{test.title}</td>
                    <td>{test.description || '-'}</td>
                    <td>
                      <span className={test.is_active ? 'text-success' : 'text-danger'}>
                        {test.is_active ? 'Активен' : 'Неактивен'}
                      </span>
                    </td>
                    <td>{new Date(test.created_at).toLocaleDateString('ru-RU')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'results' && (
        <div>
          <h4>Результаты всех студентов</h4>
          <div className="table-responsive">
            <table className="table table-striped table-hover">
              <thead className="table-dark">
                <tr>
                  <th>Студент</th>
                  <th>Тест</th>
                  <th>Баллы</th>
                  <th>Процент</th>
                  <th>Дата завершения</th>
                </tr>
              </thead>
              <tbody>
                {results.map(result => (
                  <tr key={result.id}>
                    <td>{result.student_name}</td>
                    <td>{result.test_title}</td>
                    <td>{result.score} из {result.max_score}</td>
                    <td>
                      <span className={`badge bg-${
                        parseFloat(result.percentage) >= 85 ? 'success' : 
                        parseFloat(result.percentage) >= 70 ? 'warning' : 'danger'
                      }`}>
                        {result.percentage}%
                      </span>
                    </td>
                    <td>
                      {result.completed_at 
                        ? new Date(result.completed_at).toLocaleDateString('ru-RU')
                        : '-'
                      }
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
