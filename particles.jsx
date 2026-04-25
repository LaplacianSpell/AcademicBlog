/* Particle dot transition — captures snapshots & dissolves between pages */
const { useEffect, useRef } = React;

function Particles({ trigger }) {
  const canvasRef = useRef(null);
  const animRef = useRef(0);

  useEffect(() => {
    if (!trigger) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const dpr = window.devicePixelRatio || 1;
    const W = window.innerWidth, H = window.innerHeight;
    canvas.width = W * dpr; canvas.height = H * dpr;
    canvas.style.width = W + "px"; canvas.style.height = H + "px";
    ctx.scale(dpr, dpr);

    // Generate dot field
    const cols = 64, rows = 36;
    const cellW = W / cols, cellH = H / rows;
    const dots = [];
    for (let i = 0; i < cols; i++) {
      for (let j = 0; j < rows; j++) {
        // skewed random — denser around left (where blob is)
        const distFromCenter = Math.hypot((i - cols / 2) / cols, (j - rows / 2) / rows);
        if (Math.random() > 0.45 - distFromCenter * 0.2) continue;
        dots.push({
          x: i * cellW + cellW / 2 + (Math.random() - 0.5) * 6,
          y: j * cellH + cellH / 2 + (Math.random() - 0.5) * 6,
          r: 1 + Math.random() * 2.4,
          delay: (i / cols) * 200 + Math.random() * 250,
          life: 600 + Math.random() * 400,
          alpha: 0.18 + Math.random() * 0.35,
        });
      }
    }

    const start = performance.now();
    const tick = (now) => {
      const t = now - start;
      ctx.clearRect(0, 0, W, H);
      let alive = false;
      for (const d of dots) {
        const localT = t - d.delay;
        if (localT < 0) { alive = true; continue; }
        if (localT > d.life) continue;
        alive = true;
        const p = localT / d.life;
        // fade in/out (peak in middle)
        const a = Math.sin(p * Math.PI) * d.alpha;
        ctx.fillStyle = `rgba(80,80,80,${a})`;
        ctx.beginPath();
        ctx.arc(d.x, d.y, d.r, 0, Math.PI * 2);
        ctx.fill();
      }
      if (alive) {
        animRef.current = requestAnimationFrame(tick);
      } else {
        ctx.clearRect(0, 0, W, H);
      }
    };
    animRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(animRef.current);
  }, [trigger]);

  return <canvas className="particles" ref={canvasRef} />;
}

window.Particles = Particles;
