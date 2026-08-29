import { useEffect, useRef } from 'react';
import { useVisionDebugStats, useVisionFrameRef } from '../useVisionEngine';

const SKELETON_PAIRS = [
  ['left_shoulder', 'right_shoulder'],
  ['left_shoulder', 'left_elbow'],
  ['left_elbow', 'left_wrist'],
  ['right_shoulder', 'right_elbow'],
  ['right_elbow', 'right_wrist'],
  ['left_shoulder', 'left_hip'],
  ['right_shoulder', 'right_hip'],
  ['left_hip', 'right_hip'],
  ['left_hip', 'left_knee'],
  ['left_knee', 'left_ankle'],
  ['right_hip', 'right_knee'],
  ['right_knee', 'right_ankle'],
];

interface VisionDebugOverlayProps {
  requiredPlayers: 1 | 2;
  showCanvas?: boolean;
}

/**
 * Development-only vision HUD: live stats panel + bounding boxes / IDs /
 * skeletons drawn straight from the engine's frame ref, on its own
 * animation-frame loop — no React re-render per frame.
 */
export default function VisionDebugOverlay({ requiredPlayers, showCanvas = true }: VisionDebugOverlayProps) {
  const stats = useVisionDebugStats(requiredPlayers);
  const frameRef = useVisionFrameRef();
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!showCanvas) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let rafId: number;

    const draw = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
      const { width, height } = canvas;
      ctx.clearRect(0, 0, width, height);

      const mirrorX = (x: number) => width * (1 - x);

      frameRef.current.players.forEach((player) => {
        const color = player.playerIndex === 1 ? '#7c3aed' : '#ff5757';
        const isLost = player.trackingState === 'lost';
        ctx.globalAlpha = isLost ? 0.4 : 1;

        const boxW = player.boundingBox.width * width;
        const boxH = player.boundingBox.height * height;
        const boxX = mirrorX(player.boundingBox.x + player.boundingBox.width);
        const boxY = player.boundingBox.y * height;

        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.setLineDash(isLost ? [4, 4] : []);
        ctx.strokeRect(boxX, boxY, boxW, boxH);
        ctx.setLineDash([]);

        const label = `${player.id.toUpperCase()} ${Math.round(player.confidence * 100)}%${isLost ? ' (LOST)' : ''}`;
        ctx.font = '900 11px monospace';
        ctx.fillStyle = color;
        const textW = ctx.measureText(label).width;
        ctx.fillRect(boxX, boxY - 16, textW + 8, 16);
        ctx.fillStyle = '#fff';
        ctx.fillText(label, boxX + 4, boxY - 4);

        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        SKELETON_PAIRS.forEach(([a, b]) => {
          const j1 = player.bodyLandmarks.find((lm) => lm.name === a);
          const j2 = player.bodyLandmarks.find((lm) => lm.name === b);
          if (j1 && j2 && j1.visibility > 0.3 && j2.visibility > 0.3) {
            ctx.moveTo(mirrorX(j1.x), j1.y * height);
            ctx.lineTo(mirrorX(j2.x), j2.y * height);
          }
        });
        ctx.stroke();

        ctx.globalAlpha = 1;
      });

      rafId = requestAnimationFrame(draw);
    };

    rafId = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafId);
  }, [frameRef, showCanvas]);

  return (
    <>
      {showCanvas && (
        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none z-10" />
      )}
      <div className="absolute bottom-2 left-2 bg-slate-900/90 text-white font-mono text-[9px] p-2.5 rounded-xl border border-slate-700 z-50 text-left pointer-events-none select-none flex flex-col gap-0.5 shadow-lg min-w-[150px]">
        <div className="font-bold text-brand-yellow mb-0.5 border-b border-slate-700 pb-0.5">VISION DEBUG</div>
        <div>CAMERA: <span className={stats.cameraReady ? 'text-green-400 font-bold' : 'text-red-400'}>{stats.cameraReady ? 'READY' : 'NOT READY'}</span></div>
        <div>RESOLUTION: {stats.resolutionWidth}x{stats.resolutionHeight}</div>
        <div>VISION: <span className={stats.visionRunning ? 'text-green-400 font-bold' : 'text-red-400'}>{stats.visionRunning ? 'RUNNING' : 'STOPPED'}</span></div>
        <div>FPS: {stats.fps}</div>
        <div>PERSON DETECTIONS: {stats.personDetectionCount}</div>
        <div>TRACKED PLAYERS: {stats.trackedPlayerCount}</div>
        {stats.players.map((p) => (
          <div key={p.id} className="pl-2">
            {p.id.toUpperCase()}: conf {p.confidence.toFixed(2)} · <span className={p.trackingState === 'tracked' ? 'text-green-400' : 'text-yellow-400'}>{p.trackingState.toUpperCase()}</span>
          </div>
        ))}
        <div>REQUIRED: {stats.requiredPlayers}</div>
        <div>GAME READY: <span className={stats.gameReady ? 'text-green-400 font-bold' : 'text-red-400'}>{stats.gameReady ? 'YES' : 'NO'}</span></div>
      </div>
    </>
  );
}
