import { useEffect, useRef } from 'react';
import type { TrackedPlayer } from '../../vision/types/VisionTypes';
import type { IceCubeData, FistData, ScorePopup, Particle } from './IceBreakerGameTypes';
import {
  PUNCH_VELOCITY_THRESHOLD,
  FIST_RADIUS,
  CUBE_RADIUS,
  PUNCH_COOLDOWN_MS
} from './IceBreakerConfig';
import { soundFx } from '../../utils/SoundEffects';

interface IceBreakerArenaCanvasProps {
  players: TrackedPlayer[];
  isSolo: boolean;
  isPlaying: boolean;
  onCubeBreak: (owner: 1 | 2) => void;
}

export default function IceBreakerArenaCanvas({
  players,
  isSolo,
  isPlaying,
  onCubeBreak
}: IceBreakerArenaCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Persistent Game State Refs for BOTH LEFT AND RIGHT HANDS (P1 & P2)
  const cubesRef = useRef<IceCubeData[]>([]);
  const fistsRef = useRef<{
    p1Left: FistData;
    p1Right: FistData;
    p2Left: FistData;
    p2Right: FistData;
  }>({
    p1Left: { handSide: 'left', owner: 1, x: 0, y: 0, vx: 0, vy: 0, isPunching: false, lastHitAt: 0, trail: [] },
    p1Right: { handSide: 'right', owner: 1, x: 0, y: 0, vx: 0, vy: 0, isPunching: false, lastHitAt: 0, trail: [] },
    p2Left: { handSide: 'left', owner: 2, x: 0, y: 0, vx: 0, vy: 0, isPunching: false, lastHitAt: 0, trail: [] },
    p2Right: { handSide: 'right', owner: 2, x: 0, y: 0, vx: 0, vy: 0, isPunching: false, lastHitAt: 0, trail: [] }
  });
  const popupsRef = useRef<ScorePopup[]>([]);
  const lastTimeRef = useRef<number>(performance.now());
  const patternIndexRef = useRef<number>(0);

  // Helper: Generate Ice Shard Particles on Break
  const createIceParticles = (x: number, y: number): Particle[] => {
    const colors = ['#e0f2fe', '#bae6fd', '#7dd3fc', '#ffffff', '#38bdf8'];
    const particles: Particle[] = [];
    for (let i = 0; i < 18; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 4 + Math.random() * 8.5;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 2.5,
        size: 5 + Math.random() * 11,
        opacity: 1.0,
        rotation: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    return particles;
  };

  // Helper: Spawning Large 3D Ice Cubes in U-Shape (Bottom + Left & Right Sides)
  const spawnUshapedIceStructure = (owner: 1 | 2, width: number, height: number) => {
    patternIndexRef.current++;
    const newCubes: { x: number; y: number }[] = [];

    if (isSolo) {
      // Single Player U-Shape: Bottom row + Left side curve + Right side curve surrounding central player
      const bottomY = height * 0.76;
      const midY = height * 0.54;
      const topY = height * 0.34;

      const leftX = width * 0.12;
      const innerLeftX = width * 0.28;
      const centerX = width * 0.50;
      const innerRightX = width * 0.72;
      const rightX = width * 0.88;

      // Bottom row
      newCubes.push(
        { x: innerLeftX, y: bottomY },
        { x: centerX, y: bottomY + 12 },
        { x: innerRightX, y: bottomY }
      );
      // Left side stack
      newCubes.push(
        { x: leftX, y: bottomY - 15 },
        { x: leftX + 15, y: midY },
        { x: leftX, y: topY }
      );
      // Right side stack
      newCubes.push(
        { x: rightX, y: bottomY - 15 },
        { x: rightX - 15, y: midY },
        { x: rightX, y: topY }
      );
    } else {
      // Two Player: Left half (P1) U-Shape vs Right half (P2) U-Shape
      const bottomY = height * 0.76;
      const topY = height * 0.40;

      if (owner === 1) {
        newCubes.push(
          { x: width * 0.08, y: topY },
          { x: width * 0.10, y: bottomY },
          { x: width * 0.26, y: bottomY + 10 },
          { x: width * 0.42, y: bottomY },
          { x: width * 0.44, y: topY }
        );
      } else {
        newCubes.push(
          { x: width * 0.56, y: topY },
          { x: width * 0.58, y: bottomY },
          { x: width * 0.74, y: bottomY + 10 },
          { x: width * 0.90, y: bottomY },
          { x: width * 0.92, y: topY }
        );
      }
    }

    newCubes.forEach((pos) => {
      cubesRef.current.push({
        id: Math.random().toString(36).substring(2, 9),
        x: pos.x + (Math.random() - 0.5) * 8,
        y: pos.y + (Math.random() - 0.5) * 8,
        radius: CUBE_RADIUS,
        state: 'spawning',
        spawnProgress: 0,
        crackProgress: 0,
        shakeOffset: { x: 0, y: 0 },
        rotation: (Math.random() - 0.5) * 0.15,
        rotationSpeed: (Math.random() - 0.5) * 0.008,
        driftX: (Math.random() - 0.5) * 0.2,
        driftY: (Math.random() - 0.5) * 0.2,
        owner,
        particles: []
      });
    });
  };

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = (now: number) => {
      const dt = Math.max(1, now - lastTimeRef.current);
      lastTimeRef.current = now;

      if (canvas.parentElement) {
        if (canvas.width !== canvas.parentElement.clientWidth || canvas.height !== canvas.parentElement.clientHeight) {
          canvas.width = canvas.parentElement.clientWidth;
          canvas.height = canvas.parentElement.clientHeight;
        }
      }

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw Bottom Physical Ice Wall Foundation
      ctx.save();
      const platformY = height * 0.85;
      const platHeight = height * 0.15;

      const platGrad = ctx.createLinearGradient(0, platformY, 0, height);
      platGrad.addColorStop(0, 'rgba(14, 116, 144, 0.70)');
      platGrad.addColorStop(1, 'rgba(15, 23, 42, 0.95)');
      ctx.fillStyle = platGrad;
      ctx.fillRect(0, platformY, width, platHeight);

      // Top Specular Edge Highlight
      ctx.fillStyle = 'rgba(224, 242, 254, 0.95)';
      ctx.fillRect(0, platformY - 4, width, 5);

      // Decorative Ice Foundation Blocks Row
      const blockWidth = 90;
      const blockCount = Math.ceil(width / blockWidth) + 1;
      for (let i = 0; i < blockCount; i++) {
        const bx = i * blockWidth - 10;
        const by = platformY - 15;

        ctx.fillStyle = 'rgba(125, 211, 252, 0.5)';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2.5;

        ctx.beginPath();
        ctx.roundRect(bx, by, blockWidth - 8, 32, 8);
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(bx + 6, by + 4, blockWidth - 20, 5);
      }
      ctx.restore();

      // 2. Draw Dividing Line in Two Player Mode
      if (!isSolo) {
        ctx.save();
        ctx.strokeStyle = 'rgba(124, 58, 237, 0.45)';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, platformY);
        ctx.stroke();
        ctx.restore();
      }

      // 3. PROCESS BOTH LEFT AND RIGHT HAND POSITIONS & VELOCITIES SIMULTANEOUSLY
      const p1 = players.find((p) => p.playerIndex === 1);
      const p2 = players.find((p) => p.playerIndex === 2);

      const updateHandFist = (fist: FistData, player: TrackedPlayer | undefined, side: 'left' | 'right') => {
        if (player && player.bodyLandmarks) {
          const wristName = side === 'left' ? 'left_wrist' : 'right_wrist';
          const indexName = side === 'left' ? 'left_index' : 'right_index';

          const handLm =
            player.bodyLandmarks.find((lm) => lm.name === wristName) ||
            player.bodyLandmarks.find((lm) => lm.name === indexName);

          if (handLm && (handLm.visibility ?? 1) > 0.25) {
            // Mirror X mapping so screen right matches physical right
            const targetX = (1 - handLm.x) * width;
            const targetY = handLm.y * height;

            const vx = (targetX - fist.x) / dt;
            const vy = (targetY - fist.y) / dt;
            const speed = Math.hypot(vx, vy);

            fist.x = targetX;
            fist.y = targetY;
            fist.vx = vx;
            fist.vy = vy;
            fist.isPunching = speed > PUNCH_VELOCITY_THRESHOLD;

            // Motion Trail update
            fist.trail.unshift({ x: targetX, y: targetY, opacity: 1.0 });
            if (fist.trail.length > 5) fist.trail.pop();
          }
        }
        fist.trail.forEach((pt) => (pt.opacity -= 0.14));
        fist.trail = fist.trail.filter((pt) => pt.opacity > 0);
      };

      // Player 1 Left & Right Hands
      updateHandFist(fistsRef.current.p1Left, p1, 'left');
      updateHandFist(fistsRef.current.p1Right, p1, 'right');

      // Player 2 Left & Right Hands
      if (!isSolo) {
        updateHandFist(fistsRef.current.p2Left, p2, 'left');
        updateHandFist(fistsRef.current.p2Right, p2, 'right');
      }

      // 4. Spawning U-Shaped Ice Structure
      if (isPlaying) {
        const p1Active = cubesRef.current.filter((c) => c.owner === 1 && c.state !== 'broken');
        if (p1Active.length === 0) {
          spawnUshapedIceStructure(1, width, height);
        }

        if (!isSolo) {
          const p2Active = cubesRef.current.filter((c) => c.owner === 2 && c.state !== 'broken');
          if (p2Active.length === 0) {
            spawnUshapedIceStructure(2, width, height);
          }
        }
      }

      // 5. Update & Render Large Cartoon 3D Ice Cubes
      const activeFistsP1 = [fistsRef.current.p1Left, fistsRef.current.p1Right];
      const activeFistsP2 = [fistsRef.current.p2Left, fistsRef.current.p2Right];

      cubesRef.current.forEach((cube) => {
        if (cube.state === 'broken') return;

        if (cube.state === 'spawning') {
          cube.spawnProgress += 0.1;
          if (cube.spawnProgress >= 1) {
            cube.spawnProgress = 1;
            cube.state = 'active';
          }
        }

        cube.x += cube.driftX;
        cube.y += cube.driftY;
        cube.rotation += cube.rotationSpeed;

        const minX = isSolo ? width * 0.06 : cube.owner === 1 ? width * 0.05 : width * 0.54;
        const maxX = isSolo ? width * 0.94 : cube.owner === 1 ? width * 0.45 : width * 0.95;
        if (cube.x < minX || cube.x > maxX) cube.driftX *= -1;
        if (cube.y < height * 0.25 || cube.y > height * 0.82) cube.driftY *= -1;

        // COLLISION CHECK AGAINST BOTH LEFT AND RIGHT HANDS SIMULTANEOUSLY
        const targetFists = cube.owner === 1 ? activeFistsP1 : activeFistsP2;

        targetFists.forEach((fist) => {
          if (fist.x === 0 && fist.y === 0) return;
          const dist = Math.hypot(fist.x - cube.x, fist.y - cube.y);

          if (
            isPlaying &&
            (cube.state === 'active' || cube.state === 'spawning') &&
            dist < FIST_RADIUS + cube.radius &&
            fist.isPunching &&
            now - fist.lastHitAt > PUNCH_COOLDOWN_MS
          ) {
            // PUNCH HIT REGISTERED!
            fist.lastHitAt = now;
            cube.state = 'cracked';
            cube.crackProgress = 1;
            cube.shakeOffset = { x: (Math.random() - 0.5) * 14, y: (Math.random() - 0.5) * 14 };
            cube.particles = createIceParticles(cube.x, cube.y);

            soundFx.playIceBreakSound();
            onCubeBreak(cube.owner);

            popupsRef.current.push({
              id: Math.random().toString(),
              text: '+1',
              x: cube.x,
              y: cube.y - 35,
              color: cube.owner === 1 ? '#7c3aed' : '#ff5757',
              opacity: 1.0,
              scale: 1.5,
              createdAt: now
            });
          }
        });

        if (cube.state === 'cracked') {
          cube.state = 'breaking';
        }

        // RENDER LARGE CHUNKY CARTOON 3D ICE BLOCK
        ctx.save();

        const curScale = cube.spawnProgress;
        const renderX = cube.x + (cube.state === 'breaking' ? (Math.random() - 0.5) * 10 : 0);
        const renderY = cube.y + (cube.state === 'breaking' ? (Math.random() - 0.5) * 10 : 0);

        ctx.translate(renderX, renderY);
        ctx.scale(curScale, curScale);
        ctx.rotate(cube.rotation);

        const s = cube.radius * 1.45; // Large chunky size (~120px edge)
        const d = s * 0.35;

        if (cube.state === 'breaking') {
          // Explosion Shard Particles
          cube.particles.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;
            p.opacity -= 0.035;
            p.rotation += 0.12;

            if (p.opacity > 0) {
              ctx.save();
              ctx.translate(p.x - renderX, p.y - renderY);
              ctx.rotate(p.rotation);
              ctx.fillStyle = p.color;
              ctx.globalAlpha = p.opacity;
              ctx.beginPath();
              ctx.rect(-p.size / 2, -p.size / 2, p.size, p.size);
              ctx.fill();
              ctx.restore();
            }
          });

          if (cube.particles.every((p) => p.opacity <= 0)) {
            cube.state = 'broken';
          }
        } else {
          // 1. Drop Shadow
          ctx.fillStyle = 'rgba(15, 23, 42, 0.35)';
          ctx.beginPath();
          ctx.ellipse(0, s / 2 + d + 10, s * 0.9, s * 0.3, 0, 0, Math.PI * 2);
          ctx.fill();

          // 2. 3D Front Face Gradient (Bright Cartoon Blue/Cyan)
          const frontGrad = ctx.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2);
          frontGrad.addColorStop(0, 'rgba(56, 189, 248, 0.82)');
          frontGrad.addColorStop(1, 'rgba(2, 132, 199, 0.90)');
          ctx.fillStyle = frontGrad;
          ctx.strokeStyle = '#0369a1';
          ctx.lineWidth = 3.5;

          ctx.beginPath();
          ctx.roundRect(-s / 2, -s / 2, s, s, 10);
          ctx.fill();
          ctx.stroke();

          // 3. 3D Top Specular Face (Bright White/Cyan)
          ctx.fillStyle = 'rgba(224, 242, 254, 0.92)';
          ctx.beginPath();
          ctx.moveTo(-s / 2, -s / 2);
          ctx.lineTo(-s / 2 + d, -s / 2 - d);
          ctx.lineTo(s / 2 + d, -s / 2 - d);
          ctx.lineTo(s / 2, -s / 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // 4. 3D Right Side Face (Deep Ocean Blue)
          ctx.fillStyle = 'rgba(2, 132, 199, 0.88)';
          ctx.beginPath();
          ctx.moveTo(s / 2, -s / 2);
          ctx.lineTo(s / 2 + d, -s / 2 - d);
          ctx.lineTo(s / 2 + d, s / 2 - d);
          ctx.lineTo(s / 2, s / 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // 5. Specular Glossy Highlight
          ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
          ctx.beginPath();
          ctx.roundRect(-s / 2 + 6, -s / 2 + 6, s * 0.35, s * 0.35, 4);
          ctx.fill();

          // 6. Crack Vectors when Hit
          if (cube.crackProgress > 0) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 4;
            ctx.beginPath();
            ctx.moveTo(-s / 3, -s / 3);
            ctx.lineTo(0, 0);
            ctx.lineTo(s / 3, s / 3);
            ctx.moveTo(s / 3, -s / 4);
            ctx.lineTo(-s / 4, s / 3);
            ctx.stroke();
          }
        }

        ctx.restore();
      });

      // 6. RENDER BOTH LEFT AND RIGHT VIRTUAL FIST INDICATORS
      const drawFist = (fist: FistData, color: string, label: string) => {
        if (fist.x === 0 && fist.y === 0) return;

        fist.trail.forEach((pt) => {
          ctx.save();
          ctx.fillStyle = `${color}${Math.floor(pt.opacity * 65).toString(16).padStart(2, '0')}`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, FIST_RADIUS * 0.65, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        ctx.save();
        ctx.translate(fist.x, fist.y);

        if (fist.isPunching) {
          ctx.strokeStyle = `${color}cc`;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, 0, FIST_RADIUS * 1.6, 0, Math.PI * 2);
          ctx.stroke();
        }

        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.shadowColor = color;
        ctx.shadowBlur = 18;

        ctx.beginPath();
        ctx.arc(0, 0, FIST_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        ctx.shadowBlur = 0;
        ctx.fillStyle = color;
        ctx.font = '900 13px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 0, 0);

        ctx.restore();
      };

      // Draw P1 Left & Right Fists
      drawFist(fistsRef.current.p1Left, '#7c3aed', isSolo ? 'L-FIST' : 'P1-L');
      drawFist(fistsRef.current.p1Right, '#7c3aed', isSolo ? 'R-FIST' : 'P1-R');

      // Draw P2 Left & Right Fists
      if (!isSolo) {
        drawFist(fistsRef.current.p2Left, '#ff5757', 'P2-L');
        drawFist(fistsRef.current.p2Right, '#ff5757', 'P2-R');
      }

      // 7. Render Floating Score Popups
      if (popupsRef.current.length > 0) {
        for (let i = popupsRef.current.length - 1; i >= 0; i--) {
          const popup = popupsRef.current[i];
          popup.y -= 1.4;
          popup.opacity -= 0.02;
          popup.scale = Math.max(1.0, popup.scale - 0.02);

          if (popup.opacity > 0) {
            ctx.save();
            ctx.font = `900 ${Math.round(28 * popup.scale)}px system-ui, sans-serif`;
            ctx.fillStyle = popup.color;
            ctx.globalAlpha = popup.opacity;
            ctx.shadowColor = '#000000';
            ctx.shadowBlur = 4;
            ctx.fillText(popup.text, popup.x, popup.y);
            ctx.restore();
          } else {
            popupsRef.current.splice(i, 1);
          }
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [players, isSolo, isPlaying, onCubeBreak]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none z-10"
    />
  );
}
