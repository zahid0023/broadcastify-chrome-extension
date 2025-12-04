console.log("Background loaded");

// --- Configuration ---
const GEMINI_API_KEY = "AIzaSyCuxwOg9dvDELmcAYeXb1776SGG_kNAFW4";
const GENERATE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// --- Helper to send status updates to popup ---
function sendStatus(text) {
  chrome.runtime.sendMessage({ action: "updateStatus", text });
}

// --- Generate transcription + summary using Gemini ---
async function generateSummaryInline(base64Data, mimeType) {
  const requestBody = {
    contents: [
      {
        parts: [
          {
            inlineData: {
              mimeType,
              data: base64Data,
            },
          },
          {
            text: "Transcribe the full audio content. After the transcription, write a concise, three-point executive summary. Format the output with the transcription first, followed by a '---' separator, and then the summary.",
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 4096,
    },
  };

  sendStatus("Sending audio to Gemini API...");

  const response = await fetch(GENERATE_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
  });

  const data = await response.json();
  console.log("Gemini API response:", data);

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