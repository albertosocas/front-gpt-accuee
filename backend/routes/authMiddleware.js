const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
    const token = req.header('Authorization')?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'clave_por_defecto');
        req.user = decoded.id;
        next();
    } catch (err) {
        console.error('Error al verificar el token:', err);
        return res.status(401).json({ error: 'Token inválido o expirado' });
    }
};
module.exports = protect;
