import { useEffect, useRef } from 'react';

interface CameraPreviewProps {
  stream: MediaStream | null;
}

export default function CameraPreview({ stream }: CameraPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videoElement = videoRef.current;
    if (!videoElement) return;

    if (stream) {
      videoElement.srcObject = stream;
    } else {
      videoElement.srcObject = null;
    }
  }, [stream]);

  return (
    <div className="relative w-full h-full bg-slate-950 rounded-2xl overflow-hidden border-[3px] border-slate-950 flex items-center justify-center shadow-chunky aspect-[4/3] max-h-[42vh] sm:max-h-[48vh]">
      {stream ? (
        <>
          {/* Mirrored Video Stream */}
          <video
            id="vybe-webcam-video"
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover select-none pointer-events-none"
            style={{ transform: 'scaleX(-1)' }}
          />

          {/* Viewfinder Target Guidelines Overlay */}
          <div className="absolute inset-0 border-[2px] border-white/20 rounded-xl pointer-events-none p-3 sm:p-4 flex flex-col justify-between">
            {/* Live Indicator */}
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-1.5 px-2.5 py-1 bg-red-500 text-white rounded-full text-[9px] font-mono font-bold tracking-wider shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                <span>LIVE FEED</span>
              </div>
              <div className="text-[9px] font-mono font-bold text-white/50 tracking-wider">
                1280x720 • 30FPS
              </div>
            </div>

            {/* Central Guidance Lines */}
            <div className="absolute inset-0 flex items-center justify-center opacity-25">
              {/* Central crosshair */}
              <div className="w-5 h-[1.5px] bg-white" />
              <div className="h-5 w-[1.5px] bg-white" />
              
              {/* Left Player Spot (dashed circle outline) */}
              <div className="absolute left-[12%] w-[32%] h-[65%] border-2 border-dashed border-white rounded-full" />
              {/* Right Player Spot (dashed circle outline) */}
              <div className="absolute right-[12%] w-[32%] h-[65%] border-2 border-dashed border-white rounded-full" />
            </div>

            {/* Viewfinder HUD Framing Corners */}
            <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-white/60 rounded-tl" />
            <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-white/60 rounded-tr" />
            <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-white/60 rounded-bl" />
            <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-white/60 rounded-br" />

            {/* Placement guidelines text */}
            <div className="w-full text-center text-[9px] sm:text-[10px] font-display font-black text-white/80 tracking-widest uppercase mt-auto bg-black/45 py-1.5 rounded-xl backdrop-blur-xs">
              Fit both players inside the circles
            </div>
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center justify-center text-center p-6 text-slate-400 select-none">
          <div className="w-12 h-12 rounded-full border-4 border-dashed border-brand-purple animate-spin mb-4" />
          <span className="font-mono text-xs font-bold uppercase tracking-wider text-slate-500">
            Waiting for camera feed...
          </span>
        </div>
      )}
    </div>
  );
}
