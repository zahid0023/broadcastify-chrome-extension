document.addEventListener("DOMContentLoaded", () => {
  const muteCheckbox = document.getElementById("mute");
  const maxTimeInput = document.getElementById("maxTime");
  const removeLimitCheckbox = document.getElementById("removeLimit");
  const qualitySelect = document.getElementById("quality");
  const saveButton = document.getElementById("save");
  const status = document.getElementById("status");

  // Load saved settings
  chrome.storage.sync.get(
    {
      muteTab: false,
      maxTime: 30,            
      limitRemoved: false,
      format: "mp3",
      quality: 192
    },
    (data) => {
      muteCheckbox.checked = data.muteTab;
      maxTimeInput.value = data.maxTime;
      removeLimitCheckbox.checked = data.limitRemoved;
      qualitySelect.value = data.quality;
    }
  );

  // Save settings
  saveButton.addEventListener("click", () => {
    let maxTimeVal = parseInt(maxTimeInput.value);

    if (!removeLimitCheckbox.checked) {
      if (isNaN(maxTimeVal) || maxTimeVal < 1 || maxTimeVal > 30) {
        status.textContent = "Enter a valid time from 1–30 minutes.";
        return;
      }
    }

    chrome.storage.sync.set(
      {
        muteTab: muteCheckbox.checked,
        maxTime: removeLimitCheckbox.checked ? 30 : maxTimeVal,
        limitRemoved: removeLimitCheckbox.checked,
        format: "mp3", // ALWAYS mp3
        quality: parseInt(qualitySelect.value)
      },
      () => {
        status.textContent = "Settings saved!";
        setTimeout(() => (status.textContent = ""), 1500);
      }
    );
  });
});
