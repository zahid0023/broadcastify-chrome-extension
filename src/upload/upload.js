document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('dropZone');
    const fileInput = document.getElementById('fileInput');
    const selectedFileDiv = document.getElementById('selectedFile');
    const transcribeBtn = document.getElementById('transcribeBtn');
    const statusContainer = document.getElementById('statusContainer');
    const progressBar = document.getElementById('progressBar');
    const statusText = document.getElementById('statusText');

    let selectedFile = null;

    // Handle drag and drop events
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    // Highlight drop zone when dragging over it
    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, highlight, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, unhighlight, false);
    });

    function highlight() {
        dropZone.classList.add('dragover');
    }

    function unhighlight() {
        dropZone.classList.remove('dragover');
    }

    // Handle dropped files
    dropZone.addEventListener('drop', handleDrop, false);
    dropZone.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleFileSelect);

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
                alert('Please select a valid audio file (MP3)');
            }
        }
    }

    function isValidFileType(file) {
        // Only allow MP3 files as per the UI
        return file.type === 'audio/mp3' || file.type === 'audio/mpeg';
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

        selectedFileDiv.style.display = 'block';

        // Add event listener to remove button
        document.getElementById('removeFile').addEventListener('click', () => {
            selectedFile = null;
            selectedFileDiv.style.display = 'none';
            fileInput.value = '';
            transcribeBtn.disabled = true;
        });
    }

    function formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Handle transcribe button click
    transcribeBtn.addEventListener('click', startTranscription);

    function startTranscription() {
        if (!selectedFile) return;

        // Show status container
        statusContainer.style.display = 'block';
        updateStatus('Uploading file...', 25);

        // TODO: Implement actual API call to AssemblyAI
        // For now, simulate progress
        simulateTranscription();
    }

    function simulateTranscription() {
        setTimeout(() => {
            updateStatus('Transcribing audio...', 50);

            setTimeout(() => {
                updateStatus('Processing transcription...', 75);

                setTimeout(() => {
                    updateStatus('Transcription complete!', 100);
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
    document.getElementById('backButton').addEventListener('click', () => {
        window.close();
    });
});
