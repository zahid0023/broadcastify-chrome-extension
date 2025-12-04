document.addEventListener('DOMContentLoaded', () => {
  const encodeProgress = document.getElementById('encodeProgress');
  const saveButton = document.getElementById('downloadCustom');
  const saveDateButton = document.getElementById('downloadDate');
  const closeButton = document.getElementById('close');
  const status = document.getElementById('status');
  const previewPlayer = document.getElementById('previewPlayer');
  const filenameInput = document.getElementById('filenameInput');

  // Get audio URL from query parameters
  const urlParams = new URLSearchParams(window.location.search);
  const audioURL = urlParams.get('audio');

  if (!audioURL) {
    status.textContent = 'Error: No audio data received';
    return;
  }

  // Set up audio preview
  previewPlayer.src = audioURL;
  
  // Set default filename with current date
  const now = new Date();
  const defaultFilename = `recording-${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}.webm`;
  filenameInput.value = defaultFilename.replace('.webm', '');
  
  // Update status
  encodeProgress.style.width = '100%';
  status.textContent = 'File is ready!';

  // Setup save with custom filename
  saveButton.addEventListener('click', () => {
    const filename = filenameInput.value.trim() || 'recording';
    const fullFilename = filename.endsWith('.webm') ? filename : `${filename}.webm`;
    
    chrome.downloads.download({
      url: audioURL,
      filename: fullFilename,
      saveAs: true
    });
  });

  // Setup save with date filename
  saveDateButton.addEventListener('click', () => {
    chrome.downloads.download({
      url: audioURL,
      filename: defaultFilename,
      saveAs: true
    });
  });

  // Close button
  closeButton.addEventListener('click', () => {
    window.close();
  });

  // Show all buttons
  [saveButton, saveDateButton, closeButton].forEach(btn => {
    if (btn) btn.style.display = 'inline-block';
  });
});
