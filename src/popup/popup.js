document.addEventListener("DOMContentLoaded", function () {
  // Screen management
  let currentScreen = null;
  const loginScreenEl = document.getElementById("login-screen");
  const captureScreenEl = document.getElementById("capture-screen");

  // Load screen HTML files
  async function loadScreen(screenName) {
    const screenEl = screenName === "login" ? loginScreenEl : captureScreenEl;
    const htmlPath =
      screenName === "login"
        ? chrome.runtime.getURL("src/popup/screens/login/login.html")
        : chrome.runtime.getURL("src/popup/screens/capture/capture.html");
    const cssPath =
      screenName === "login"
        ? chrome.runtime.getURL("src/popup/screens/login/login.css")
        : chrome.runtime.getURL("src/popup/screens/capture/capture.css");

    try {
      const response = await fetch(htmlPath);
      const html = await response.text();
      screenEl.innerHTML = html;

      // Load CSS
      const existingLink = document.querySelector(
        `link[data-screen="${screenName}"]`
      );
      if (!existingLink) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = cssPath;
        link.setAttribute("data-screen", screenName);
        document.head.appendChild(link);
      }

      return screenEl;
    } catch (error) {
      console.error(`Error loading ${screenName} screen:`, error);
      return null;
    }
  }

  // Show a specific screen
  async function showScreen(screenName) {
    // Hide all screens
    loginScreenEl.style.display = "none";
    captureScreenEl.style.display = "none";

    // Load and show the requested screen
    const screenEl = await loadScreen(screenName);
    if (screenEl) {
      screenEl.style.display = "block";
      currentScreen = screenName;

      // Initialize screen-specific functionality
      if (screenName === "login") {
        initLoginScreen();
      } else if (screenName === "capture") {
        initCaptureScreen();
      }
    }
  }

  // Check authentication status
  function checkAuthStatus(callback) {
    chrome.storage.local.get(["isLoggedIn"], function (result) {
      const isLoggedIn = result.isLoggedIn === true;
      callback(isLoggedIn);
    });
  }

  // Initialize login screen
  function initLoginScreen() {
    const loginForm = document.getElementById("login-form");
    const errorEl = document.getElementById("login-error");
    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");

    if (loginForm) {
      loginForm.addEventListener("submit", async function (e) {
        e.preventDefault();

        const username = usernameInput.value.trim();
        const password = passwordInput.value.trim();

        // Hide previous errors
        errorEl.style.display = "none";

        // Basic validation
        if (!username || !password) {
          errorEl.textContent = "Please enter both username and password.";
          errorEl.style.display = "block";
          return;
        }

        // Disable button during login
        const loginButton = loginForm.querySelector(".login-button");
        loginButton.disabled = true;
        loginButton.textContent = "Logging in...";

        // Simulate login (basic validation for now)
        // In the future, this can be replaced with actual API call
        setTimeout(() => {
          // Store authentication state
          chrome.storage.local.set(
            {
              isLoggedIn: true,
              username: username,
            },
            function () {
              // Switch to capture screen
              showScreen("capture");
            }
          );
        }, 500);
      });
    }
  }

  // Initialize capture screen
  function initCaptureScreen() {
    // UI Elements
    const startBtn = document.getElementById("start");
    const finishBtn = document.getElementById("finish");
    const cancelBtn = document.getElementById("cancel");
    const statusEl = document.getElementById("status");
    const timeRemEl = document.getElementById("timeRem");

    if (!startBtn || !finishBtn || !cancelBtn || !statusEl || !timeRemEl) {
      console.error("Capture screen elements not found");
      return;
    }

    // State variables
    let isCapturing = false;
    let startTime;
    let timerInterval;
    const MAX_CAPTURE_TIME = 30 * 60 * 1000; // 30 minutes in milliseconds

    /**
     * Initialize the UI components
     */
    function initUI() {
      updateUI();

      // Check for active capture session
      chrome.storage.local.get(["isCapturing", "startTime"], function (result) {
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
      startBtn.style.display = isCapturing ? "none" : "block";
      finishBtn.style.display = isCapturing ? "block" : "none";
      cancelBtn.style.display = isCapturing ? "block" : "none";
      statusEl.textContent = isCapturing
        ? "Capture in progress..."
        : "Ready to capture";
      if (!isCapturing) timeRemEl.textContent = "";
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
      timeRemEl.textContent = `Time remaining: ${minutes}:${seconds
        .toString()
        .padStart(2, "0")}`;
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
     * @param {boolean} save - Whether to save the captured audio
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
  }

  // Initialize app - check auth and show appropriate screen
  checkAuthStatus(function (isLoggedIn) {
    if (isLoggedIn) {
      showScreen("capture");
    } else {
      showScreen("login");
    }
  });
});

chrome.runtime.onMessage.addListener((msg) => {
  console.log("OK!!");
  if (msg.action === "summaryResult") {
    const result = msg.result;

    // Update status - make sure we're on capture screen
    const statusEl = document.getElementById("status");
    if (statusEl) {
      statusEl.textContent = "Summary ready!";
    }

    // Automatically trigger Save As dialog
    const blob = new Blob([result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);

    chrome.downloads.download(
      {
        url: url,
        filename: "transcription_summary.txt",
        saveAs: true, // <-- this opens the "Save As" dialog automatically
      },
      (downloadId) => {
        if (chrome.runtime.lastError) {
          console.error("Download failed:", chrome.runtime.lastError);
        } else {
          console.log("Download started with ID:", downloadId);
        }
        URL.revokeObjectURL(url); // Clean up
      }
    );
  }

  if (msg.action === "updateStatus") {
    const statusEl = document.getElementById("status");
    if (statusEl) {
      statusEl.textContent = msg.text;
    }
  }
});
