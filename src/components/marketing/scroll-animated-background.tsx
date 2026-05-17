"use client";

import { useEffect, useState } from "react";
import { HeroCanvasBackground } from "./hero-canvas-background";

export function ScrollAnimatedBackground() {
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    let rafId = 0;
    const onScroll = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(() => {
        setScrollY(window.scrollY || 0);
        rafId = 0;
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (rafId) cancelAnimationFrame(rafId);
    };
  }, []);

  return (
    <>
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0 bg-gradient-to-br from-[#0d0f1e] via-[#0e1020] to-[#10121f]" />
      <HeroCanvasBackground scrollY={scrollY} />
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 z-[1]"
        style={{
          background: `radial-gradient(ellipse 80% 60% at 50% 0%, rgba(99,102,241,0.10) 0%, transparent 70%),
                       radial-gradient(ellipse 50% 40% at 10% 40%, rgba(34,211,238,0.07) 0%, transparent 60%),
                       radial-gradient(ellipse 50% 40% at 90% 60%, rgba(139,92,246,0.08) 0%, transparent 60%)`,
          transform: `translateY(${scrollY * 0.04}px)`,
        }}
      />
    </>
  );
}
