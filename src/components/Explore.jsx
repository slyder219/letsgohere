import { useState } from 'react';
import Icon from './Icon.jsx';
import { ActivityCard, Budget, Choice, GearList, Route, StayCard, useTrip } from './Cards.jsx';
import { SELECTION, SELECTION_ORDER, flag, humanize } from '../lib/trip.js';

const TABS = [
  ['activities', 'Activities'],
  ['travel', 'Places & stays'],
  ['costs', 'Costs'],
  ['decisions', 'Decisions'],
  ['sources', 'Sources'],
];

export default function Explore({ tab, setTab }) {
  const { trip } = useTrip();
  const tabs = TABS.filter(([id]) => id !== 'decisions' || trip.choices.length);
  const current = tabs.some(([id]) => id === tab) ? tab : 'activities';
  return (
    <div className="explore">
      <header className="page-head">
        <h1>Explore</h1>
        <p>Every option we've looked at, with the details.</p>
      </header>
      <nav className="segments" aria-label="Explore sections">
        {tabs.map(([id, label]) => (
          <button key={id} className="segment" aria-current={current === id ? 'page' : undefined} onClick={() => setTab(id)}>
            {label}
          </button>
        ))}
      </nav>
      <div className="explore-body">
        {current === 'activities' && <Activities />}
        {current === 'travel' && <Travel />}
        {current === 'costs' && <Budget items={trip.budget.items} />}
        {current === 'decisions' && trip.choices.map((c) => <Choice key={c.id} choice={c} />)}
        {current === 'sources' && <Sources />}
      </div>
    </div>
  );
}

function Activities() {
  const { trip } = useTrip();
  const kinds = [...new Set(trip.activities.map((a) => a.kind))];
  const [kind, setKind] = useState(null);
  const list = trip.activities.filter((a) => !kind || a.kind === kind);
  const groups = [...SELECTION_ORDER, undefined].map((sel) => [sel, list.filter((a) => a.selection === sel)]).filter(([, l]) => l.length);
  return (
    <>
      <div className="chips filter" role="group" aria-label="Filter by type">
        <button className="chip" aria-pressed={!kind} onClick={() => setKind(null)}>
          All {trip.activities.length}
        </button>
        {kinds.map((k) => (
          <button key={k} className="chip" aria-pressed={kind === k} onClick={() => setKind(kind === k ? null : k)}>
            {humanize(k)} {trip.activities.filter((a) => a.kind === k).length}
          </button>
        ))}
      </div>
      {groups.map(([sel, items]) => {
        const body = (
          <div className="grid">
            {items.map((a) => (
              <ActivityCard key={a.id} activity={a} />
            ))}
          </div>
        );
        const title = `${SELECTION[sel]?.label ?? 'Other'} · ${items.length}`;
        return sel === 'rejected' ? (
          <details key="rejected" className="group">
            <summary>
              <h2>{title}</h2>
            </summary>
            {body}
          </details>
        ) : (
          <section key={sel ?? 'other'} className="group">
            <h2>{title}</h2>
            {body}
          </section>
        );
      })}
    </>
  );
}

function Travel() {
  const { trip, open } = useTrip();
  return (
    <>
      {trip.legs.length > 0 && (
        <section className="group">
          <h2>Getting around</h2>
          <Route legs={trip.legs} />
        </section>
      )}
      {trip.stays.length > 0 && (
        <section className="group">
          <h2>Stays</h2>
          <div className="grid">
            {trip.stays.map((s) => (
              <StayCard key={s.id} stay={s} />
            ))}
          </div>
        </section>
      )}
      <section className="group">
        <h2>Places</h2>
        <ul className="list">
          {trip.places.map((p) => (
            <li key={p.id}>
              <button className="list-row" onClick={() => open('place', p.id)}>
                <span className="list-flag" aria-hidden="true">{flag(p.country_code)}</span>
                <span className="list-main">
                  {p.name}
                  <span className="muted">{humanize(p.role)}</span>
                </span>
                <Icon name="next" size={16} />
              </button>
            </li>
          ))}
        </ul>
      </section>
      {trip.gear.length > 0 && (
        <section className="group">
          <h2>Gear</h2>
          <GearList gear={trip.gear} />
        </section>
      )}
    </>
  );
}

function Sources() {
  const { trip } = useTrip();
  return (
    <ul className="list">
      {trip.sources.map((s) => (
        <li key={s.id}>
          <a className="list-row" href={s.url} target="_blank" rel="noreferrer">
            <Icon name="source" size={18} />
            <span className="list-main">
              {s.title}
              <span className="muted">
                {s.scope}
                {s.checked_at && ` · checked ${s.checked_at}`}
              </span>
            </span>
            <Icon name="external" size={16} />
          </a>
        </li>
      ))}
    </ul>
  );
}
