/* title-fx.jsx — Sakura letter animation
 *
 * SCATTER: each letter morphs into a cherry blossom petal and flies away
 * REFORM:  petals drift in from random positions and morph back into letters
 *
 * Bug fix: isAnimating guard prevents re-entrant calls stacking up.
 *
 * Public API (used by app.jsx):
 *   window.runTitleScatter()  → Promise, resolves when letters are gone
 *   window.runTitleReform()   → Promise, resolves when letters have appeared
 */
(function () {

  /* ── config ──────────────────────────────────────────────────────────── */
  const PETAL_COLORS = ["#ffb7c5","#ff9ab0","#ffc8d5","#f7a8b8","#ffd1dc","#ff85a1"];
  const GRAVITY      = 0.06;   // px/frame²
  const WIND         = 0.015;  // sinusoidal wind amplitude per frame
  const SCATTER_MS   = 700;    // time before scatter resolves
  const REFORM_STAGGER = 38;   // ms between letters appearing

  let activePetals = [];   // petal DOM elements still on screen
  let rafId        = null; // physics loop handle
  let isAnimating  = false;

  /* ── DOM helpers ─────────────────────────────────────────────────────── */
  function wrapLetters(el) {
    if (!el) return [];
    if (el.dataset.wrapped === "1") return [...el.querySelectorAll(".tfx-letter")];
    const letters = [];
    const walk = (node) => {
      for (const child of [...node.childNodes]) {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          for (const ch of child.textContent) {
            if (ch === " " || ch === "\u00A0") {
              frag.appendChild(document.createTextNode("\u00A0"));
            } else {
              const span = document.createElement("span");
              span.className = "tfx-letter";
              span.textContent = ch;
              frag.appendChild(span);
              letters.push(span);
            }
          }
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      }
    };
    walk(el);
    el.dataset.wrapped = "1";
    return letters;
  }

  /* ── Petal factory ───────────────────────────────────────────────────── */
  function petalSVG() {
    const c = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
    const rot = (Math.random() * 40 - 20).toFixed(1);
    // Two overlapping ellipses = convincing petal
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 18" width="14" height="18">
      <ellipse cx="7" cy="11" rx="5.5" ry="7.5" fill="${c}" opacity="0.92"
        transform="rotate(${rot} 7 9)"/>
      <ellipse cx="7" cy="8" rx="3" ry="5.5" fill="${c}" opacity="0.55"
        transform="rotate(${-rot * 0.6} 7 9)"/>
    </svg>`;
  }

  function makePetal(x, y) {
    const div = document.createElement("div");
    div.innerHTML = petalSVG();
    Object.assign(div.style, {
      position:       "fixed",
      left:           x + "px",
      top:            y  + "px",
      width:          "14px",
      height:         "18px",
      pointerEvents:  "none",
      zIndex:         "9998",
      transformOrigin:"50% 60%",
      transform:      `rotate(${Math.random() * 360}deg)`,
      opacity:        "1",
      transition:     "none",
    });
    document.body.appendChild(div);
    return div;
  }

  /* ── Physics state per petal ─────────────────────────────────────────── */
  function petalState(el, vx, vy, spin, phase) {
    return { el, x: parseFloat(el.style.left), y: parseFloat(el.style.top),
             vx, vy, spin, rot: Math.random() * 360, phase, t: 0 };
  }

  function applyState(p) {
    p.el.style.left      = p.x.toFixed(1) + "px";
    p.el.style.top       = p.y.toFixed(1) + "px";
    p.el.style.transform = `rotate(${p.rot.toFixed(1)}deg)`;
  }

  /* ── Physics loops ───────────────────────────────────────────────────── */
  function startFloatLoop(states) {
    if (rafId) cancelAnimationFrame(rafId);
    function tick() {
      states.forEach(p => {
        p.t++;
        p.vy += GRAVITY;
        p.vx += Math.sin(p.t * 0.04 + p.phase) * WIND;
        p.x  += p.vx;
        p.y  += p.vy;
        p.rot += p.spin;
        applyState(p);
      });
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
  }

  function startConvergeLoop(states, onDone) {
    if (rafId) cancelAnimationFrame(rafId);
    let done = 0;
    function tick() {
      let allDone = true;
      states.forEach(p => {
        if (p.arrived) return;
        const dx = p.tx - p.x, dy = p.ty - p.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 3) {
          p.arrived = true;
          p.el.style.opacity = "0";
          p.el.style.transition = "opacity 0.18s";
          done++;
          if (p.onArrive) p.onArrive();
          return;
        }
        allDone = false;
        const speed = Math.min(dist * 0.14 + 1.5, 18);
        p.x   += (dx / dist) * speed;
        p.y   += (dy / dist) * speed;
        p.rot += p.spin * 0.5;
        // slight wobble on approach
        p.x   += Math.sin(p.t * 0.08) * 0.6;
        p.t++;
        applyState(p);
      });
      if (allDone) { onDone(); return; }
      rafId = requestAnimationFrame(tick);
    }
    rafId = requestAnimationFrame(tick);
  }

  function stopLoop() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  function clearPetals() {
    activePetals.forEach(p => p.el && p.el.remove());
    activePetals = [];
  }

  /* ── SCATTER ─────────────────────────────────────────────────────────── */
  function runTitleScatter() {
    if (isAnimating) return Promise.resolve();
    isAnimating = true;
    stopLoop();
    clearPetals();

    const el = document.querySelector(".title-trigger");
    if (!el) { isAnimating = false; return Promise.resolve(); }

    const letters = wrapLetters(el);
    const states  = [];

    letters.forEach((ltr, i) => {
      const r   = ltr.getBoundingClientRect();
      const cx  = r.left + r.width  / 2;
      const cy  = r.top  + r.height / 2;
      const p   = makePetal(cx - 7, cy - 9);

      // Hide the letter
      ltr.style.opacity    = "0";
      ltr.style.transition = "opacity 0.15s";

      // Petal starts at letter position, flies outward
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 3.5;
      states.push(petalState(p,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed - 1.5,     // slight upward bias
        (Math.random() - 0.5) * 6,
        Math.random() * Math.PI * 2
      ));
    });

    activePetals = states;
    startFloatLoop(states);

    return new Promise(res => setTimeout(() => {
      // Don't stop loop — petals keep drifting until reform
      // Don't set isAnimating=false here; app.jsx controls that via reform
      res();
    }, SCATTER_MS));
  }

  /* ── REFORM ──────────────────────────────────────────────────────────── */
  function runTitleReform() {
    stopLoop();

    const el = document.querySelector(".title-trigger");
    if (!el) { clearPetals(); isAnimating = false; return Promise.resolve(); }

    const letters = wrapLetters(el);

    // Hide letters initially
    letters.forEach(l => {
      l.style.opacity    = "0";
      l.style.transition = "none";
    });

    // Force layout so getBoundingClientRect is accurate
    void el.offsetWidth;

    // Reuse existing petals, pad with new ones from random spawn points
    const W = window.innerWidth, H = window.innerHeight;
    while (activePetals.length < letters.length) {
      const spawnX = Math.random() * W;
      const spawnY = -20 - Math.random() * 120;
      activePetals.push(petalState(makePetal(spawnX, spawnY),
        (Math.random() - 0.5) * 3, Math.random() * 2,
        (Math.random() - 0.5) * 5,
        Math.random() * Math.PI * 2
      ));
    }

    // Trim excess petals
    while (activePetals.length > letters.length) {
      const p = activePetals.pop();
      p.el.style.transition = "opacity 0.2s";
      p.el.style.opacity    = "0";
      setTimeout(() => p.el.remove(), 200);
    }

    // Assign targets — each petal → corresponding letter
    // Stagger the onArrive callbacks so letters appear one by one
    const convergeStates = activePetals.map((p, i) => {
      const r  = letters[i].getBoundingClientRect();
      const tx = r.left + r.width  / 2 - 7;
      const ty = r.top  + r.height / 2 - 9;
      return {
        ...p,
        tx, ty,
        arrived: false,
        t: 0,
        onArrive: () => {
          // Show letter with staggered delay for a wave effect
          setTimeout(() => {
            letters[i].style.transition = "opacity 0.22s, transform 0.22s";
            letters[i].style.transform  = "translateY(4px)";
            void letters[i].offsetWidth;
            letters[i].style.opacity    = "1";
            letters[i].style.transform  = "translateY(0)";
          }, i * REFORM_STAGGER);
        },
      };
    });
    activePetals = convergeStates;

    return new Promise(res => {
      startConvergeLoop(convergeStates, () => {
        const tail = letters.length * REFORM_STAGGER + 260;
        setTimeout(() => {
          // Cleanup
          clearPetals();
          letters.forEach(l => {
            l.style.opacity    = "1";
            l.style.transition = "";
            l.style.transform  = "";
          });
          isAnimating = false;
          res();
        }, tail);
      });
    });
  }

  /* ── Expose ──────────────────────────────────────────────────────────── */
  window.runTitleScatter = runTitleScatter;
  window.runTitleReform  = runTitleReform;

})();
