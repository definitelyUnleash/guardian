const express = require('express');
const WebSocket = require('ws');
const app = express();
const PORT = process.env.PORT || 3000;

// HTTP server (required for Railway)
app.get('/', (req, res) => {
  res.send('WebSocket Server Ready - ESP32 can connect later');
});

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startWebSocketServer(server); // Initialize only AFTER HTTP server starts
});

function startWebSocketServer(httpServer) {
  const wss = new WebSocket.Server({ server: httpServer });
  
  wss.on('listening', () => {
    console.log('WebSocket ready for ESP32 connections');
  });

  wss.on('error', (err) => {
    console.error('WebSocket error (ESP32 may be offline):', err.message);
  });

  wss.on('connection', (ws) => {
    console.log('New ESP32 connected');
    ws.on('message', (data) => {
      wss.clients.forEach((client) => client.send(data));
    });
  });
}
