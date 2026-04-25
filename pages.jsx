/* Page contents — all text lives in /content/*.md and /content/*.json */
const { useState, useEffect } = React;

/* ── Shared: fetch a markdown file and render it ── */
function useMarkdown(path) {
  const [html, setHtml] = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    fetch(path)
      .then(r => r.text())
      .then(md => { setHtml(window.marked ? window.marked.parse(md) : md); setLoading(false); })
      .catch(() => setLoading(false));
  }, [path]);
  return { html, loading };
}

/* ── Shared: fetch a JSON file ── */
function useJSON(path) {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch(path)
      .then(r => r.json())
      .then(setData)
      .catch(() => setData(null));
  }, [path]);
  return data;
}

/* ── Loading placeholder ── */
function Loading() {
  return <p style={{ fontFamily: "var(--mono)", fontSize: 13, color: "var(--ink-mute)" }}>loading…</p>;
}

/* ── Drop-cap helper ── */
function DropCap({ text, size = 38 }) {
  return (
    <h2 style={{ fontSize: size }}>
      <span className="dropcap">{text[0]}</span>{text.slice(1)}
    </h2>
  );
}

/* ════════════════════════════════════════════════════════
   ABOUT
   Edit: /content/about.md
   ════════════════════════════════════════════════════════ */
function AboutPage({ onTitleClick }) {
  const { html, loading } = useMarkdown("/content/about.md");
  return (
    <article className="article page-enter">
      <div className="eyebrow">About / 关于</div>
      <h1 className="title-trigger" data-title="about" onClick={onTitleClick}>
        <span className="dropcap">A</span>bout me
      </h1>
      {loading ? <Loading /> : <div className="md-body" dangerouslySetInnerHTML={{ __html: html }} />}
    </article>
  );
}

/* ════════════════════════════════════════════════════════
   RESEARCH
   Edit: /content/research.md
   ════════════════════════════════════════════════════════ */
