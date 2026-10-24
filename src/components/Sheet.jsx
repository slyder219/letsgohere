import { useEffect, useRef, useState } from 'react';
import Icon from './Icon.jsx';
import { Badge, Evidence, Fact, Selection, Stats } from './Bits.jsx';
import { useTrip } from './Cards.jsx';
import { GUIDE, LEG_MODE, RECOMMENDATION, costLabel, duration, flag, humanize, km, moneyRange } from '../lib/trip.js';

const DISMISS_PX = 110;

export default function Sheet({ type, id, onClose }) {
  const { trip } = useTrip();
  const item = type && trip.by[type]?.get(id);
  const ref = useRef(null);
  const [closing, setClosing] = useState(false);
  const [drag, setDrag] = useState(0);
  const start = useRef(null);

  useEffect(() => {
    const dialog = ref.current;
    if (item && !dialog.open) {
      dialog.showModal();
      dialog.querySelector('.sheet-scroll').scrollTop = 0;
      document.documentElement.classList.add('locked');
    }
    if (!item && dialog.open) {
      dialog.close();
      document.documentElement.classList.remove('locked');
    }
  }, [item]);

  useEffect(() => () => document.documentElement.classList.remove('locked'), []);

  const close = () => {
    if (closing) return;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return finish();
    setClosing(true);
  };
  const finish = () => {
    setClosing(false);
    setDrag(0);
    ref.current.close();
    document.documentElement.classList.remove('locked');
    onClose();
  };

  // drag down from the handle/header, or from the content when it is scrolled to the top
  const onTouchStart = (e) => {
    const scroller = ref.current.querySelector('.sheet-scroll');
    start.current = scroller.scrollTop <= 0 || e.target.closest('.sheet-grab') ? e.touches[0].clientY : null;
  };
  const onTouchMove = (e) => {
    if (start.current == null) return;
    const dy = e.touches[0].clientY - start.current;
    if (dy > 0) setDrag(dy);
  };
  const onTouchEnd = () => {
    if (start.current == null) return;
    start.current = null;
    if (drag > DISMISS_PX) close();
    else setDrag(0);
  };

  const share = async () => {
    try {
      if (navigator.share) await navigator.share({ title: item.title ?? item.name ?? item.label, url: location.href });
      else await navigator.clipboard.writeText(location.href);
    } catch {}
  };

  return (
    <dialog ref={ref} className={`sheet${closing ? ' closing' : ''}`} aria-labelledby="sheet-title"
      onCancel={(e) => { e.preventDefault(); close(); }}
      onClick={(e) => e.target === ref.current && close()}
      onAnimationEnd={(e) => closing && e.target === ref.current.firstChild && finish()}>
      <div className="sheet-panel" style={drag ? { transform: `translateY(${drag}px)`, transition: 'none' } : undefined}
        onTouchStart={onTouchStart} onTouchMove={onTouchMove} onTouchEnd={onTouchEnd}>
        <div className="sheet-grab">
          <span className="sheet-handle" />
          <div className="sheet-actions">
            <button className="icon-button" onClick={share} aria-label="Share link">
              <Icon name="share" size={18} />
            </button>
            <button className="icon-button" onClick={close} aria-label="Close">
              <Icon name="close" size={18} />
            </button>
          </div>
        </div>
        <div className="sheet-scroll" tabIndex={-1} autoFocus>{item && <Detail type={type} item={item} />}</div>
      </div>
    </dialog>
  );
}

