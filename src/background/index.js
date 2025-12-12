console.log("Background loaded");

getProviders().then((providers) => {
  const GEMINI_API_KEY = providers.gemini;
  console.log('Gemini API Key:', GEMINI_API_KEY);
});

// --- Helper to send status updates to popup ---
function sendStatus(text) {
  chrome.runtime.sendMessage({ action: "updateStatus", text });
}

// Helper to get providers object from storage
function getProviders() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['providers'], (data) => {
      console.log(data.providers);
      const providers = data.providers || {
        chatgpt: null,
        gemini: null,
        claude: null,
        default: 'gemini'
      };
      resolve(providers);
    });
  });
}

async function generateSummaryInlineUsingGemini(base64Data, mimeType) {
  const providers = await getProviders(); // wait for storage
  const GEMINI_API_KEY = providers.gemini;
  if (!GEMINI_API_KEY) throw new Error("Gemini API key is not set!");

  const GENERATE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

  const requestBody = {
    contents: [
      {
        parts: [
          { inlineData: { mimeType, data: base64Data } },
          { text: "Transcribe the full audio content. After the transcription, write a concise, three-point executive summary. Format the output with the transcription first, followed by a '---' separator, and then the summary." }
        ]
      }
    ],
    generationConfig: { temperature: 0.1, maxOutputTokens: 4096 }
  };

  sendStatus("Sending audio to Gemini API...");

  const response = await fetch(GENERATE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();
  if (data.error) throw new Error(data.error.message || "Gemini API error");

  return data.candidates[0].content.parts[0].text;
}

// --- Ensure Offscreen document exists for audio capture ---
async function ensureOffscreen() {
  const contexts = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [chrome.runtime.getURL("src/offscreen/offscreen.html")],
  });
  if (contexts.length > 0) return;

  await chrome.offscreen.createDocument({
    url: "src/offscreen/offscreen.html",
    reasons: ["USER_MEDIA"],
    justification: "Record audio from tab",
  });
}

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  // 1) Start capture
  if (msg.action === "startCapture") {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab) return sendResponse({ success: false });

      console.log("Starting capture for tab", tab.id);
      await ensureOffscreen();

      const streamId = await chrome.tabCapture.getMediaStreamId({
        targetTabId: tab.id,
      });

      chrome.runtime.sendMessage({
        action: "RECORD_AUDIO",
        streamId,
        tabId: tab.id,
      });
      sendResponse({ success: true });
    } catch (err) {
      console.error("StartCapture error:", err);
      sendResponse({ success: false });
    }

    return true;
  }

  // 2) Stop capture
  if (msg.action === "stopCapture") {
    console.log("Stopping capture");
    chrome.runtime.sendMessage({
      action: "STOP_RECORDING"
    });
    sendResponse({ success: true });
    return true;
  }

  // 3) Audio is ready → send to Gemini for transcription & summary
  if (msg.action === "AUDIO_READY") {
    console.log("Background: Audio ready, sending to Gemini...");

    const { base64Data, mimeType } = msg;

    if (!base64Data) {
      console.error("No audio data received!");
      return;
    }

    chrome.runtime.sendMessage({ action: "updateStatus", text: "Sending to Gemini..." });

    try {
      const result = await generateSummaryInline(base64Data, mimeType);
      console.log(result)
      chrome.runtime.sendMessage({ action: "summaryResult", result });
    } catch (err) {
      chrome.runtime.sendMessage({ action: "error", message: err.message });
    }
  }
  return false;
});

async function createContact(data) {
  const url = 'https://rest.gohighlevel.com/v1/contacts/';
  const token = '<token>'; // Replace with your actual token

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(data) // send the JSON object as request body
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('Contact created successfully:', result);
    return result;
  } catch (error) {
    console.error('Error creating contact:', error);
    throw error;
  }
}