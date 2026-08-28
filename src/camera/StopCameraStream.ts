export function stopCameraStream(stream: MediaStream | null): void {
  if (!stream) return;
  try {
    stream.getTracks().forEach((track) => {
      if (track.readyState === 'live') {
        track.stop();
      }
    });
  } catch (err) {
    console.error('Error stopping camera stream:', err);
  }
}
