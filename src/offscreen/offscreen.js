console.log("Offscreen loaded");

let recorder = null;
let chunks = [];
let currentStream = null;

chrome.runtime.onMessage.addListener(async (msg) => {
  if (msg.action === "RECORD_AUDIO") {
    console.log("Offscreen: RECORD_AUDIO received");

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: "tab",
          chromeMediaSourceId: msg.streamId
        }
      }
    });

    currentStream = stream;

    //  Keep tab audio audible
    const playback = new Audio();
    playback.srcObject = stream;
    playback.play().catch(err =>
      console.warn("Offscreen playback blocked:", err)
    );

    recorder = new MediaRecorder(stream);
    chunks = [];

    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };

    recorder.onstop = () => {
      const blob = new Blob(chunks, { type: "audio/webm" });
      const url = URL.createObjectURL(blob);
      console.log("Recording completed:", url);

      chrome.runtime.sendMessage({
        action: "AUDIO_READY",
        audioUrl: url
      });
    };

    recorder.start(500);
    console.log("Recording started");
  }

  if (msg.action === "STOP_RECORDING") {
    console.log("Offscreen: STOP_RECORDING");

    if (recorder && recorder.state !== "inactive") {
      recorder.stop();
      currentStream.getTracks().forEach((t) => t.stop());
    }
  }
});
