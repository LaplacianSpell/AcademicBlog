/* title-fx.jsx — Sakura animation v4
 *
 * Inspired by the reference: letters slowly drift to fill the entire screen,
 * linger as visible petals, then gently converge back into the new title.
 *
 * Key changes from v3:
 * - Much slower: scatter ~2800ms, reform ~3000ms
 * - Larger petals (28px) with realistic 5-petal cherry blossom shape
 * - Petals fly to all corners of the viewport, not just upward
 * - Gentle sinusoidal drift while floating, no harsh gravity
 * - Reform uses smooth easing, spin decelerates on approach
 *
 * Public API:
 *   window.runTitleScatter()  → Promise resolves when letters are gone
 *   window.runTitleReform()   → Promise resolves when new title is visible
 */
(function () {

  /* ── Timing (all in ms) ─────────────────────────────────────────────── */
  const SHAKE_DUR      = 380;   // letter wobble before explosion
  const SCATTER_STAG   = 60;    // delay between letters starting to scatter
  const FLY_SPEED_MIN  = 1.2;   // px/frame minimum
  const FLY_SPEED_MAX  = 2.8;   // px/frame maximum
  const MORPH_DELAY    = 500;   // ms into flight: letter fades → petal fades in
  const MORPH_DUR      = 500;   // ms crossfade takes
  const FLOAT_AFTER    = 900;   // ms petals just float before scatter resolves
  const SCATTER_TOTAL  = SHAKE_DUR + 2400;

  const CONVERGE_LERP  = 0.055; // lower = slower convergence
  const ARRIVE_DIST    = 5;
  const REFORM_STAG    = 75;    // ms between each letter appearing
  const REFORM_TAIL    = 400;

  /* ── Petal look ─────────────────────────────────────────────────────── */
  const PETAL_COLORS = [
    "#ffb7c5","#ff8fab","#ffc2d1","#f9a8b8","#ffd6e0",
    "#ffafc5","#ff6b8a","#ffc8d5","#ff85a1",
  ];
  const PETAL_SIZE = 28;  // px — big enough to see clearly

  // Five-petal cherry blossom, notched tips
  function petalSVG() {
    const fill  = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
    const fill2 = PETAL_COLORS[Math.floor(Math.random() * PETAL_COLORS.length)];
    const rot   = Math.random() * 360;
    // Build 5 petals around center
    const petals = [];
    for (let k = 0; k < 5; k++) {
      const a = (k * 72 + rot) * Math.PI / 180;
      const px = 16 + Math.cos(a) * 9;
      const py = 16 + Math.sin(a) * 9;
      const lx = 16 + Math.cos(a - 0.5) * 5.5;
      const ly = 16 + Math.sin(a - 0.5) * 5.5;
      const rx = 16 + Math.cos(a + 0.5) * 5.5;
      const ry = 16 + Math.sin(a + 0.5) * 5.5;
      // Notch at tip
      const nx = 16 + Math.cos(a) * 7.5;
      const ny = 16 + Math.sin(a) * 7.5;
      petals.push(`<path d="M 16 16 L ${lx.toFixed(1)} ${ly.toFixed(1)} Q ${px.toFixed(1)} ${py.toFixed(1)} ${nx.toFixed(1)} ${ny.toFixed(1)} Q ${px.toFixed(1)} ${py.toFixed(1)} ${rx.toFixed(1)} ${ry.toFixed(1)} Z"
        fill="${fill}" opacity="0.88" stroke="${fill2}" stroke-width="0.4"/>`);
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${PETAL_SIZE}" height="${PETAL_SIZE}">
      ${petals.join('\n')}
      <circle cx="16" cy="16" r="3" fill="#fff9" stroke="${fill2}" stroke-width="0.5"/>
    </svg>`;
  }

  /* ── State ───────────────────────────────────────────────────────────── */
  let isAnimating = false;
  let rafId       = null;
  let morphEls    = [];

  /* ── Utilities ───────────────────────────────────────────────────────── */
  function stopRaf() {
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  }

  function clearMorphEls() {
    morphEls.forEach(m => { try { m.container.remove(); } catch(e){} });
    morphEls = [];
  }

  function unwrapLetters(el) {
    if (!el) return;
    el.querySelectorAll(".tfx-letter").forEach(s => {
      s.replaceWith(document.createTextNode(s.textContent));
    });
    el.normalize();
    delete el.dataset.wrapped;
  }

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
              s.style.display = "inline-block";
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

  // Create the morph container (letter + petal, overlaid)
  function makeMorphEl(cx, cy, letterText, fontSize) {
    const half = PETAL_SIZE / 2;
    const container = document.createElement("div");
    Object.assign(container.style, {
      position: "fixed",
      left: (cx - half) + "px",
      top:  (cy - half) + "px",
      width:  PETAL_SIZE + "px",
      height: PETAL_SIZE + "px",
      pointerEvents: "none",
      zIndex: "9998",
      transformOrigin: "50% 50%",
    });

    const lEl = document.createElement("span");
    lEl.textContent = letterText;
    Object.assign(lEl.style, {
      position: "absolute", inset: "0",
      display: "flex", alignItems: "center", justifyContent: "center",
      fontFamily: "var(--serif)",
      fontSize:   Math.max(fontSize, 13) + "px",
      fontWeight: "500",
      color:      "var(--accent)",
      opacity:    "1",
      lineHeight: "1",
      pointerEvents: "none",
    });

    const pEl = document.createElement("div");
    pEl.innerHTML = petalSVG();
    Object.assign(pEl.style, {
      position: "absolute", inset: "0",
      display: "flex", alignItems: "center", justifyContent: "center",
      opacity: "0",
    });

    container.appendChild(lEl);
    container.appendChild(pEl);
    document.body.appendChild(container);
    return { container, lEl, pEl };
  }

  /* ══════════════════════════════════════════════════════════════
     SCATTER
     Letters shake → explode in all directions → crossfade to petals
     → petals drift gently across whole viewport
     ══════════════════════════════════════════════════════════════ */
  function runTitleScatter() {
    if (isAnimating) return Promise.resolve();
    isAnimating = true;
    stopRaf();
    clearMorphEls();

    const el = document.querySelector(".title-trigger");
    if (!el) return Promise.resolve();

    unwrapLetters(el);
    const letters = wrapLetters(el);
    if (!letters.length) return Promise.resolve();

    const W = window.innerWidth, H = window.innerHeight;

    // ── Phase 1: shake ───────────────────────────────────────────
    letters.forEach((ltr, i) => {
      ltr.style.color      = "var(--accent)";
      ltr.style.transition = `transform ${SHAKE_DUR * 0.45}ms ease-in-out`;
      const dx = (Math.random() - 0.5) * 6;
      const dy = (Math.random() - 0.5) * 5;
      const dr = (Math.random() - 0.5) * 14;
      setTimeout(() => {
        ltr.style.transform = `translate(${dx}px,${dy}px) rotate(${dr}deg) scale(1.12)`;
      }, i * 15);
    });

    // ── Phase 2: scatter ─────────────────────────────────────────
    setTimeout(() => {
      const states = letters.map((ltr, i) => {
        const r  = ltr.getBoundingClientRect();
        const cx = r.left + r.width  / 2;
        const cy = r.top  + r.height / 2;
        const fs = Math.max(r.height * 0.82, 12);

        ltr.style.opacity    = "0";
        ltr.style.transition = "opacity 0.12s";

        const { container, lEl, pEl } = makeMorphEl(cx, cy, ltr.textContent, fs);

        // Fly in random direction toward edges, spread across whole screen
        const angle  = Math.random() * Math.PI * 2;
        const speed  = FLY_SPEED_MIN + Math.random() * (FLY_SPEED_MAX - FLY_SPEED_MIN);
        const state  = {
          container, lEl, pEl,
          x: cx - PETAL_SIZE / 2,
          y: cy - PETAL_SIZE / 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          rot: Math.random() * 360,
          spin: (Math.random() - 0.5) * 3,   // gentle spin
          phase: Math.random() * Math.PI * 2,
          wphase: Math.random() * Math.PI * 2,
          t: 0,
          morphStarted: false,
          morphed: false,
          delay: i * SCATTER_STAG,
        };
        morphEls.push(state);
        return state;
      });

      const startTime = performance.now();

      function tick(now) {
        const elapsed = now - startTime;

        states.forEach(p => {
          if (elapsed < p.delay) return;
          const localT = elapsed - p.delay;

          // Gentle drift — no gravity, sinusoidal horizontal & vertical wander
          const wander = 0.35;
          p.vx += Math.sin(p.t * 0.028 + p.phase)  * wander * 0.06;
          p.vy += Math.cos(p.t * 0.031 + p.wphase) * wander * 0.06;

          // Soft speed cap so petals don't fly off instantly
          const spd = Math.sqrt(p.vx*p.vx + p.vy*p.vy);
          if (spd > FLY_SPEED_MAX * 1.1) {
            p.vx = (p.vx / spd) * FLY_SPEED_MAX;
            p.vy = (p.vy / spd) * FLY_SPEED_MAX;
          }

          // Gentle bounce off viewport edges so petals stay visible
          const half = PETAL_SIZE / 2;
          if (p.x < -half*2)    p.vx =  Math.abs(p.vx) * 0.6;
          if (p.x > window.innerWidth  + half) p.vx = -Math.abs(p.vx) * 0.6;
          if (p.y < -half*2)    p.vy =  Math.abs(p.vy) * 0.6;
          if (p.y > window.innerHeight + half) p.vy = -Math.abs(p.vy) * 0.6;

          p.x  += p.vx;
          p.y  += p.vy;
          p.rot += p.spin;
          p.t++;

          p.container.style.left      = p.x.toFixed(1) + "px";
          p.container.style.top       = p.y.toFixed(1) + "px";
          p.container.style.transform = `rotate(${p.rot.toFixed(1)}deg)`;

          // Crossfade letter → petal
          if (!p.morphed && !p.morphStarted && localT > MORPH_DELAY) {
            p.morphStarted = true;
            p.lEl.style.transition = `opacity ${MORPH_DUR}ms ease`;
            p.pEl.style.transition = `opacity ${MORPH_DUR}ms ease`;
            p.lEl.style.opacity    = "0";
            p.pEl.style.opacity    = "1";
            setTimeout(() => { p.morphed = true; }, MORPH_DUR + 50);
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
     Petals gently converge toward their target letter positions,
     spin slows, petal → letter crossfade on arrival, staggered reveal
     ══════════════════════════════════════════════════════════════ */
  function runTitleReform() {
    stopRaf();

    const el = document.querySelector(".title-trigger");
    if (!el) { clearMorphEls(); isAnimating = false; return Promise.resolve(); }

    unwrapLetters(el);
    const letters = wrapLetters(el);

    letters.forEach(l => {
      l.style.opacity   = "0";
      l.style.transform = "translateY(8px)";
      l.style.transition = "none";
    });
    void el.offsetWidth;

    const W = window.innerWidth, H = window.innerHeight;

    // Pad / trim morph elements to match letter count
    while (morphEls.length < letters.length) {
      // Spawn from random screen position
      const sx = Math.random() * W;
      const sy = Math.random() * H;
      const { container, lEl, pEl } = makeMorphEl(sx, sy, "", 1);
      pEl.style.opacity = "1";
      lEl.style.opacity = "0";
      morphEls.push({
        container, lEl, pEl,
        x: sx - PETAL_SIZE/2, y: sy - PETAL_SIZE/2,
        vx: (Math.random()-0.5)*1.5, vy: (Math.random()-0.5)*1.5,
        rot: Math.random()*360, spin: (Math.random()-0.5)*4,
        phase: Math.random()*Math.PI*2, wphase: Math.random()*Math.PI*2,
        t: 0, morphed: true, morphStarted: true, delay: 0,
      });
    }
    while (morphEls.length > letters.length) {
      const p = morphEls.pop();
      p.container.style.transition = "opacity 0.3s";
      p.container.style.opacity    = "0";
      setTimeout(() => { try { p.container.remove(); } catch(e){} }, 320);
    }

    // Assign target letter to each petal
    const states = morphEls.map((p, i) => {
      const r  = letters[i].getBoundingClientRect();
      const tx = r.left + r.width  / 2 - PETAL_SIZE / 2;
      const ty = r.top  + r.height / 2 - PETAL_SIZE / 2;
      return { ...p, tx, ty, arrived: false, letterEl: letters[i], localT: 0 };
    });

    return new Promise(res => {
      let arrivedCount = 0;
      const total = states.length;

      function tick() {
        states.forEach((p, i) => {
          if (p.arrived) return;

          const dx   = p.tx - p.x;
          const dy   = p.ty - p.y;
          const dist = Math.sqrt(dx*dx + dy*dy);

          if (dist < ARRIVE_DIST) {
            p.arrived = true;
            arrivedCount++;

            p.pEl.style.transition = "opacity 0.25s ease";
            p.pEl.style.opacity    = "0";

            setTimeout(() => {
              try { p.container.style.opacity = "0"; } catch(e) {}
              const ltr = p.letterEl;
              ltr.style.transition  = "opacity 0.30s ease, transform 0.30s ease";
              ltr.style.opacity     = "1";
              ltr.style.transform   = "translateY(0)";
              ltr.style.color       = "";
              setTimeout(() => {
                try { p.container.remove(); } catch(e) {}
              }, 320);
            }, i * REFORM_STAG);
            return;
          }

          // Eased lerp — stronger pull at distance, gentler close up
          const pull   = Math.min(dist * CONVERGE_LERP + 0.5, 8);
          p.vx = p.vx * 0.80 + (dx / dist) * pull;
          p.vy = p.vy * 0.80 + (dy / dist) * pull;

          // Gentle lateral wobble while converging
          p.x += p.vx + Math.sin(p.localT * 0.07 + p.phase) * (dist / 220);
          p.y += p.vy;

          // Spin decelerates as it nears target
          p.rot += p.spin * Math.min(dist / 60, 1);
          p.localT++;

          p.container.style.left      = p.x.toFixed(1) + "px";
          p.container.style.top       = p.y.toFixed(1) + "px";
          p.container.style.transform = `rotate(${p.rot.toFixed(1)}deg)`;
        });

        if (arrivedCount < total) {
          rafId = requestAnimationFrame(tick);
        } else {
          const tail = total * REFORM_STAG + REFORM_TAIL;
          setTimeout(() => {
            clearMorphEls();
            letters.forEach(l => {
              l.style.opacity    = "1";
              l.style.transform  = "translateY(0)";
              l.style.transition = "";
              l.style.color      = "";
            });
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
