const express = require('express');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// ===== WebSocket Server Setup ===== //
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`ESP32-CAM should connect to: wss://${process.env.RAILWAY_PUBLIC_DOMAIN || 'localhost:' + PORT}/video`);
});

const wss = new WebSocket.Server({
  server,
  path: "/video",
  perMessageDeflate: false // Disable compression for binary frames
});

// Frame rate controller (10FPS)
const broadcastFrame = (() => {
  let lastBroadcast = 0;
  return (data) => {
    const now = Date.now();
    if (now - lastBroadcast >= 100) { // 10FPS throttle
      wss.clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(data, { binary: true });
        }
      });
      lastBroadcast = now;
    }
  };
})();

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  const isESP32 = req.url.includes('/video');
  console.log(`New ${isESP32 ? 'ESP32-CAM' : 'browser'} connected`);

  // Process ESP32 frames
  if (isESP32) {
    ws.on('message', (data, isBinary) => {
      if (isBinary) {
        console.log(`Received frame: ${data.length} bytes`);
        broadcastFrame(data);
      }
    });
  }

  // Heartbeat for Railway
  const pingInterval = setInterval(() => ws.ping(), 15000);
  ws.on('close', () => clearInterval(pingInterval));
});

// ===== HTML Server ===== //
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>ESP32-CAM Stream</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          text-align: center;
          margin: 0;
          padding: 20px;
          background: #f5f5f5;
        }
        #video-container {
          max-width: 640px;
          margin: 0 auto;
          background: white;
          padding: 10px;
          border-radius: 8px;
          box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        #video-feed {
          width: 100%;
          border-radius: 4px;
        }
        h1 {
          color: #2c3e50;
          margin-bottom: 20px;
        }
        #status {
          color: #7f8c8d;
          margin-top: 10px;
          font-size: 14px;
        }
      </style>
    </head>
    <body>
      <div id="video-container">
        <h1>ESP32-CAM Live Stream</h1>
        <img id="video-feed" src="" alt="Live feed loading...">
        <div id="status">Connecting...</div>
      </div>

      <script>
        const ws = new WebSocket('wss://' + window.location.host + '/video');
        const videoFeed = document.getElementById('video-feed');
        const statusDiv = document.getElementById('status');
        let currentUrl = null;

        // Connection events
        ws.onopen = () => {
          statusDiv.textContent = "Connected (Waiting for frames)";
          statusDiv.style.color = "#27ae60";
        };

        ws.onerror = (err) => {
          statusDiv.textContent = "Connection error - Refresh page";
          statusDiv.style.color = "#e74c3c";
        };

        // Handle incoming JPEG frames
        ws.onmessage = (e) => {
          if (e.data instanceof Blob) {
            // Memory management
            if (currentUrl) URL.revokeObjectURL(currentUrl);
            
            // Display new frame
            currentUrl = URL.createObjectURL(e.data);
            videoFeed.src = currentUrl;
            statusDiv.textContent = "Streaming (10FPS)";
          }
        };

        // Cleanup on exit
        window.addEventListener('beforeunload', () => {
          if (currentUrl) URL.revokeObjectURL(currentUrl);
          ws.close();
        });
      </script>
    </body>
    </html>
  `);
});
