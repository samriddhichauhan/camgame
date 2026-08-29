import { useEffect, useRef } from 'react';
import type { TrackedPlayer } from '../../vision/types/VisionTypes';
import type { IceCubeData, FistData, ScorePopup, Particle } from './IceBreakerGameTypes';
import {
  PUNCH_VELOCITY_THRESHOLD,
  FIST_RADIUS,
  CUBE_RADIUS,
  MAX_CUBES_PER_PLAYER,
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

  // Persistent Game State Refs across RAF loop
  const cubesRef = useRef<IceCubeData[]>([]);
  const fistsRef = useRef<{ p1: FistData; p2: FistData }>({
    p1: { owner: 1, x: 0, y: 0, vx: 0, vy: 0, isPunching: false, lastHitAt: 0 },
    p2: { owner: 2, x: 0, y: 0, vx: 0, vy: 0, isPunching: false, lastHitAt: 0 }
  });
  const popupsRef = useRef<ScorePopup[]>([]);
  const lastTimeRef = useRef<number>(performance.now());

  // Spawn ice cube helper
  const spawnCube = (owner: 1 | 2, width: number, height: number): IceCubeData => {
    let minX: number, maxX: number;

    if (isSolo) {
      minX = width * 0.12;
      maxX = width * 0.88;
    } else if (owner === 1) {
      minX = width * 0.08;
      maxX = width * 0.44;
    } else {
      minX = width * 0.56;
      maxX = width * 0.92;
    }

    const minY = height * 0.15;
    const maxY = height * 0.80;

    return {
      id: Math.random().toString(36).substring(2, 9),
      x: minX + Math.random() * (maxX - minX),
      y: minY + Math.random() * (maxY - minY),
      radius: CUBE_RADIUS,
      state: 'active',
      crackProgress: 0,
      rotation: Math.random() * Math.PI * 2,
      rotationSpeed: (Math.random() - 0.5) * 0.02,
      driftX: (Math.random() - 0.5) * 0.4,
      driftY: (Math.random() - 0.5) * 0.4,
      owner,
      particles: []
    };
  };

  // Helper to create ice particle shards
  const createIceParticles = (x: number, y: number): Particle[] => {
    const count = 10;
    const particles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2 + Math.random() * 5;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        size: 3 + Math.random() * 7,
        opacity: 1.0,
        rotation: Math.random() * Math.PI * 2
      });
    }
    return particles;
  };

  // Render Loop Effect
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = (now: number) => {
      const dt = Math.max(1, now - lastTimeRef.current);
      lastTimeRef.current = now;

      // Match parent container size
      if (canvas.parentElement) {
        if (canvas.width !== canvas.parentElement.clientWidth || canvas.height !== canvas.parentElement.clientHeight) {
          canvas.width = canvas.parentElement.clientWidth;
          canvas.height = canvas.parentElement.clientHeight;
        }
      }

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw Dividing Line for Two Player Mode
      if (!isSolo) {
        ctx.save();
        ctx.strokeStyle = 'rgba(15, 23, 42, 0.15)';
        ctx.lineWidth = 4;
        ctx.setLineDash([8, 8]);
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, height);
        ctx.stroke();
        ctx.restore();
      }

      // 2. Process Hand/Fist Positions & Velocities from Vision System
      const p1 = players.find((p) => p.playerIndex === 1);
      const p2 = players.find((p) => p.playerIndex === 2);

      const updateFist = (fist: FistData, player: TrackedPlayer | undefined) => {
        if (player && player.bodyLandmarks) {
          // Track wrist or index finger as fist position
          const handLm =
            player.bodyLandmarks.find((lm) => lm.name === 'right_wrist') ||
            player.bodyLandmarks.find((lm) => lm.name === 'left_wrist') ||
            player.bodyLandmarks.find((lm) => lm.name === 'right_index');

          if (handLm && (handLm.visibility ?? 1) > 0.25) {
            // Mirror X mapping so hand right = screen right
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
          }
        }
      };

      updateFist(fistsRef.current.p1, p1);
      if (!isSolo) {
        updateFist(fistsRef.current.p2, p2);
      }

      // 3. Spawning Logic if Playing
      if (isPlaying) {
        // Player 1 Cubes
        const p1Cubes = cubesRef.current.filter((c) => c.owner === 1 && c.state !== 'broken');
        if (p1Cubes.length < MAX_CUBES_PER_PLAYER) {
          cubesRef.current.push(spawnCube(1, width, height));
        }

        // Player 2 Cubes
        if (!isSolo) {
          const p2Cubes = cubesRef.current.filter((c) => c.owner === 2 && c.state !== 'broken');
          if (p2Cubes.length < MAX_CUBES_PER_PLAYER) {
            cubesRef.current.push(spawnCube(2, width, height));
          }
        }
      }

      // 4. Update & Render Cubes
      cubesRef.current.forEach((cube) => {
        if (cube.state === 'broken') return;

        // Subtle drifting movement
        cube.x += cube.driftX;
        cube.y += cube.driftY;
        cube.rotation += cube.rotationSpeed;

        // Keep cubes within arena boundaries
        const minX = isSolo ? width * 0.1 : cube.owner === 1 ? width * 0.05 : width * 0.55;
        const maxX = isSolo ? width * 0.9 : cube.owner === 1 ? width * 0.45 : width * 0.95;
        if (cube.x < minX || cube.x > maxX) cube.driftX *= -1;
        if (cube.y < height * 0.12 || cube.y > height * 0.82) cube.driftY *= -1;

        // Collision Check with Owner's Fist
        const activeFist = cube.owner === 1 ? fistsRef.current.p1 : fistsRef.current.p2;
        const dist = Math.hypot(activeFist.x - cube.x, activeFist.y - cube.y);

        if (
          isPlaying &&
          cube.state === 'active' &&
          dist < FIST_RADIUS + cube.radius &&
          activeFist.isPunching &&
          now - activeFist.lastHitAt > PUNCH_COOLDOWN_MS
        ) {
          // IMPACT HIT!
          activeFist.lastHitAt = now;
          cube.state = 'cracked';
          cube.crackProgress = 1;
          cube.particles = createIceParticles(cube.x, cube.y);

          soundFx.playIceBreakSound();
          onCubeBreak(cube.owner);

          // Add Score Popup
          popupsRef.current.push({
            id: Math.random().toString(),
            text: '+1',
            x: cube.x,
            y: cube.y - 20,
            color: cube.owner === 1 ? '#7c3aed' : '#ff5757',
            opacity: 1.0,
            createdAt: now
          });
        }

        // Handle breaking progression
        if (cube.state === 'cracked') {
          cube.state = 'breaking';
        }

        // Draw Crystalline 3D Ice Cube
        ctx.save();
        ctx.translate(cube.x, cube.y);
        ctx.rotate(cube.rotation);

        const r = cube.radius;
        const size = r * 1.6;

        if (cube.state === 'breaking') {
          // Render Explosion Shards
          cube.particles.forEach((p) => {
            p.x += p.vx;
            p.y += p.vy;
            p.opacity -= 0.04;
            p.rotation += 0.1;

            if (p.opacity > 0) {
              ctx.save();
              ctx.translate(p.x - cube.x, p.y - cube.y);
              ctx.rotate(p.rotation);
              ctx.fillStyle = `rgba(186, 230, 253, ${p.opacity})`;
              ctx.strokeStyle = `rgba(255, 255, 255, ${p.opacity})`;
              ctx.lineWidth = 1.5;
              ctx.beginPath();
              ctx.rect(-p.size / 2, -p.size / 2, p.size, p.size);
              ctx.fill();
              ctx.stroke();
              ctx.restore();
            }
          });

          if (cube.particles.every((p) => p.opacity <= 0)) {
            cube.state = 'broken';
          }
        } else {
          // Render Ice Cube Body
          ctx.fillStyle = 'rgba(186, 230, 253, 0.75)'; // Soft cyan translucent ice
          ctx.strokeStyle = '#0284c7';
          ctx.lineWidth = 3;

          // Outer Cube Box
          ctx.beginPath();
          ctx.roundRect(-size / 2, -size / 2, size, size, 8);
          ctx.fill();
          ctx.stroke();

          // Glossy Corner Highlight
          ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
          ctx.beginPath();
          ctx.roundRect(-size / 2 + 4, -size / 2 + 4, size / 3, size / 3, 4);
          ctx.fill();

          // Inner Crystalline Crack Lines when hit
          if (cube.crackProgress > 0) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.moveTo(-size / 3, -size / 4);
            ctx.lineTo(0, 0);
            ctx.lineTo(size / 3, size / 4);
            ctx.moveTo(size / 4, -size / 3);
            ctx.lineTo(-size / 4, size / 3);
            ctx.stroke();
          }
        }

        ctx.restore();
      });

      // 5. Render Virtual Fists
      const drawFist = (fist: FistData, color: string, label: string) => {
        if (fist.x === 0 && fist.y === 0) return;

        ctx.save();
        ctx.translate(fist.x, fist.y);

        // Glowing Punch Aura when moving fast
        if (fist.isPunching) {
          ctx.fillStyle = `${color}33`;
          ctx.beginPath();
          ctx.arc(0, 0, FIST_RADIUS * 1.5, 0, Math.PI * 2);
          ctx.fill();
        }

        // Virtual Fist Outer Ring
        ctx.strokeStyle = color;
        ctx.lineWidth = 3.5;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.85)';
        ctx.beginPath();
        ctx.arc(0, 0, FIST_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner Fist Label / Icon
        ctx.fillStyle = color;
        ctx.font = '900 13px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 0, 0);

        ctx.restore();
      };

      drawFist(fistsRef.current.p1, '#7c3aed', isSolo ? 'FIST' : 'P1');
      if (!isSolo) {
        drawFist(fistsRef.current.p2, '#ff5757', 'P2');
      }

      // 6. Efficiently Render & Prune Floating Score Popups
      if (popupsRef.current.length > 0) {
        ctx.font = '900 22px system-ui, sans-serif';
        for (let i = popupsRef.current.length - 1; i >= 0; i--) {
          const popup = popupsRef.current[i];
          popup.y -= 1.2;
          popup.opacity -= 0.02;

          if (popup.opacity > 0) {
            ctx.save();
            ctx.fillStyle = popup.color;
            ctx.globalAlpha = popup.opacity;
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
