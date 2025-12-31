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
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const vehicleStore = {};

runConsumer(io, vehicleStore);

app.get('/', (req, res) => {
  res.send('Backend is running and listening to Kafka...');
});

app.get('/api/vehicles', (req, res) => {
  res.json(Object.values(vehicleStore));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
