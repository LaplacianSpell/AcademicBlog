/* pages.jsx — all text content lives in /content/*.md and /content/*.json */
const { useState, useEffect, useRef, useMemo } = React;

/* ── data hooks ─────────────────────────────────────────────────────────── */
function useMarkdown(path) {
  const [html, setHtml]       = useState("");
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    setLoading(true);
    fetch(path)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.text(); })
      .then(md  => { setHtml(window.marked ? window.marked.parse(md) : md); setLoading(false); })
      .catch(()  => setLoading(false));
  }, [path]);
  return { html, loading };
}

function useJSON(path) {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch(path)
      .then(r => { if (!r.ok) throw new Error(r.status); return r.json(); })
      .then(d  => setData(Array.isArray(d) ? d : []))
      .catch(()  => setData([]));
  }, [path]);
  return data;
}

function Loading() {
  return <p style={{ fontFamily:"var(--mono)", fontSize:13, color:"var(--ink-mute)" }}>loading…</p>;
}

/* ════════════════════════════════════════════════════════
   ABOUT — edit /content/about.md
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
   RESEARCH — edit /content/research.md
   ════════════════════════════════════════════════════════ */
function ResearchPage({ onTitleClick }) {
  const { html, loading } = useMarkdown("/content/research.md");
  return (
    <div className="page-enter">
      <div className="eyebrow" style={{ fontFamily:"var(--mono)", fontSize:12, letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--ink-mute)", marginBottom:24 }}>
        Research / 研究
      </div>
      <h1 className="title-trigger" data-title="research" onClick={onTitleClick}
          style={{ fontFamily:"var(--serif)", fontWeight:500, fontSize:56, margin:"0 0 48px 0", lineHeight:1.05 }}>
        <span className="dropcap" style={{ color:"var(--accent)", fontStyle:"italic" }}>R</span>esearch
      </h1>
      {loading ? <Loading /> : <div className="md-body" dangerouslySetInnerHTML={{ __html: html }} />}
    </div>
  );
}

/* ════════════════════════════════════════════════════════
   PUBLICATIONS — edit /content/publications.json
   ════════════════════════════════════════════════════════ */
function PubsPage({ onTitleClick }) {
  const pubs = useJSON("/content/publications.json");
  return (
    <div className="page-enter">
      <div className="eyebrow" style={{ fontFamily:"var(--mono)", fontSize:12, letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--ink-mute)", marginBottom:24 }}>
        Publications / 论文
      </div>
      <h1 className="title-trigger" data-title="pubs" onClick={onTitleClick}
          style={{ fontFamily:"var(--serif)", fontWeight:500, fontSize:56, margin:"0 0 48px 0", lineHeight:1.05 }}>
        <span className="dropcap" style={{ color:"var(--accent)", fontStyle:"italic" }}>P</span>ublications
      </h1>
      {pubs === null && <Loading />}
      {pubs !== null && pubs.length === 0 && (
        <p style={{ fontFamily:"var(--serif)", fontSize:19, color:"var(--ink-mute)", fontStyle:"italic" }}>
          Papers in preparation — check back soon.
        </p>
      )}
      {pubs !== null && pubs.length > 0 && (
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
              {p.links && p.links.length > 0 && (
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
   NOTES — edit /content/notes.json
   Two views: List (sidebar + filtered list) and Graph (D3 knowledge map)
   ════════════════════════════════════════════════════════ */

const TOPIC_META = [
  { id: "Quantum Gravity", glyph: "Ω", color: "#c0392b" },
  { id: "Holography",      glyph: "◐", color: "#2471a3" },
  { id: "Quantum Info",    glyph: "ℏ", color: "#7d3c98" },
  { id: "CFT",             glyph: "Φ", color: "#148f77" },
  { id: "GR",              glyph: "g", color: "#d35400" },
  { id: "Math",            glyph: "∞", color: "#7f8c8d" },
];

function topicColor(topic) {
  return (TOPIC_META.find(t => t.id === topic) || { color: "#aaa" }).color;
}

/* ── Sidebar button ── */
function SidebarBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{
      display:"flex", alignItems:"center", justifyContent:"space-between",
      width:"100%", textAlign:"left", padding:"6px 10px",
      fontFamily:"var(--mono)", fontSize:12, letterSpacing:"0.04em",
      color: active ? "var(--ink)" : "var(--ink-mute)",
      background: active ? "var(--card)" : "transparent",
      borderRadius:4, border: active ? "1px solid var(--rule)" : "1px solid transparent",
      cursor:"pointer", transition:"all 0.15s",
    }}>
      {children}
    </button>
  );
}

function SidebarLabel({ children }) {
  return (
    <div style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:"0.12em", textTransform:"uppercase",
                  color:"var(--ink-faint)", padding:"16px 10px 4px", userSelect:"none" }}>
      {children}
    </div>
  );
}

/* ── Knowledge graph (D3) ── */
function NoteGraph({ notes, onOpen }) {
  const svgRef   = useRef(null);
  const tipRef   = useRef(null);
  const [hovered, setHovered] = useState(null);

  useEffect(() => {
    if (!notes.length || !window.d3) return;
    const d3  = window.d3;
    const el  = svgRef.current;
    const W   = el.clientWidth || 800;
    const H   = 520;

    d3.select(el).selectAll("*").remove();

    /* ── build graph data ── */
    const nodeMap = {};
    notes.forEach(n => { nodeMap[n.id] = { ...n, type: "note" }; });

    const links = [];
    const seen  = new Set();
    notes.forEach(n => {
      (n.related || []).forEach(rid => {
        const key = [n.id, rid].sort().join("--");
        if (!seen.has(key) && nodeMap[rid]) {
          seen.add(key);
          links.push({ source: n.id, target: rid, kind: "related" });
        }
      });
    });
    // Also link notes sharing the same topic (light edges)
    const byTopic = {};
    notes.forEach(n => { (byTopic[n.topic] = byTopic[n.topic] || []).push(n.id); });
    Object.values(byTopic).forEach(ids => {
      for (let i = 0; i < ids.length; i++) {
        for (let j = i + 1; j < ids.length; j++) {
          const key = [ids[i], ids[j]].sort().join("--");
          if (!seen.has(key)) {
            seen.add(key);
            links.push({ source: ids[i], target: ids[j], kind: "topic" });
          }
        }
      }
    });

    const nodes = Object.values(nodeMap);

    /* ── SVG setup ── */
    const svg = d3.select(el)
      .attr("viewBox", `0 0 ${W} ${H}`)
      .attr("width", "100%")
      .attr("height", H);

    // Subtle grid
    const defs = svg.append("defs");
    const pat  = defs.append("pattern").attr("id","grid").attr("width",40).attr("height",40)
                     .attr("patternUnits","userSpaceOnUse");
    pat.append("path").attr("d","M 40 0 L 0 0 0 40").attr("fill","none")
       .attr("stroke","var(--rule)").attr("stroke-width","0.5");
    svg.append("rect").attr("width","100%").attr("height","100%").attr("fill","url(#grid)").attr("opacity",0.5);

    /* ── simulation ── */
    const sim = d3.forceSimulation(nodes)
      .force("link",      d3.forceLink(links).id(d => d.id)
                            .distance(d => d.kind === "related" ? 90 : 130)
                            .strength(d => d.kind === "related" ? 0.6 : 0.15))
      .force("charge",    d3.forceManyBody().strength(-260))
      .force("center",    d3.forceCenter(W / 2, H / 2))
      .force("collision", d3.forceCollide(28));

    /* ── edges ── */
    const link = svg.append("g").selectAll("line").data(links).join("line")
      .attr("stroke",      d => d.kind === "related" ? "var(--ink-faint)" : "var(--rule)")
      .attr("stroke-width",d => d.kind === "related" ? 1.5 : 0.8)
      .attr("stroke-dasharray", d => d.kind === "topic" ? "4 4" : null)
      .attr("opacity",     d => d.kind === "related" ? 0.7 : 0.4);

    /* ── nodes ── */
    const node = svg.append("g").selectAll("g").data(nodes).join("g")
      .style("cursor", "pointer")
      .call(d3.drag()
        .on("start", (event, d) => { if (!event.active) sim.alphaTarget(0.3).restart(); d.fx = d.x; d.fy = d.y; })
        .on("drag",  (event, d) => { d.fx = event.x; d.fy = event.y; })
        .on("end",   (event, d) => { if (!event.active) sim.alphaTarget(0); d.fx = null; d.fy = null; }));

    // Circle
    node.append("circle")
      .attr("r", 14)
      .attr("fill",   d => topicColor(d.topic) + "22")
      .attr("stroke", d => topicColor(d.topic))
      .attr("stroke-width", 1.5);

    // Topic glyph inside circle
    node.append("text")
      .attr("text-anchor", "middle")
      .attr("dominant-baseline", "central")
      .attr("font-size", 10)
      .attr("fill", d => topicColor(d.topic))
      .attr("font-family", "var(--mono)")
      .text(d => (TOPIC_META.find(t => t.id === d.topic) || {}).glyph || "·");

    // Hover interaction
    node
      .on("mouseenter", (event, d) => {
        d3.select(event.currentTarget).select("circle")
          .attr("r", 18).attr("stroke-width", 2.5);
        setHovered(d);
      })
      .on("mouseleave", (event, d) => {
        d3.select(event.currentTarget).select("circle")
          .attr("r", 14).attr("stroke-width", 1.5);
        setHovered(null);
      })
      .on("click", (event, d) => { onOpen(d); });

    /* ── tick ── */
    sim.on("tick", () => {
      link
        .attr("x1", d => d.source.x).attr("y1", d => d.source.y)
        .attr("x2", d => d.target.x).attr("y2", d => d.target.y);
      node.attr("transform", d => `translate(${
        Math.max(18, Math.min(W - 18, d.x))},${Math.max(18, Math.min(H - 18, d.y))})`);
    });

    return () => sim.stop();
  }, [notes]);

  return (
    <div style={{ position:"relative" }}>
      <svg ref={svgRef} style={{ width:"100%", display:"block", borderRadius:4,
        border:"1px solid var(--rule)", background:"var(--bg)" }} />

      {/* Tooltip */}
      {hovered && (
        <div style={{ position:"absolute", top:12, left:12, maxWidth:260,
          background:"var(--bg)", border:"1px solid var(--rule)", borderRadius:6,
          padding:"10px 14px", pointerEvents:"none", boxShadow:"0 2px 12px rgba(0,0,0,0.06)" }}>
          <div style={{ fontFamily:"var(--mono)", fontSize:10, letterSpacing:"0.1em",
            textTransform:"uppercase", color: topicColor(hovered.topic), marginBottom:4 }}>
            {hovered.topic} · {hovered.date}
          </div>
          <div style={{ fontFamily:"var(--serif)", fontSize:15, fontWeight:500, color:"var(--ink)", marginBottom:4 }}>
            {hovered.title}
          </div>
          <div style={{ fontFamily:"var(--sans)", fontSize:12, color:"var(--ink-mute)", lineHeight:1.5 }}>
            {hovered.abstract.slice(0, 120)}…
          </div>
          <div style={{ fontFamily:"var(--mono)", fontSize:10, color:"var(--ink-faint)", marginTop:6 }}>
            click to open
          </div>
        </div>
      )}

      {/* Legend */}
      <div style={{ display:"flex", flexWrap:"wrap", gap:"10px 18px", marginTop:12 }}>
        {TOPIC_META.filter(t => notes.some(n => n.topic === t.id)).map(t => (
          <span key={t.id} style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--ink-mute)",
            display:"flex", alignItems:"center", gap:5 }}>
            <span style={{ width:10, height:10, borderRadius:"50%", display:"inline-block",
              background: t.color + "33", border:`1.5px solid ${t.color}` }} />
            {t.id}
          </span>
        ))}
        <span style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--ink-faint)", marginLeft:8 }}>
          — — topic link &nbsp;·&nbsp; ——  explicit link
        </span>
      </div>
    </div>
  );
}

