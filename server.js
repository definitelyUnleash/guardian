const express = require('express');
const WebSocket = require('ws');
const app = express();
const PORT = process.env.PORT || 3000;

// HTTP server (required for Railway health checks)
app.get('/', (req, res) => {
  res.send('ESP32 WebSocket Server Running');
});

const server = app.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
});

// WebSocket server
const wss = new WebSocket.Server({ server }); // Attach to HTTP server

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    wss.clients.forEach((client) => client.send(data));
  });
});
