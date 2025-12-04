let recorder = null;
let chunks = [];
let currentStream = null;
let audioContext = null;

// Clean up resources
function cleanup() {
  if (recorder && recorder.state !== 'inactive') {
    try { recorder.stop(); } catch (e) {}
  }

  if (currentStream) {
    currentStream.getTracks().forEach(track => track.stop());
    currentStream = null;
  }

  if (audioContext && audioContext.state !== 'closed') {
    try {
      audioContext.close();
    } catch (e) {}
  }

  chunks = [];
}

// Convert WebM to MP3 (placeholder)
async function convertToMp3(webmBlob) {
  return new Blob([webmBlob], { type: 'audio/mp3' });
}

chrome.runtime.onMessage.addListener(async (msg, sender, sendResponse) => {
  if (msg.action === 'RECORD_AUDIO') {
    console.log('Offscreen: RECORD_AUDIO received');

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: 'tab',
            chromeMediaSourceId: msg.streamId
          }
        }
      });

      currentStream = stream;

      const playback = new Audio();
      playback.srcObject = stream;
      playback.play().catch(console.warn);

      audioContext = new (window.AudioContext || window.webkitAudioContext)();

      const options = { mimeType: 'audio/webm;codecs=opus' };
      try {
        recorder = new MediaRecorder(stream, options);
      } catch (e) {
        recorder = new MediaRecorder(stream);
      }

      chunks = [];

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunks.push(e.data);
        }
      };

      recorder.onstop = async () => {
        try {
          const webmBlob = new Blob(chunks, { type: 'audio/webm' });
          const mp3Blob = await convertToMp3(webmBlob);
          const url = URL.createObjectURL(mp3Blob);

          chrome.runtime.sendMessage({
            action: 'AUDIO_READY',
            audioUrl: url,
            format: 'mp3',
            blob: mp3Blob
          });
        } catch (error) {
          console.error('Error in recorder.onstop:', error);
          chrome.runtime.sendMessage({
            action: 'RECORDING_ERROR',
            error: error.message
          });
        } finally {
          cleanup();
        }
      };

      recorder.start(500); // Collect data every 500ms
      console.log('Recording started');

    } catch (error) {
      console.error('Error starting recording:', error);
      cleanup();

      chrome.runtime.sendMessage({
        action: 'RECORDING_ERROR',
        error: error.message
      });
    }
  }

  if (msg.settings && msg.settings.maxTime) {
    const limitMs = msg.settings.maxTime * 60 * 1000;

    setTimeout(() => {
      if (recorder && recorder.state !== 'inactive') {
        console.log('Auto-stopping due to maxTime');
        stopRecording();
      }
    }, limitMs);
  }

  if (msg.action === 'STOP_RECORDING') {
    console.log('Offscreen: STOP_RECORDING');
    stopRecording();
  }

  return true; // Keep the message channel open for async response
});

function stopRecording() {
  if (!recorder || recorder.state === 'inactive') return;

  console.log('Stopping recording...');
  recorder.stop();
}
