import { useEffect, useRef, useState } from 'react';
import { Character } from '../App';

interface VideoCharacterProps {
  character: Character;
  isPlaying: boolean;
  progress: number;
  duration: number;
}

export function VideoCharacter({ character, isPlaying, progress, duration }: VideoCharacterProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [mouthOpen, setMouthOpen] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = character.avatar;

    img.onload = () => {
      drawFrame(ctx, canvas, img);
    };

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [character.avatar]);

  // Animate mouth when speaking
  useEffect(() => {
    if (!isPlaying) {
      setMouthOpen(false);
      return;
    }

    let lastToggle = Date.now();
    const toggleInterval = 150 + Math.random() * 100; // Random interval for natural look

    const animate = () => {
      const now = Date.now();
      if (now - lastToggle > toggleInterval) {
        setMouthOpen(prev => !prev);
        lastToggle = now;
      }
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [isPlaying]);

  // Redraw with mouth animation
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = character.avatar;

    img.onload = () => {
      drawFrame(ctx, canvas, img);
    };
  }, [mouthOpen, character.avatar]);

  const drawFrame = (ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement, img: HTMLImageElement) => {
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw background gradient
    const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    gradient.addColorStop(0, '#9333ea');
    gradient.addColorStop(1, '#2563eb');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw character image (circular)
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2 - 20;
    const radius = Math.min(canvas.width, canvas.height) * 0.35;

    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    
    const imgSize = radius * 2;
    ctx.drawImage(img, centerX - radius, centerY - radius, imgSize, imgSize);
    ctx.restore();

    // Draw character border with glow when playing
    ctx.strokeStyle = isPlaying ? '#fbbf24' : '#ffffff';
    ctx.lineWidth = isPlaying ? 6 : 4;
    ctx.shadowBlur = isPlaying ? 20 : 0;
    ctx.shadowColor = '#fbbf24';
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Draw mouth animation (simple oval below character)
    if (isPlaying && mouthOpen) {
      const mouthY = centerY + radius + 20;
      const mouthWidth = 30;
      const mouthHeight = 20;

      ctx.fillStyle = '#ffffff';
      ctx.beginPath();
      ctx.ellipse(centerX, mouthY, mouthWidth, mouthHeight, 0, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#1f2937';
      ctx.beginPath();
      ctx.ellipse(centerX, mouthY, mouthWidth - 4, mouthHeight - 4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw sound waves when playing
    if (isPlaying) {
      const waveCount = 3;
      const time = Date.now() / 1000;

      for (let i = 0; i < waveCount; i++) {
        const waveRadius = radius + 20 + (i * 25) + (Math.sin(time * 3 + i) * 5);
        const opacity = 0.3 - (i * 0.08);
        
        ctx.strokeStyle = `rgba(251, 191, 36, ${opacity})`;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(centerX, centerY, waveRadius, 0, Math.PI * 2);
        ctx.stroke();
      }
    }

    // Draw character name
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 24px sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowBlur = 10;
    ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';
    ctx.fillText(character.name, centerX, canvas.height - 30);
    ctx.shadowBlur = 0;

    // Draw progress bar
    const barWidth = canvas.width * 0.8;
    const barHeight = 6;
    const barX = (canvas.width - barWidth) / 2;
    const barY = canvas.height - 15;

    // Background
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.fillRect(barX, barY, barWidth, barHeight);

    // Progress
    ctx.fillStyle = '#fbbf24';
    ctx.fillRect(barX, barY, barWidth * progress, barHeight);

    // Request next frame for animations
    if (isPlaying) {
      animationFrameRef.current = requestAnimationFrame(() => {
        drawFrame(ctx, canvas, img);
      });
    }
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={400}
        height={500}
        className="w-full h-full rounded-xl"
      />
      {isPlaying && (
        <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-semibold flex items-center gap-2 animate-pulse">
          <div className="w-2 h-2 bg-white rounded-full" />
          LIVE
        </div>
      )}
    </div>
  );
}
