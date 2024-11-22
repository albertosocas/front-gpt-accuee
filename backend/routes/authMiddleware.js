const jwt = require('jsonwebtoken');

const protect = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1]; // Bearer token
  
  if (!token) {
    return res.status(401).json({ error: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, 'your_jwt_secret'); // Verificar el token
    req.user = decoded.id; // Almacenar el id del usuario en el objeto `req`
    next(); // Continuar con la solicitud
  } catch (err) {
    res.status(401).json({ error: 'Token inválido' });
  }
};

module.exports = protect;
