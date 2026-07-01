const jwt = require('jsonwebtoken');

function adminAuth(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ error: 'Token requerido' });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'admin') throw new Error();
    next();
  } catch {
    return res.status(401).json({ error: 'Token inválido o expirado' });
  }
}

module.exports = adminAuth;