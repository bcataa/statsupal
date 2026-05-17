"use client";

import { useEffect, useRef } from "react";

type Node = {
  x: number;
  y: number;
  z: number;
  vx: number;
  vy: number;
  vz: number;
  color: string;
  pulse: number;
  pulseSpeed: number;
  status: "ok" | "warn" | "down";
  radius: number;
};

const STATUS_COLORS = {
  ok: "#34d399",
  warn: "#fbbf24",
  down: "#f87171",
};

function project(x: number, y: number, z: number, w: number, h: number, fov: number) {
  const scale = fov / (fov + z);
  return {
    px: x * scale + w / 2,
    py: y * scale + h / 2,
    scale,
  };
}

export function HeroCanvasBackground({ scrollY }: { scrollY: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const nodesRef = useRef<Node[]>([]);
  const rafRef = useRef(0);
  const scrollRef = useRef(0);

  scrollRef.current = scrollY;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener("resize", resize);

    const count = 90;
    const statuses: Array<"ok" | "warn" | "down"> = ["ok", "ok", "ok", "ok", "ok", "warn", "warn", "down"];
    nodesRef.current = Array.from({ length: count }, () => {
      const status = statuses[Math.floor(Math.random() * statuses.length)];
      return {
        x: (Math.random() - 0.5) * 1400,
        y: (Math.random() - 0.5) * 900,
        z: Math.random() * 600 - 300,
        vx: (Math.random() - 0.5) * 0.28,
        vy: (Math.random() - 0.5) * 0.18,
        vz: (Math.random() - 0.5) * 0.22,
        color: STATUS_COLORS[status],
        pulse: Math.random() * Math.PI * 2,
        pulseSpeed: 0.015 + Math.random() * 0.025,
        status,
        radius: 2.4 + Math.random() * 2.2,
      };
    });

    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      const fov = 600;
      const sv = scrollRef.current;

      ctx.clearRect(0, 0, w, h);

      const nodes = nodesRef.current;
      for (const n of nodes) {
        n.x += n.vx;
        n.y += n.vy;
        n.z += n.vz;
        n.pulse += n.pulseSpeed;
        if (n.x > 800 || n.x < -800) n.vx *= -1;
        if (n.y > 600 || n.y < -600) n.vy *= -1;
        if (n.z > 400 || n.z < -400) n.vz *= -1;
      }

      const scrollDrift = sv * 0.06;

      for (let i = 0; i < nodes.length; i++) {
        const a = nodes[i];
        const pa = project(a.x, a.y + scrollDrift, a.z, w, h, fov);
        for (let j = i + 1; j < nodes.length; j++) {
          const b = nodes[j];
          const dx = a.x - b.x;
          const dy = a.y - b.y;
          const dz = a.z - b.z;
          const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
          if (dist < 240) {
            const pb = project(b.x, b.y + scrollDrift, b.z, w, h, fov);
            const opacity = (1 - dist / 240) * 0.28 * Math.min(pa.scale, pb.scale);
            ctx.beginPath();
            ctx.moveTo(pa.px, pa.py);
            ctx.lineTo(pb.px, pb.py);
            const edgeColor = a.status === "down" || b.status === "down"
              ? "rgba(248,113,113,"
              : a.status === "warn" || b.status === "warn"
                ? "rgba(251,191,36,"
                : "rgba(52,211,153,";
            ctx.strokeStyle = `${edgeColor}${opacity})`;
            ctx.lineWidth = 0.6 * Math.min(pa.scale, pb.scale);
            ctx.stroke();
          }
        }
      }

      for (const n of nodes) {
        const { px, py, scale } = project(n.x, n.y + scrollDrift, n.z, w, h, fov);
        if (px < -50 || px > w + 50 || py < -50 || py > h + 50) continue;
        const pulseGlow = 0.55 + Math.sin(n.pulse) * 0.45;
        const r = n.radius * scale;

        const grad = ctx.createRadialGradient(px, py, 0, px, py, r * 4.5);
        grad.addColorStop(0, n.color + "aa");
        grad.addColorStop(0.4, n.color + "44");
        grad.addColorStop(1, n.color + "00");
        ctx.beginPath();
        ctx.arc(px, py, r * 4.5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.globalAlpha = pulseGlow * 0.55;
        ctx.fill();
        ctx.globalAlpha = 1;

        ctx.beginPath();
        ctx.arc(px, py, r, 0, Math.PI * 2);
        ctx.fillStyle = n.color;
        ctx.globalAlpha = 0.7 + pulseGlow * 0.3;
        ctx.fill();
        ctx.globalAlpha = 1;

        if (n.status !== "ok") {
          ctx.beginPath();
          const ringR = r + 2.5 + Math.sin(n.pulse) * 2.2;
          ctx.arc(px, py, ringR, 0, Math.PI * 2);
          ctx.strokeStyle = n.color + "66";
          ctx.lineWidth = 0.9;
          ctx.stroke();
        }
      }

      rafRef.current = requestAnimationFrame(draw);
    };

    rafRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 h-full w-full"
      style={{ opacity: 0.38 }}
    />
  );
}
