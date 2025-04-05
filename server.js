const express = require('express');
const WebSocket = require('ws');
const app = express();
const PORT = process.env.PORT || 3000;

const wss = new WebSocket.Server({ server: app.listen(PORT) });
console.log(`WebSocket server running on port ${PORT}`);

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    // Broadcast JPEG to all connected websites
    wss.clients.forEach((client) => client.send(data));
  });
});
