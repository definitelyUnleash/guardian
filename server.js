const express = require('express');
const WebSocket = require('ws');
const app = express();
const PORT = process.env.PORT || 3000;

// HTTP server (required for Railway health checks)
app.get('/', (req, res) => {
  res.send(`
    <h1>WebSocket Server Ready</h1>
    <p>ESP32-CAM not connected yet. Deploy successful!</p>
    <script>
      // Test WebSocket connection
      const ws = new WebSocket('wss://'+window.location.host);
      ws.onopen = () => console.log("WebSocket working!");
    </script>
  `);
});

const server = app.listen(PORT, () => {
  console.log(`HTTP server running on port ${PORT}`);
});

// WebSocket server (starts empty, waits for ESP32)
const wss = new WebSocket.Server({ server });

wss.on('listening', () => {
  console.log('WebSocket ready for ESP32 connections');
  console.log(`Your ESP32 should connect to: wss://${server.address().address}:${PORT}`);
});

wss.on('connection', (ws) => {
  console.log('New client connected');
  ws.on('message', (data) => {
    // Broadcast to all clients (including browser)
    wss.clients.forEach(client => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(data);
      }
    });
  });
});
