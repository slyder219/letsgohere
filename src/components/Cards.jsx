import { createContext, useContext } from 'react';
import Icon from './Icon.jsx';
import { Badge, Selection, Stats } from './Bits.jsx';
import { LEG_MODE, RECOMMENDATION, costLabel, duration, flag, humanize, moneyRange, sharedSuffix } from '../lib/trip.js';

// { trip, open(type, id), goToSection(id) }
export const TripContext = createContext(null);
export const useTrip = () => useContext(TripContext);

export function ActivityCard({ activity }) {
  const { open } = useTrip();
  return (
    <button className="card activity-card" onClick={() => open('activity', activity.id)}>
      <div className="card-top">
        <Selection value={activity.selection} />
        {activity.recommendation && <span className="card-kicker">{RECOMMENDATION[activity.recommendation]}</span>}
      </div>
      <h3>{activity.title}</h3>
      <Stats item={activity} />
      {activity.difficulty && <p className="card-text">{activity.difficulty}</p>}
      {activity.area && <p className="card-foot">{activity.area}</p>}
    </button>
  );
}

export function Rail({ children, label }) {
  return (
    <div className="rail" role="list" aria-label={label}>
      {children}
    </div>
  );
}

export function Places({ places }) {
  const { open } = useTrip();
  return (
    <div className="chips">
      {places.map((p) => (
        <button key={p.id} className="chip" onClick={() => open('place', p.id)}>
          <span aria-hidden="true">{flag(p.country_code)}</span> {p.name}
        </button>
      ))}
    </div>
  );
}

export function Route({ legs }) {
  const { trip, open } = useTrip();
  const stops = [];
  for (const leg of legs) {
    if (stops.at(-1)?.place?.id !== leg.from_place_id) stops.push({ place: trip.get('place', leg.from_place_id) });
    stops.push({ leg, place: trip.get('place', leg.to_place_id) });
  }
  return (
    <ol className="route">
      {stops.map(({ leg, place }, i) => (
        <li key={i}>
          {leg && (
            <button className="route-leg" onClick={() => open('leg', leg.id)}>
              <Icon name={leg.mode === 'flight' ? 'flight' : 'drive'} size={16} />
              <span>{LEG_MODE[leg.mode] ?? humanize(leg.mode)}</span>
              {duration(leg.duration_minutes) && <span className="muted">· {duration(leg.duration_minutes)}</span>}
            </button>
          )}
          <button className="route-stop" onClick={() => place && open('place', place.id)}>
            <span className="route-dot" />
            <span>{place?.name ?? 'Unknown'}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

export function StayCard({ stay }) {
  const { trip, open } = useTrip();
  return (
    <button className="card stay-card" onClick={() => open('stay', stay.id)}>
      <div className="card-top">
        <Icon name="stay" size={18} />
        <span className="card-kicker">{humanize(stay.kind)} · {trip.get('place', stay.place_id)?.name}</span>
      </div>
      <h3>{stay.name}</h3>
      <p className="card-foot">{stay.nights == null ? 'Nights TBD' : `${stay.nights} nights`}</p>
    </button>
  );
}

export function Choice({ choice }) {
  const { trip, goToSection } = useTrip();
  return (
    <div className="choice">
      <div className="choice-head">
        <Icon name="choice" size={18} />
        <h3>{choice.question}</h3>
        {!choice.selected_option_id && <Badge tone="idea">Undecided</Badge>}
      </div>
      <div className="choice-options">
        {choice.options.map((o) => {
          const next = o.next_section_id && trip.get('section', o.next_section_id);
          const picked = choice.selected_option_id === o.id;
          return (
            <div key={o.id} className={`option${picked ? ' option-picked' : ''}`}>
              <div className="option-label">
                {picked && <Icon name="check" size={16} />}
                {o.label}
              </div>
              <p>{o.description}</p>
              {next && (
                <button className="text-link" onClick={() => goToSection(next.id)}>
                  {next.title} <Icon name="next" size={14} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function Budget({ items }) {
  const { open } = useTrip();
  const included = items.filter((i) => i.included_in_total);
  const extras = items.filter((i) => !i.included_in_total);
  const currency = items[0]?.currency ?? 'USD';
  const perPerson = included.every((i) => i.basis === 'per-person');
  const sum = (k) => included.reduce((t, i) => (t == null || i[k] == null ? null : t + i[k] * (i.quantity ?? 1)), 0);
  const [min, max] = [sum('amount_min'), sum('amount_max')];
  const top = Math.max(...included.map((i) => i.amount_max ?? i.amount_min ?? 0));
  const scenario = sharedSuffix(items);
  const row = (i) => (
    <li key={i.id}>
      <button className="budget-row" onClick={() => open('cost', i.id)}>
        <span className="budget-label">{costLabel(i, items)}</span>
        <span className="budget-amount">{moneyRange(i.amount_min, i.amount_max, i.currency)}</span>
        {i.included_in_total && <span className="budget-bar" style={{ '--w': `${((i.amount_max ?? i.amount_min ?? 0) / top) * 100}%` }} />}
      </button>
    </li>
  );
  return (
    <div className="budget">
      <div className="budget-total">
        <span className="budget-total-num">{min == null ? 'TBD' : moneyRange(min, max, currency)}</span>
        <span className="budget-total-label">
          {perPerson ? 'per person' : 'total'} · sum of {included.length} estimated items
        </span>
        {scenario && <span className="budget-scenario">{humanize(scenario)}</span>}
      </div>
      <ul className="budget-list">{included.sort((a, b) => (b.amount_max ?? 0) - (a.amount_max ?? 0)).map(row)}</ul>
      {extras.length > 0 && (
        <>
          <h4 className="budget-sub">Optional extras, not in the total</h4>
          <ul className="budget-list">{extras.map(row)}</ul>
        </>
      )}
    </div>
  );
}

export function GearList({ gear }) {
  return (
    <ul className="gear-list">
      {gear.map((g) => (
        <li key={g.id}>
          <Icon name="gear" size={16} />
          <span>
            {g.name}
            {g.quantity_per_person != null && ` ×${g.quantity_per_person}`}
            {g.obtain && <span className="muted"> · {humanize(g.obtain)}</span>}
          </span>
          {g.required && <Badge tone="accent">Required</Badge>}
        </li>
      ))}
    </ul>
  );
}
