console.log("Offscreen loaded");

chrome.runtime.onMessage.addListener((msg) => {
  if (msg.action === "audioCapture") {
    console.log("Offscreen received:", msg.data);
  }
});
