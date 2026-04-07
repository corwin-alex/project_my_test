import React, { useState, useEffect, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../App';

function TestList() {
  const [tests, setTests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchTests();
  }, []);

  const fetchTests = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/tests', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки тестов');
      }

      const data = await response.json();
      setTests(data);
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

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>Доступные тесты</h2>
        {user?.role === 'admin' && (
          <Link to="/admin" className="btn btn-primary">
            + Создать тест
          </Link>
        )}
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {tests.length === 0 ? (
        <div className="alert alert-info">
          Тестов пока нет. {user?.role === 'admin' ? 'Создайте первый тест!' : 'Зайдите позже.'}
        </div>
      ) : (
        <div className="row">
          {tests.map((test) => (
            <div key={test.id} className="col-md-6 col-lg-4 mb-4">
              <div className="card test-card h-100">
                <div className="card-body">
                  <h5 className="card-title">{test.title}</h5>
                  {test.description && (
                    <p className="card-text text-muted">{test.description}</p>
                  )}
                  <p className="card-text">
                    <small className="text-muted">
                      Создан: {new Date(test.created_at).toLocaleDateString('ru-RU')}
                    </small>
                  </p>
                  <div className="d-flex justify-content-between">
                    <Link 
                      to={`/tests/${test.id}`} 
                      className="btn btn-outline-primary btn-sm"
                    >
                      Подробнее
                    </Link>
                    {user?.role === 'student' && test.is_active && (
                      <Link 
                        to={`/take-test/${test.id}`} 
                        className="btn btn-primary btn-sm"
                      >
                        Пройти тест
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default TestList;
