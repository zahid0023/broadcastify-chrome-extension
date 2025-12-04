document.addEventListener("DOMContentLoaded", () => {
  const dropZone = document.getElementById("dropZone");
  const fileInput = document.getElementById("fileInput");
  const selectedFileDiv = document.getElementById("selectedFile");
  const transcribeBtn = document.getElementById("transcribeBtn");
  const statusContainer = document.getElementById("statusContainer");
  const progressBar = document.getElementById("progressBar");
  const statusText = document.getElementById("statusText");

  let selectedFile = null;

  // Handle drag and drop events
  ["dragenter", "dragover", "dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  // Highlight drop zone when dragging over it
  ["dragenter", "dragover"].forEach((eventName) => {
    dropZone.addEventListener(eventName, highlight, false);
  });

  ["dragleave", "drop"].forEach((eventName) => {
    dropZone.addEventListener(eventName, unhighlight, false);
  });

  function highlight() {
    dropZone.classList.add("dragover");
  }

  function unhighlight() {
    dropZone.classList.remove("dragover");
  }

  // Handle dropped files
  dropZone.addEventListener("drop", handleDrop, false);
  dropZone.addEventListener("click", () => fileInput.click());
  fileInput.addEventListener("change", handleFileSelect);

  function handleDrop(e) {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
  }

  function handleFileSelect(e) {
    const files = e.target.files;
    handleFiles(files);
  }

  function handleFiles(files) {
    if (files.length > 0) {
      const file = files[0];
      if (isValidFileType(file)) {
        selectedFile = file;
        displaySelectedFile(file);
        transcribeBtn.disabled = false;
      } else {
        alert("Please select a valid audio file (MP3)");
      }
    }
  }

  function isValidFileType(file) {
    // Only allow MP3 files as per the UI
    return file.type === "audio/mp3" || file.type === "audio/mpeg";
  }

  function displaySelectedFile(file) {
    const fileSize = formatFileSize(file.size);

    selectedFileDiv.innerHTML = `
            <div class="file-info">
                <div class="file-icon">🎵</div>
                <div class="file-details">
                    <p class="file-name">${file.name}</p>
                    <p class="file-size">${fileSize}</p>
                </div>
                <button class="remove-file" id="removeFile">✕</button>
            </div>
        `;

    selectedFileDiv.style.display = "block";

    // Add event listener to remove button
    document.getElementById("removeFile").addEventListener("click", () => {
      selectedFile = null;
      selectedFileDiv.style.display = "none";
      fileInput.value = "";
      transcribeBtn.disabled = true;
    });
  }

  function formatFileSize(bytes) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  }

  // Handle transcribe button click
  transcribeBtn.addEventListener("click", startTranscription);

  function startTranscription() {
    if (!selectedFile) return;

    console.log("Starting transcription for file:", selectedFile);

    // Show status container
    statusContainer.style.display = "block";
    updateStatus("Uploading file...", 25);
    transcribeBtn.disabled = true;

    const reader = new FileReader();
    reader.onloadend = () => {
      // The result is a Data URL: data:[<MIME-type>][;base64],<data>
      const dataUrl = reader.result;

      // Extract only the Base64 part and the MIME type
      const [metadata, base64Data] = dataUrl.split(",");
      const mimeType = metadata.split(":")[1].split(";")[0];

      statusContainer.textContent = "Generating summary...";

      // 2. Send the Base64 data and MIME type to the Service Worker
      chrome.runtime.sendMessage({
        action: "summarizeAudioInline",
        base64Data,
        mimeType,
      });
    };

    reader.onerror = (e) => {
      statusDiv.textContent = `Error reading file: ${e.message}`;
      summarizeButton.disabled = false;
    };

    reader.readAsDataURL(selectedFile);

    // TODO: Implement actual API call to AssemblyAI
    // For now, simulate progress
    // simulateTranscription();
  }

  function simulateTranscription() {
    setTimeout(() => {
      updateStatus("Transcribing audio...", 50);

      setTimeout(() => {
        updateStatus("Processing transcription...", 75);

        setTimeout(() => {
          updateStatus("Transcription complete!", 100);
          // TODO: Redirect to results page when API is implemented
          // window.location.href = 'results.html';
        }, 2000);
      }, 2000);
    }, 1500);
  }

  function updateStatus(text, progress) {
    statusText.textContent = text;
    progressBar.style.width = `${progress}%`;
  }

  // Handle back button
  document.getElementById("backButton").addEventListener("click", () => {
    window.close();
  });

  // --- Message Listener for Service Worker Feedback ---
  chrome.runtime.onMessage.addListener((message) => {
    if (message.action === "updateStatus") {
      statusContainer.textContent = message.text;
    } else if (message.action === "summaryResult") {
      statusContainer.innerHTML = `
        <div>${message.result}</div>
        <button id="downloadBtn" style="margin-top: 10px; padding: 8px 16px; background-color: #4CAF50; color: white; border: none; border-radius: 4px; cursor: pointer;">
          Download Transcription
        </button>
      `;
      transcribeBtn.disabled = false;

      // Add click handler for download button
      document.getElementById("downloadBtn").addEventListener("click", () => {
        const blob = new Blob([message.result], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `transcription_${new Date()
          .toISOString()
          .slice(0, 10)}.txt`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });
      // statusContainer.textContent = "✅ Finished processing.";
    } else if (message.action === "error") {
      statusContainer.textContent = `ERROR: ${message.message}`;
      transcribeBtn.disabled = false;
      statusContainer.textContent = "🛑 An error occurred.";
    }
  });
});
