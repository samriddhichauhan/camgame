import { useEffect, useRef } from 'react';
import type { TrackedPlayer } from '../vision/types/VisionTypes';

interface DetectedPlayerOverlayProps {
  players: TrackedPlayer[];
}

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
  ['right_knee', 'right_ankle']
];

export default function DetectedPlayerOverlay({ players }: DetectedPlayerOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Synchronize canvas dimensions with physical container sizing
    const resizeCanvas = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const width = canvas.width;
    const height = canvas.height;

    // Clear previous frames
    ctx.clearRect(0, 0, width, height);

    // Map raw camera coordinates (0 to 1) into mirrored screen coordinates
    const getScreenCoords = (x: number, y: number) => {
      return {
        x: width * (1 - x), // Mirrors horizontally so canvas overlays CSS-mirrored video
        y: height * y
      };
    };

    players.forEach((player) => {
      // Determine theme colors based on player indexes (P1 Purple, P2 Coral)
      const color = player.playerIndex === 1 ? '#7c3aed' : '#ff5757';
      const isLost = player.trackingState === 'lost';
      ctx.globalAlpha = isLost ? 0.4 : 1;

      // 1. Draw Bounding Box
      const boxWidth = player.boundingBox.width * width;
      const boxHeight = player.boundingBox.height * height;
      const screenBoxX = width * (1 - (player.boundingBox.x + player.boundingBox.width));
      const screenBoxY = height * player.boundingBox.y;

      ctx.beginPath();
      ctx.setLineDash(isLost ? [3, 3] : [5, 5]);
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.strokeRect(screenBoxX, screenBoxY, boxWidth, boxHeight);
      ctx.setLineDash([]); // Reset dash state

      // 2. Draw Bounding Box Badge Label
      ctx.fillStyle = color;
      const labelText = `PLAYER ${player.playerIndex}${isLost ? ' (LOST)' : ''}`;
      ctx.font = '900 10px Outfit, sans-serif';
      const textWidth = ctx.measureText(labelText).width;
      const paddingX = 6;
      const badgeW = textWidth + paddingX * 2;
      const badgeH = 16;
      const badgeX = screenBoxX + 6;
      const badgeY = screenBoxY - 8;

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 4);
      } else {
        ctx.rect(badgeX, badgeY, badgeW, badgeH);
      }
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.fillText(labelText, badgeX + paddingX, badgeY + 11);

      // 3. Draw Skeleton Bones
      ctx.beginPath();
      ctx.strokeStyle = color + '80'; // 50% opacity
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';

      SKELETON_PAIRS.forEach(([p1Name, p2Name]) => {
        const j1 = player.bodyLandmarks.find(lm => lm.name === p1Name);
        const j2 = player.bodyLandmarks.find(lm => lm.name === p2Name);

        if (j1 && j2 && j1.visibility > 0.35 && j2.visibility > 0.35) {
          const s1 = getScreenCoords(j1.x, j1.y);
          const s2 = getScreenCoords(j2.x, j2.y);
          ctx.moveTo(s1.x, s1.y);
          ctx.lineTo(s2.x, s2.y);
        }
      });
      ctx.stroke();

      // 4. Draw Skeleton Joint Dots
      player.bodyLandmarks.forEach((lm) => {
        const isKeyJoint = [
          'nose', 'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
          'left_wrist', 'right_wrist', 'left_hip', 'right_hip', 'left_knee',
          'right_knee', 'left_ankle', 'right_ankle'
        ].includes(lm.name);

        if (isKeyJoint && lm.visibility > 0.35) {
          const s = getScreenCoords(lm.x, lm.y);

          // Outer glowing ring
          ctx.beginPath();
          ctx.arc(s.x, s.y, 5, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();

          // Inner white dot
          ctx.beginPath();
          ctx.arc(s.x, s.y, 2.5, 0, 2 * Math.PI);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }
      });

      ctx.globalAlpha = 1;
    });

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [players]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
    />
  );
}
