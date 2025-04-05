const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: process.env.PORT || 3000 });

wss.on('connection', (ws) => {
  ws.on('message', (data) => {
    wss.clients.forEach((client) => client.send(data));
  });
});

console.log(`WebSocket server running on port ${process.env.PORT || 3000}`);
