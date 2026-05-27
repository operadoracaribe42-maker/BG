const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Servir la carpeta de output/pdfs de forma estática opcionalmente
app.use('/output/pdfs', express.static('./output/pdfs'));

// Mount routes
const reservaRouter = require('./src/routes/reservaRoutes');
app.use(reservaRouter);

// Basic status route
app.get('/status', (req, res) => {
  res.json({ status: 'ok', service: 'BG Caribe API' });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Servidor de BG Caribe escuchando en el puerto ${PORT}`);
  });
}

module.exports = app;
