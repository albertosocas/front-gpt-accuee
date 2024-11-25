const express = require('express');
const User = require('../models/User');
const Prompt = require('../models/Prompt');
const protect = require('./authMiddleware'); // Importar el middleware de autenticación
const router = express.Router();

// Guardar un nuevo prompt
router.post('/', protect, async (req, res) => {
    const { prompt, evaluator_id, gpt_manager, query_batch_length, temperature, inputTokens, outputTokens, responsesCount } = req.body;

    const userId = req.user; // `protect` añade `req.user` basado en el token JWT
    if (!userId) {
        return res.status(401).json({ message: 'Usuario no autenticado.' });
    }

    const newPrompt = new Prompt({
        prompt,
        evaluator_id,
        gpt_manager,
        query_batch_length,
        temperature,
        user_id: userId
    });

    try {
        const savedPrompt = await newPrompt.save();

        // Actualizar estadísticas del usuario
        const user = await User.findById(userId);
        if (user) {
            user.inputTokens += inputTokens || 0;
            user.outputTokens += outputTokens || 0;
            user.responsesProcessed += responsesCount || 0;

            await user.save(); // Guarda los cambios
        }

        res.status(201).json({
            savedPrompt,
            stats: {
                inputTokens: user ? user.inputTokens : 0,
                outputTokens: user ? user.outputTokens : 0,
                responsesProcessed: user ? user.responsesProcessed : 0
            }
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Este prompt ya existe en la base de datos.' });
        }
        res.status(400).json({ message: err.message });
    }
});

// Obtener prompts del usuario autenticado
router.get('/user-prompts', protect, async (req, res) => {
    const userId = req.user;
    try {
        const prompts = await Prompt.find({ user_id: userId });
        res.status(200).json(prompts);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los prompts del usuario.' });
    }
});

// Obtener todos los prompts (sin autenticación, para pruebas o administradores)
router.get('/', async (req, res) => {
    try {
        const prompts = await Prompt.find();
        res.json(prompts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
