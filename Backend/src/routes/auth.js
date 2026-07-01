const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

router.post('/login', async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.status(400).json({ error: 'Contraseña requerida' });
  }

  const valid = await bcrypt.compare(password, process.env.ADMIN_PASSWORD_HASH);

  if (!valid) {
    // Mismo mensaje para no revelar si existe o no el usuario
    return res.status(401).json({ error: 'Credenciales incorrectas' });
  }

  const token = jwt.sign(
    { role: 'admin' },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );

  res.json({ token });
});

module.exports = router;