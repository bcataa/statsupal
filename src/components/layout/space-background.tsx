"use client";

import { useEffect, useRef } from "react";

type Star = { x: number; y: number; r: number; alpha: number; twinkleSpeed: number; twinkleOffset: number };
type ShootingStar = { x: number; y: number; len: number; speed: number; angle: number; life: number; maxLife: number; active: boolean };

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

    // ── Stars ─────────────────────────────────────────
    const STAR_COUNT = 380;
    const stars: Star[] = Array.from({ length: STAR_COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: Math.random() < 0.08 ? 1.6 + Math.random() * 1.0 : 0.3 + Math.random() * 0.9,
      alpha: 0.25 + Math.random() * 0.75,
      twinkleSpeed: 0.4 + Math.random() * 1.6,
      twinkleOffset: Math.random() * Math.PI * 2,
    }));

    // ── Shooting stars ────────────────────────────────
    const SHOOT_COUNT = 6;
    const shooters: ShootingStar[] = Array.from({ length: SHOOT_COUNT }, () => ({
      x: 0, y: 0, len: 0, speed: 0, angle: 0, life: 0, maxLife: 1, active: false,
    }));

    function spawnShooter(s: ShootingStar) {
      s.x = Math.random() * w * 0.85;
      s.y = Math.random() * h * 0.45;
      s.len = 80 + Math.random() * 160;
      s.speed = 6 + Math.random() * 10;
      s.angle = (Math.PI / 5) + Math.random() * (Math.PI / 6);
      s.maxLife = (s.len / s.speed) * 1.6;
      s.life = 0;
      s.active = true;
    }

    // Stagger initial spawns
    shooters.forEach((s, i) => {
      setTimeout(() => spawnShooter(s), i * 2200 + Math.random() * 3000);
    });

    let t = 0;
    const draw = () => {
      t += 0.016;

      // Base — deep space black
      ctx.fillStyle = "#01010a";
      ctx.fillRect(0, 0, w, h);

      // ── Nebula / dark cloud layers ─────────────────
      {
        // Blue-purple nebula centre-left
        const g1 = ctx.createRadialGradient(w * 0.15, h * 0.55, 0, w * 0.15, h * 0.55, w * 0.38);
        g1.addColorStop(0, "rgba(45,20,110,0.22)");
        g1.addColorStop(0.5, "rgba(30,10,80,0.10)");
        g1.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g1;
        ctx.fillRect(0, 0, w, h);

        // Teal nebula bottom-left
        const g2 = ctx.createRadialGradient(w * 0.04, h * 0.82, 0, w * 0.04, h * 0.82, w * 0.28);
        g2.addColorStop(0, "rgba(0,40,80,0.18)");
        g2.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g2;
        ctx.fillRect(0, 0, w, h);
      }

      // ── Planet ────────────────────────────────────
      const px = w * 0.82;
      const py = -h * 0.03;
      const pr = Math.min(w, h) * 0.42;

      // Breathing glow pulse
      const pulse = 1 + 0.018 * Math.sin(t * 0.45);

      // Outer halo layers
      for (let i = 5; i >= 1; i--) {
        const haloR = pr * pulse * (1 + i * 0.20);
        const g = ctx.createRadialGradient(px, py, pr * 0.65, px, py, haloR);
        g.addColorStop(0, `rgba(100,30,190,${0.07 / i})`);
        g.addColorStop(0.6, `rgba(60,10,130,${0.04 / i})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.beginPath();
        ctx.arc(px, py, haloR, 0, Math.PI * 2);
        ctx.fillStyle = g;
        ctx.fill();
      }

      // Planet body
      const pg = ctx.createRadialGradient(px - pr * 0.30, py + pr * 0.25, pr * 0.04, px, py, pr * pulse);
      pg.addColorStop(0, "#a855e8");
      pg.addColorStop(0.25, "#7c22d4");
      pg.addColorStop(0.60, "#4a0ea4");
      pg.addColorStop(0.85, "#2a0870");
      pg.addColorStop(1, "#110440");
      ctx.beginPath();
      ctx.arc(px, py, pr * pulse, 0, Math.PI * 2);
      ctx.fillStyle = pg;
      ctx.fill();

      // Surface texture (stable — redrawn per frame using ctx.save/restore)
      ctx.save();
      ctx.beginPath();
      ctx.arc(px, py, pr * pulse, 0, Math.PI * 2);
      ctx.clip();

      // Subtle band sweeping across planet
      const bandX = (Math.sin(t * 0.08) * 0.5 + 0.5) * pr * 2 - pr;
      const band = ctx.createLinearGradient(px + bandX - pr * 0.4, py, px + bandX + pr * 0.4, py);
      band.addColorStop(0, "rgba(180,80,255,0)");
      band.addColorStop(0.5, "rgba(180,80,255,0.06)");
      band.addColorStop(1, "rgba(180,80,255,0)");
      ctx.fillStyle = band;
      ctx.fillRect(px - pr, py - pr, pr * 2, pr * 2);

      ctx.restore();

      // Rim light (always bright edge)
      const rim = ctx.createRadialGradient(px, py, pr * pulse * 0.84, px, py, pr * pulse * 1.04);
      rim.addColorStop(0, "rgba(200,100,255,0)");
      rim.addColorStop(0.65, "rgba(170,80,255,0.15)");
      rim.addColorStop(1, "rgba(210,130,255,0.42)");
      ctx.beginPath();
      ctx.arc(px, py, pr * pulse * 1.04, 0, Math.PI * 2);
      ctx.fillStyle = rim;
      ctx.fill();

      // ── Twinkling stars ───────────────────────────
      for (const s of stars) {
        const a = s.alpha * (0.55 + 0.45 * Math.sin(t * s.twinkleSpeed + s.twinkleOffset));
        // Occasionally render a 4-point cross glint on brighter stars
        if (s.r > 1.2) {
          ctx.strokeStyle = `rgba(255,255,255,${a * 0.35})`;
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(s.x - s.r * 3, s.y);
          ctx.lineTo(s.x + s.r * 3, s.y);
          ctx.moveTo(s.x, s.y - s.r * 3);
          ctx.lineTo(s.x, s.y + s.r * 3);
          ctx.stroke();
        }
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fill();
      }

      // ── Shooting stars ────────────────────────────
      for (const s of shooters) {
        if (!s.active) continue;
        s.life += 1;
        const progress = s.life / s.maxLife;
        const headX = s.x + Math.cos(s.angle) * s.speed * s.life;
        const headY = s.y + Math.sin(s.angle) * s.speed * s.life;
        const tailX = headX - Math.cos(s.angle) * s.len;
        const tailY = headY - Math.sin(s.angle) * s.len;

        const fade = progress < 0.3 ? progress / 0.3 : 1 - (progress - 0.3) / 0.7;
        const grad = ctx.createLinearGradient(tailX, tailY, headX, headY);
        grad.addColorStop(0, "rgba(255,255,255,0)");
        grad.addColorStop(0.6, `rgba(200,180,255,${fade * 0.55})`);
        grad.addColorStop(1, `rgba(255,255,255,${fade * 0.90})`);

        ctx.beginPath();
        ctx.moveTo(tailX, tailY);
        ctx.lineTo(headX, headY);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        if (s.life >= s.maxLife) {
          s.active = false;
          setTimeout(() => spawnShooter(s), 2500 + Math.random() * 5000);
        }
      }

      // Vignette
      const vig = ctx.createRadialGradient(w / 2, h / 2, h * 0.3, w / 2, h / 2, h * 0.95);
      vig.addColorStop(0, "rgba(0,0,0,0)");
      vig.addColorStop(1, "rgba(0,0,0,0.45)");
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
