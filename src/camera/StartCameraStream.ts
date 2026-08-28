export async function startCameraStream(): Promise<MediaStream> {
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    throw new Error('BROWSER_UNSUPPORTED');
  }
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: 'user',
      },
      audio: false,
    });
    return stream;
  } catch (err: any) {
    if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
      throw new Error('PERMISSION_DENIED');
    } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
      throw new Error('NO_CAMERA_FOUND');
    } else if (err.name === 'NotReadableError' || err.name === 'TrackStartError') {
      throw new Error('CAMERA_IN_USE');
    } else {
      throw new Error('UNKNOWN_ERROR');
    }
  }
}
