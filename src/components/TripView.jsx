import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import Story from './Story.jsx';
import Explore from './Explore.jsx';
import Search from './Search.jsx';
import Sheet from './Sheet.jsx';
import Gate from './Gate.jsx';
import { TripContext } from './Cards.jsx';
import { AuthError, fetchTrip, savedToken } from '../lib/api.js';
import { Link, navigate } from '../lib/router.jsx';
import { indexTrip, splitTitle } from '../lib/trip.js';

const VIEWS = [
  ['', 'Story', 'story'],
  ['explore', 'Explore', 'explore'],
  ['search', 'Search', 'search'],
];

export default function TripView({ summary, view, params }) {
  const [token, setToken] = useState(() => savedToken(summary.id));
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!token) return;
    let live = true;
    setError(null);
    fetchTrip(summary.id, token)
      .then((t) => live && setTrip(indexTrip(t)))
      .catch((e) => {
        if (!live) return;
        if (e instanceof AuthError) setToken(null);
        else setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [summary.id, token]);

  if (!token) return <Gate summary={summary} onToken={setToken} />;
  if (error)
    return (
      <div className="center-screen">
        <p>{error}</p>
        <button className="button" onClick={() => setToken(savedToken(summary.id))}>
          Try again
        </button>
      </div>
    );
  if (!trip) return <Loading summary={summary} />;
  return <Loaded trip={trip} view={view} params={params} />;
}

function Loading({ summary }) {
  return (
    <div className="hero hero-loading" aria-busy="true">
      {summary.hero && <img className="hero-img" src={summary.hero} alt="" />}
      <div className="hero-shade" />
      <div className="hero-body">
        <h1 className="hero-title hero-title-long">{splitTitle(summary.title)[0]}</h1>
        <p className="hero-headline">Loading the plan…</p>
      </div>
    </div>
  );
}

function Loaded({ trip, view, params }) {
  const base = trip.id;
  const [sheetType, sheetId] = (params.get('open') ?? '').split(':');
  const [query, setQuery] = useState(params.get('q') ?? '');
  const [exploreTab, setExploreTab] = useState(params.get('tab') ?? 'activities');
  const scrolls = useRef({});
  const pendingSection = useRef(null);

  const url = (v, extra = {}) => {
    const p = new URLSearchParams(extra);
    for (const [k, val] of [...p]) if (!val) p.delete(k);
    return `${base}/${v ? `${v}/` : ''}${p.size ? `?${p}` : ''}`;
  };
  const here = (extra) => url(view, { tab: view === 'explore' ? exploreTab : '', q: view === 'search' ? query : '', ...extra });

  const open = useCallback((type, id) => navigate(here({ open: `${type}:${id}` }), { state: { sheet: true } }), [view, exploreTab, query]);
  const closeSheet = () => (history.state?.sheet ? history.back() : navigate(here({ open: '' }), { replace: true }));

  const goToSection = useCallback(
    (id) => {
      pendingSection.current = id;
      if (sheetType) navigate(url(''), { replace: true });
      else if (view !== '') navigate(url(''));
      // already on the story: no view change will trigger the scroll
      if (view === '') scrollToSection();
    },
    [view, sheetType],
  );

  function scrollToSection() {
    const id = pendingSection.current;
    pendingSection.current = null;
    requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }));
  }

  // each tab keeps its own scroll position
  useLayoutEffect(() => {
    window.scrollTo(0, scrolls.current[view] ?? 0);
    if (view === '' && pendingSection.current) scrollToSection();
    const save = () => (scrolls.current[view] = window.scrollY);
    addEventListener('scroll', save, { passive: true });
    return () => removeEventListener('scroll', save);
  }, [view]);

  // keep the explore tab and search text in the URL so links and reloads land in the same place
  useEffect(() => {
    if (!sheetType) navigate(here(), { replace: true });
  }, [exploreTab, query]);

  useEffect(() => {
    document.title = `${splitTitle(trip.title)[0]} · Let's Go Here`;
  }, [trip]);

  const ctx = useMemo(() => ({ trip, open, goToSection }), [trip, open, goToSection]);

  return (
    <TripContext.Provider value={ctx}>
      <TopBar trip={trip} view={view} />
      <main className={`view view-${view || 'story'}`}>
        {view === '' && <Story />}
        {view === 'explore' && <Explore tab={exploreTab} setTab={setExploreTab} />}
        {view === 'search' && <Search query={query} setQuery={setQuery} />}
      </main>
      <nav className="tabbar" aria-label="Trip sections">
        {VIEWS.map(([v, label, icon]) => (
          <Link key={v} to={url(v, { tab: v === 'explore' ? exploreTab : '', q: v === 'search' ? query : '' })} className="tab"
            aria-current={view === v ? 'page' : undefined}
            onClick={(e) => {
              if (view === v) {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }
            }}>
            <Icon name={icon} size={24} />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
      <Sheet type={sheetType} id={sheetId} onClose={closeSheet} />
    </TripContext.Provider>
  );
}

function TopBar({ trip, view }) {
  const [solid, setSolid] = useState(view !== '');
  const [chapter, setChapter] = useState(null);

  useEffect(() => {
    if (view !== '') return setSolid(true);
    const hero = document.querySelector('.hero');
    const heroObs = new IntersectionObserver(([e]) => setSolid(!e.isIntersecting), { rootMargin: '-60px 0px 0px 0px' });
    if (hero) heroObs.observe(hero);
    const chapterObs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setChapter(e.target.querySelector('h2')?.textContent ?? null);
      },
      { rootMargin: '-40% 0px -55% 0px' },
    );
    document.querySelectorAll('.chapter').forEach((el) => chapterObs.observe(el));
    return () => {
      heroObs.disconnect();
      chapterObs.disconnect();
    };
  }, [view, trip]);

  return (
    <header className={`topbar${solid ? ' solid' : ''}`}>
      <Link to="" className="topbar-back" aria-label="All trips">
        <Icon name="back" size={22} />
      </Link>
      <div className="topbar-title">
        <strong>{splitTitle(trip.title)[0]}</strong>
        {view === '' && chapter && solid && <span>{chapter}</span>}
      </div>
    </header>
  );
}
