const http = require('http');
const WebSocket = require('ws');

// ==== HTML Template Served on GET Request ====
const html = `
<!DOCTYPE html>
<html>
<head>
  <title>ESP32-CAM Stream</title>
  <style>
    body { background: #111; color: #eee; text-align: center; }
    img { max-width: 100%; border: 4px solid #fff; margin-top: 20px; }
  </style>
</head>
<body>
  <h1>ESP32-CAM Live Stream</h1>
  <img id="stream" />
  <script>
    const img = document.getElementById("stream");
    const socket = new WebSocket("ws://" + location.host);
    socket.binaryType = "arraybuffer";
    socket.onmessage = (event) => {
      const blob = new Blob([event.data], { type: "image/jpeg" });
      img.src = URL.createObjectURL(blob);
    };
  </script>
</body>
</html>
`;

// ==== HTTP Server to Serve HTML ====
const server = http.createServer((req, res) => {
  res.writeHead(200, {'Content-Type': 'text/html'});
  res.end(html);
});

// ==== WebSocket Server ====
const wss = new WebSocket.Server({ server });

wss.on('connection', ws => {
  console.log('Client connected to WebSocket');

  ws.on('message', message => {
    // Broadcast to all browser clients
    wss.clients.forEach(client => {
      if (client !== ws && client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  });

  ws.on('close', () => console.log('Client disconnected'));
});

// ==== Start Server ====
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
