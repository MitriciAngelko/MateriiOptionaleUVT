// Importarea modulelor necesare
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
require('dotenv').config();
const routes = require('./routes/index');

// Inițializarea serverului Express
const app = express();

// Configurare middleware
app.use(cors()); // Permite cererile între domenii
app.use(bodyParser.json()); // Permite lucrul cu JSON în corpul cererii

// Importarea rutelor
app.use('/api', routes);


// Ruta principală pentru testare
app.get('/', (req, res) => {
  res.send('Serverul este funcțional!');
});

// Setarea portului și pornirea serverului
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Serverul rulează pe portul ${PORT}`);
});
