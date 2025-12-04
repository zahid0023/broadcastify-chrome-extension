console.log("Background loaded");

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  // 1) Start capture
  if (msg.action === "startCapture") {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
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
