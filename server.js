const express = require('express');
const WebSocket = require('ws');
const app = express();
const PORT = process.env.PORT || 3000;

// HTTP server
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>ESP32-CAM Stream</title>
      <script>
        const ws = new WebSocket('wss://' + window.location.host);
        const videoFeed = document.getElementById('video-feed');
        let frameCount = 0;
        
        ws.onopen = () => console.log('Connected to WebSocket');
        ws.onerror = (err) => console.error('WebSocket error:', err);
        
        ws.onmessage = (event) => {
          if (event.data instanceof Blob) {
            // Create object URL from binary frame
            const url = URL.createObjectURL(event.data);
            
            // Update image source and revoke previous URL
            videoFeed.onload = () => URL.revokeObjectURL(url);
            videoFeed.src = url;
            
            // Debug log every 10 frames
            if (frameCount++ % 10 === 0) {
              console.log('Received frame', frameCount);
            }
          }
        };
      </script>
      <style>
        #video-feed {
          max-width: 100%;
          transform: rotate(0deg); /* Fix rotation if needed */
        }
      </style>
    </head>
    <body>
      <h1>ESP32-CAM Live Stream</h1>
      <img id="video-feed" src="" alt="Live Feed">
    </body>
    </html>
  `);
});

// WebSocket Server
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`ESP32-CAM should connect to: wss://${process.env.RAILWAY_PUBLIC_DOMAIN || 'localhost:' + PORT}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('New client connected');
  
  // Handle binary frames from ESP32
  ws.on('message', (data, isBinary) => {
    if (isBinary) {
      // Broadcast to all other clients (browsers)
      wss.clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(data, { binary: true });
        }
      });
    }
  });

  // Heartbeat
  const pingInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) ws.ping();
  }, 30000);

  ws.on('close', () => {
    clearInterval(pingInterval);
    console.log('Client disconnected');
  });
});
