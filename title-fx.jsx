/* title-fx.jsx — Sakura letter animation (v3)
 *
 * SCATTER: letters shake → explode outward → crossfade into sakura petals
 * REFORM:  petals drift in → converge on letter positions → crossfade into letters
 *
 * Bug fix: letters are fully unwrapped after reform, so re-clicks always
 * start from a clean DOM state. isAnimating guard prevents stacking.
 *
 * Public API:
 *   window.runTitleScatter()  → Promise, resolves when letters are gone (~1400ms)
 *   window.runTitleReform()   → Promise, resolves when title is fully visible
 */
(function () {

  /* ── Timing ──────────────────────────────────────────────────────────── */
  const SHAKE_DUR     = 220;   // ms of pre-scatter shake
  const SCATTER_STAG  = 45;    // ms between each letter starting to scatter
  const MORPH_DELAY   = 320;   // ms into flight before letter→petal crossfade
  const SCATTER_TOTAL = 1400;  // ms until scatter resolves

  const CONVERGE_SPEED = 0.10; // lerp factor per frame (lower = slower)
  const ARRIVE_DIST    = 4;    // px threshold to count as "arrived"
  const REFORM_STAG    = 55;   // ms between letters appearing
  const REFORM_TAIL    = 320;  // ms after last letter appears before resolving

  /* ── Petal visuals ───────────────────────────────────────────────────── */
  const PETAL_COLORS = ["#ffb7c5","#ff9ab0","#ffc8d5","#f7a8b8","#ffd1dc","#ff85a1","#ffcdd6"];
  const GRAVITY = 0.055;
  const WIND_AMP = 0.018;

  function petalSVG(size) {
    const c1 = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
    const c2 = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
    const rot = (Math.random() * 50 - 25).toFixed(1);
    const s = size || 16;
    return `<svg xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 16 20" width="${s}" height="${Math.round(s*1.25)}">
      <ellipse cx="8" cy="12" rx="6.5" ry="9" fill="${c1}" opacity="0.90"
        transform="rotate(${rot} 8 10)"/>
      <ellipse cx="8" cy="8"  rx="3.5" ry="6" fill="${c2}" opacity="0.55"
        transform="rotate(${(-rot*0.5).toFixed(1)} 8 10)"/>
      <circle  cx="8" cy="4"  r="1.5" fill="${c1}" opacity="0.4"/>
    </svg>`;
  }

  /* ── State ───────────────────────────────────────────────────────────── */
  let isAnimating  = false;
  let rafId        = null;
  let morphEls     = [];   // { container, letterEl, petalEl, x, y, vx, vy, rot, spin, phase, t }

  /* ── Helpers ─────────────────────────────────────────────────────────── */
  function stopRaf() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  function clearMorphEls() {
    morphEls.forEach(m => m.container && m.container.remove());
    morphEls = [];
  }

  // Fully unwrap a .title-trigger: remove tfx-letter spans, restore plain text
  function unwrapLetters(el) {
    if (!el) return;
    el.querySelectorAll(".tfx-letter").forEach(span => {
      span.replaceWith(document.createTextNode(span.textContent));
    });
    el.normalize();
    delete el.dataset.wrapped;
  }

  // Wrap textContent into per-letter spans
  function wrapLetters(el) {
    if (!el) return [];
    const letters = [];
    function walk(node) {
      for (const child of [...node.childNodes]) {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          for (const ch of child.textContent) {
            if (ch === " " || ch === "\u00A0") {
              frag.appendChild(document.createTextNode("\u00A0"));
            } else {
              const s = document.createElement("span");
              s.className = "tfx-letter";
              s.textContent = ch;
              s.style.display = "inline-block"; // needed for transform
              frag.appendChild(s);
              letters.push(s);
            }
          }
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      }
    }
    walk(el);
    el.dataset.wrapped = "1";
    return letters;
  }

  // Create a morph container (letter + petal overlay) at a fixed position
  function makeMorphEl(cx, cy, letterText, fontSize, color) {
    const container = document.createElement("div");
    Object.assign(container.style, {
      position: "fixed",
      left: (cx - 9) + "px",
      top:  (cy - 11) + "px",
      width: "18px",
      height: "22px",
      pointerEvents: "none",
      zIndex: "9998",
      transformOrigin: "50% 55%",
    });

    const lEl = document.createElement("span");
    lEl.textContent = letterText;
    Object.assign(lEl.style, {
      position: "absolute",
      inset: "0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      fontFamily: "var(--serif)",
      fontSize: fontSize + "px",
      fontWeight: "500",
      color: color || "var(--accent)",
      opacity: "1",
      pointerEvents: "none",
      lineHeight: "1",
    });

    const pEl = document.createElement("div");
    pEl.innerHTML = petalSVG(16);
    Object.assign(pEl.style, {
      position: "absolute",
      inset: "0",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      opacity: "0",
    });

    container.appendChild(lEl);
    container.appendChild(pEl);
    document.body.appendChild(container);
    return { container, lEl, pEl };
  }

  /* ══════════════════════════════════════════════════════════════
     SCATTER
     ══════════════════════════════════════════════════════════════ */
  function runTitleScatter() {
    if (isAnimating) return Promise.resolve();
    isAnimating = true;
    stopRaf();
    clearMorphEls();

    const el = document.querySelector(".title-trigger");
    if (!el) return Promise.resolve();

    // Always start from clean DOM
    unwrapLetters(el);
    const letters = wrapLetters(el);
    if (!letters.length) return Promise.resolve();

    // ── Phase 1: shake each letter in place ──────────────────────
    letters.forEach((ltr, i) => {
      ltr.style.transition = `transform ${SHAKE_DUR * 0.5}ms ease`;
      ltr.style.color = "var(--accent)";
      setTimeout(() => {
        ltr.style.transform = `translate(${(Math.random()-0.5)*5}px,${(Math.random()-0.5)*4}px) rotate(${(Math.random()-0.5)*12}deg)`;
      }, i * 12);
    });

    // ── Phase 2: explode + crossfade to petal ────────────────────
    setTimeout(() => {
      const states = letters.map((ltr, i) => {
        const r   = ltr.getBoundingClientRect();
        const cx  = r.left + r.width  / 2;
        const cy  = r.top  + r.height / 2;
        const fs  = Math.max(r.height * 0.85, 12);
        const col = window.getComputedStyle(ltr).color;

        // Hide original letter
        ltr.style.opacity = "0";
        ltr.style.transition = "opacity 0.08s";

        const { container, lEl, pEl } = makeMorphEl(cx, cy, ltr.textContent, fs, col);

        // Random outward velocity — mostly upward/sideways
        const angle = (Math.random() * 2 - 1) * Math.PI * 0.75 - Math.PI * 0.5;
        const speed = 2.8 + Math.random() * 4.2;
        const state = {
          container, lEl, pEl,
          x: cx - 9, y: cy - 11,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 0.5,
          rot: Math.random() * 360,
          spin: (Math.random() - 0.5) * 9,
          phase: Math.random() * Math.PI * 2,
          t: 0,
          morphStarted: false,
          morphed: false,
          delay: i * SCATTER_STAG,
        };
        morphEls.push(state);
        return state;
      });

      // ── Physics loop ──────────────────────────────────────────
      const startTime = performance.now();
      function tick(now) {
        const elapsed = now - startTime;
        states.forEach(p => {
          if (elapsed < p.delay) return;
          const localT = elapsed - p.delay;

          // Physics
          p.vy += GRAVITY;
          p.vx += Math.sin(p.t * 0.045 + p.phase) * WIND_AMP;
          p.x  += p.vx;
          p.y  += p.vy;
          p.rot += p.spin;
          p.t++;

          p.container.style.left      = p.x.toFixed(1) + "px";
          p.container.style.top       = p.y.toFixed(1) + "px";
          p.container.style.transform = `rotate(${p.rot.toFixed(1)}deg)`;

          // Crossfade letter → petal
          if (!p.morphed) {
            if (localT > MORPH_DELAY && !p.morphStarted) {
              p.morphStarted = true;
              p.lEl.style.transition = "opacity 0.38s ease";
              p.pEl.style.transition = "opacity 0.38s ease";
              p.lEl.style.opacity    = "0";
              p.pEl.style.opacity    = "1";
              setTimeout(() => { p.morphed = true; }, 420);
            }
          }
        });
        rafId = requestAnimationFrame(tick);
      }
      rafId = requestAnimationFrame(tick);

    }, SHAKE_DUR);

    return new Promise(res => setTimeout(res, SCATTER_TOTAL));
  }

  /* ══════════════════════════════════════════════════════════════
     REFORM
     ══════════════════════════════════════════════════════════════ */
  function runTitleReform() {
    stopRaf();

    const el = document.querySelector(".title-trigger");
    if (!el) { clearMorphEls(); isAnimating = false; return Promise.resolve(); }

    // Always wrap fresh
    unwrapLetters(el);
    const letters = wrapLetters(el);

    // Hide letters
    letters.forEach(l => {
      l.style.opacity    = "0";
      l.style.transform  = "translateY(6px)";
      l.style.transition = "none";
    });

    void el.offsetWidth; // flush layout

    const W = window.innerWidth, H = window.innerHeight;

    // Reuse existing morph elements (still flying), pad or trim to match letter count
    while (morphEls.length < letters.length) {
      // Spawn new petals from random off-screen positions
      const side = Math.floor(Math.random() * 4);
      let sx, sy;
      if (side === 0) { sx = Math.random() * W;  sy = -40; }            // top
      else if (side===1){ sx = W + 30;             sy = Math.random()*H; }  // right
      else if (side===2){ sx = -30;                sy = Math.random()*H; }  // left
      else              { sx = Math.random() * W;  sy = H + 30; }           // bottom

      const { container, lEl, pEl } = makeMorphEl(sx, sy, "", 16, "transparent");
      pEl.style.opacity = "1";
      lEl.style.opacity = "0";
      morphEls.push({
        container, lEl, pEl,
        x: sx, y: sy,
        vx: 0, vy: 0,
        rot: Math.random() * 360,
        spin: (Math.random()-0.5) * 5,
        phase: Math.random() * Math.PI * 2,
        t: 0, morphed: true, morphStarted: true, delay: 0,
      });
    }
    while (morphEls.length > letters.length) {
      const p = morphEls.pop();
      p.container.style.transition = "opacity 0.25s";
      p.container.style.opacity    = "0";
      setTimeout(() => p.container.remove(), 280);
    }

    // Assign a target letter to each morph element
    const convergeStates = morphEls.map((p, i) => {
      const r  = letters[i].getBoundingClientRect();
      const tx = r.left + r.width  / 2 - 9;
      const ty = r.top  + r.height / 2 - 11;
      return { ...p, tx, ty, arrived: false, letterEl: letters[i] };
    });

    return new Promise(res => {
      let arrivedCount = 0;
      const total = convergeStates.length;

      function tick() {
        let anyMoving = false;

        convergeStates.forEach((p, i) => {
          if (p.arrived) return;
          const dx   = p.tx - p.x;
          const dy   = p.ty - p.y;
          const dist = Math.sqrt(dx*dx + dy*dy);

          if (dist < ARRIVE_DIST) {
            p.arrived = true;
            arrivedCount++;

            // Crossfade petal → letter
            p.pEl.style.transition = "opacity 0.22s";
            p.pEl.style.opacity    = "0";
            p.container.style.transition = "opacity 0.15s";

            // Staggered letter reveal
            setTimeout(() => {
              p.container.style.opacity = "0";
              const ltr = p.letterEl;
              ltr.style.transition  = "opacity 0.28s ease, transform 0.28s ease";
              ltr.style.opacity     = "1";
              ltr.style.transform   = "translateY(0)";
              setTimeout(() => p.container.remove(), 200);
            }, i * REFORM_STAG);
            return;
          }

          anyMoving = true;

          // Lerp toward target + gentle wobble
          p.vx = p.vx * 0.82 + (dx / dist) * (dist * CONVERGE_SPEED + 1.2);
          p.vy = p.vy * 0.82 + (dy / dist) * (dist * CONVERGE_SPEED + 1.2);
          p.x += p.vx;
          p.y += p.vy;
          p.rot += p.spin * (dist / 80);  // spin slows as it approaches
          p.x   += Math.sin(p.t * 0.06 + p.phase) * 0.5;
          p.t++;

          p.container.style.left      = p.x.toFixed(1) + "px";
          p.container.style.top       = p.y.toFixed(1) + "px";
          p.container.style.transform = `rotate(${p.rot.toFixed(1)}deg)`;
        });

        if (arrivedCount < total) {
          rafId = requestAnimationFrame(tick);
        } else {
          // All arrived — wait for stagger tail then clean up
          const tail = total * REFORM_STAG + REFORM_TAIL;
          setTimeout(() => {
            clearMorphEls();
            // Ensure all letters are fully visible and clean
            letters.forEach(l => {
              l.style.opacity    = "1";
              l.style.transform  = "translateY(0)";
              l.style.transition = "";
              l.style.color      = "";
            });
            // Unwrap so next click starts completely fresh
            unwrapLetters(el);
            isAnimating = false;
            res();
          }, tail);
        }
      }

      rafId = requestAnimationFrame(tick);
    });
  }

  window.runTitleScatter = runTitleScatter;
  window.runTitleReform  = runTitleReform;

})();
