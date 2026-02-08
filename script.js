// DOM Elements
const ultrasonic1El = document.getElementById('ultrasonic1');
const ultrasonic2El = document.getElementById('ultrasonic2');
const smokeValueEl = document.getElementById('smoke-value');
const lastUpdateEl = document.getElementById('last-update');
const connectionStatusEl = document.getElementById('connection-status');
const esp32StatusIndicator = document.getElementById('esp32-status');
const batteryLevelEl = document.getElementById('battery-level');
const wifiStatusEl = document.getElementById('wifi-status');
const connectionStatusFooterEl = document.getElementById('connection-status-footer');
const ipAddressEl = document.getElementById('ip-address');
const serverPortEl = document.getElementById('server-port');
const uptimeEl = document.getElementById('uptime');
const signalStrengthEl = document.getElementById('signal-strength');

// Servo elements
const servoSliders = document.querySelectorAll('.slider');
const servoValueDisplays = {
    servo1: document.getElementById('servo1-value'),
    servo2: document.getElementById('servo2-value'),
    servo3: document.getElementById('servo3-value'),
    servo4: document.getElementById('servo4-value')
};

// Button elements
const startBtn = document.getElementById('start-btn');
const stopBtn = document.getElementById('stop-btn');
const calibrateBtn = document.getElementById('calibrate-btn');
const resetBtn = document.getElementById('reset-btn');
const connectBtn = document.getElementById('connect-btn');

// Configuration
const config = {
    updateInterval: 2000, // 2 seconds
    simulateData: true,   // Set to false when connecting to real ESP32
    esp32IP: '192.168.1.100',
    serverPort: 80
};

// State variables
let isConnected = false;
let updateIntervalId = null;
let robotActive = false;
let uptimeSeconds = 0;

// Initialize the application
function init() {
    console.log('Spider Robot Control Panel Initializing...');
    
    // Set initial UI state
    updateConnectionStatus(false);
    
    // Initialize servo sliders
    initServoSliders();
    
    // Set up event listeners
    setupEventListeners();
    
    // Start data updates
    startDataUpdates();
    
    // Start uptime counter
    startUptimeCounter();
}

// Initialize servo slider controls
function initServoSliders() {
    servoSliders.forEach(slider => {
        // Set initial value display
        const valueId = slider.id + '-value';
        if (servoValueDisplays[slider.id]) {
            servoValueDisplays[slider.id].textContent = slider.value + '°';
        }
        
        // Update value when slider moves
        slider.addEventListener('input', function() {
            if (servoValueDisplays[this.id]) {
                servoValueDisplays[this.id].textContent = this.value + '°';
            }
            
            // Send servo position to ESP32 (simulated or real)
            sendServoPosition(this.id, this.value);
        });
    });
}

// Set up event listeners for buttons
function setupEventListeners() {
    // Start Robot button
    startBtn.addEventListener('click', function() {
        if (!isConnected) {
            showMessage('Error: Not connected to ESP32', 'error');
            return;
        }
        
        robotActive = true;
        showMessage('Robot movement started!', 'success');
        startBtn.disabled = true;
        stopBtn.disabled = false;
        
        // In real implementation, send command to ESP32
        sendCommand('START_ROBOT');
    });
    
    // Stop Robot button
    stopBtn.addEventListener('click', function() {
        robotActive = false;
        showMessage('Robot movement stopped!', 'info');
        startBtn.disabled = false;
        stopBtn.disabled = true;
        
        // In real implementation, send command to ESP32
        sendCommand('STOP_ROBOT');
    });
    
    // Calibrate Sensors button
    calibrateBtn.addEventListener('click', function() {
        if (!isConnected) {
            showMessage('Error: Not connected to ESP32', 'error');
            return;
        }
        
        showMessage('Calibrating sensors...', 'info');
        
        // In real implementation, send command to ESP32
        sendCommand('CALIBRATE_SENSORS');
    });
    
    // Reset Position button
    resetBtn.addEventListener('click', function() {
        if (!isConnected) {
            showMessage('Error: Not connected to ESP32', 'error');
            return;
        }
        
        // Reset all servos to 90°
        servoSliders.forEach(slider => {
            slider.value = 90;
            if (servoValueDisplays[slider.id]) {
                servoValueDisplays[slider.id].textContent = '90°';
            }
            
            // Send reset position to ESP32
            sendServoPosition(slider.id, 90);
        });
        
        showMessage('All servos reset to default position (90°)', 'success');
    });
    
    // Connect to ESP32 button
    connectBtn.addEventListener('click', toggleConnection);
}

