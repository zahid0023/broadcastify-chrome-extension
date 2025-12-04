document.addEventListener('DOMContentLoaded', function() {
    // UI Elements
    const startBtn = document.getElementById('start');
    const finishBtn = document.getElementById('finish');
    const cancelBtn = document.getElementById('cancel');
    const statusEl = document.getElementById('status');
    const timeRemEl = document.getElementById('timeRem');

    let isCapturing = false;
    let startTime;
    let timerInterval;
    const MAX_CAPTURE_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds

    // Initialize the UI
    function initUI() {
        updateUI();

        // Check for active capture session
        chrome.storage.local.get(['isCapturing', 'startTime'], function(result) {
            if (result.isCapturing && result.startTime) {
                isCapturing = true;
                startTime = result.startTime;
                startTimer();
                updateUI();
            }
        });
    }

    // Update UI based on current state
    function updateUI() {
        startBtn.style.display = isCapturing ? 'none' : 'block';
        finishBtn.style.display = isCapturing ? 'block' : 'none';
        cancelBtn.style.display = isCapturing ? 'block' : 'none';
        statusEl.textContent = isCapturing ? 'Capture in progress...' : 'Ready to capture';
        if (!isCapturing) timeRemEl.textContent = '';
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

    // Start capture
    function startCapture() {
        isCapturing = true;
        startTime = Date.now();

        chrome.storage.local.set({
            isCapturing: true,
            startTime: startTime
        }, function() {
            startTimer();
            updateUI();
            chrome.runtime.sendMessage({ action: 'startCapture' })
                .catch(err => console.log('Background script not ready:', err));
        });
    }

    // Stop capture with save option
    function stopCapture(shouldSave = false) {
        clearInterval(timerInterval);
        isCapturing = false;

        chrome.storage.local.remove(['isCapturing', 'startTime'], function() {
            updateUI();
            chrome.runtime.sendMessage({ action: 'stopCapture', shouldSave })
                .catch(err => console.log('Background script not ready:', err));

            if (shouldSave) {
                chrome.tabs.create({ url: 'save.html' });
            }
        });
    }

    // Event Listeners
    startBtn.addEventListener('click', startCapture);
    finishBtn.addEventListener('click', () => stopCapture(true));
    cancelBtn.addEventListener('click', () => stopCapture(false));

    document.getElementById("options").addEventListener("click", () => {
    chrome.runtime.openOptionsPage();
});

    // Initialize the UI
    initUI();
});
