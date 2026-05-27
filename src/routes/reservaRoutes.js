const express = require('express');
const router = express.Router();
const { confirmarReserva, descargarDocumento } = require('../controllers/reservaController');

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

router.post('/api/reservas/download/:tipo', async (req, res) => {
  try {
    const result = await descargarDocumento(req.params.tipo, req.body);
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    if (result.type === 'pdf') {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      return res.send(result.buffer);
    } else {
      res.setHeader('Content-Type', 'text/html');
      return res.send(result.html);
    }
  } catch (err) {
    console.error('Error en ruta /api/reservas/download:', err);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router;

