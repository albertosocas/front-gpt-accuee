const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const dotenv = require('dotenv');
dotenv.config();

const router = express.Router();

const jwtSecret = process.env.JWT_SECRET || 'clave_por_defecto';

router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Nombre de usuario y contraseña son requeridos' });
    }

    try {
        const user = await User.findOne({ username });
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(400).json({ error: 'Contraseña incorrecta' });
        }

        const token = jwt.sign({ id: user._id }, jwtSecret, { expiresIn: '1h' });
        return res.status(200).json({ token, username:user.username , message: 'Usuario logeado correctamente' });

    } catch (err) {
        console.error('Error en login:', err);
        return res.status(500).json({ error: 'Hubo un error al procesar la solicitud' });
    }
});

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

router.get('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user);
        if (!user) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        console.log("User profile data:", user); // Log para verificar los datos
        res.json({ 
            username: user.username, 
            email: user.email,
            inputTokens: user.inputTokens,
            outputTokens: user.outputTokens,
            responsesProcessed: user.responsesProcessed 
        });
    } catch (err) {
        console.error('Error al obtener el perfil:', err);
        return res.status(500).json({ error: 'Error al obtener el perfil del usuario' });
    }
});

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

router.post('/actualizar', protect, async (req, res) => {
    try {
        const { inputTokens, outputTokens, responsesProcessed } = req.body;
        const userId = req.user; 
        

        const user = await User.findById(userId);
        if (user) {
            user.inputTokens += inputTokens || 0;
            user.outputTokens += outputTokens || 0;
            user.responsesProcessed += responsesProcessed || 0;
            await user.save();
        }

        res.status(201).json({
            stats: {
                inputTokens: user ? user.inputTokens : 0,
                outputTokens: user ? user.outputTokens : 0,
                responsesProcessed: user ? user.responsesProcessed : 0,
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: "Error al actualizar las estadísticas" });
    }
});



module.exports = router;
