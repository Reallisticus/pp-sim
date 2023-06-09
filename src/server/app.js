//app.js

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const port = 3000;
const config = require('../simulation/config');

const simulation = require('../simulation/simulation');

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/public/index.html');
});

app.get('/config', (req, res) => {
  res.json(config);
});

io.on('connection', (socket) => {
  console.log('a user connected');
  simulation.startSimulation(io, socket);
});

server.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
