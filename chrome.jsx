/* Page chrome — top breadcrumb nav, blobs, identity card, scroll mark */

/* ── Dark mode hook ──────────────────────────────────────────────────────── */
function useDarkMode() {
  const [dark, setDark] = React.useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("theme", dark ? "dark" : "light");
    // Keep tweaks panel toggle in sync
    if (window._setDarkFromOutside) window._setDarkFromOutside(dark);
  }, [dark]);

  // Register setter so tweaks panel can drive this component
  React.useEffect(() => {
    window._darkToggle = (v) => setDark(typeof v === "boolean" ? v : (d => !d));
    return () => { window._darkToggle = null; };
  }, []);

  return [dark, setDark];
}

/* ── TopNav ──────────────────────────────────────────────────────────────── */
function TopNav({ route, onGo }) {
  const items = [
    { id: "about",    label: "About" },
    { id: "research", label: "Research" },
    { id: "pubs",     label: "Publications" },
    { id: "notes",    label: "Notes" },
  ];
  return (
    <header className="topnav">
      <button className="brand" onClick={() => onGo("about")}>
        <span className="cap">D</span>i&nbsp;Pan
      </button>
      <nav className="crumbs">
        {items.map((it, i) => (
          <React.Fragment key={it.id}>
            {i > 0 && <span className="sep">/</span>}
            <button
              className={route === it.id ? "active" : ""}
              onClick={() => onGo(it.id)}
            >
              {it.label}
            </button>
          </React.Fragment>
        ))}
        <span className="sep">/</span>
        <a
          href="https://laplacianspell.github.io/"
          target="_blank"
          rel="noopener"
          style={{ color: "var(--ink-soft)", textDecoration: "none", fontSize: "inherit" }}
        >Blog ↗</a>
      </nav>
    </header>
  );
}

/* ── Identity card ───────────────────────────────────────────────────────── */
function Identity() {
  const [dark, setDark] = useDarkMode();
  return (
    <div className="identity">
      <div className="av">D</div>
      <div className="who">
        <span className="name">Di Pan</span>
        <span className="tags">
          <span>PHYSICS</span>
          <span>•</span>
          <span>EPFL</span>
        </span>
      </div>
      <div className="id-actions">
        <button
          onClick={() => setDark(d => !d)}
          title={dark ? "Switch to light mode" : "Switch to dark mode"}
          aria-label="Toggle dark mode"
          style={{ fontSize: "1.1em", opacity: 0.75, transition: "opacity 0.2s" }}
          onMouseEnter={e => e.currentTarget.style.opacity = "1"}
          onMouseLeave={e => e.currentTarget.style.opacity = "0.75"}
        >
          {dark ? "●" : "◐"}
        </button>
        <a href="https://github.com/LaplacianSpell" target="_blank" rel="noopener"
           title="GitHub" aria-label="GitHub">✦</a>
        <a href="/attaches/CV.pdf" target="_blank" title="CV" aria-label="CV">↗</a>
      </div>
    </div>
  );
}

/* ── Blobs ───────────────────────────────────────────────────────────────── */
function Blobs() {
  return (
    <>
      <div className="blob" />
      <div className="blob bottom-right" />
    </>
  );
}

/* ── Scroll position mark ────────────────────────────────────────────────── */
function ScrollMark({ idx, total }) {
  return (
    <div className="scroll-mark">
      <span className="idx">{String(idx).padStart(2, "0")}</span>
      <div className="rule-v" />
      <span className="tot">{String(total).padStart(2, "0")}</span>
    </div>
  );
}

/* ── Rotating footer quote ───────────────────────────────────────────────── */
const QUOTES = [
  "The boundary of a boundary is zero.",
  "Physics is just geometry you haven't understood yet.",
  "Entropy always wins in the end.",
  "A black hole is a region of no escape — and yet Hawking found a way out.",
  "The unreasonable effectiveness of mathematics.",
  "Shut up and calculate.",
  "It from bit.",
];

function FooterQuote({ idx }) {
  const q = QUOTES[idx % QUOTES.length];
  return (
    <div className="footer-quote">
      <span className="dash">—</span>
      <span className="text">{q}</span>
    </div>
  );
}

/* ── Keyboard hint ───────────────────────────────────────────────────────── */
function KbdHint() {
  const [visible, setVisible] = React.useState(true);
  React.useEffect(() => {
    const t = setTimeout(() => setVisible(false), 4500);
    return () => clearTimeout(t);
  }, []);
  if (!visible) return null;
  return (
    <div className="kbd-hint" style={{ opacity: visible ? 1 : 0, transition: "opacity 0.6s" }}>
      <span>1–4</span> navigate &nbsp;·&nbsp; <span>← →</span> cycle &nbsp;·&nbsp; <span>Esc</span> back
    </div>
  );
}

Object.assign(window, { TopNav, Identity, ScrollMark, Blobs, FooterQuote, KbdHint });
