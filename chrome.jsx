/* Page chrome — top breadcrumb nav, blobs, identity card, scroll mark */

/* ── Dark mode (minimal, no visual changes to Identity card) ─────────────── */
function useDarkMode() {
  const [dark, setDark] = React.useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });
  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);
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
          target="_blank" rel="noopener"
          style={{ color:"var(--ink-soft)", textDecoration:"none", fontSize:"inherit" }}
        >Blog ↗</a>
      </nav>
    </header>
  );
}

/* ── Identity card — exactly original layout, ◐ wired to dark mode ───────── */
function Identity() {
  const [, setDark] = useDarkMode();
  return (
    <div className="identity">
      <div className="av">D</div>
      <div className="who">
        Di Pan
        <small>Physics · EPFL</small>
      </div>
      <div className="links">
        <a title="Toggle dark mode" aria-label="Toggle dark mode"
           style={{ cursor:"pointer" }}
           onClick={(e) => { e.preventDefault(); setDark(d => !d); }}>◐</a>
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
      <div className="blob"></div>
      <div className="blob bottom-right"></div>
    </>
  );
}

/* ── Scroll mark ─────────────────────────────────────────────────────────── */
function ScrollMark({ idx, total }) {
  return (
    <div className="scroll-mark">
      <div className="num">{String(idx).padStart(2, "0")}</div>
      <div className="line"></div>
      <div>{String(total).padStart(2, "0")}</div>
    </div>
  );
}

/* ── Footer quote ────────────────────────────────────────────────────────── */
const QUOTES = [
  '"Some day in the rain." — D.P.',
  '"The boundary of a boundary is zero."',
  '"In quantum gravity, geometry is emergent."',
  '"黑洞是引力的实验室."',
];

function FooterQuote({ idx }) {
  return <div className="footer-quote">{QUOTES[idx % QUOTES.length]}</div>;
}

/* ── Keyboard hint ───────────────────────────────────────────────────────── */
function KbdHint() {
  return (
    <div className="kbd-hint">
      <span><kbd>1</kbd>–<kbd>4</kbd> jump</span>
      <span><kbd>←</kbd><kbd>→</kbd> nav</span>
    </div>
  );
}

Object.assign(window, { TopNav, Identity, ScrollMark, Blobs, FooterQuote, KbdHint });