/* ── Main NotesPage ── */
function NotesPage({ onTitleClick, archive, setArchive, onOpen }) {
  const notes  = useJSON("/content/notes.json");
  const [view, setView]     = useState("list");  // "list" | "graph"
  const [query, setQuery]   = useState("");

  useEffect(() => { if (notes) window.NOTES = notes; }, [notes]);

  // Fuzzy search
  const searched = useMemo(() => {
    if (!notes || !query.trim()) return notes || [];
    if (window.Fuse) {
      const fuse = new Fuse(notes, {
        keys: [{ name:"title", weight:0.6 }, { name:"abstract", weight:0.3 }, { name:"topic", weight:0.1 }],
        threshold: 0.4, includeScore: true,
      });
      return fuse.search(query).map(r => r.item);
    }
    const q = query.toLowerCase();
    return notes.filter(n => n.title.toLowerCase().includes(q) ||
                             n.abstract.toLowerCase().includes(q) ||
                             n.topic.toLowerCase().includes(q));
  }, [notes, query]);

  // Topic/year filter (only in list view)
  const active = archive || "all";
  const filtered = useMemo(() => {
    const base = query.trim() ? searched : (notes || []);
    if (active === "all")            return base;
    if (active.startsWith("year:"))  return base.filter(n => n.date.startsWith(active.slice(5)));
    return base.filter(n => n.topic === active);
  }, [searched, notes, active, query]);

  const presentTopics = TOPIC_META.filter(t => (notes || []).some(n => n.topic === t.id));
  const years = useMemo(() => [...new Set((notes || []).map(n => n.date.slice(0, 4)))].sort().reverse(), [notes]);

  /* ── view toggle button ── */
  function ViewBtn({ id, label, icon }) {
    return (
      <button onClick={() => setView(id)} style={{
        fontFamily:"var(--mono)", fontSize:11, letterSpacing:"0.06em",
        padding:"5px 12px", border:"1px solid var(--rule)", borderRadius:4,
        background: view === id ? "var(--card)" : "transparent",
        color: view === id ? "var(--ink)" : "var(--ink-mute)",
        cursor:"pointer", transition:"all 0.15s",
      }}>
        {icon} {label}
      </button>
    );
  }

  return (
    <div className="page-enter">
      {/* Header row */}
      <div style={{ display:"flex", alignItems:"baseline", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:32 }}>
        <div>
          <div className="eyebrow" style={{ fontFamily:"var(--mono)", fontSize:12, letterSpacing:"0.12em", textTransform:"uppercase", color:"var(--ink-mute)", marginBottom:8 }}>
            Notes / 笔记
          </div>
          <h1 className="title-trigger" data-title="notes" onClick={onTitleClick}
              style={{ fontFamily:"var(--serif)", fontWeight:500, fontSize:56, margin:0, lineHeight:1.05 }}>
            <span className="dropcap" style={{ color:"var(--accent)", fontStyle:"italic" }}>N</span>otes
          </h1>
        </div>
        <div style={{ display:"flex", gap:6, alignItems:"center" }}>
          <ViewBtn id="list"  label="List"  icon="☰" />
          <ViewBtn id="graph" label="Graph" icon="◎" />
        </div>
      </div>

      {notes === null && <Loading />}

      {notes !== null && notes.length === 0 && (
        <p style={{ fontFamily:"var(--serif)", fontSize:19, color:"var(--ink-mute)", fontStyle:"italic" }}>
          No notes yet — coming soon.
        </p>
      )}

      {notes !== null && notes.length > 0 && view === "list" && (
        <div className="notes-layout">

          {/* Sidebar */}
          <aside className="notes-sidebar">
            {/* Search */}
            <input
              type="text"
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search…"
              style={{
                width:"100%", padding:"6px 10px", marginBottom:8,
                fontFamily:"var(--mono)", fontSize:12,
                border:"1px solid var(--rule)", borderRadius:4,
                background:"var(--bg)", color:"var(--ink)", outline:"none",
              }}
            />
            <SidebarBtn active={active === "all" && !query} onClick={() => { setArchive(null); setQuery(""); }}>
              <span>All notes</span>
              <span style={{ opacity:0.5 }}>{notes.length}</span>
            </SidebarBtn>

            {presentTopics.length > 0 && <SidebarLabel>Topic</SidebarLabel>}
            {presentTopics.map(t => {
              const ct = notes.filter(n => n.topic === t.id).length;
              return (
                <SidebarBtn key={t.id} active={active === t.id && !query} onClick={() => { setArchive(t.id); setQuery(""); }}>
                  <span style={{ display:"flex", alignItems:"center", gap:6 }}>
                    <span style={{ color: topicColor(t.id) }}>{t.glyph}</span>{t.id}
                  </span>
                  <span style={{ opacity:0.5 }}>{ct}</span>
                </SidebarBtn>
              );
            })}

            {years.length > 0 && <SidebarLabel>Year</SidebarLabel>}
            {years.map(y => {
              const ct = notes.filter(n => n.date.startsWith(y)).length;
              const id = "year:" + y;
              return (
                <SidebarBtn key={y} active={active === id && !query} onClick={() => { setArchive(id); setQuery(""); }}>
                  <span>{y}</span>
                  <span style={{ opacity:0.5 }}>{ct}</span>
                </SidebarBtn>
              );
            })}
          </aside>

          {/* Note list */}
          <div className="notes-list">
            {query && (
              <div style={{ fontFamily:"var(--mono)", fontSize:11, color:"var(--ink-mute)",
                            marginBottom:20, letterSpacing:"0.06em" }}>
                {filtered.length} result{filtered.length !== 1 ? "s" : ""} for "{query}"
              </div>
            )}
            {filtered.length === 0 ? (
              <p style={{ fontFamily:"var(--serif)", fontSize:17, color:"var(--ink-mute)", fontStyle:"italic" }}>
                No notes found.
              </p>
            ) : filtered.map(n => (
              <article className="abstract-row" key={n.id} onClick={() => onOpen(n)}>
                <div className="meta">
                  <span className="date">{n.date}</span>
                  <span className="topic" style={{ color: topicColor(n.topic) }}>{n.topic}</span>
                </div>
                <h3><span className="dropcap">{n.title[0]}</span>{n.title.slice(1)}</h3>
                <p className="abstract">{n.abstract}</p>
                {n.links && n.links.length > 0 && (
                  <div className="link-row">
                    {n.links.map((l, j) => (
                      <a key={j} href={l.href} target="_blank" rel="noopener"
                         onClick={e => e.stopPropagation()}>
                        <span className="kind">{l.kind === "pdf" ? "PDF" : "↗"}</span>{l.label}
                      </a>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        </div>
      )}

      {notes !== null && notes.length > 0 && view === "graph" && (
        <div>
          <p style={{ fontFamily:"var(--serif)", fontSize:16, color:"var(--ink-mute)", fontStyle:"italic", marginBottom:20 }}>
            Nodes are notes, colored by topic. Solid edges are explicit links; dashed edges connect notes sharing a topic.
            Drag nodes to rearrange. Click a node to open the note.
          </p>
          <NoteGraph notes={notes} onOpen={onOpen} />
        </div>
      )}
    </div>
  );
}

/* ── Note detail ── */
function NoteAbstractPage({ note, onBack }) {
  return (
    <article className="article page-enter" style={{ maxWidth:720 }}>
      <div className="eyebrow">
        <button onClick={onBack} style={{ color:"var(--ink-mute)" }}>← Notes</button>
        &nbsp;&nbsp;·&nbsp;&nbsp;{note.date}&nbsp;&nbsp;·&nbsp;&nbsp;
        <span style={{ color: topicColor(note.topic) }}>{note.topic}</span>
      </div>
      <h1 style={{ fontSize:44, lineHeight:1.1 }}>
        <span className="dropcap">{note.title[0]}</span>{note.title.slice(1)}
      </h1>
      <div className="note-abstract-label">Abstract</div>
      <p className="note-abstract">{note.abstract}</p>
      {note.related && note.related.length > 0 && (
        <>
          <div className="note-abstract-label">See also</div>
          <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginBottom:24 }}>
            {note.related.map(rid => {
              const rel = (window.NOTES || []).find(n => n.id === rid);
              if (!rel) return null;
              return (
                <button key={rid}
                  onClick={() => { window.location.hash = "notes/" + rid; }}
                  style={{ fontFamily:"var(--mono)", fontSize:11, padding:"4px 10px",
                    border:"1px solid var(--rule)", borderRadius:4, background:"var(--card)",
                    color:"var(--ink-mute)", cursor:"pointer" }}>
                  {rel.title}
                </button>
              );
            })}
          </div>
        </>
      )}
      {note.links && note.links.length > 0 && (
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
      <p style={{ color:"var(--ink-mute)", fontStyle:"italic", fontSize:14 }}>
        — Working notes; expect typos and half-thoughts. Email corrections welcome.
      </p>
    </article>
  );
}

Object.assign(window, { AboutPage, ResearchPage, PubsPage, NotesPage, NoteAbstractPage });