function Detail({ type, item }) {
  const { trip, goToSection } = useTrip();
  const place = item.place_id && trip.get('place', item.place_id);
  const notes = item.notes ?? [];
  const mentions = trip.flow.filter((s) => s[`${type}_ids`]?.includes(item.id));

  const heads = {
    activity: () => [humanize(item.kind === 'other' ? item.objective_type ?? item.kind : item.kind), item.title],
    place: () => [humanize(item.role), `${flag(item.country_code)} ${item.name}`],
    stay: () => [humanize(item.kind), item.name],
    leg: () => [LEG_MODE[item.mode] ?? humanize(item.mode), `${trip.get('place', item.from_place_id)?.name} → ${trip.get('place', item.to_place_id)?.name}`],
    cost: () => ['Cost', costLabel(item, trip.budget.items)],
    choice: () => ['Decision', item.question],
    gear: () => ['Gear', item.name],
  };
  const head = heads[type]?.() ?? [humanize(type), item.title ?? item.name ?? item.id];

  return (
    <article className="detail">
      <p className="kicker">{head[0]}</p>
      <h2 id="sheet-title">{head[1]}</h2>
      <div className="detail-badges">
        <Selection value={item.selection} />
        <Evidence evidence={item.evidence} />
        {item.recommendation && <Badge tone="muted">{RECOMMENDATION[item.recommendation]}</Badge>}
      </div>

      {type === 'activity' && (
        <>
          <Stats item={item} large />
          <dl className="detail-facts">
            {item.difficulty && <Row k="Difficulty" v={item.difficulty} />}
            {item.guide && <Row k="Guide" v={GUIDE[item.guide] ?? humanize(item.guide)} />}
            {item.area && <Row k="Area" v={item.area} />}
            {place && <Row k="Base" v={place.name} />}
            {item.objective_type && <Row k="Type" v={humanize(item.objective_type)} />}
          </dl>
        </>
      )}
      {type === 'cost' && (
        <dl className="detail-facts">
          <Row k="Amount" v={moneyRange(item.amount_min, item.amount_max, item.currency)} big />
          <Row k="Basis" v={humanize(item.basis)} />
          {item.quantity !== 1 && <Row k="Quantity" v={item.quantity ?? 'TBD'} />}
          <Row k="In the total" v={item.included_in_total ? 'Yes' : 'No, optional'} />
        </dl>
      )}
      {type === 'stay' && (
        <dl className="detail-facts">
          {place && <Row k="Where" v={place.name} />}
          <Row k="Nights" v={item.nights ?? 'TBD'} />
          {item.booking_url && <Row k="Booking" v={<a href={item.booking_url} target="_blank" rel="noreferrer">Open booking page</a>} />}
        </dl>
      )}
      {type === 'leg' && (
        <dl className="detail-facts">
          <Row k="Duration" v={duration(item.duration_minutes) ?? 'TBD'} />
          <Row k="Distance" v={km(item.distance_km) ?? 'TBD'} />
        </dl>
      )}
      {type === 'choice' && (
        <div className="stack">
          {item.options.map((o) => (
            <div key={o.id} className={`option${item.selected_option_id === o.id ? ' option-picked' : ''}`}>
              <div className="option-label">{o.label}</div>
              <p>{o.description}</p>
            </div>
          ))}
        </div>
      )}

      {item.evidence?.note && <p className="detail-note">{item.evidence.note}</p>}
      {notes.length > 0 && (
        <div className="detail-notes">
          {notes.map((n, i) => (
            <Fact key={i} fact={n} trip={trip} />
          ))}
        </div>
      )}
      {item.evidence?.source_ids?.length > 0 && (
        <div className="detail-sources">
          <h3>Sources</h3>
          <Fact fact={{ text: '', evidence: { source_ids: item.evidence.source_ids } }} trip={trip} />
        </div>
      )}
      {mentions.length > 0 && (
        <div className="detail-mentions">
          <h3>In the story</h3>
          {mentions.map((s) => (
            <button key={s.id} className="text-link" onClick={() => goToSection(s.id)}>
              {s.title} <Icon name="next" size={14} />
            </button>
          ))}
        </div>
      )}
    </article>
  );
}

function Row({ k, v, big }) {
  return (
    <div className={big ? 'row-big' : undefined}>
      <dt>{k}</dt>
      <dd>{v}</dd>
    </div>
  );
}
