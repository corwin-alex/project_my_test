import React, { useState, useEffect } from 'react';

function Results() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/results/my-results', {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Ошибка загрузки результатов');
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getGradeColor = (percentage) => {
    const pct = parseFloat(percentage);
    if (pct >= 85) return 'success';
    if (pct >= 70) return 'warning';
    return 'danger';
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
      <h2 className="mb-4">Мои результаты</h2>

      {error && <div className="alert alert-danger">{error}</div>}

      {results.length === 0 ? (
        <div className="alert alert-info">
          У вас пока нет завершенных тестирований
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-hover">
            <thead className="table-dark">
              <tr>
                <th>Тест</th>
                <th>Дата завершения</th>
                <th>Баллы</th>
                <th>Процент</th>
                <th>Статус</th>
              </tr>
            </thead>
            <tbody>
              {results.map((result) => (
                <tr key={result.id}>
                  <td>{result.test_title}</td>
                  <td>
                    {result.completed_at 
                      ? new Date(result.completed_at).toLocaleDateString('ru-RU') + ' ' + 
                        new Date(result.completed_at).toLocaleTimeString('ru-RU', {hour: '2-digit', minute:'2-digit'})
                      : '-'
                    }
                  </td>
                  <td>
                    {result.score} из {result.max_score}
                  </td>
                  <td>
                    <span className={`badge bg-${getGradeColor(result.percentage)}`}>
                      {result.percentage}%
                    </span>
                  </td>
                  <td>
                    <span className={result.status === 'completed' ? 'text-success' : 'text-warning'}>
                      {result.status === 'completed' ? '✓ Завершен' : '⏳ В процессе'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Results;
