"use client";

import { useEffect, useRef } from "react";

export function FallingStarsCanvas() {
  const ref = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef(0);

  useEffect(() => {
    const c = ref.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;

    let w = window.innerWidth;
    let h = window.innerHeight;
    c.width = w;
    c.height = h;

    const onResize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      c.width = w;
      c.height = h;
    };
    window.addEventListener("resize", onResize);

    type S = {
      x: number; y: number; r: number; a: number;
      spd: number; drift: number; tw: number; ph: number;
    };

    const stars: S[] = Array.from({ length: 200 }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 0.25 + Math.random() * 1.1,
      a: 0.2 + Math.random() * 0.8,
      spd: 0.08 + Math.random() * 0.25,
      drift: (Math.random() - 0.5) * 0.05,
      tw: 0.4 + Math.random() * 1.4,
      ph: Math.random() * Math.PI * 2,
    }));

    let t = 0;
    const draw = () => {
      t += 0.016;
      ctx.fillStyle = "#01010a";
      ctx.fillRect(0, 0, w, h);

      for (const s of stars) {
        s.y += s.spd;
        s.x += s.drift;
        if (s.y > h + 4) { s.y = -4; s.x = Math.random() * w; }
        const a = s.a * (0.5 + 0.5 * Math.sin(t * s.tw + s.ph));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fill();
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", onResize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden
      className="pointer-events-none absolute inset-0 z-0 h-full w-full"
    />
  );
}
