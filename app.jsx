/* App root */
const { useState, useEffect, useRef, useMemo } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accent": "#c0392b",
  "blob": "#fadcd9",
  "showBlob": true,
  "showQuote": true,
  "showIdentity": true,
  "particleDensity": 0.55,
  "serif": "Cormorant Garamond"
}/*EDITMODE-END*/;

const ROUTE_ORDER = ["about", "research", "pubs", "notes"];

function parseHash() {
  const raw = window.location.hash.replace(/^#/, "");
  const [base, sub = null] = raw.split("/");
  const route = ROUTE_ORDER.includes(base) ? base : "about";
  return { route, sub };
}

function pushRoute(route, sub) {
  const hash = sub ? `${route}/${sub}` : route;
  window.location.hash = hash;
}

function App() {
  const tweaks = (window.useTweaks || ((d) => [d, () => {}]))(TWEAK_DEFAULTS);
  const [vals, setVal] = tweaks;

  const [route, setRoute]   = useState(() => parseHash().route);
  const [note, setNote]     = useState(null);
  const [archive, setArchive] = useState(null);
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [pageKey, setPageKey] = useState(0);
  const reformOnMountRef = useRef(false);
  const animatingRef     = useRef(false);

  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty("--accent", vals.accent);
    r.setProperty("--blob", vals.blob);
    r.setProperty("--serif", `"${vals.serif}", "EB Garamond", Georgia, serif`);
  }, [vals.accent, vals.blob, vals.serif]);

  useEffect(() => {
    if (reformOnMountRef.current && window.runTitleReform) {
      reformOnMountRef.current = false;
      window.runTitleReform().then(() => {
        setAnimating(false);
        animatingRef.current = false;
      });
    }
  }, [route, pageKey]);

  // Safety valve: if reform never fires (e.g. no title on page),
  // unlock after a timeout so the site doesn't get stuck
  useEffect(() => {
    if (animatingRef.current) {
      const t = setTimeout(() => {
        animatingRef.current = false;
        setAnimating(false);
      }, 2200);
      return () => clearTimeout(t);
    }
  }, [route]);

  // hashchange is the single source of truth for all navigation
  useEffect(() => {
    function onHashChange() {
      const { route: r, sub } = parseHash();
      let restoredNote = null;
      if (r === "notes" && sub) {
        restoredNote = (window.NOTES || []).find(n => n.id === sub) || null;
      }
      setRoute(r);
      setNote(restoredNote);
      setArchive(!restoredNote && sub ? decodeURIComponent(sub) : null);
      setQuoteIdx(q => q + 1);
      setPageKey(k => k + 1);
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    window.addEventListener("hashchange", onHashChange);
    if (!window.location.hash) history.replaceState(null, "", "#about");
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const goWithFx = async (targetRoute) => {
    // title-fx.jsx owns the isAnimating guard — if scatter returns instantly
    // (already animating), we still navigate but skip the duplicate scatter
    if (animatingRef.current) return;
    animatingRef.current = true;
    setAnimating(true);
    if (window.runTitleScatter) await window.runTitleScatter();
    reformOnMountRef.current = true;
    pushRoute(targetRoute);
  };

  const handleTitleClick = () => {
    const i = ROUTE_ORDER.indexOf(route);
    goWithFx(ROUTE_ORDER[(i + 1) % ROUTE_ORDER.length]);
  };

  const openNote = (n) => pushRoute("notes", n.id);
  const openArchive = (a) => a ? pushRoute("notes", encodeURIComponent(a)) : pushRoute("notes");

  useEffect(() => {
    const map = { "1": "about", "2": "research", "3": "pubs", "4": "notes" };
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (animatingRef.current) return;
      if (map[e.key]) { goWithFx(map[e.key]); return; }
      if (e.key === "Escape") { window.history.back(); return; }
      if (e.key === "ArrowRight") {
        const i = ROUTE_ORDER.indexOf(route);
        if (i >= 0) goWithFx(ROUTE_ORDER[(i + 1) % ROUTE_ORDER.length]);
      }
      if (e.key === "ArrowLeft") {
        const i = ROUTE_ORDER.indexOf(route);
        if (i >= 0) goWithFx(ROUTE_ORDER[(i - 1 + ROUTE_ORDER.length) % ROUTE_ORDER.length]);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [route]);

  const routeIdx = useMemo(() => {
    const i = ROUTE_ORDER.indexOf(route);
    return i < 0 ? 1 : i + 1;
  }, [route]);

  let content;
  if (route === "about") {
    content = <AboutPage onTitleClick={handleTitleClick} />;
  } else if (route === "research") {
    content = <ResearchPage onTitleClick={handleTitleClick} />;
  } else if (route === "pubs") {
    content = <PubsPage onTitleClick={handleTitleClick} />;
  } else if (route === "notes") {
    content = note
      ? <NoteAbstractPage note={note} onBack={() => window.history.back()} />
      : <NotesPage onTitleClick={handleTitleClick} archive={archive} setArchive={openArchive} onOpen={openNote} />;
  } else {
    content = <AboutPage onTitleClick={handleTitleClick} />;
  }

  return (
    <>
      {vals.showBlob && <Blobs />}
      <TopNav route={route} onGo={(r) => goWithFx(r)} />
      <main className="stage" key={pageKey}>{content}</main>
      <ScrollMark idx={routeIdx} total={ROUTE_ORDER.length} />
      {vals.showIdentity && <Identity />}
      {vals.showQuote && <FooterQuote idx={quoteIdx} />}
      <KbdHint />

      {window.TweaksPanel && (
        <window.TweaksPanel title="Tweaks">
          <window.TweakSection label="Color">
            <window.TweakColor label="Accent (dropcap)" value={vals.accent} onChange={(v) => setVal("accent", v)} />
            <window.TweakColor label="Blob (corner)"    value={vals.blob}   onChange={(v) => setVal("blob", v)} />
          </window.TweakSection>
          <window.TweakSection label="Type">
            <window.TweakSelect
              label="Serif family"
              value={vals.serif}
              onChange={(v) => setVal("serif", v)}
              options={["Cormorant Garamond","EB Garamond","Source Serif Pro","Playfair Display","Lora"]}
            />
          </window.TweakSection>
          <window.TweakSection label="Chrome">
            <window.TweakToggle label="Pink corner blob"  value={vals.showBlob}     onChange={(v) => setVal("showBlob", v)} />
            <window.TweakToggle label="Identity card"     value={vals.showIdentity} onChange={(v) => setVal("showIdentity", v)} />
            <window.TweakToggle label="Footer quote"      value={vals.showQuote}    onChange={(v) => setVal("showQuote", v)} />
          </window.TweakSection>
          <window.TweakSection label="Transition">
            <window.TweakButton label="Replay" onClick={() => handleTitleClick()}>↻ Cycle &amp; replay</window.TweakButton>
          </window.TweakSection>
        </window.TweaksPanel>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
