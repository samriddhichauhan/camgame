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

  // Persistent Game State Refs
  const cubesRef = useRef<IceCubeData[]>([]);
  const fistsRef = useRef<{ p1: FistData; p2: FistData }>({
    p1: { owner: 1, x: 0, y: 0, vx: 0, vy: 0, isPunching: false, lastHitAt: 0, trail: [] },
    p2: { owner: 2, x: 0, y: 0, vx: 0, vy: 0, isPunching: false, lastHitAt: 0, trail: [] }
  });
  const popupsRef = useRef<ScorePopup[]>([]);
  const lastTimeRef = useRef<number>(performance.now());
  const patternIndexRef = useRef<number>(0);

  // Helper: Generate Ice Shard Particles on Break
  const createIceParticles = (x: number, y: number): Particle[] => {
    const colors = ['#e0f2fe', '#bae6fd', '#7dd3fc', '#ffffff', '#38bdf8'];
    const particles: Particle[] = [];
    for (let i = 0; i < 12; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 3 + Math.random() * 6;
      particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.5,
        size: 4 + Math.random() * 8,
        opacity: 1.0,
        rotation: Math.random() * Math.PI * 2,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    return particles;
  };

  // Helper: Pattern-based Spawning
  const spawnPatternCubes = (owner: 1 | 2, width: number, height: number) => {
    const minX = isSolo ? width * 0.12 : owner === 1 ? width * 0.08 : width * 0.56;
    const maxX = isSolo ? width * 0.88 : owner === 1 ? width * 0.44 : owner === 2 ? width * 0.92 : width * 0.88;
    const centerX = (minX + maxX) / 2;
    const spreadX = (maxX - minX) * 0.35;

    const minY = height * 0.22;
    const maxY = height * 0.72;
    const centerY = (minY + maxY) / 2;

    const patternId = patternIndexRef.current % 4;
    patternIndexRef.current++;

    const newCubes: { x: number; y: number }[] = [];

    if (patternId === 0) {
      // Pattern A: Horizontal Trio
      newCubes.push(
        { x: centerX - spreadX, y: centerY },
        { x: centerX, y: centerY - 25 },
        { x: centerX + spreadX, y: centerY }
      );
    } else if (patternId === 1) {
      // Pattern B: V-Shape
      newCubes.push(
        { x: centerX - spreadX * 0.8, y: centerY - 45 },
        { x: centerX, y: centerY + 30 },
        { x: centerX + spreadX * 0.8, y: centerY - 45 }
      );
    } else if (patternId === 2) {
      // Pattern C: Stacked Block
      newCubes.push(
        { x: centerX - spreadX * 0.5, y: centerY + 35 },
        { x: centerX + spreadX * 0.5, y: centerY + 35 },
        { x: centerX, y: centerY - 35 }
      );
    } else {
      // Pattern D: Diamond Cluster
      newCubes.push(
        { x: centerX, y: centerY - 55 },
        { x: centerX - spreadX * 0.7, y: centerY },
        { x: centerX + spreadX * 0.7, y: centerY },
        { x: centerX, y: centerY + 55 }
      );
    }

    newCubes.forEach((pos) => {
      cubesRef.current.push({
        id: Math.random().toString(36).substring(2, 9),
        x: pos.x + (Math.random() - 0.5) * 15,
        y: pos.y + (Math.random() - 0.5) * 15,
        radius: CUBE_RADIUS,
        state: 'spawning',
        spawnProgress: 0,
        crackProgress: 0,
        shakeOffset: { x: 0, y: 0 },
        rotation: (Math.random() - 0.5) * 0.2,
        rotationSpeed: (Math.random() - 0.5) * 0.015,
        driftX: (Math.random() - 0.5) * 0.3,
        driftY: (Math.random() - 0.5) * 0.3,
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

      // Handle Fullscreen 100vw / 100dvh Canvas Resize
      if (canvas.parentElement) {
        if (canvas.width !== canvas.parentElement.clientWidth || canvas.height !== canvas.parentElement.clientHeight) {
          canvas.width = canvas.parentElement.clientWidth;
          canvas.height = canvas.parentElement.clientHeight;
        }
      }

      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // 1. Draw Bottom 3D Ice Wall Platform
      ctx.save();
      const platformY = height * 0.84;
      const platHeight = height * 0.16;

      // Dark Blue Ocean Depth Base
      const platGrad = ctx.createLinearGradient(0, platformY, 0, height);
      platGrad.addColorStop(0, 'rgba(14, 116, 144, 0.85)');
      platGrad.addColorStop(1, 'rgba(15, 23, 42, 0.98)');
      ctx.fillStyle = platGrad;
      ctx.fillRect(0, platformY, width, platHeight);

      // Top Crystalline Highlight Edge
      ctx.fillStyle = 'rgba(186, 230, 253, 0.9)';
      ctx.fillRect(0, platformY - 4, width, 5);

      // Interlocking Bottom 3D Ice Blocks Decorative Row
      const blockWidth = 70;
      const blockCount = Math.ceil(width / blockWidth) + 1;
      for (let i = 0; i < blockCount; i++) {
        const bx = i * blockWidth - 10;
        const by = platformY - 14;

        ctx.fillStyle = 'rgba(125, 211, 252, 0.55)';
        ctx.strokeStyle = '#0284c7';
        ctx.lineWidth = 2;

        ctx.beginPath();
        ctx.roundRect(bx, by, blockWidth - 6, 28, 6);
        ctx.fill();
        ctx.stroke();

        // Top glossy face
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        ctx.fillRect(bx + 4, by + 3, blockWidth - 14, 5);
      }
      ctx.restore();

      // 2. Draw Dividing Line in Two Player Mode
      if (!isSolo) {
        ctx.save();
        ctx.strokeStyle = 'rgba(124, 58, 237, 0.35)';
        ctx.lineWidth = 4;
        ctx.setLineDash([10, 10]);
        ctx.beginPath();
        ctx.moveTo(width / 2, 0);
        ctx.lineTo(width / 2, platformY);
        ctx.stroke();
        ctx.restore();
      }

      // 3. Process Hand/Fist Positions & Velocities from Vision System
      const p1 = players.find((p) => p.playerIndex === 1);
      const p2 = players.find((p) => p.playerIndex === 2);

      const updateFist = (fist: FistData, player: TrackedPlayer | undefined) => {
        if (player && player.bodyLandmarks) {
          const handLm =
            player.bodyLandmarks.find((lm) => lm.name === 'right_wrist') ||
            player.bodyLandmarks.find((lm) => lm.name === 'left_wrist') ||
            player.bodyLandmarks.find((lm) => lm.name === 'right_index');

          if (handLm && (handLm.visibility ?? 1) > 0.25) {
            // Mirror X mapping so screen-right movement matches real right
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
            if (fist.trail.length > 6) fist.trail.pop();
          }
        }
        fist.trail.forEach((pt) => (pt.opacity -= 0.12));
        fist.trail = fist.trail.filter((pt) => pt.opacity > 0);
      };

      updateFist(fistsRef.current.p1, p1);
      if (!isSolo) {
        updateFist(fistsRef.current.p2, p2);
      }

      // 4. Pattern Spawning Logic
      if (isPlaying) {
        const p1Active = cubesRef.current.filter((c) => c.owner === 1 && c.state !== 'broken');
        if (p1Active.length === 0) {
          spawnPatternCubes(1, width, height);
        }

        if (!isSolo) {
          const p2Active = cubesRef.current.filter((c) => c.owner === 2 && c.state !== 'broken');
          if (p2Active.length === 0) {
            spawnPatternCubes(2, width, height);
          }
        }
      }

      // 5. Render & Update 3D Ice Cubes
      cubesRef.current.forEach((cube) => {
        if (cube.state === 'broken') return;

        // Handle Spawning Growth Animation (<300ms)
        if (cube.state === 'spawning') {
          cube.spawnProgress += 0.08;
          if (cube.spawnProgress >= 1) {
            cube.spawnProgress = 1;
            cube.state = 'active';
          }
        }

        // Subtle Floating Motion
        cube.x += cube.driftX;
        cube.y += cube.driftY;
        cube.rotation += cube.rotationSpeed;

        // Keep cubes within arena boundaries
        const minX = isSolo ? width * 0.1 : cube.owner === 1 ? width * 0.06 : width * 0.54;
        const maxX = isSolo ? width * 0.9 : cube.owner === 1 ? width * 0.44 : width * 0.94;
        if (cube.x < minX || cube.x > maxX) cube.driftX *= -1;
        if (cube.y < height * 0.14 || cube.y > height * 0.78) cube.driftY *= -1;

        // Collision Check with Owner's Fist
        const activeFist = cube.owner === 1 ? fistsRef.current.p1 : fistsRef.current.p2;
        const dist = Math.hypot(activeFist.x - cube.x, activeFist.y - cube.y);

        if (
          isPlaying &&
          (cube.state === 'active' || cube.state === 'spawning') &&
          dist < FIST_RADIUS + cube.radius &&
          activeFist.isPunching &&
          now - activeFist.lastHitAt > PUNCH_COOLDOWN_MS
        ) {
          // PUNCH HIT IMPACT!
          activeFist.lastHitAt = now;
          cube.state = 'cracked';
          cube.crackProgress = 1;
          cube.shakeOffset = { x: (Math.random() - 0.5) * 12, y: (Math.random() - 0.5) * 12 };
          cube.particles = createIceParticles(cube.x, cube.y);

          soundFx.playIceBreakSound();
          onCubeBreak(cube.owner);

          // Add Animated Score Popup
          popupsRef.current.push({
            id: Math.random().toString(),
            text: '+1',
            x: cube.x,
            y: cube.y - 30,
            color: cube.owner === 1 ? '#7c3aed' : '#ff5757',
            opacity: 1.0,
            scale: 1.4,
            createdAt: now
          });
        }

        if (cube.state === 'cracked') {
          cube.state = 'breaking';
        }

        // RENDER STUNNING 3D ISOMETRIC ICE CUBE
        ctx.save();

        const curScale = cube.spawnProgress;
        const renderX = cube.x + (cube.state === 'breaking' ? (Math.random() - 0.5) * 8 : 0);
        const renderY = cube.y + (cube.state === 'breaking' ? (Math.random() - 0.5) * 8 : 0);

        ctx.translate(renderX, renderY);
        ctx.scale(curScale, curScale);
        ctx.rotate(cube.rotation);

        const s = cube.radius * 1.3; // 3D Cube edge length
        const d = s * 0.35; // 3D Depth offset

        if (cube.state === 'breaking') {
          // Render Explosion Shard Particles
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
          // 1. Draw 3D Ground Drop Shadow
          ctx.fillStyle = 'rgba(15, 23, 42, 0.25)';
          ctx.beginPath();
          ctx.ellipse(0, s / 2 + d + 8, s * 0.9, s * 0.3, 0, 0, Math.PI * 2);
          ctx.fill();

          // 2. Draw 3D Front Face (Medium Ice Blue)
          const frontGrad = ctx.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2);
          frontGrad.addColorStop(0, '#38bdf8');
          frontGrad.addColorStop(1, '#0284c7');
          ctx.fillStyle = frontGrad;
          ctx.strokeStyle = '#0369a1';
          ctx.lineWidth = 2.5;

          ctx.beginPath();
          ctx.roundRect(-s / 2, -s / 2, s, s, 6);
          ctx.fill();
          ctx.stroke();

          // 3. Draw 3D Top Face (Bright Specular Cyan)
          ctx.fillStyle = '#e0f2fe';
          ctx.beginPath();
          ctx.moveTo(-s / 2, -s / 2);
          ctx.lineTo(-s / 2 + d, -s / 2 - d);
          ctx.lineTo(s / 2 + d, -s / 2 - d);
          ctx.lineTo(s / 2, -s / 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // 4. Draw 3D Right Side Face (Deep Ocean Blue)
          ctx.fillStyle = '#0284c7';
          ctx.beginPath();
          ctx.moveTo(s / 2, -s / 2);
          ctx.lineTo(s / 2 + d, -s / 2 - d);
          ctx.lineTo(s / 2 + d, s / 2 - d);
          ctx.lineTo(s / 2, s / 2);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();

          // 5. Specular Glossy Reflection Lines
          ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
          ctx.beginPath();
          ctx.roundRect(-s / 2 + 5, -s / 2 + 5, s * 0.35, s * 0.35, 3);
          ctx.fill();

          // 6. Inner Crystalline Crack Vectors when Hit
          if (cube.crackProgress > 0) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 3;
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

      // 6. Render Virtual Fist Indicators with Motion Trails
      const drawFist = (fist: FistData, color: string, label: string) => {
        if (fist.x === 0 && fist.y === 0) return;

        // Draw Motion Trail Lines
        fist.trail.forEach((pt) => {
          ctx.save();
          ctx.fillStyle = `${color}${Math.floor(pt.opacity * 60).toString(16).padStart(2, '0')}`;
          ctx.beginPath();
          ctx.arc(pt.x, pt.y, FIST_RADIUS * 0.6, 0, Math.PI * 2);
          ctx.fill();
          ctx.restore();
        });

        ctx.save();
        ctx.translate(fist.x, fist.y);

        // Glowing Punch Energy Shockwave Ring
        if (fist.isPunching) {
          ctx.strokeStyle = `${color}aa`;
          ctx.lineWidth = 4;
          ctx.beginPath();
          ctx.arc(0, 0, FIST_RADIUS * 1.6, 0, Math.PI * 2);
          ctx.stroke();
        }

        // Virtual Fist Main Ring
        ctx.strokeStyle = color;
        ctx.lineWidth = 4;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
        ctx.shadowColor = color;
        ctx.shadowBlur = 15;

        ctx.beginPath();
        ctx.arc(0, 0, FIST_RADIUS, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Inner Label
        ctx.shadowBlur = 0;
        ctx.fillStyle = color;
        ctx.font = '900 14px system-ui, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(label, 0, 0);

        ctx.restore();
      };

      drawFist(fistsRef.current.p1, '#7c3aed', isSolo ? 'PUNCH' : 'P1');
      if (!isSolo) {
        drawFist(fistsRef.current.p2, '#ff5757', 'P2');
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
            ctx.font = `900 ${Math.round(24 * popup.scale)}px system-ui, sans-serif`;
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
