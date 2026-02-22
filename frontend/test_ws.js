const WebSocket = require('ws');
const ws = new WebSocket('ws://localhost:8000/api/v1/ws/transcript');
ws.on('open', () => { console.log('connected'); ws.close(); });
ws.on('error', (e) => { console.error('error:', e.message); });