// Toggle connection to ESP32
function toggleConnection() {
    if (isConnected) {
        disconnectFromESP32();
    } else {
        connectToESP32();
    }
}

// Connect to ESP32 (simulated)
function connectToESP32() {
    console.log('Connecting to ESP32...');
    
    // Update UI to show connecting state
    esp32StatusIndicator.className = 'status-indicator connecting';
    connectionStatusEl.textContent = 'Connecting...';
    connectBtn.disabled = true;
    connectBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
    
    // Simulate connection delay
    setTimeout(() => {
        isConnected = true;
        esp32StatusIndicator.className = 'status-indicator online';
        connectionStatusEl.textContent = 'Connected';
        connectionStatusFooterEl.textContent = 'Connected to ESP32';
        
        connectBtn.disabled = false;
        connectBtn.innerHTML = '<i class="fas fa-plug"></i> Disconnect from ESP32';
        connectBtn.classList.add('btn-primary');
        connectBtn.classList.remove('btn-secondary');
        
        showMessage('Successfully connected to ESP32!', 'success');
        
        // Enable robot controls
        startBtn.disabled = false;
        stopBtn.disabled = true;
        calibrateBtn.disabled = false;
        resetBtn.disabled = false;
        
    }, 1500);
}

// Disconnect from ESP32
function disconnectFromESP32() {
    console.log('Disconnecting from ESP32...');
    
    isConnected = false;
    robotActive = false;
    
    // Update UI
    esp32StatusIndicator.className = 'status-indicator offline';
    connectionStatusEl.textContent = 'Disconnected';
    connectionStatusFooterEl.textContent = 'Disconnected';
    
    connectBtn.innerHTML = '<i class="fas fa-plug"></i> Connect to ESP32';
    connectBtn.classList.remove('btn-primary');
    connectBtn.classList.add('btn-secondary');
    
    // Disable robot controls
    startBtn.disabled = true;
    stopBtn.disabled = true;
    calibrateBtn.disabled = true;
    resetBtn.disabled = true;
    
    showMessage('Disconnected from ESP32', 'info');
}

// Update sensor data
function updateSensorData() {
    if (!isConnected && !config.simulateData) {
        return; // Don't update if not connected
    }
    
    // Generate simulated sensor data
    if (config.simulateData) {
        // Ultrasonic sensors - simulate realistic distance measurements
        const us1Value = Math.floor(Math.random() * 50 + 10);
        const us2Value = Math.floor(Math.random() * 50 + 15);
        
        ultrasonic1El.innerHTML = us1Value + '<span class="sensor-unit">cm</span>';
        ultrasonic2El.innerHTML = us2Value + '<span class="sensor-unit">cm</span>';
        
        // Smoke sensor with occasional warning
        let smokeValue = Math.floor(Math.random() * 300 + 50);
        smokeValueEl.innerHTML = smokeValue + '<span class="sensor-unit">ppm</span>';
        
        // Add warning class if smoke level is high
        if (smokeValue > 250) {
            smokeValueEl.classList.add('warning');
            if (smokeValue > 400) {
                smokeValueEl.classList.add('danger');
                showMessage('WARNING: High smoke concentration detected!', 'error');
            }
        } else {
            smokeValueEl.classList.remove('warning', 'danger');
        }
        
        // Simulate battery drain when robot is active
        if (robotActive) {
            const currentBattery = parseInt(batteryLevelEl.textContent);
            if (currentBattery > 0) {
                // Drain 1% every 5 updates when active
                if (Math.random() < 0.2) {
                    batteryLevelEl.textContent = (currentBattery - 1) + '%';
                }
            }
        }
        
        // Simulate WiFi signal fluctuations
        const signalStrength = Math.floor(Math.random() * 30) - 70;
        signalStrengthEl.textContent = signalStrength + ' dBm';
        
    } else {
        // In real implementation, fetch data from ESP32 API
        fetchDataFromESP32();
    }
    
    // Update timestamp
    const now = new Date();
    lastUpdateEl.textContent = 
        `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
}

// Start data updates
function startDataUpdates() {
    // Initial update
    updateSensorData();
    
    // Set up interval for updates
    updateIntervalId = setInterval(updateSensorData, config.updateInterval);
}

// Start uptime counter
function startUptimeCounter() {
    setInterval(() => {
        uptimeSeconds++;
        
        const hours = Math.floor(uptimeSeconds / 3600);
        const minutes = Math.floor((uptimeSeconds % 3600) / 60);
        const seconds = uptimeSeconds % 60;
        
        uptimeEl.textContent = `${hours}h ${minutes}m ${seconds}s`;
    }, 1000);
}

// Send servo position to ESP32
function sendServoPosition(servoId, position) {
    if (!isConnected) {
        console.log(`Simulated: Setting ${servoId} to ${position} degrees`);
        return;
    }
    
    // In real implementation, send HTTP request to ESP32
    // Example: fetch(`http://${config.esp32IP}/servo/${servoId}?position=${position}`);
    console.log(`Sending to ESP32: ${servoId} = ${position}°`);
}

