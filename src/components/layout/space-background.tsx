"use client";

import { useEffect, useRef } from "react";

type Star = { x: number; y: number; r: number; alpha: number; speed: number };

export function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = window.innerWidth;
    let h = document.documentElement.scrollHeight || window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    const resize = () => {
      w = window.innerWidth;
      h = document.documentElement.scrollHeight || window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };
    window.addEventListener("resize", resize);

    // Generate stars
    const COUNT = 280;
    const stars: Star[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() < 0.15 ? 1.4 + Math.random() * 1.2 : 0.4 + Math.random() * 0.9,
      alpha: 0.3 + Math.random() * 0.7,
      speed: 0.003 + Math.random() * 0.007,
    }));

    let t = 0;
    const draw = () => {
      t += 0.012;
      ctx.clearRect(0, 0, w, h);

      // Deep space base
      ctx.fillStyle = "#02020a";
      ctx.fillRect(0, 0, w, h);

      // Planet — top right, large glowing sphere
      const px = w * 0.82;
      const py = -h * 0.04;
      const pr = Math.min(w, h) * 0.44;

      // Outer atmospheric glow
      for (let i = 4; i >= 1; i--) {
        const g = ctx.createRadialGradient(px, py, pr * 0.7, px, py, pr * (1 + i * 0.22));
        g.addColorStop(0, `rgba(108,40,200,${0.06 / i})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath();
        ctx.arc(px, py, pr * (1 + i * 0.22), 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }

      // Planet body
      const pg = ctx.createRadialGradient(px - pr * 0.28, py + pr * 0.22, pr * 0.05, px, py, pr);
      pg.addColorStop(0, "#9b45e8");
      pg.addColorStop(0.35, "#7022c8");
      pg.addColorStop(0.72, "#3d0e82");
      pg.addColorStop(1, "#1a0540");
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.fillStyle = pg;
      ctx.fill();

      // Planet surface noise/grain via small dots
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, pr, 0, Math.PI * 2);
      ctx.clip();
      for (let i = 0; i < 320; i++) {
        const a = Math.random() * Math.PI * 2;
        const d = Math.random() * pr;
        const nx = px + Math.cos(a) * d;
        const ny = py + Math.sin(a) * d;
        ctx.fillStyle = `rgba(255,255,255,${Math.random() * 0.04})`;
        ctx.beginPath();
        ctx.arc(nx, ny, 0.5 + Math.random() * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();

      // Planet rim light
      const rim = ctx.createRadialGradient(px, py, pr * 0.86, px, py, pr * 1.02);
      rim.addColorStop(0, "rgba(180,100,255,0)");
      rim.addColorStop(0.7, "rgba(160,80,255,0.18)");
      rim.addColorStop(1, "rgba(200,120,255,0.38)");
      ctx.beginPath();
      ctx.arc(px, py, pr * 1.02, 0, Math.PI * 2);
      ctx.fillStyle = rim;
      ctx.fill();

      // Stars — twinkle by varying alpha
      for (const s of stars) {
        const a = s.alpha * (0.6 + 0.4 * Math.sin(t * s.speed * 60 + s.x));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fill();
      }

      // Very subtle bottom fade so content doesn't float off
      const fade = ctx.createLinearGradient(0, h * 0.75, 0, h);
      fade.addColorStop(0, "rgba(2,2,10,0)");
      fade.addColorStop(1, "rgba(2,2,10,0.55)");
      ctx.fillStyle = fade;
      ctx.fillRect(0, h * 0.75, w, h * 0.25);

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(frameRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
    />
  );
}
