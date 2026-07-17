try {
  const AudioContext = require('web-audio-api').AudioContext;
  const ctx = new AudioContext();
  const bufferSize = ctx.sampleRate * 0.25;
  console.log("BufferSize:", bufferSize);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  console.log("Buffer created successfully.");
} catch(e) {
  console.log("Error:", e);
}
