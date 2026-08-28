export type CameraErrorType = 
  | 'PERMISSION_DENIED'
  | 'NO_CAMERA_FOUND'
  | 'CAMERA_IN_USE'
  | 'BROWSER_UNSUPPORTED'
  | 'UNKNOWN_ERROR';

export function getFriendlyCameraErrorMessage(errorType: CameraErrorType): string {
  switch (errorType) {
    case 'PERMISSION_DENIED':
      return 'Camera access was blocked. Please enable camera permissions in your browser settings and try again.';
    case 'NO_CAMERA_FOUND':
      return 'No camera found. VYBE needs a webcam connected to continue.';
    case 'CAMERA_IN_USE':
      return 'Your camera is already in use by another application. Please close it and try again.';
    case 'BROWSER_UNSUPPORTED':
      return 'Your browser does not support webcam access. Please try a modern browser like Chrome or Safari.';
    case 'UNKNOWN_ERROR':
    default:
      return 'Something went wrong with the camera connection. Please try again.';
  }
}
