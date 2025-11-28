export default defineBackground(() => {
  console.log("Background loaded");

  chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
    if (msg.type === "START_RECORDING") {
      getCurrentTab().then((tab) => {
        if (tab?.id != null) {
          startCaptureForTab(tab.id)
            .then(() => sendResponse(true))
            .catch((err) => {
              console.error(err);
              sendResponse(false);
            });
        } else {
          sendResponse(false);
        }
      });

      return true; // keep listener async
    }
  });
});

/** Get current tab */
async function getCurrentTab(): Promise<chrome.tabs.Tab | undefined> {
  const [tab] = await chrome.tabs.query({
    active: true,
    currentWindow: true,
  });
  return tab;
}

/** Offscreen document setup */
let creatingOffscreen: Promise<void> | null = null;

async function setupOffscreenDocument(path: string) {
  const url = chrome.runtime.getURL(path);

  const existing = await chrome.runtime.getContexts({
    contextTypes: ["OFFSCREEN_DOCUMENT"],
    documentUrls: [url],
  });

  if (existing.length > 0) return;

  if (creatingOffscreen) {
    await creatingOffscreen;
    return;
  }

  creatingOffscreen = chrome.offscreen.createDocument({
    url: path,
    reasons: ["USER_MEDIA"],
    justification: "Recording tab audio",
  });

  await creatingOffscreen;
  creatingOffscreen = null;
}

/** Start audio capture */
async function startCaptureForTab(tabId: number) {
  const key = tabId.toString();

  // Prevent double capture
  const stored = await chrome.storage.local.get(key);
  if (stored && Object.keys(stored).length > 0) return;

  await setupOffscreenDocument("offscreen.html");

  await chrome.storage.local.set({ [key]: Date.now() });

  const opts = await chrome.storage.sync.get({
    maxTime: 1800000,
    muteTab: false,
    format: "webm",
    quality: 192,
    limitRemoved: false,
  });

  const streamId = await chrome.tabCapture.getMediaStreamId({
    targetTabId: tabId,
  });

  chrome.runtime.sendMessage({
    action: "audioCapture",
    data: [
      opts.maxTime,
      opts.muteTab,
      opts.format,
      opts.quality,
      opts.limitRemoved,
      streamId,
      tabId,
    ],
  });
}