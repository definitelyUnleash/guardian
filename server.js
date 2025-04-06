const express = require("express");
const http = require("http");
const WebSocket = require("ws");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let latestImageBuffer = null;

// Serve HTML directly from this JS file
app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>ESP32-CAM Stream</title>
      <style>
        body { font-family: sans-serif; background: #121212; color: white; text-align: center; }
        img { width: 80%; margin-top: 20px; border-radius: 12px; box-shadow: 0 0 12px rgba(0,0,0,0.6); }
        h1 { margin-top: 40px; }
      </style>
    </head>
    <body>
      <h1>ESP32-CAM Live Stream</h1>
      <img id="stream" src="" alt="Waiting for stream...">
      <script>
        const ws = new WebSocket("wss://" + location.host);
        const img = document.getElementById("stream");
        ws.binaryType = "arraybuffer";
        ws.onmessage = (event) => {
          const blob = new Blob([event.data], { type: 'image/jpeg' });
          img.src = URL.createObjectURL(blob);
        };
      </script>
    </body>
    </html>
  `);
});

// WebSocket server logic
wss.on("connection", function connection(ws) {
  console.log("Client connected via WebSocket");

  // Send latest image buffer to new clients
  if (latestImageBuffer) {
    ws.send(latestImageBuffer);
  }

  ws.on("message", function incoming(data) {
    // Expecting binary JPEG frame from ESP32-CAM
    if (Buffer.isBuffer(data)) {
      latestImageBuffer = data;

      // Broadcast to all browser clients
      wss.clients.forEach(function each(client) {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(data);
        }
      });
    }
  });

  ws.on("close", () => {
    console.log("Client disconnected");
  });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log("Server running on port", PORT);
});
