"use client";

import { useEffect, useRef } from "react";

const STAR_COUNT = 90;
const TARGET_FPS = 24;

type Star = {
  x: number;
  y: number;
  r: number;
  alpha: number;
  speed: number;
  drift: number;
  twinkle: number;
  phase: number;
};

export function SpaceBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d", { alpha: false });
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
    window.addEventListener("resize", onResize, { passive: true });

    const stars: Star[] = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.25 + Math.random() * 0.85,
      alpha: 0.2 + Math.random() * 0.8,
      speed: 0.08 + Math.random() * 0.28,
      drift: (Math.random() - 0.5) * 0.06,
      twinkle: 0.3 + Math.random() * 1.4,
      phase: Math.random() * Math.PI * 2,
    }));

    let t = 0;
    let lastFrame = 0;
    const frameInterval = 1000 / TARGET_FPS;

    const draw = (now: number) => {
      frameRef.current = requestAnimationFrame(draw);
      if (document.hidden) return;
      if (now - lastFrame < frameInterval) return;
      lastFrame = now;
      t += frameInterval / 1000;

      ctx.fillStyle = "#01010a";
      ctx.fillRect(0, 0, w, h);

      for (const s of stars) {
        s.y += s.speed;
        s.x += s.drift;
        if (s.y > h + 4) {
          s.y = -4;
          s.x = Math.random() * w;
        }
        if (s.x < -4) s.x = w + 4;
        if (s.x > w + 4) s.x = -4;

        const a = s.alpha * (0.5 + 0.5 * Math.sin(t * s.twinkle + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fill();
      }
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
