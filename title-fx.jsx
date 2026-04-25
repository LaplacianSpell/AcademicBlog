/* Title transition: ink-bleed letter stagger.
 *
 * On click, each letter of the .title-trigger gets wrapped in a span and
 * animated out (drop + ink-bleed shadow). A crimson hairline draws across
 * where the title was. After the route changes, the new title's letters
 * are wrapped & faded in from below — staggered. The hairline retracts.
 *
 * Public API (used by app.jsx):
 *   window.runTitleScatter()  → Promise that resolves when "out" is done
 *   window.runTitleReform()   → Promise that resolves when "in" is done
 */

(function () {
  const OUT_DUR = 520;     // ms per letter cycle (out)
  const IN_DUR  = 560;     // ms per letter cycle (in)
  const STAGGER = 28;      // ms between letters
  const HAIRLINE_DUR = 380;

  // Wrap the textContent of `el` into per-letter spans.
  // Preserves: .dropcap inner span, italics, spaces.
  function wrapLetters(el) {
    if (!el || el.dataset.wrapped === "1") return [...el.querySelectorAll(".tfx-letter")];

    const letters = [];
    const walk = (node, parentClone) => {
      for (const child of [...node.childNodes]) {
        if (child.nodeType === 3) {
          // text node — split into letters
          const text = child.textContent;
          const frag = document.createDocumentFragment();
          for (const ch of text) {
            if (ch === " ") {
              frag.appendChild(document.createTextNode("\u00A0"));
            } else {
              const span = document.createElement("span");
              span.className = "tfx-letter";
              span.textContent = ch;
              frag.appendChild(span);
              letters.push(span);
            }
          }
          parentClone.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          // element — recurse into it (e.g. .dropcap span)
          walk(child, child);
        }
      }
    };
    walk(el, el);
    el.dataset.wrapped = "1";
    return letters;
  }

  function getOrMakeHairline() {
    let h = document.querySelector(".tfx-hairline");
    if (!h) {
      h = document.createElement("div");
      h.className = "tfx-hairline";
      document.body.appendChild(h);
    }
    return h;
  }

  function positionHairline(rect) {
    const h = getOrMakeHairline();
    h.style.left = (rect.left + window.scrollX) + "px";
    h.style.top  = (rect.bottom - 4 + window.scrollY) + "px";
    h.style.width = rect.width + "px";
    return h;
  }

  function runTitleScatter() {
    const el = document.querySelector(".title-trigger");
    if (!el) return Promise.resolve();
    const rect = el.getBoundingClientRect();
    const letters = wrapLetters(el);

    // Draw hairline across the title
    const h = positionHairline(rect);
    h.classList.remove("tfx-hairline-retract");
    // Force reflow then add draw class
    void h.offsetWidth;
    h.classList.add("tfx-hairline-draw");

    // Stagger letters out (right→left feels nice for a written line being unwritten)
    letters.forEach((ltr, i) => {
      const idx = letters.length - 1 - i;
      ltr.style.animationDelay = (idx * STAGGER) + "ms";
      ltr.classList.add("tfx-out");
    });

    const total = OUT_DUR + (letters.length - 1) * STAGGER;
    return new Promise(res => setTimeout(res, total));
  }

  function runTitleReform() {
    const el = document.querySelector(".title-trigger");
    if (!el) return Promise.resolve();
    const letters = wrapLetters(el);

    // Hide initially via class on parent (so flash before stagger fires is hidden)
    el.classList.add("tfx-prepared");
    letters.forEach(l => l.classList.add("tfx-prein"));
    // reflow
    void el.offsetWidth;

    letters.forEach((ltr, i) => {
      ltr.style.animationDelay = (i * STAGGER) + "ms";
      ltr.classList.remove("tfx-prein");
      ltr.classList.add("tfx-in");
    });

    // Retract hairline
    const h = document.querySelector(".tfx-hairline");
    if (h) {
      h.classList.remove("tfx-hairline-draw");
      h.classList.add("tfx-hairline-retract");
    }

    const total = IN_DUR + (letters.length - 1) * STAGGER;
    return new Promise(res => setTimeout(() => {
      // Cleanup classes so re-clicks restart clean
      letters.forEach(l => {
        l.classList.remove("tfx-in", "tfx-out");
        l.style.animationDelay = "";
      });
      el.classList.remove("tfx-prepared");
      if (h) h.classList.remove("tfx-hairline-draw", "tfx-hairline-retract");
      res();
    }, total));
  }

  window.runTitleScatter = runTitleScatter;
  window.runTitleReform = runTitleReform;
})();
