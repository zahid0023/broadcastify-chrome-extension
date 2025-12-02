console.log("Background loaded");

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {

  if (msg.action === "startCapture") {
    try {
      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      if (!tab) return sendResponse({ success: false });

      console.log("Starting capture for tab", tab.id);

      // Create offscreen if missing
      await ensureOffscreen();

      // Create stream ID
      const streamId = await chrome.tabCapture.getMediaStreamId({
        targetTabId: tab.id
      });

      // Tell offscreen to start recording
      chrome.runtime.sendMessage({
        action: "RECORD_AUDIO",
        streamId,
        tabId: tab.id
      });

      sendResponse({ success: true });

    } catch (err) {
      console.error("StartCapture error:", err);
      sendResponse({ success: false });
    }

    return true; // async
  }

  if (msg.action === "stopCapture") {
    console.log("Stopping capture");

    chrome.runtime.sendMessage({
      action: "STOP_RECORDING",
      shouldSave: msg.shouldSave
    });

    if (msg.shouldSave) {
    chrome.tabs.create({
      url: chrome.runtime.getURL("src/save/complete.html")
    });
  }

    sendResponse({ success: true });
    return true;
  }
});

async function ensureOffscreen() {
  const alreadyExists = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [chrome.runtime.getURL("src/offscreen/offscreen.html")]
  });

  if (alreadyExists.length > 0) return;

  await chrome.offscreen.createDocument({
    url: "src/offscreen/offscreen.html",
    reasons: ["USER_MEDIA"],
    justification: "Record audio from tab"
  });
}
