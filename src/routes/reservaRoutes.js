const express = require('express');
const router = express.Router();
const { confirmarReserva } = require('../controllers/reservaController');

// Middleware de autenticación — solo para esta ruta
function authMiddleware(req, res, next) {
  const token = req.headers['authorization']?.replace('Bearer ', '');
  if (token !== process.env.BGCARIBE_API_KEY) {
    return res.status(401).json({ error: 'No autorizado' });
  }
  next();
}

router.post('/api/reservas/confirmar', authMiddleware, async (req, res) => {
  try {
    const result = await confirmarReserva(req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    return res.status(200).json(result);
  } catch (err) {
    console.error('Error en ruta /api/reservas/confirmar:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;
