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

const ROUTE_ORDER = ["about", "research", "pubs", "notes", "home"];

function App() {
  const tweaks = (window.useTweaks || ((d) => [d, () => {}]))(TWEAK_DEFAULTS);
  const [vals, setVal] = tweaks;

  // About is now the default landing.
  const [route, setRoute] = useState("about");
  const [post, setPost] = useState(null);
  const [note, setNote] = useState(null);
  const [archive, setArchive] = useState(null); // notes archive filter (null = category index)
  const [quoteIdx, setQuoteIdx] = useState(0);
  const [animating, setAnimating] = useState(false);
  // Bump key on every route change so the page-enter CSS animation re-runs.
  const [pageKey, setPageKey] = useState(0);
  // When true, the next-page mount should run the reform animation.
  const reformOnMountRef = useRef(false);

  // CSS variable overrides from tweaks
  useEffect(() => {
    const r = document.documentElement.style;
    r.setProperty("--accent", vals.accent);
    r.setProperty("--blob", vals.blob);
    r.setProperty("--serif", `"${vals.serif}", "EB Garamond", Georgia, serif`);
  }, [vals.accent, vals.blob, vals.serif]);

  // After we change route, if a reform is pending, run it once the new title
  // is in the DOM.
  useEffect(() => {
    if (reformOnMountRef.current && window.runTitleReform) {
      reformOnMountRef.current = false;
      window.runTitleReform().then(() => setAnimating(false));
    }
  }, [route, post, pageKey]);

  // Plain navigation (no FX) — used for clicks on nav and post tiles.
  const goPlain = (r, p = null) => {
    if (animating) return;
    if (r === route && !p) return;
    setRoute(r);
    setPost(p);
    setQuoteIdx(q => q + 1);
    setPageKey(k => k + 1);
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  // Title-click navigation (with scatter → reform FX). Cycles to next route.
  const goWithFx = async (targetRoute) => {
    if (animating) return;
    setAnimating(true);
    if (window.runTitleScatter) {
      await window.runTitleScatter();
    }
    setRoute(targetRoute);
    setPost(null);
    setQuoteIdx(q => q + 1);
    setPageKey(k => k + 1);
    reformOnMountRef.current = true;
    window.scrollTo({ top: 0, behavior: "instant" });
  };

  const handleTitleClick = () => {
    // Title click cycles to the next page in ROUTE_ORDER (skipping post view).
    const i = ROUTE_ORDER.indexOf(route);
    const next = ROUTE_ORDER[(i + 1) % ROUTE_ORDER.length];
    goWithFx(next);
  };

  // Keyboard nav
  useEffect(() => {
    const onKey = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "TEXTAREA") return;
      if (animating) return;
      const map = { "1": "about", "2": "home", "3": "pubs", "4": "notes" };
      if (map[e.key]) { goWithFx(map[e.key]); return; }
      if (e.key === "Escape" && route === "post") { goPlain("about"); return; }
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
  }, [route, animating]);

  const routeIdx = useMemo(() => {
    const i = ROUTE_ORDER.indexOf(route);
    return i < 0 ? 1 : i + 1;
  }, [route]);

  // Reset notes-archive sub-state whenever we leave the notes section.
  useEffect(() => {
    if (route !== "notes" && route !== "note") {
      setArchive(null);
      setNote(null);
    }
  }, [route]);

  let content;
  if (route === "home")  content = <HomePage  onTitleClick={handleTitleClick} onOpen={(p) => goPlain("post", p)} />;
  else if (route === "about") content = <AboutPage  onTitleClick={handleTitleClick} />;
  else if (route === "research") content = <ResearchPage onTitleClick={handleTitleClick} />;
  else if (route === "pubs")  content = <PubsPage   onTitleClick={handleTitleClick} />;
  else if (route === "notes") content = <NotesPage  onTitleClick={handleTitleClick} archive={archive} setArchive={(a) => { setArchive(a); setPageKey(k => k+1); window.scrollTo({top:0, behavior:"instant"}); }} onOpen={(n) => { setNote(n); setRoute("note"); setPageKey(k => k+1); window.scrollTo({top:0, behavior:"instant"}); }} />;
  else if (route === "note" && note) content = <NoteAbstractPage note={note} onBack={() => { setRoute("notes"); setNote(null); setPageKey(k => k+1); window.scrollTo({top:0, behavior:"instant"}); }} />;
  else if (route === "post" && post) content = <PostPage post={post} onBack={() => goPlain("home")} />;

  // For the nav highlight: when in a post view, highlight nothing/home.
  return (
    <>
      {vals.showBlob && <Blobs />}
      <TopNav route={route === "post" ? "home" : (route === "note" ? "notes" : route)} onGo={(r) => goWithFx(r)} />
      <main className="stage" key={pageKey}>{content}</main>
      <ScrollMark idx={routeIdx} total={ROUTE_ORDER.length} />
      {vals.showIdentity && <Identity onGo={goPlain} />}
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
              options={[
                "Cormorant Garamond",
                "EB Garamond",
                "Source Serif Pro",
                "Playfair Display",
                "Lora",
              ]}
            />
          </window.TweakSection>
          <window.TweakSection label="Chrome">
            <window.TweakToggle label="Pink corner blob"     value={vals.showBlob}     onChange={(v) => setVal("showBlob", v)} />
            <window.TweakToggle label="Identity card"        value={vals.showIdentity} onChange={(v) => setVal("showIdentity", v)} />
            <window.TweakToggle label="Footer quote"         value={vals.showQuote}    onChange={(v) => setVal("showQuote", v)} />
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
