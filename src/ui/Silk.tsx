'use client';

import { useEffect, useRef } from 'react';

/* Silk: a ribbon of fine lines of light that drifts and twists slowly behind the hero. Drawn on a
   canvas so it stays smooth. It stops when the tab is hidden, and stands still under reduced
   motion. `calm` slows it down (rest days, done days). */

const LINES = 26;

export function Silk({ calm = false, className = '' }: { calm?: boolean; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const speed = calm ? 0.45 : 1;
    let w = 0;
    let h = 0;
    const size = () => {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(canvas);

    const draw = (t: number) => {
      ctx.clearRect(0, 0, w, h);
      // Lines fade in at the left and out at the right; blue on the left, iris on the right.
      const g = ctx.createLinearGradient(0, 0, w, 0);
      g.addColorStop(0, 'rgba(110,116,240,0)');
      g.addColorStop(0.25, 'rgba(110,116,240,1)');
      g.addColorStop(0.7, 'rgba(167,139,245,1)');
      g.addColorStop(1, 'rgba(236,236,239,0)');
      ctx.strokeStyle = g;
      ctx.lineWidth = 1;
      const mid = h * 0.66;
      const amp = h * 0.11;
      for (let i = 0; i < LINES; i++) {
        const k = i / (LINES - 1); // 0..1 across the ribbon
        const spread = (k - 0.5) * h * 0.24;
        // The middle lines are brighter, the edges fall away.
        ctx.globalAlpha = 0.08 + 0.5 * Math.pow(Math.sin(Math.PI * k), 2);
        ctx.beginPath();
        for (let x = 0; x <= w; x += 6) {
          const u = x / w;
          // Two slow waves; the twist makes the ribbon narrow and open as it travels.
          const twist = Math.sin(u * 3.1 + t * 0.00031);
          const y =
            mid +
            spread * twist +
            amp * Math.sin(u * 4.2 - t * 0.00042 + k * 0.6) * 0.55 +
            amp * Math.sin(u * 1.7 + t * 0.00023) * 0.45;
          if (x === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }
      ctx.globalAlpha = 1;
    };

    if (still) {
      draw(4000);
      return () => ro.disconnect();
    }
    let raf = 0;
    let t0 = performance.now();
    let clock = 0;
    const tick = (now: number) => {
      clock += (now - t0) * speed;
      t0 = now;
      draw(clock);
      raf = requestAnimationFrame(tick);
    };
    const onVis = () => {
      cancelAnimationFrame(raf);
      if (!document.hidden) {
        t0 = performance.now();
        raf = requestAnimationFrame(tick);
      }
    };
    raf = requestAnimationFrame(tick);
    document.addEventListener('visibilitychange', onVis);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
      ro.disconnect();
    };
  }, [calm]);

  return <canvas ref={ref} aria-hidden className={`pointer-events-none ${className}`} />;
}
