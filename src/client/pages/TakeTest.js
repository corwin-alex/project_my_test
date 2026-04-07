import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

function TakeTest() {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [test, setTest] = useState(null);
  const [resultId, setResultId] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    loadTest();
  }, [id]);

  const loadTest = async () => {
    try {
      const token = localStorage.getItem('token');
      
      // Проверяем, есть ли активное тестирование
      const existingResponse = await fetch('/api/results/my-results', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (existingResponse.ok) {
        const results = await existingResponse.json();
        const activeTest = results.find(r => r.test_id == id && r.status === 'in_progress');
        
        if (activeTest) {
          setResultId(activeTest.id);
        }
      }
      
      // Загружаем тест
      const response = await fetch(`/api/tests/${id}`, {
        headers: { 'Authorization': `Bearer ${token}` },
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

  const startTest = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/results/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ test_id: id }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.result_id) {
          setResultId(data.result_id);
        } else {
          throw new Error(data.message);
        }
      } else {
        setResultId(data.id);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  const handleAnswerSelect = (questionId, answerId) => {
    setAnswers(prev => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  const submitTest = async () => {
    if (!resultId) {
      setError('Тестирование не начато');
      return;
    }

    if (!window.confirm('Вы уверены, что хотите завершить тест?')) {
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      // Формируем массив ответов
      const answersArray = Object.entries(answers).map(([questionId, answerId]) => ({
        question_id: parseInt(questionId),
        answer_id: answerId ? parseInt(answerId) : null,
      }));

      const response = await fetch('/api/results/complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          result_id: resultId,
          answers: answersArray,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message);
      }

      setSuccess(true);
      setTestResult(data.result);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
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

  if (success && testResult) {
    const percentage = parseFloat(testResult.percentage);
    let gradeColor = 'danger';
    if (percentage >= 85) gradeColor = 'success';
    else if (percentage >= 70) gradeColor = 'warning';

    return (
      <div className="text-center">
        <h2 className="mb-4">Тестирование завершено!</h2>
        <div className="card mb-4">
          <div className="card-body">
            <h3>Ваш результат:</h3>
            <p className="display-4">
              <span className={`badge bg-${gradeColor}`}>
                {testResult.score} из {testResult.max_score} ({percentage}%)
              </span>
            </p>
          </div>
        </div>
        <button 
          className="btn btn-primary" 
          onClick={() => navigate('/results')}
        >
          Мои результаты
        </button>
      </div>
    );
  }

  if (!test) {
    return <div className="alert alert-warning">Тест не найден</div>;
  }

  if (!resultId) {
    return (
      <div className="text-center">
        <h2>{test.title}</h2>
        <p className="lead mb-4">
          Количество вопросов: {test.questions?.length || 0}
        </p>
        <button className="btn btn-primary btn-lg" onClick={startTest}>
          Начать тестирование
        </button>
      </div>
    );
  }

  return (
    <div>
      <h2 className="mb-4">{test.title}</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      {test.questions && test.questions.map((question, qIndex) => (
        <div key={question.id} className="question-card">
          <h5>
            Вопрос {qIndex + 1}: {question.question_text}
            <span className="badge bg-secondary ms-2">{question.points} балл(а)</span>
          </h5>

          <div className="mt-3">
            {question.answers.map((answer) => (
              <div
                key={answer.id}
                className={`answer-option ${
                  answers[question.id] == answer.id ? 'selected' : ''
                }`}
                onClick={() => handleAnswerSelect(question.id, answer.id)}
              >
                {answer.answer_text}
              </div>
            ))}
          </div>
        </div>
      ))}

      <div className="mt-4 text-center">
        <button 
          className="btn btn-success btn-lg" 
          onClick={submitTest}
          disabled={submitting}
        >
          {submitting ? 'Отправка...' : 'Завершить тест'}
        </button>
      </div>
    </div>
  );
}

export default TakeTest;
