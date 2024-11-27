const express = require('express');
const User = require('../models/User');
const Prompt = require('../models/Prompt');
const protect = require('./authMiddleware'); // Importar el middleware de autenticación
const router = express.Router();


router.post('/', protect, async (req, res) => {
    const { prompt, evaluator_id, gpt_manager, query_batch_length, temperature } = req.body;

    const userId = req.user; 
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
        res.status(201).json({
            savedPrompt,
        });
    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ message: 'Este prompt ya existe en la base de datos.' });
        }
        res.status(400).json({ message: err.message });
    }
});


router.get('/user-prompts', protect, async (req, res) => {
    const userId = req.user;
    try {
        const prompts = await Prompt.find({ user_id: userId });
        res.status(200).json(prompts);
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener los prompts del usuario.' });
    }
});

router.get('/', async (req, res) => {
    try {
        const prompts = await Prompt.find();
        res.json(prompts);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.delete('/delete/:id', protect, async (req, res) => {
    const { id } = req.params;
    const userId = req.user; 

    try {
        
        const prompt = await Prompt.findById(id);

        if (!prompt) {
            return res.status(404).json({ message: 'Prompt no encontrado.' });
        }

        
        if (prompt.user_id.toString() !== userId) {
            return res.status(403).json({ message: 'No tienes permiso para eliminar este prompt.' });
        }

        await prompt.deleteOne();

        res.status(200).json({ message: 'Prompt eliminado correctamente.' });
    } catch (error) {
        console.error('Error al eliminar el prompt:', error);
        res.status(500).json({ message: 'Error al eliminar el prompt.' });
    }
});

router.put('/edit/:id', protect, async (req, res) => {
    const { id } = req.params;
    const userId = req.user;
    const { prompt, evaluator_id, gpt_manager, query_batch_length, temperature } = req.body;

    try {
        const existingPrompt = await Prompt.findById(id);

        if (!existingPrompt) {
            return res.status(404).json({ message: 'Prompt no encontrado.' });
        }

        if (existingPrompt.user_id.toString() !== userId) {
            return res.status(403).json({ message: 'No tienes permiso para editar este prompt.' });
        }

        existingPrompt.prompt = prompt || existingPrompt.prompt;
        existingPrompt.evaluator_id = evaluator_id || existingPrompt.evaluator_id;
        existingPrompt.gpt_manager = gpt_manager || existingPrompt.gpt_manager;
        existingPrompt.query_batch_length = query_batch_length || existingPrompt.query_batch_length;
        existingPrompt.temperature = temperature || existingPrompt.temperature;

        const updatedPrompt = await existingPrompt.save();

        res.status(200).json({ message: 'Prompt actualizado correctamente.', updatedPrompt });
    } catch (error) {
        console.error('Error al editar el prompt:', error);
        res.status(500).json({ message: 'Error al editar el prompt.' });
    }
});



module.exports = router;
