import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

function TestDetail() {
  const { id } = useParams();
  const [test, setTest] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTest();
  }, [id]);

  const fetchTest = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/tests/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки теста');
      }

      const data = await response.json();
      setTest(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
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

  if (error) {
    return <div className="alert alert-danger">{error}</div>;
  }

  if (!test) {
    return <div className="alert alert-warning">Тест не найден</div>;
  }

  return (
    <div>
      <Link to="/tests" className="btn btn-outline-secondary mb-3">
        ← Назад к тестам
      </Link>

      <div className="card mb-4">
        <div className="card-body">
          <h2>{test.title}</h2>
          {test.description && (
            <p className="text-muted">{test.description}</p>
          )}
          <p>
            <strong>Статус:</strong>{' '}
            <span className={test.is_active ? 'text-success' : 'text-danger'}>
              {test.is_active ? 'Активен' : 'Неактивен'}
            </span>
          </p>
          <p>
            <strong>Вопросов:</strong> {test.questions?.length || 0}
          </p>
        </div>
      </div>

      <h3 className="mb-3">Вопросы теста</h3>
      
      {test.questions && test.questions.length > 0 ? (
        test.questions.map((question, index) => (
          <div key={question.id} className="question-card">
            <h5>
              Вопрос {index + 1}: {question.question_text}
              <span className="badge bg-secondary ms-2">{question.points} балл(а)</span>
            </h5>
            
            <div className="mt-3">
              <strong>Варианты ответов:</strong>
              <ul className="list-group mt-2">
                {question.answers.map((answer) => (
                  <li 
                    key={answer.id} 
                    className={`list-group-item ${answer.is_correct ? 'list-group-item-success' : ''}`}
                  >
                    {answer.answer_text}
                    {answer.is_correct && <span className="text-success ms-2">✓ Правильный</span>}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))
      ) : (
        <div className="alert alert-info">В этом тесте пока нет вопросов</div>
      )}
    </div>
  );
}

export default TestDetail;
