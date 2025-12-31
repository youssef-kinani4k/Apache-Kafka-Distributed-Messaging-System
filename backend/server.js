const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const runConsumer = require('./kafkaConsumer');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // Autoriser le frontend
    methods: ["GET", "POST"]
  }
});

// Stockage en mémoire des dernières positions
const vehicleStore = {};

// Démarrer le consumer Kafka
runConsumer(io, vehicleStore);

// API simple pour tester
app.get('/', (req, res) => {
  res.send('Backend is running and listening to Kafka...');
});

// Récupérer l'état initial (Optionnel mais utile)
app.get('/api/vehicles', (req, res) => {
  res.json(Object.values(vehicleStore));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});