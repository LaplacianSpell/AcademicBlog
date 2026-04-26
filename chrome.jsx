/* Page chrome — top breadcrumb nav, blobs, identity card, scroll mark */
const { useState: useStateChrome } = React;

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

function Identity() {
  const [dark, setDark] = useSharedDarkMode();
  return (
    <div className="identity">
      <div className="av">D</div>
      <div className="who">
        Di Pan
        <small>Physics · EPFL</small>
      </div>
      <div className="links">
        <button onClick={() => setDark(d => !d)} title="Toggle dark mode" aria-label="Toggle dark mode" style={{fontFamily:"inherit",fontSize:"inherit",color:"inherit",cursor:"pointer"}}>{dark ? "●" : "◐"}</button>
        <a href="mailto:laplacianspell@gmail.com" title="Email" aria-label="Email">✦</a>
        <a href="/attaches/CV.pdf" target="_blank" title="CV" aria-label="CV">↗</a>
      </div>
    </div>
  );
}

function ScrollMark({ idx, total }) {
  return (
    <div className="scroll-mark">
      <div className="num">{String(idx).padStart(2, "0")}</div>
      <div className="line"></div>
      <div>{String(total).padStart(2, "0")}</div>
    </div>
  );
}

function Blobs() {
  return (
    <>
      <div className="blob"></div>
      <div className="blob bottom-right"></div>
    </>
  );
}

const QUOTES = [
  "“Some day in the rain.” — D.P.",
  "“The boundary of a boundary is zero.”",
  "“In quantum gravity, geometry is emergent.”",
  "“黑洞是引力的实验室.”",
];

function FooterQuote({ idx }) {
  return <div className="footer-quote">{QUOTES[idx % QUOTES.length]}</div>;
}

function KbdHint() {
  return (
    <div className="kbd-hint">
      <span><kbd>1</kbd>–<kbd>4</kbd> jump</span>
      <span><kbd>←</kbd><kbd>→</kbd> nav</span>
    </div>
  );
}

Object.assign(window, { TopNav, Identity, ScrollMark, Blobs, FooterQuote, KbdHint });
