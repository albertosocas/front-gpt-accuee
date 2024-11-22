import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Login from './components/Login';
import Register from './components/Register';
import Home from './components/Home';
import Perfil from './components/Perfil';
import axios from 'axios';

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(null); // Cambiar a null para manejar el estado de carga
  const [loading, setLoading] = useState(true); // Estado para manejar la carga de la autenticación

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token'); // Obtener el token del almacenamiento local
      if (!token) {
        setIsAuthenticated(false); // No hay token, no está autenticado
        setLoading(false);
        return;
      }

      try {
        // Solicitud al backend para verificar el perfil
        const response = await axios.get('http://localhost:5000/api/auth/profile', {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (response.status === 200) {
          setIsAuthenticated(true); // Autenticado correctamente
        } else {
          setIsAuthenticated(false); // Estado no autenticado por cualquier otra razón
        }
      } catch (err) {
        console.error('Error al verificar la autenticación:', err.message);
        setIsAuthenticated(false); // Manejar errores como no autenticado
      } finally {
        setLoading(false); // Cuando se complete la verificación
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return <div>Cargando...</div>; // Puedes poner un indicador de carga mientras se verifica la autenticación
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/home" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
        <Route path="/perfil" element={isAuthenticated ? <Perfil /> : <Navigate to="/login" />} />
        <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
      </Routes>
    </Router>
  );
};

export default App;
