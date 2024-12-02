import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import Perfil from './components/Perfil';
import axios from 'axios';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsAuthenticated(false); 
        setLoading(false);
        console.log("No hay token. Usuario no autenticado.");
        return;
      }
  
      try {
        const response = await axios.get('http://localhost:5000/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });
  
        
        if (response.status === 200) {
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
        }
      } catch (err) {
        console.error("Error al verificar la autenticación:", err.message);
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div>Cargando...</div>; 
  }

  return (
    <Router>
      <Routes>
        <Route
          path="/login"
          element={<Login setIsAuthenticated={setIsAuthenticated} />}
        />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
        <Route path="/perfil" element={isAuthenticated ? <Perfil /> : <Navigate to="/login" />} />
        <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;
