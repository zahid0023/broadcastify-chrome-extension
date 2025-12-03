importScripts("/../encoders/libmp3lame.min.js");

let mp3Encoder = null;
let mp3Data = [];
let sampleRate = 44100;
let numChannels = 1;
let bitRate = 192;

function floatTo16BitPCM(float32Array) {
  const len = float32Array.length;
  const int16Array = new Int16Array(len);
  for (let i = 0; i < len; i++) {
    let s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16Array;
}

self.onmessage = function (e) {
  const msg = e.data;

  switch (msg.command) {
    case "init": {
      const cfg = msg.config || {};
      const opts = msg.options || {};

      sampleRate = cfg.sampleRate || 44100;
      numChannels = cfg.numChannels || 1;
      bitRate = (opts.mp3 && opts.mp3.bitRate) || 192;


      const encoderLib = self.lamejs || self.Lame || self.lame || {};
      const Mp3Encoder = encoderLib.Mp3Encoder || encoderLib.Encoder;

      mp3Encoder = new Mp3Encoder(numChannels, sampleRate, bitRate);
      mp3Data = [];

      postMessage({ command: "loaded" });
      break;
    }

    case "record": {

      const firstChannel = msg.buffer[0];
      const samples = floatTo16BitPCM(firstChannel);
      const chunk = mp3Encoder.encodeBuffer(samples);
      if (chunk && chunk.length) {
        mp3Data.push(chunk);
      }

      break;
    }

    case "finish": {
      const flush = mp3Encoder.flush();
      if (flush && flush.length) {
        mp3Data.push(flush);
      }
      const blob = new Blob(mp3Data, { type: "audio/mpeg" });
      mp3Encoder = null;
      mp3Data = [];
      postMessage({ command: "complete", blob });
      break;
    }

    case "cancel": {
      mp3Encoder = null;
      mp3Data = [];
      postMessage({ command: "timeout" });
      break;
    }
  }
};