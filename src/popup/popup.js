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
