const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const dotenv = require('dotenv');
dotenv.config();

const router = express.Router();

// Configuración de la clave secreta para JWT
const jwtSecret = process.env.JWT_SECRET || 'clave_por_defecto';

// Login de usuario
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Nombre de usuario y contraseña son requeridos' });
    }

    try {
        // Buscar al usuario en la base de datos
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Verificar que la contraseña coincida
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Contraseña incorrecta' });
        }

        // Generar un token JWT
        const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '1h' });
        return res.status(200).json({ token, message: 'Usuario logeado correctamente' });

    } catch (err) {
        console.error('Error en login:', err);
        return res.status(500).json({ error: 'Hubo un error al procesar la solicitud' });
    }
});

// Middleware para proteger rutas
const protect = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No token, autorización denegada' });
    }

    try {
        const decoded = jwt.verify(token, jwtSecret);
        req.user = decoded.id;
        next();
    } catch (err) {
        console.error('Error al verificar el token:', err);
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
};

// Ruta protegida: perfil del usuario
router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json({ username: user.username, email: user.email });
    } catch (err) {
        console.error('Error al obtener el perfil:', err);
        return res.status(500).json({ error: 'Error al obtener el perfil del usuario' });
    }
});

// Registro de usuario
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
    }

    try {
        const existingUser = await User.findOne({ $or: [{ username }, { email }] });
        if (existingUser) {
            return res.status(400).json({ error: 'Usuario o correo ya registrado' });
        }

        const user = new User({ username, email, password });
        await user.save();
        return res.status(201).json({ message: 'Usuario registrado correctamente' });
    } catch (err) {
        console.error('Error al registrar el usuario:', err);
        return res.status(500).json({ error: 'Error al registrar el usuario' });
    }
});

module.exports = router;
