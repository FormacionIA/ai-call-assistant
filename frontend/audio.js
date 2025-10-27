const audioRecorder = (() => {
  let mediaStream;
  let mediaRecorder;
  let chunkHandler;

  async function start(onChunkReady) {
    chunkHandler = onChunkReady;

    mediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

    mediaRecorder = new MediaRecorder(mediaStream, {
      mimeType: "audio/webm",
      audioBitsPerSecond: 48000,
    });

    mediaRecorder.addEventListener("dataavailable", async (ev) => {
      if (ev.data && ev.data.size > 0) {
        chunkHandler(ev.data);
      }
    });

    mediaRecorder.start(2000); // cada 2 segundos
  }

  function stop() {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    if (mediaStream) {
      mediaStream.getTracks().forEach((t) => t.stop());
    }
  }

  return { start, stop };
})();
