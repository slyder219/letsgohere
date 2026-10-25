import { createContext, useContext, useState } from 'react';
import Icon from './Icon.jsx';
import { Badge, Selection, Stats } from './Bits.jsx';
import { LEG_ICON, LEG_MODE, RECOMMENDATION, costLabel, duration, flag, humanize, money, moneyRange, sharedSuffix } from '../lib/trip.js';

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
              <Icon name={LEG_ICON[leg.mode] ?? 'drive'} size={16} />
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
      <p className="card-foot">{stay.nights == null ? 'Nights TBD' : `${stay.nights} night${stay.nights === 1 ? '' : 's'}`}</p>
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

// What the JSON says an item costs: its single amount, or the middle of its range.
const planned = (i) =>
  i.amount_min == null && i.amount_max == null ? null : i.amount_min == null || i.amount_max == null ? (i.amount_min ?? i.amount_max) : (i.amount_min + i.amount_max) / 2;

// slider runs from 0 to about twice the plan, rounded to a friendly number
function sliderScale(amount) {
  const raw = Math.max(amount * 2, 100);
  const mag = 10 ** Math.floor(Math.log10(raw));
  const max = Math.ceil(raw / mag) * mag;
  return { max, step: max <= 500 ? 5 : max <= 2000 ? 10 : 25 };
}

const defaults = (items) => Object.fromEntries(items.map((i) => [i.id, { on: i.included_in_total, amount: planned(i) }]));

// The total is always the sum of the rows; sliders and the "Add" toggles change it live, Reset restores the JSON.
export function Budget({ items }) {
  const { open } = useTrip();
  const [state, setState] = useState(() => defaults(items));
  const set = (id, patch) => setState((s) => ({ ...s, [id]: { ...s[id], ...patch } }));
  const currency = items[0]?.currency ?? 'USD';
  const value = (i) => state[i.id].amount * (i.quantity ?? 1);

  const counted = items.filter((i) => state[i.id].on && state[i.id].amount != null);
  const total = counted.reduce((t, i) => t + value(i), 0);
  const tbd = items.filter((i) => state[i.id].on && state[i.id].amount == null).length;
  const perPerson = counted.every((i) => i.basis === 'per-person');
  const changed = items.some((i) => state[i.id].on !== i.included_in_total || state[i.id].amount !== planned(i));

  const plan = items.filter((i) => i.included_in_total);
  const planSum = (k) => plan.reduce((t, i) => (t == null || i[k] == null ? null : t + i[k] * (i.quantity ?? 1)), 0);
  const [planMin, planMax] = [planSum('amount_min'), planSum('amount_max')];
  const scenario = sharedSuffix(items);

  // sorted once by the JSON amounts, so rows never jump around under a finger
  const byPlan = (a, b) => (planned(b) ?? 0) - (planned(a) ?? 0);
  const included = items.filter((i) => i.included_in_total).sort(byPlan);
  const extras = items.filter((i) => !i.included_in_total);

  const row = (i) => {
    const { on, amount } = state[i.id];
    const label = costLabel(i, items);
    const { max, step } = sliderScale(planned(i) ?? 0);
    return (
      <li key={i.id} className={`budget-item${on ? '' : ' off'}`}>
        <div className="budget-row">
          <button className="budget-label" onClick={() => open('cost', i.id)}>
            {label}
          </button>
          <span className="budget-amount">{amount == null ? 'TBD' : money(value(i), i.currency)}</span>
        </div>
        {amount != null && (
          <input type="range" className="budget-slider" min="0" max={max} step={step} value={amount} disabled={!on}
            aria-label={`${label} amount`} aria-valuetext={money(amount, i.currency)}
            style={{ '--p': `${Math.min(100, (amount / max) * 100)}%` }}
            onChange={(e) => set(i.id, { amount: Number(e.target.value) })} />
        )}
        {(i.amount_min !== i.amount_max || !i.included_in_total) && (
          <div className="budget-meta">
            {i.amount_min !== i.amount_max && <span>Plan: {moneyRange(i.amount_min, i.amount_max, i.currency)}</span>}
            {!i.included_in_total && (
              <button className="chip budget-toggle" aria-pressed={on} onClick={() => set(i.id, { on: !on })}>
                {on ? (
                  <>
                    <Icon name="check" size={14} /> Added
                  </>
                ) : (
                  '+ Add'
                )}
              </button>
            )}
          </div>
        )}
      </li>
    );
  };

  return (
    <div className="budget">
      <div className="budget-total">
        <div className="budget-total-top">
          <span className="budget-total-num" aria-live="polite">
            {counted.length ? money(total, currency) : 'TBD'}
            {tbd > 0 && counted.length > 0 && '+'}
          </span>
          <button className="text-link budget-reset" onClick={() => setState(defaults(items))} disabled={!changed}>
            Reset
          </button>
        </div>
        <span className="budget-total-label">
          {perPerson ? 'per person' : 'total'} · {changed ? 'with your changes' : `sum of ${counted.length} items`}
          {tbd > 0 && ` · ${tbd} TBD`}
        </span>
        {planMin != null && planMin !== planMax && <span className="budget-plan">Plan: {moneyRange(planMin, planMax, currency)}</span>}
        {scenario && <span className="budget-scenario">{humanize(scenario)}</span>}
      </div>
      <ul className="budget-list">{included.map(row)}</ul>
      {extras.length > 0 && (
        <>
          <h4 className="budget-sub">Not in the total</h4>
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
