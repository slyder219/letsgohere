import { useDeferredValue, useMemo } from 'react';
import Icon from './Icon.jsx';
import { useTrip } from './Cards.jsx';
import { buildIndex, searchTrip, snippet } from '../lib/search.js';

const TYPE = {
  section: ['Chapter', 'story'], activity: ['Activity', 'mountain'], place: ['Place', 'place'], leg: ['Travel', 'drive'],
  stay: ['Stay', 'stay'], cost: ['Cost', 'money'], choice: ['Decision', 'choice'], gear: ['Gear', 'gear'], source: ['Source', 'source'],
};
// built from the trip itself, so every trip gets suggestions that have answers
function suggestions(trip) {
  const pick = trip.activities.find((a) => a.selection === 'selected' && a.kind === 'hike') ?? trip.activities[0];
  return [
    pick && `How hard is ${pick.title}?`,
    trip.budget.items.length && 'What does it cost?',
    trip.stays.length && 'Where do we sleep?',
    trip.gear.length && 'What should I pack?',
    trip.activities.some((a) => a.guide) && 'Do we need a guide?',
    trip.flow.some((s) => /weather/i.test(s.title)) && 'Weather',
  ].filter(Boolean);
}

export default function Search({ query, setQuery }) {
  const { trip, open, goToSection } = useTrip();
  const index = useMemo(() => buildIndex(trip), [trip]);
  const q = useDeferredValue(query);
  const results = useMemo(() => searchTrip(index, q).slice(0, 30), [index, q]);

  const pick = (r) => {
    if (r.type === 'section') goToSection(r.ref);
    else if (r.type === 'source') window.open(trip.get('source', r.ref).url, '_blank', 'noreferrer');
    else open(r.type, r.ref);
  };

  return (
    <div className="search">
      <form className="search-bar" role="search" onSubmit={(e) => { e.preventDefault(); e.target.querySelector('input').blur(); }}>
        <Icon name="search" size={18} />
        <input type="search" enterKeyHint="search" autoFocus placeholder={`Search ${trip.title.split(':')[0]}`} aria-label="Search this trip"
          value={query} onChange={(e) => setQuery(e.target.value)} autoComplete="off" autoCorrect="off" spellCheck="false" />
        {query && (
          <button type="button" className="icon-button" aria-label="Clear search" onClick={() => setQuery('')}>
            <Icon name="close" size={16} />
          </button>
        )}
      </form>

      {!q.trim() ? (
        <div className="search-empty">
          <p>Search anything in the plan.</p>
          <div className="chips">
            {suggestions(trip).map((s) => (
              <button key={s} className="chip" onClick={() => setQuery(s)}>
                {s}
              </button>
            ))}
          </div>
        </div>
      ) : results.length === 0 ? (
        <p className="search-empty">Nothing matches “{q}”. Try a simpler word.</p>
      ) : (
        <ul className="list results" aria-live="polite">
          {results.map((r) => {
            const [label, icon] = TYPE[r.type] ?? [r.type, 'source'];
            return (
              <li key={r.id}>
                <button className="list-row result" onClick={() => pick(r)}>
                  <Icon name={icon} size={18} />
                  <span className="list-main">
                    <span className="result-type">{label}</span>
                    <span>
                      <Highlight text={r.title} terms={r.terms} />
                    </span>
                    <span className="muted">
                      <Highlight text={snippet(r.text || r.meta, r.terms)} terms={r.terms} />
                    </span>
                  </span>
                  <Icon name="next" size={16} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function Highlight({ text, terms }) {
  if (!text || !terms?.length) return text ?? null;
  const re = new RegExp(`(${terms.map((t) => t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`, 'gi');
  return text.split(re).map((part, i) => (i % 2 ? <mark key={i}>{part}</mark> : part));
}
