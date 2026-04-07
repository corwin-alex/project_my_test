import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import TestList from './pages/TestList';
import TestDetail from './pages/TestDetail';
import TakeTest from './pages/TakeTest';
import Results from './pages/Results';
import AdminDashboard from './pages/AdminDashboard';

// Контекст авторизации
export const AuthContext = React.createContext(null);

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Проверяем наличие токена при загрузке
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userData = localStorage.getItem('user');
    
    if (token && userData) {
      setUser(JSON.parse(userData));
    }
    setLoading(false);
  }, []);

  // Функция входа
  const login = (userData, token) => {
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  };

  // Функция выхода
  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
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
    <AuthContext.Provider value={{ user, login, logout }}>
      <Router>
        <div className="app-container">
          <Navbar />
          <div className="main-content container">
            <Routes>
              <Route path="/" element={<Navigate to="/tests" replace />} />
              <Route path="/login" element={user ? <Navigate to="/tests" /> : <Login />} />
              <Route path="/register" element={user ? <Navigate to="/tests" /> : <Register />} />
              <Route path="/tests" element={<TestList />} />
              <Route path="/tests/:id" element={<TestDetail />} />
              <Route path="/take-test/:id" element={user?.role === 'student' ? <TakeTest /> : <Navigate to="/tests" />} />
              <Route path="/results" element={user?.role === 'student' ? <Results /> : <Navigate to="/tests" />} />
              <Route path="/admin" element={user?.role === 'admin' ? <AdminDashboard /> : <Navigate to="/tests" />} />
            </Routes>
          </div>
        </div>
      </Router>
    </AuthContext.Provider>
  );
}

export default App;
