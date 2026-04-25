/* Page contents */

function DropCapTitle({ text, size = 38 }) {
  // Take first character; if it's a Latin letter or digit, drop-cap it.
  const first = text[0] || "";
  const rest = text.slice(1);
  return (
    <h2 style={{ fontSize: size }}>
      <span className="dropcap">{first}</span>{rest}
    </h2>
  );
}

const POSTS = [
  { id: "p1", date: "2024-09-12", title: "Sth. about JieLabs",        tag: "JOURNAL" },
  { id: "p2", date: "2024-08-03", title: "2024 — A Year in Quanta",   tag: "REFLECTION" },
  { id: "p3", date: "2024-06-19", title: "Chisel3 踩坑实录",            tag: "NOTES" },
  { id: "p4", date: "2024-05-04", title: "拼音排序 \\w JavaScript",     tag: "CODE" },
  { id: "p5", date: "2024-03-22", title: "被记忆和普通的花所祝福",        tag: "PROSE" },
  { id: "p6", date: "2024-02-08", title: "喵++",                       tag: "MISC" },
];

function HomePage({ onOpen, onTitleClick }) {
  return (
    <div className="page-enter">
      <div className="eyebrow" style={{ fontFamily: "var(--mono)", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-mute)", marginBottom: 24 }}>
        Index / 文草
      </div>
      <h1 className="title-trigger" data-title="home" onClick={onTitleClick} style={{ fontFamily: "var(--serif)", fontWeight: 500, fontSize: 56, margin: "0 0 48px 0", lineHeight: 1.05 }}>
        <span className="dropcap" style={{ color: "var(--accent)", fontStyle: "italic" }}>I</span>ndex
      </h1>
      <div className="post-list">
        {POSTS.map(p => (
          <div className="post-row" key={p.id} onClick={() => onOpen(p)}>
            <div className="date">{p.date}</div>
            <DropCapTitle text={p.title} />
            <div className="meta-line">
              <span className="tag">{p.tag}</span>
              <span>· 8 min read</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function AboutPage({ onTitleClick }) {
  return (
    <article className="article page-enter">
      <div className="eyebrow">About / 关于</div>
      <h1 className="title-trigger" data-title="about" onClick={onTitleClick}><span className="dropcap">A</span>bout me</h1>
      <p>
        My name is Di Pan (潘迪), a Master’s student in Physics at the
        Swiss Federal Technology Institute of Lausanne (EPFL). I am deeply
        fascinated by the <span className="em">quantum origin of spacetime
        and gravity</span>, as well as the mathematical structures behind
        physics.
      </p>
      <p>
        Specifically, I am interested in the physics of black holes, which
        provide a great laboratory for studying quantum aspects of gravity.
        Recently, I am focusing on studies on extreme black holes. I am also
        interested in the role of black holes under the frame of AdS/CFT,
        and the role of quantum information theory plays in our understanding
        of spacetime and gravity. Besides, I am also curious about string
        theory and its applications to quantum gravity.
      </p>
      <p>
        Outside of physics, I write small things in the rain, sort Pinyin in
        JavaScript, and maintain a blog called <em>The Melancholy of Haruhi
        Suzumiya</em>.
      </p>
      <dl className="facts">
        <dt>Now</dt>      <dd>MSc Physics @ EPFL, Lausanne</dd>
        <dt>Before</dt>   <dd>BSc Physics @ Tsinghua University</dd>
        <dt>Field</dt>    <dd>Quantum gravity · Holography · Lattice QFT</dd>
        <dt>Email</dt>    <dd><a href="mailto:laplacianspell@gmail.com">laplacianspell@gmail.com</a></dd>
        <dt>GitHub</dt>   <dd><a href="https://github.com/LaplacianSpell" target="_blank" rel="noopener">@LaplacianSpell</a></dd>
        <dt>CV</dt>       <dd><a href="/attaches/CV.pdf" target="_blank">Detailed CV ↗</a></dd>
      </dl>
    </article>
  );
}

const PUBS = [
  {
    title: "Modified Villain Construction on the Lattice with Boundaries",
    authors: ["D. Pan", "J. Penedones"],
    venue: "In preparation · 2026",
    status: "in prep",
    links: [],
  },
  {
    title: "Zero Mode Corrections to the Kerr Black Hole Partition Function",
    authors: ["D. Pan", "W. Song"],
    venue: "In preparation · 2026",
    status: "in prep",
    links: [],
  },
];

function PubsPage({ onTitleClick }) {
  return (
    <div className="page-enter">
      <div className="eyebrow" style={{ fontFamily: "var(--mono)", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-mute)", marginBottom: 24 }}>
        Publications / 论文
      </div>
      <h1 className="title-trigger" data-title="pubs" onClick={onTitleClick} style={{ fontFamily: "var(--serif)", fontWeight: 500, fontSize: 56, margin: "0 0 48px 0", lineHeight: 1.05 }}>
        <span className="dropcap" style={{ color: "var(--accent)", fontStyle: "italic" }}>P</span>ublications
      </h1>
      <div className="pub-list">
        {PUBS.map((p, i) => (
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
            <div className="links">
              {p.links.map(l => <a key={l} href="#">{l}</a>)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const NOTES = [
  {
    id: "n01", date: "2025-04-12", year: "2025", topic: "Quantum Gravity",
    title: "Schwarzian action, briefly",
    abstract: "A working sketch of how the Schwarzian derivative emerges as the boundary mode of nearly-AdS₂ gravity. We start from JT gravity in Euclidean signature, integrate out the bulk dilaton, and find the boundary action governs the reparametrisation mode of the asymptotic time circle. The one-loop exactness of the partition function is reviewed; matrix-model implications are deferred.",
    links: [
      { label: "Maldacena, Stanford, Yang (2016)", href: "https://arxiv.org/abs/1606.01857", kind: "ref" },
      { label: "PDF (handwritten)", href: "#", kind: "pdf" },
    ],
  },
  {
    id: "n02", date: "2025-03-08", year: "2025", topic: "Holography",
    title: "Replica trick & wormholes",
    abstract: "Re-deriving the entropy formula from gravitational replicas. After the n→1 limit, the dominant saddle on the Renyi entropy diagram becomes a connected wormhole geometry rather than disconnected disks. This is the cleanest way to see the QES prescription falling out of a Euclidean path integral; we also touch on the role of replica wormholes in the Page curve.",
    links: [
      { label: "Penington, Shenker, Stanford, Yang (2019)", href: "https://arxiv.org/abs/1911.11977", kind: "ref" },
      { label: "Almheiri et al. (2019)", href: "https://arxiv.org/abs/1911.12333", kind: "ref" },
    ],
  },
  {
    id: "n03", date: "2025-02-19", year: "2025", topic: "Quantum Info",
    title: "Modular Hamiltonians I can remember",
    abstract: "Why the modular Hamiltonian for a half-space in QFT is the boost generator (Bisognano–Wichmann), and how this generalises to spherical regions in CFT via conformal mapping. A short list of cases I keep forgetting — half-line, sphere, interval at finite temperature — with the precise statement and the geometric reason.",
    links: [
      { label: "Bisognano–Wichmann theorem", href: "https://en.wikipedia.org/wiki/Bisognano%E2%80%93Wichmann_theorem", kind: "ref" },
      { label: "Casini, Huerta (2009)", href: "https://arxiv.org/abs/0903.5284", kind: "ref" },
    ],
  },
  {
    id: "n04", date: "2025-01-30", year: "2025", topic: "Quantum Gravity",
    title: "On the JT path integral",
    abstract: "Two takes on the matrix-model dual of JT gravity: the Saad–Shenker–Stanford genus expansion and the Mertens–Turiaci approach via Liouville. Which one is 'right'? Both — they capture different non-perturbative completions. A short note on why the genus expansion is asymptotic and what the matrix integral fixes.",
    links: [
      { label: "Saad, Shenker, Stanford (2019)", href: "https://arxiv.org/abs/1903.11115", kind: "ref" },
    ],
  },
  {
    id: "n05", date: "2024-12-04", year: "2024", topic: "CFT",
    title: "Conformal blocks for the impatient",
    abstract: "Recursive definitions, Casimir equations, and a worked 4-point function in 2d. We derive the global block from SL(2,ℝ) representation theory, then upgrade to the Virasoro block via Zamolodchikov's recursion. A worked example: the identity block contribution to the heavy-light limit.",
    links: [
      { label: "Zamolodchikov (1984)", href: "#", kind: "ref" },
      { label: "Hartman lectures", href: "https://www.hartmanhep.net/topics2015/", kind: "ref" },
    ],
  },
  {
    id: "n06", date: "2024-11-11", year: "2024", topic: "GR",
    title: "Edge modes & the area term",
    abstract: "Why the gravitational entropy is geometric — a bookkeeping argument. The boundary degrees of freedom localised at the entangling surface contribute the area term to the entanglement entropy; the bulk fields contribute the rest. This is just generalised entropy in slow motion.",
    links: [
      { label: "Donnelly, Wall (2014)", href: "https://arxiv.org/abs/1412.1895", kind: "ref" },
    ],
  },
  {
    id: "n07", date: "2024-10-02", year: "2024", topic: "Quantum Gravity",
    title: "Extremal Kerr — what's so special",
    abstract: "The near-horizon geometry of extremal Kerr is a fibration of AdS₂ over S² with non-trivial U(1) bundle structure. The isometry enhancement to SL(2,ℝ)×U(1) is what powers the Kerr/CFT correspondence — but the boundary CFT is a chiral half, not a full 2d CFT. A re-derivation, slowly.",
    links: [
      { label: "Bardeen, Horowitz (1999)", href: "https://arxiv.org/abs/hep-th/9905099", kind: "ref" },
      { label: "Guica et al., Kerr/CFT (2008)", href: "https://arxiv.org/abs/0809.4266", kind: "ref" },
    ],
  },
  {
    id: "n08", date: "2024-08-21", year: "2024", topic: "Quantum Info",
    title: "Subregion duality, three ways",
    abstract: "Entanglement wedge reconstruction stated as: bulk operators in the entanglement wedge of a boundary subregion can be reconstructed from boundary operators on that subregion. Three formulations — Petz map, modular flow, and the JLMS relation — and why they're equivalent at leading order in 1/N.",
    links: [
      { label: "Jafferis, Lewkowycz, Maldacena, Suh (2015)", href: "https://arxiv.org/abs/1512.06431", kind: "ref" },
    ],
  },
  {
    id: "n09", date: "2024-07-04", year: "2024", topic: "Math",
    title: "拼音 sort, finally working",
    abstract: "How I finally got JavaScript's Intl.Collator to sort Pinyin correctly across mixed Latin/CJK strings. The trick is `localeCompare` with `zh-Hans-u-co-pinyin` — but Safari and Firefox disagree on tone-mark handling. A small polyfill for the corner cases.",
    links: [
      { label: "Intl.Collator (MDN)", href: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/Collator", kind: "ref" },
      { label: "Source on GitHub", href: "https://github.com/LaplacianSpell", kind: "code" },
    ],
  },
  {
    id: "n10", date: "2024-05-18", year: "2024", topic: "Math",
    title: "Cohomology, but for the kitchen",
    abstract: "An attempt to explain de Rham cohomology to a non-physicist friend using the metaphor of a recipe and its variations. Closed forms = the dish; exact forms = a step that doesn't change the outcome; cohomology classes = recipes that produce the same dish modulo trivial rephrasings. Imperfect but stuck.",
    links: [],
  },
];

const NOTE_TOPICS = [
  { id: "all",  label: "All notes",        glyph: "✦" },
  { id: "Quantum Gravity", label: "Quantum Gravity", glyph: "Ω" },
  { id: "Holography",      label: "Holography",      glyph: "◐" },
  { id: "Quantum Info",    label: "Quantum Info",    glyph: "ℏ" },
  { id: "CFT",             label: "CFT",             glyph: "Φ" },
  { id: "GR",              label: "General Relativity", glyph: "g" },
  { id: "Math",            label: "Math & misc.",    glyph: "∞" },
];

function NotesPage({ onTitleClick, archive, setArchive, onOpen }) {
  // archive: null = show category index; string = show notes within that category (or "all")
  const filter = archive;

  if (!filter) {
    // Category index
    const counts = NOTE_TOPICS.map(t => ({
      ...t,
      count: t.id === "all" ? NOTES.length : NOTES.filter(n => n.topic === t.id).length,
    }));
    const years = [...new Set(NOTES.map(n => n.year))].sort().reverse();

    return (
      <div className="page-enter">
        <div className="eyebrow">Notes / 笔记 — Archive</div>
        <h1 className="title-trigger" data-title="notes" onClick={onTitleClick} style={{ fontFamily: "var(--serif)", fontWeight: 500, fontSize: 56, margin: "0 0 16px 0", lineHeight: 1.05 }}>
          <span className="dropcap" style={{ color: "var(--accent)", fontStyle: "italic" }}>N</span>otes
        </h1>
        <p style={{ fontFamily: "var(--serif)", fontSize: 19, color: "var(--ink-soft)", maxWidth: 560, margin: "0 0 56px 0", fontStyle: "italic" }}>
          A working archive — quantum gravity, holography, and the maths I keep forgetting. Browse by topic or by year.
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
              const ct = NOTES.filter(n => n.year === y).length;
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

  // Filtered list view
  let list, filterLabel;
  if (filter === "all") {
    list = NOTES;
    filterLabel = "All notes";
  } else if (filter.startsWith("year:")) {
    const y = filter.slice(5);
    list = NOTES.filter(n => n.year === y);
    filterLabel = "Notes from " + y;
  } else {
    list = NOTES.filter(n => n.topic === filter);
    filterLabel = filter;
  }

  return (
    <div className="page-enter">
      <div className="eyebrow">
        <button onClick={() => setArchive(null)} style={{ color: "var(--ink-mute)" }}>← Archive</button>
        &nbsp;&nbsp;·&nbsp;&nbsp;{filterLabel}
      </div>
      <h1 className="title-trigger" data-title="notes" onClick={onTitleClick} style={{ fontFamily: "var(--serif)", fontWeight: 500, fontSize: 48, margin: "0 0 12px 0", lineHeight: 1.05 }}>
        <span className="dropcap" style={{ color: "var(--accent)", fontStyle: "italic" }}>{filterLabel[0]}</span>{filterLabel.slice(1)}
      </h1>
      <p style={{ fontFamily: "var(--serif)", fontSize: 16, color: "var(--ink-mute)", margin: "0 0 40px 0", fontStyle: "italic" }}>
        {list.length} note{list.length === 1 ? "" : "s"} — abstracts only. Click a title to read.
      </p>
      <div className="abstract-list">
        {list.map(n => (
          <article className="abstract-row" key={n.id} onClick={() => onOpen(n)}>
            <div className="meta">
              <span className="date">{n.date}</span>
              <span className="topic">{n.topic}</span>
            </div>
            <h3>
              <span className="dropcap">{n.title[0]}</span>{n.title.slice(1)}
            </h3>
            <p className="abstract">{n.abstract}</p>
            {n.links.length > 0 && (
              <div className="link-row">
                {n.links.map((l, j) => (
                  <a key={j} href={l.href} target="_blank" rel="noopener" onClick={(e) => e.stopPropagation()}>
                    <span className="kind">{l.kind === "pdf" ? "PDF" : l.kind === "code" ? "↗ code" : "↗"}</span>
                    {l.label}
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
                  {l.label}
                  <span className="arrow">↗</span>
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

function PostPage({ post, onBack }) {
  return (
    <article className="article page-enter">
      <div className="eyebrow">
        <button onClick={onBack} style={{ color: "var(--ink-mute)" }}>← Back to index</button>
        &nbsp;&nbsp;·&nbsp;&nbsp;{post.date}&nbsp;&nbsp;·&nbsp;&nbsp;{post.tag}
      </div>
      <h1>
        <span className="dropcap">{post.title[0]}</span>{post.title.slice(1)}
      </h1>
      <p>
        This is a placeholder body for "{post.title}". The real post would
        live here, set in the same warm serif as the rest of the site, with
        an oversized italic dropcap leading the first paragraph — small,
        deliberate, and unhurried.
      </p>
      <p>
        The aesthetic borrows from a sketch I saw in a friend's WIP: a soft
        peach blob bleeding off the top-left of the page, a single accent of
        <span className="em"> crimson </span>
        on every initial letter, and a dotted-particle dissolve between
        pages. Everything else is whitespace.
      </p>
      <div className="divider"></div>
      <p>
        — D.P.
      </p>
    </article>
  );
}


function ResearchPage({ onTitleClick }) {
  const projects = [
    {
      title: "Modified Villain Construction with Boundaries",
      collab: "with Prof. João Penedones (EPFL) · 2024–present",
      status: "ongoing",
      body: "We develop lattice Villain Hamiltonians with boundary conditions as a systematic discretization of continuum QFTs. The Villain formulation resolves pathologies of compact scalars on the lattice by extending the field configuration space. Current results: we have matched the anomaly-free condition in the continuum limit and reproduced the Reflection Matrix for a bosonized lattice model. A preprint is planned for 2026.",
    },
    {
      title: "Zero Mode Corrections to the Kerr Black Hole Partition Function",
      collab: "with Prof. Wei Song (Tsinghua University) · 2023–present",
      status: "ongoing",
      body: "We investigate quantum corrections from zero modes in the gravitational path integral for the Kerr black hole. Zero modes — field configurations that cost no action but are not pure gauge — must be treated separately in the one-loop determinant. This project connects to the microscopic counting of extremal Kerr microstates and the Kerr/CFT correspondence.",
    },
    {
      title: "Research Internship in Holography",
      collab: "with Prof. Mukund Rangamani (UC Davis) · Summer 2024",
      status: "past",
      body: "Research in holography and AdS/CFT at UC Davis.",
    },
  ];

  return (
    <div className="page-enter">
      <div className="eyebrow" style={{ fontFamily: "var(--mono)", fontSize: 12, letterSpacing: "0.12em", textTransform: "uppercase", color: "var(--ink-mute)", marginBottom: 24 }}>
        Research / 研究
      </div>
      <h1 className="title-trigger" data-title="research" onClick={onTitleClick} style={{ fontFamily: "var(--serif)", fontWeight: 500, fontSize: 56, margin: "0 0 16px 0", lineHeight: 1.05 }}>
        <span className="dropcap" style={{ color: "var(--accent)", fontStyle: "italic" }}>R</span>esearch
      </h1>
      <p style={{ fontFamily: "var(--serif)", fontSize: 19, color: "var(--ink-soft)", maxWidth: 560, margin: "0 0 56px 0", fontStyle: "italic" }}>
        Ongoing and past projects in quantum gravity, holography, and lattice field theory.
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
        {projects.map((p, i) => (
          <div key={i} style={{ borderLeft: "2px solid var(--accent)", paddingLeft: 24, opacity: p.status === "past" ? 0.72 : 1 }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: 12, marginBottom: 6 }}>
              <h3 style={{ fontFamily: "var(--serif)", fontSize: 22, fontWeight: 500, margin: 0, lineHeight: 1.2 }}>
                <span className="dropcap" style={{ color: "var(--accent)", fontStyle: "italic" }}>{p.title[0]}</span>{p.title.slice(1)}
              </h3>
              {p.status === "ongoing" && (
                <span style={{ fontFamily: "var(--mono)", fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--accent)", border: "1px solid var(--accent)", padding: "2px 7px", flexShrink: 0 }}>ongoing</span>
              )}
            </div>
            <div style={{ fontFamily: "var(--mono)", fontSize: 12, color: "var(--ink-mute)", marginBottom: 12 }}>{p.collab}</div>
            <p style={{ fontFamily: "var(--serif)", fontSize: 18, color: "var(--ink-soft)", lineHeight: 1.6, margin: 0 }}>{p.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

Object.assign(window, { HomePage, AboutPage, ResearchPage, PubsPage, NotesPage, NoteAbstractPage, PostPage, POSTS, NOTES });
