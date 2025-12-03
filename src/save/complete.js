document.addEventListener("DOMContentLoaded", () => {
  const encodeProgress = document.getElementById("encodeProgress");
  const saveCustomBtn = document.getElementById("downloadCustom");
  const saveDateBtn = document.getElementById("downloadDate");
  const closeBtn = document.getElementById("close");
  const status = document.getElementById("status");
  const previewPlayer = document.getElementById("previewPlayer");
  const filenameInput = document.getElementById("filenameInput");

  const params = new URLSearchParams(window.location.search);
  const audioUrl = params.get("audio");

  if (!audioUrl) {
    status.textContent = "No audio file found. Please try recording again.";
    saveCustomBtn.style.display = "none";
    saveDateBtn.style.display = "none";
    return;
  }

  // Hide save buttons until encoding is done
  saveCustomBtn.style.display = "none";
  saveDateBtn.style.display = "none";
  previewPlayer.style.display = "none";

  status.textContent = "Please wait...";

  /** --------------------------------
   *   🔵 Smooth Fake Encoding Animation
   * --------------------------------*/
  let progress = 0;
  const duration = 1500; // total animation time (ms)
  const stepTime = 20;   // update every 20ms
  const increment = 100 / (duration / stepTime);

  const ani = setInterval(() => {
    progress += increment;

    if (progress >= 100) {
      progress = 100;
      encodeProgress.style.width = "100%";

      clearInterval(ani);
      onEncodingComplete();
    } else {
      encodeProgress.style.width = progress + "%";
    }
  }, stepTime);

  /** --------------------------------
   *  🔵 Once “encoding” is done
   * --------------------------------*/
  function onEncodingComplete() {
    status.textContent = "File is ready!";

    // Show audio preview
    previewPlayer.src = audioUrl;
    previewPlayer.style.display = "block";

    // Show save options
    saveCustomBtn.style.display = "inline-block";
    saveDateBtn.style.display = "inline-block";

    // Generate default filename
    const today = new Date().toISOString().slice(0, 10);
    const defaultBase = `Capture-${today}`;
    filenameInput.value = defaultBase;

    function ensureExt(name) {
      if (!name.toLowerCase().endsWith(".webm")) return name + ".webm";
      return name;
    }

    saveCustomBtn.onclick = () => {
      let base = filenameInput.value.trim() || defaultBase;
      chrome.downloads.download({
        url: audioUrl,
        filename: ensureExt(base),
        saveAs: true
      });
    };

    saveDateBtn.onclick = () => {
      chrome.downloads.download({
        url: audioUrl,
        filename: `${defaultBase}.webm`,
        saveAs: true
      });
    };
  }

  /** Close page */
  closeBtn.addEventListener("click", () => {
    chrome.tabs.getCurrent((tab) => {
      chrome.tabs.remove(tab.id);
    });
  });
});
