// src/index.js
import express from 'express';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { WebSocketServer } from 'ws';
import si from 'systeminformation'; // <-- Import systeminformation

// --- Basic Setup ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });
const PORT = 3000;

app.use(express.static(path.join(__dirname, '..', 'public')));

// --- Data State and History Management ---
let historySize = 20; // Default history size (n seconds)
let dataHistory = {
    cpu: [],
    mem: [],
    net: []
};

// Helper function to manage rolling history arrays
const updateHistory = (arr, value) => {
    arr.push(value);
    if (arr.length > historySize) {
        arr.shift();
    }
};

// --- WebSocket Logic ---
wss.on('connection', (ws) => {
    console.log('A new client connected!');
    // Send the current history size to the new client
    ws.send(JSON.stringify({ type: 'config', historySize }));

    ws.on('message', (message) => {
        try {
            const data = JSON.parse(message);
            // Allow clients to update the history size
            if (data.type === 'config' && data.historySize) {
                const newSize = parseInt(data.historySize, 10);
                if (!isNaN(newSize) && newSize > 0 && newSize <= 60) {
                    historySize = newSize;
                    console.log(`History size updated to: ${historySize}`);
                    // Inform all clients of the change
                    broadcast({ type: 'config', historySize });
                }
            }
        } catch (e) {
            console.error('Failed to parse message:', e);
        }
    });

    ws.on('close', () => console.log('Client disconnected.'));
});

function broadcast(data) {
    wss.clients.forEach((client) => {
        if (client.readyState === client.OPEN) {
            client.send(JSON.stringify(data));
        }
    });
}

// --- Main Data Collection Loop ---
setInterval(async () => {
    try {
        // Fetch all data concurrently
        const [cpuData, memData, netData] = await Promise.all([
            si.currentLoad(),
            si.mem(),
            si.networkStats()
        ]);

        // 1. CPU Data
        const currentCpuLoad = parseFloat(cpuData.currentLoad.toFixed(2));
        updateHistory(dataHistory.cpu, currentCpuLoad);

        // 2. Memory Data
        const memUsedPercent = parseFloat(((memData.used / memData.total) * 100).toFixed(2));
        updateHistory(dataHistory.mem, memUsedPercent);

        // 3. Network Data (sum of all interfaces)
        // We calculate rx_sec/tx_sec based on the total transferred bytes over the interval
        const totalRx = netData.reduce((acc, iface) => acc + iface.rx_bytes, 0);
        const totalTx = netData.reduce((acc, iface) => acc + iface.tx_bytes, 0);

        // This is a simplified rate calculation. A more accurate one would store the previous value.
        // For simplicity here, we'll use the per-second value which systeminformation provides.
        const rx_sec = netData.reduce((acc, iface) => acc + iface.rx_sec, 0) / 1024; // KB/s
        const tx_sec = netData.reduce((acc, iface) => acc + iface.tx_sec, 0) / 1024; // KB/s
        updateHistory(dataHistory.net, parseFloat((rx_sec + tx_sec).toFixed(2)));


        // Get static OS data once
        const osData = await si.osInfo();

        // Broadcast the full payload
        broadcast({
            type: 'data',
            payload: {
                history: dataHistory,
                os: {
                    platform: osData.platform,
                    arch: osData.arch
                },
                mem: {
                    used: memData.used,
                    total: memData.total
                },
                cpu: {
                    current: currentCpuLoad
                }
            }
        });

    } catch (e) {
        console.error("Error fetching system data:", e);
    }
}, 1000); // Fetch data every second

server.listen(PORT, () => {
    console.log(`Server is listening on http://localhost:${PORT}`);
});