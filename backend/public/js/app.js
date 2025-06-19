// public/js/app.js

// --- DOM Element Selection (Unchanged) ---
const metricCards = document.querySelectorAll('.metric-card');
const chartToggle = document.getElementById('chart-toggle');
const historyInput = document.getElementById('history-size');
const chartTitle = document.getElementById('chart-title');
const chartCanvas = document.getElementById('dataChart').getContext('2d');

// --- Global State (Unchanged) ---
let chart = null;
let appState = {
    metric: 'cpu',
    chartType: 'line',
    historySize: 20,
    data: null
};

// ---Chart Configuration ---
const METRIC_CONFIG = {
    cpu: { label: 'CPU Usage', unit: '%', color: '#9A4C84' },    // Deep Purple
    mem: { label: 'Memory Usage', unit: '%', color: '#BACC64' }, // Lime Green
    net: { label: 'Network I/O', unit: 'KB/s', color: '#7BB0D7' }   // Sky Blue
};

// Main Chart Rendering Function
function renderChart() {
    if (!appState.data) return;
    if (chart) chart.destroy();
    const currentMetricConfig = METRIC_CONFIG[appState.metric];
    const historyData = appState.data.history[appState.metric] || [];
    const labels = historyData.map((_, i) => `${-(historyData.length - i - 1)}s`);
    const chartData = {
        labels: labels,
        datasets: [{
            label: `${currentMetricConfig.label} (${currentMetricConfig.unit})`,
            data: historyData,
            borderColor: currentMetricConfig.color,
            backgroundColor: `${currentMetricConfig.color}33`, // Append alpha transparency
            borderWidth: 2,
            fill: appState.chartType === 'line',
            tension: 0.3,
        }]
    };
    chartTitle.textContent = `Live ${currentMetricConfig.label} Chart`;
    chart = new Chart(chartCanvas, {
        type: appState.chartType,
        data: chartData,
        options: {
            scales: { y: { beginAtZero: true, suggestedMax: 100 } },
            responsive: true,
            maintainAspectRatio: false,
        }
    });
}

// UI Update Functions
function updateActiveMetricUI() {
    metricCards.forEach(card => {
        card.classList.toggle('active', card.dataset.metric === appState.metric);
    });
}

function updateCardValues(data) {
    appState.data = data;
    const cpuValue = `${data.cpu.current.toFixed(1)}%`;
    const memUsed = (data.mem.used / 1024**3).toFixed(2);
    const memValue = `${memUsed} GB`;
    const netValue = `${(data.history.net[data.history.net.length - 1] || 0).toFixed(1)} KB/s`;
    document.querySelector('#cpu-card .card-value').textContent = cpuValue;
    document.querySelector('#mem-card .card-value').textContent = memValue;
    document.querySelector('#net-card .card-value').textContent = netValue;
    renderChart();
}

// WebSocket Connection
// const socket = new WebSocket('ws://localhost:3000');
const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
const socket = new WebSocket(`${wsProtocol}//${window.location.host}/ws/`);

socket.onopen = () => {
    console.log('Connected to NodeMon server!');
    updateActiveMetricUI();
};
socket.onclose = () => console.log('Disconnected from server.');
socket.onmessage = (event) => {
    const message = JSON.parse(event.data);
    if (message.type === 'config') {
        appState.historySize = message.historySize;
        historyInput.value = message.historySize;
    } else if (message.type === 'data') {
        updateCardValues(message.payload);
    }
};

// Event Listeners for Controls
function setupEventListeners() {
    metricCards.forEach(card => {
        card.addEventListener('click', () => {
            appState.metric = card.dataset.metric;
            updateActiveMetricUI();
            renderChart();
        });
    });
    const lineLabel = document.getElementById('line-label');
    const barLabel = document.getElementById('bar-label');
    chartToggle.addEventListener('click', () => {
        chartToggle.classList.toggle('active');
        const isActive = chartToggle.classList.contains('active');
        appState.chartType = isActive ? 'bar' : 'line';
        lineLabel.classList.toggle('inactive', isActive);
        barLabel.classList.toggle('inactive', !isActive);
        renderChart();
    });
    historyInput.addEventListener('change', () => {
        const newSize = parseInt(historyInput.value, 10);
        if (!isNaN(newSize) && newSize >= 5 && newSize <= 60) {
            appState.historySize = newSize;
            socket.send(JSON.stringify({ type: 'config', historySize: newSize }));
        }
    });
}
setupEventListeners();