function ResearchPage({ onTitleClick }) {
  const { html, loading } = useMarkdown("/content/research.md");
  return (
    <div className="page-enter">
      <div className="eyebrow" style={{ fontFamily: "var(--mono)", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-mute)", marginBottom: 24 }}>
        Research / 研究
      </div>
      <h1 className="title-trigger" data-title="research" onClick={onTitleClick}
          style={{ fontFamily: "var(--serif)", fontWeight: 500, fontSize: 56, margin: "0 0 48px 0", lineHeight: 1.05 }}>
        <span className="dropcap" style={{ color: "var(--accent)", fontStyle: "italic" }}>R</span>esearch
      </h1>
      {loading ? <Loading /> : <div className="md-body" dangerouslySetInnerHTML={{ __html: html }} />}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   PUBLICATIONS
   Edit: /content/publications.json
   ════════════════════════════════════════════════════════ */
function PubsPage({ onTitleClick }) {
  const pubs = useJSON("/content/publications.json");
  return (
    <div className="page-enter">
      <div className="eyebrow" style={{ fontFamily: "var(--mono)", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-mute)", marginBottom: 24 }}>
        Publications / 论文
      </div>
      <h1 className="title-trigger" data-title="pubs" onClick={onTitleClick}
          style={{ fontFamily: "var(--serif)", fontWeight: 500, fontSize: 56, margin: "0 0 48px 0", lineHeight: 1.05 }}>
        <span className="dropcap" style={{ color: "var(--accent)", fontStyle: "italic" }}>P</span>ublications
      </h1>
      {!pubs ? <Loading /> : (
        <div className="pub-list">
          {pubs.map((p, i) => (
            <div className="pub" key={i}>
              <div className="num">{String(i + 1).padStart(2, "0")}</div>
              <div className="body">
                <h3>{p.title}</h3>
                <div className="authors">
                  {p.authors.map((a, j) => (
                    <React.Fragment key={j}>
                      {j > 0 && ", "}
                      <span className={a === "D. Pan" ? "me" : ""}>{a}</span>
                    </React.Fragment>
                  ))}
                </div>
                <div className="venue">{p.venue}</div>
                <span className="pub-status">{p.status}</span>
              </div>
              {p.links.length > 0 && (
                <div className="links">
                  {p.links.map(l => <a key={l.label} href={l.href} target="_blank" rel="noopener">{l.label}</a>)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   NOTES
   Edit: /content/notes.json
   ════════════════════════════════════════════════════════ */
const NOTE_TOPICS = [
  { id: "all",          label: "All notes",      glyph: "✦" },
  { id: "Quantum Gravity", label: "Quantum Gravity", glyph: "Ω" },
  { id: "Holography",   label: "Holography",     glyph: "◐" },
  { id: "Quantum Info", label: "Quantum Info",   glyph: "ℏ" },
  { id: "CFT",          label: "CFT",            glyph: "Φ" },
  { id: "GR",           label: "General Relativity", glyph: "g" },
  { id: "Math",         label: "Math & misc.",   glyph: "∞" },
];

function NotesPage({ onTitleClick, archive, setArchive, onOpen }) {
  const notes = useJSON("/content/notes.json");

  // Keep window.NOTES in sync so app.jsx can restore a note from hash
  useEffect(() => { if (notes) window.NOTES = notes; }, [notes]);

  if (!notes) return <Loading />;

  // ── Category index ──
  if (!archive) {
    const counts = NOTE_TOPICS.map(t => ({
      ...t,
      count: t.id === "all" ? notes.length : notes.filter(n => n.topic === t.id).length,
    }));
    const years = [...new Set(notes.map(n => n.date.slice(0, 4)))].sort().reverse();

    return (
      <div className="page-enter">
        <div className="eyebrow">Notes / 笔记 — Archive</div>
        <h1 className="title-trigger" data-title="notes" onClick={onTitleClick}
            style={{ fontFamily: "var(--serif)", fontWeight: 500, fontSize: 56, margin: "0 0 16px 0", lineHeight: 1.05 }}>
          <span className="dropcap" style={{ color: "var(--accent)", fontStyle: "italic" }}>N</span>otes
        </h1>
        <p style={{ fontFamily: "var(--serif)", fontSize: 19, color: "var(--ink-soft)", maxWidth: 560, margin: "0 0 56px 0", fontStyle: "italic" }}>
          A working archive — quantum gravity, holography, and the maths I keep forgetting.
        </p>
        <section className="archive-section">
          <div className="archive-label">By topic</div>
          <div className="archive-topics">
            {counts.filter(c => c.count > 0).map(t => (
              <button className="archive-topic" key={t.id} onClick={() => setArchive(t.id)}>
                <span className="glyph">{t.glyph}</span>
                <span className="lbl">{t.label}</span>
                <span className="ct">{String(t.count).padStart(2, "0")}</span>
              </button>
            ))}
          </div>
        </section>
        <section className="archive-section">
          <div className="archive-label">By year</div>
          <div className="archive-years">
            {years.map(y => {
              const ct = notes.filter(n => n.date.startsWith(y)).length;
              return (
                <button className="archive-year" key={y} onClick={() => setArchive("year:" + y)}>
                  <span className="yr">{y}</span>
                  <span className="rule"></span>
                  <span className="ct">{String(ct).padStart(2, "0")} notes</span>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    );
  }

  // ── Filtered list ──
  let list, filterLabel;
  if (archive === "all") {
    list = notes; filterLabel = "All notes";
  } else if (archive.startsWith("year:")) {
    const y = archive.slice(5);
    list = notes.filter(n => n.date.startsWith(y)); filterLabel = "Notes from " + y;
  } else {
    list = notes.filter(n => n.topic === archive); filterLabel = archive;
  }

  return (
    <div className="page-enter">
      <div className="eyebrow">
        <button onClick={() => setArchive(null)} style={{ color: "var(--ink-mute)" }}>← Archive</button>
        &nbsp;&nbsp;·&nbsp;&nbsp;{filterLabel}
      </div>
      <h1 className="title-trigger" data-title="notes" onClick={onTitleClick}
          style={{ fontFamily: "var(--serif)", fontWeight: 500, fontSize: 48, margin: "0 0 12px 0", lineHeight: 1.05 }}>
        <span className="dropcap" style={{ color: "var(--accent)", fontStyle: "italic" }}>{filterLabel[0]}</span>{filterLabel.slice(1)}
      </h1>
      <p style={{ fontFamily: "var(--serif)", fontSize: 16, color: "var(--ink-mute)", margin: "0 0 40px 0", fontStyle: "italic" }}>
        {list.length} note{list.length === 1 ? "" : "s"} — click a title to read.
      </p>
      <div className="abstract-list">
        {list.map(n => (
          <article className="abstract-row" key={n.id} onClick={() => onOpen(n)}>
            <div className="meta">
              <span className="date">{n.date}</span>
              <span className="topic">{n.topic}</span>
            </div>
            <h3><span className="dropcap">{n.title[0]}</span>{n.title.slice(1)}</h3>
            <p className="abstract">{n.abstract}</p>
            {n.links.length > 0 && (
              <div className="link-row">
                {n.links.map((l, j) => (
                  <a key={j} href={l.href} target="_blank" rel="noopener" onClick={e => e.stopPropagation()}>
                    <span className="kind">{l.kind === "pdf" ? "PDF" : "↗"}</span>{l.label}
                  </a>
                ))}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

/* ── Note detail view ── */
function NoteAbstractPage({ note, onBack }) {
  return (
    <article className="article page-enter" style={{ maxWidth: 720 }}>
      <div className="eyebrow">
        <button onClick={onBack} style={{ color: "var(--ink-mute)" }}>← Notes</button>
        &nbsp;&nbsp;·&nbsp;&nbsp;{note.date}&nbsp;&nbsp;·&nbsp;&nbsp;{note.topic}
      </div>
      <h1 style={{ fontSize: 44, lineHeight: 1.1 }}>
        <span className="dropcap">{note.title[0]}</span>{note.title.slice(1)}
      </h1>
      <div className="note-abstract-label">Abstract</div>
      <p className="note-abstract">{note.abstract}</p>
      {note.links.length > 0 && (
        <>
          <div className="note-abstract-label">Links &amp; references</div>
          <ul className="note-link-list">
            {note.links.map((l, i) => (
              <li key={i}>
                <a href={l.href} target="_blank" rel="noopener">
                  <span className="kind">{l.kind === "pdf" ? "PDF" : l.kind === "code" ? "code" : "ref"}</span>
                  {l.label}<span className="arrow">↗</span>
                </a>
              </li>
            ))}
          </ul>
        </>
      )}
      <div className="divider"></div>
      <p style={{ color: "var(--ink-mute)", fontStyle: "italic", fontSize: 14 }}>
        — These are working notes; expect typos and half-thoughts. Email corrections welcome.
      </p>
    </article>
  );
}

Object.assign(window, { AboutPage, ResearchPage, PubsPage, NotesPage, NoteAbstractPage });