// Send command to ESP32
function sendCommand(command) {
    if (!isConnected) {
        console.log(`Simulated command: ${command}`);
        return;
    }
    
    // In real implementation, send HTTP request to ESP32
    // Example: fetch(`http://${config.esp32IP}/command?cmd=${command}`);
    console.log(`Sending command to ESP32: ${command}`);
}

// Fetch data from ESP32 (real implementation)
function fetchDataFromESP32() {
    // This is where you would make actual HTTP requests to your ESP32
    // Example:
    /*
    fetch(`http://${config.esp32IP}/sensors`)
        .then(response => response.json())
        .then(data => {
            // Update UI with real data
            ultrasonic1El.innerHTML = data.ultrasonic1 + '<span class="sensor-unit">cm</span>';
            ultrasonic2El.innerHTML = data.ultrasonic2 + '<span class="sensor-unit">cm</span>';
            smokeValueEl.innerHTML = data.smoke + '<span class="sensor-unit">ppm</span>';
            batteryLevelEl.textContent = data.battery + '%';
        })
        .catch(error => {
            console.error('Error fetching data from ESP32:', error);
            showMessage('Error fetching data from ESP32', 'error');
        });
    */
}

// Show message to user
function showMessage(message, type = 'info') {
    // Create message element
    const messageEl = document.createElement('div');
    messageEl.className = `message ${type}`;
    messageEl.textContent = message;
    messageEl.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 8px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        max-width: 400px;
    `;
    
    // Set background color based on message type
    if (type === 'success') {
        messageEl.style.background = 'linear-gradient(90deg, #4CAF50, #45a049)';
    } else if (type === 'error') {
        messageEl.style.background = 'linear-gradient(90deg, #f44336, #d32f2f)';
    } else if (type === 'warning') {
        messageEl.style.background = 'linear-gradient(90deg, #ff9800, #f57c00)';
    } else {
        messageEl.style.background = 'linear-gradient(90deg, #2196F3, #1976D2)';
    }
    
    // Add to DOM
    document.body.appendChild(messageEl);
    
    // Remove after 3 seconds
    setTimeout(() => {
        messageEl.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (messageEl.parentNode) {
                messageEl.parentNode.removeChild(messageEl);
            }
        }, 300);
    }, 3000);
    
    // Add CSS for animations if not already present
    if (!document.getElementById('message-animations')) {
        const style = document.createElement('style');
        style.id = 'message-animations';
        style.textContent = `
            @keyframes slideIn {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
            @keyframes slideOut {
                from { transform: translateX(0); opacity: 1; }
                to { transform: translateX(100%); opacity: 0; }
            }
        `;
        document.head.appendChild(style);
    }
}

// Update connection status UI
function updateConnectionStatus(connected) {
    isConnected = connected;
    
    if (connected) {
        esp32StatusIndicator.className = 'status-indicator online';
        connectionStatusEl.textContent = 'Connected';
        connectionStatusEl.style.color = '#00ff00';
    } else {
        esp32StatusIndicator.className = 'status-indicator offline';
        connectionStatusEl.textContent = 'Disconnected';
        connectionStatusEl.style.color = '#ff0000';
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', init);