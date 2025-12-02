chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  console.log("Content script received:", msg);
});