console.log("Background loaded");

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
      action: "STOP_RECORDING",
      shouldSave: msg.shouldSave,
    });

    sendResponse({ success: true });
    return true;
  }

  // 3) Audio is ready → open save UI
  if (msg.action === "AUDIO_READY") {
    console.log("Background: AUDIO_READY", msg.audioUrl);

    // open complete.html with audio URL in query param
    chrome.tabs.create({
      url: chrome.runtime.getURL(
        `src/save/complete.html?audio=${encodeURIComponent(msg.audioUrl)}`
      ),
    });
  }
});

async function ensureOffscreen() {
  const alreadyExists = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [chrome.runtime.getURL("src/offscreen/offscreen.html")],
  });

  if (alreadyExists.length > 0) return;

  await chrome.offscreen.createDocument({
    url: "src/offscreen/offscreen.html",
    reasons: ["USER_MEDIA"],
    justification: "Record audio from tab",
  });
}

// ** IMPORTANT: REPLACE WITH YOUR ACTUAL API KEY **
const GEMINI_API_KEY = "AIzaSyCuxwOg9dvDELmcAYeXb1776SGG_kNAFW4";
// const UPLOAD_API_URL = `https://generativelanguage.googleapis.com/upload/v1beta/files?key=${GEMINI_API_KEY}`;
const GENERATE_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${GEMINI_API_KEY}`;

// Helper to send status updates back to the popup
function sendStatus(text) {
  chrome.runtime.sendMessage({ action: "updateStatus", text });
}

// 1. Uploads the Base64 data to the Gemini Files API
// async function uploadFile(base64Data, mimeType, fileName) {
//   const rawData = atob(base64Data);
//   const arrayBuffer = new ArrayBuffer(rawData.length);
//   const uint8Array = new Uint8Array(arrayBuffer);

//   // Convert base64 binary string back to raw bytes
//   for (let i = 0; i < rawData.length; i++) {
//     uint8Array[i] = rawData.charCodeAt(i);
//   }

//   // Use Blob for the file body
//   const blob = new Blob([uint8Array], { type: mimeType });

//   const response = await fetch(UPLOAD_API_URL, {
//     method: "POST",
//     headers: {
//       // Crucially, the Content-Type for the upload endpoint must be the file's MIME type
//       "Content-Type": mimeType,
//       "X-Goog-Upload-Protocol": "raw", // Use raw for simplicity
//       "X-Goog-Upload-Content-Type": mimeType,
//       "X-Goog-Upload-File-Name": fileName,
//     },
//     body: blob,
//   });

//   if (!response.ok) {
//     const errorBody = await response.json();
//     throw new Error(`File upload failed: ${errorBody.error.message}`);
//   }

//   const file = await response.json();
//   console.log("Uploaded file:", file);
//   return file; // Contains the 'uri' used for prompting
// }

// 2. Calls the Gemini model with the file URI
async function generateSummaryInline(base64Data, mimeType) {
  // ⚠️ WARNING: This JSON structure MUST use the REST API format (nested 'parts')
  // and must use 'inlineData' for direct Base64 file inclusion.
  const requestBody = {
    contents: [
      {
        parts: [
          {
            inlineData: {
              // Use inlineData for direct Base64 embedding
              mimeType: mimeType,
              data: base64Data, // The raw Base64 string from FileReader
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

  try {
    sendStatus("Sending large inline request to Gemini API...");
    const response = await fetch(GENERATE_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const data = await response.json();
    console.log("Gemini API response:", data);

    if (data.error) {
      throw new Error(data.error.message || "Gemini API error.");
    }

    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Gemini API call failed:", error);
    throw new Error(`API Request Failed: ${error.message}`);
  }
}

// 3. Deletes the file from the Files API after use (Cleanup)
async function deleteFile(fileName) {
  const DELETE_API_URL = `https://generativelanguage.googleapis.com/v1beta/files/${fileName}?key=${GEMINI_API_KEY}`;
  await fetch(DELETE_API_URL, {
    method: "DELETE",
  });
  console.log(`Cleaned up file: ${fileName}`);
}

// --- Main Message Listener ---
chrome.runtime.onMessage.addListener((message) => {
  if (message.action === "summarizeAudioInline") {
    const { base64Data, mimeType } = message;

    (async () => {
      try {
        // Step 1: Skip upload, go straight to generation
        const resultText = await generateSummaryInline(base64Data, mimeType);

        // Step 2: Send result to popup
        chrome.runtime.sendMessage({
          action: "summaryResult",
          result: resultText,
        });
      } catch (error) {
        chrome.runtime.sendMessage({ action: "error", message: error.message });
      }
    })();

    // Return true to indicate we will respond asynchronously
    return true;
  }
});
