"use client";

import { useEffect, useRef } from "react";

type Star = {
  x: number; y: number;
  r: number;
  alpha: number;
  speed: number;     // fall speed
  drift: number;     // horizontal drift
  twinkle: number;   // twinkle frequency
  phase: number;
};

export function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    canvas.width = w;
    canvas.height = h;

    const onResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w;
      canvas.height = h;
    };
    window.addEventListener("resize", onResize);

    const COUNT = 260;
    const make = (): Star => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() < 0.12 ? 1.2 + Math.random() * 1.1 : 0.25 + Math.random() * 0.85,
      alpha: 0.2 + Math.random() * 0.8,
      speed: 0.08 + Math.random() * 0.28,
      drift: (Math.random() - 0.5) * 0.06,
      twinkle: 0.3 + Math.random() * 1.4,
      phase: Math.random() * Math.PI * 2,
    });

    const stars: Star[] = Array.from({ length: COUNT }, make);

    let t = 0;
    const draw = () => {
      t += 0.016;

      ctx.fillStyle = "#01010a";
      ctx.fillRect(0, 0, w, h);

      for (const s of stars) {
        // Fall + drift
        s.y += s.speed;
        s.x += s.drift;

        // Wrap around when off-screen
        if (s.y > h + 4) { s.y = -4; s.x = Math.random() * w; }
        if (s.x < -4)    { s.x = w + 4; }
        if (s.x > w + 4) { s.x = -4; }

        const a = s.alpha * (0.5 + 0.5 * Math.sin(t * s.twinkle + s.phase));

        // Cross glint on larger stars
        if (s.r > 1.1) {
          ctx.strokeStyle = `rgba(255,255,255,${a * 0.28})`;
          ctx.lineWidth = 0.4;
          ctx.beginPath();
          ctx.moveTo(s.x - s.r * 3.5, s.y);
          ctx.lineTo(s.x + s.r * 3.5, s.y);
          ctx.moveTo(s.x, s.y - s.r * 3.5);
          ctx.lineTo(s.x, s.y + s.r * 3.5);
          ctx.stroke();
        }

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fill();
      }

      // Subtle vignette
      const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.28, w / 2, h / 2, h);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(0,0,0,0.55)");
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, w, h);

      frameRef.current = requestAnimationFrame(draw);
    };

    frameRef.current = requestAnimationFrame(draw);
    return () => {
      window.removeEventListener("resize", onResize);
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
