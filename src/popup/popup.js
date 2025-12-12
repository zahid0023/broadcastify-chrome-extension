document.addEventListener('DOMContentLoaded', function () {
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
        chrome.storage.local.get(['isCapturing', 'startTime'], function (result) {
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
        }, function () {
            startTimer();
            updateUI();
            chrome.runtime.sendMessage({ action: 'startCapture' })
                .catch(err => console.log('Background script not ready:', err));
        });
    }

    // Stop capture with optional save (no local save needed anymore)
    function stopCapture() {
        clearInterval(timerInterval);
        isCapturing = false;

        chrome.storage.local.remove(['isCapturing', 'startTime'], function () {
            updateUI();
            chrome.runtime.sendMessage({ action: 'stopCapture' })
                .catch(err => console.log('Background script not ready:', err));
        });
    }

    // Event Listeners
    startBtn.addEventListener('click', startCapture);
    finishBtn.addEventListener('click', () => stopCapture(true));
    cancelBtn.addEventListener('click', () => stopCapture(false));

    // Initialize the UI
    initUI();
});

chrome.runtime.onMessage.addListener((msg) => {
    console.log("OK!!")
    if (msg.action === "summaryResult") {
        const result = msg.result;

        // Update status
        const statusEl = document.getElementById("status");
        statusEl.textContent = "Summary ready!";

        // Automatically trigger Save As dialog
        const blob = new Blob([result], { type: "text/plain" });
        const url = URL.createObjectURL(blob);

        chrome.downloads.download({
            url: url,
            filename: "transcription_summary.txt",
            saveAs: true // <-- this opens the "Save As" dialog automatically
        }, (downloadId) => {
            if (chrome.runtime.lastError) {
                console.error("Download failed:", chrome.runtime.lastError);
            } else {
                console.log("Download started with ID:", downloadId);
            }
            URL.revokeObjectURL(url); // Clean up
        });
    }

    if (msg.action === "updateStatus") {
        document.getElementById("status").textContent = msg.text;
    }
});
