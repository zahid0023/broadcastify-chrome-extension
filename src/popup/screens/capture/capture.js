document.addEventListener('DOMContentLoaded', function () {
    // UI Elements
    const startBtn = document.getElementById('start');
    const finishBtn = document.getElementById('finish');
    const cancelBtn = document.getElementById('cancel');
    const statusEl = document.getElementById('status');
    const timeRemEl = document.getElementById('timeRem');
    const actionButtons = document.getElementById('action-buttons');

    // State variables
    let isCapturing = false;
    let startTime;
    let timerInterval;
    const MAX_CAPTURE_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds


    function initUI() {
        // Show start button and hide action buttons
        startBtn.style.display = 'block';
        actionButtons.style.display = 'none';

        // Reset status and timer
        statusEl.textContent = 'Ready to capture';
        timeRemEl.textContent = '';
    }

    // Start the capture timer
    function startTimer() {
        clearInterval(timerInterval);
        updateTimeRemaining();
        timerInterval = setInterval(updateTimeRemaining, 1000);
    }

    // Update the time remaining display
    function updateTimeRemaining() {
        if (!startTime) return;

        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, MAX_CAPTURE_TIME - elapsed);

        if (remaining <= 0) {
            stopCapture();
            return;
        }

        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        timeRemEl.textContent = `Time remaining: ${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    /**
     * Start the audio capture
     */
    function startCapture() {
        isCapturing = true;
        startTime = Date.now();

        // Toggle button visibility
        startBtn.style.display = 'none';
        actionButtons.style.display = 'flex';

        // Update status
        statusEl.textContent = 'Capture in progress...';
        startTimer();
    }

    /**
     * Stop the audio capture
     * @param {boolean} save
     */
    function stopCapture(save = false) {
        // Clear any running timers
        clearInterval(timerInterval);
        isCapturing = false;

        // Reset the UI
        initUI();

        // Only update status if not already showing processing message
        const currentStatus = statusEl.textContent;
        if (!currentStatus.includes('processing') && !currentStatus.includes('Sending')) {
            statusEl.textContent = save ? 'Processing...' : 'Capture canceled.';
        }

        // Clear the status message after 3 seconds if it's a cancel action
        if (!save) {
            setTimeout(() => {
                if (statusEl.textContent.includes('canceled')) {
                    statusEl.textContent = 'Ready to capture';
                }
            }, 3000);
        }
    }

    // ======================
    // Event Listeners
    // ======================

    // Start capture button
    startBtn.addEventListener('click', startCapture);

    /**
     * Update status message with optional animation
     * @param {string} message - The status message to display
     */
    function updateStatus(message) {
        statusEl.textContent = message;
    }

    // Save capture button
    finishBtn.addEventListener('click', () => {
        // Update status before stopping capture
        statusEl.textContent = 'Sending for processing...';
        stopCapture(true);
    });

    // Cancel capture button
    cancelBtn.addEventListener('click', () => {
        stopCapture(false);
    });

    // Initialize the UI when the popup loads
    initUI();
});

chrome.runtime.onMessage.addListener((msg) => {
    if (msg.action === "updateStatus") {
        document.getElementById("status").textContent = msg.text;
    }
});
