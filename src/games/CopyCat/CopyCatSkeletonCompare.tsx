import { useEffect, useRef } from 'react';
import type { BodyLandmark } from '../../vision/types/VisionTypes';

interface CopyCatSkeletonCompareProps {
  leaderPose: BodyLandmark[] | null;
  copyPose: BodyLandmark[] | null;
  leaderColor: string;
  copyColor: string;
  leaderName: string;
  copyName: string;
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

export default function CopyCatSkeletonCompare({
  leaderPose,
  copyPose,
  leaderColor,
  copyColor,
  leaderName,
  copyName
}: CopyCatSkeletonCompareProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

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

    ctx.clearRect(0, 0, width, height);

    // Drawing helper for a single skeleton centered in a target region
    const drawPose = (
      pose: BodyLandmark[],
      centerXOffset: number,
      color: string,
      label: string
    ) => {
      // Find center and size of pose for auto-centering and scaling
      let minX = 1, maxX = 0, minY = 1, maxY = 0;
      let sumX = 0, sumY = 0, count = 0;

      pose.forEach((lm) => {
        if (lm.visibility > 0.25) {
          if (lm.x < minX) minX = lm.x;
          if (lm.x > maxX) maxX = lm.x;
          if (lm.y < minY) minY = lm.y;
          if (lm.y > maxY) maxY = lm.y;
          sumX += lm.x;
          sumY += lm.y;
          count++;
        }
      });

      if (count === 0) return;

      const bodyCenterX = sumX / count;
      const bodyCenterY = sumY / count;
      const bodyHeight = Math.max(0.01, maxY - minY);

      // Scale to fit half height comfortably
      const scale = (height * 0.5) / bodyHeight;

      // Coordinate mapper
      const getDrawCoords = (lm: BodyLandmark) => {
        return {
          x: centerXOffset + (lm.x - bodyCenterX) * scale,
          y: (height * 0.5) + (lm.y - bodyCenterY) * scale
        };
      };

      // Draw Label Badge
      ctx.fillStyle = color;
      ctx.font = '900 11px Outfit, sans-serif';
      const textWidth = ctx.measureText(label).width;
      const badgeW = textWidth + 16;
      const badgeH = 20;
      const badgeX = centerXOffset - badgeW / 2;
      const badgeY = 20;

      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(badgeX, badgeY, badgeW, badgeH, 6);
      } else {
        ctx.rect(badgeX, badgeY, badgeW, badgeH);
      }
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.fillText(label, centerXOffset, badgeY + 14);
      ctx.textAlign = 'left'; // Reset

      // Draw Bones
      ctx.beginPath();
      ctx.strokeStyle = color + '80'; // 50% opacity
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';

      SKELETON_PAIRS.forEach(([p1Name, p2Name]) => {
        const j1 = pose.find(lm => lm.name === p1Name);
        const j2 = pose.find(lm => lm.name === p2Name);

        if (j1 && j2 && j1.visibility > 0.3 && j2.visibility > 0.3) {
          const s1 = getDrawCoords(j1);
          const s2 = getDrawCoords(j2);
          ctx.moveTo(s1.x, s1.y);
          ctx.lineTo(s2.x, s2.y);
        }
      });
      ctx.stroke();

      // Draw Joints
      pose.forEach((lm) => {
        const isKeyJoint = [
          'nose', 'left_shoulder', 'right_shoulder', 'left_elbow', 'right_elbow',
          'left_wrist', 'right_wrist', 'left_hip', 'right_hip', 'left_knee',
          'right_knee', 'left_ankle', 'right_ankle'
        ].includes(lm.name);

        if (isKeyJoint && lm.visibility > 0.3) {
          const s = getDrawCoords(lm);

          ctx.beginPath();
          ctx.arc(s.x, s.y, 6, 0, 2 * Math.PI);
          ctx.fillStyle = color;
          ctx.fill();

          ctx.beginPath();
          ctx.arc(s.x, s.y, 2.5, 0, 2 * Math.PI);
          ctx.fillStyle = '#ffffff';
          ctx.fill();
        }
      });
    };

    // Draw Left Half (Leader)
    if (leaderPose) {
      drawPose(leaderPose, width * 0.26, leaderColor, leaderName.toUpperCase());
    } else {
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('NO LEAD POSE', width * 0.26, height * 0.5);
      ctx.textAlign = 'left';
    }

    // Draw Right Half (Copy Cat)
    if (copyPose) {
      drawPose(copyPose, width * 0.74, copyColor, copyName.toUpperCase());
    } else {
      ctx.fillStyle = '#94a3b8';
      ctx.font = 'bold 12px Outfit, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('WAITING FOR COPY...', width * 0.74, height * 0.5);
      ctx.textAlign = 'left';
    }

    // Draw central division line
    ctx.beginPath();
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.moveTo(width / 2, 10);
    ctx.lineTo(width / 2, height - 10);
    ctx.stroke();
    ctx.setLineDash([]);

    // Draw VS Badge
    ctx.fillStyle = '#e2e8f0';
    ctx.strokeStyle = '#94a3b8';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, 16, 0, 2 * Math.PI);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#475569';
    ctx.font = '900 11px Fredoka, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('VS', width / 2, height / 2 + 4);
    ctx.textAlign = 'left';

    return () => {
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [leaderPose, copyPose, leaderColor, copyColor, leaderName, copyName]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full bg-slate-50 border-2 border-slate-950 rounded-2xl shadow-inner"
    />
  );
}
