import Icon from './Icon.jsx';
import { EVIDENCE, SELECTION, duration, km, meters } from '../lib/trip.js';

export function Badge({ tone = 'muted', children }) {
  return <span className={`badge tone-${tone}`}>{children}</span>;
}

export function Evidence({ evidence }) {
  const e = EVIDENCE[evidence?.status];
  return e ? <Badge tone={e.tone}>{e.label}</Badge> : null;
}

export function Selection({ value }) {
  const s = SELECTION[value];
  return s ? <Badge tone={s.tone}>{s.label}</Badge> : null;
}

export function Stats({ item, large = false }) {
  const stats = [
    ['distance', km(item.distance_km)],
    ['ascent', meters(item.ascent_m)],
    ['time', duration(item.duration_minutes)],
  ].filter(([, v]) => v);
  if (!stats.length) return null;
  return (
    <ul className={`stats${large ? ' stats-large' : ''}`}>
      {stats.map(([icon, value]) => (
        <li key={icon}>
          <Icon name={icon} size={large ? 20 : 15} />
          <span>{value}</span>
        </li>
      ))}
    </ul>
  );
}

// a sentence with its evidence label and sources, used for content blocks and notes
export function Fact({ fact, trip }) {
  const sources = fact.evidence?.source_ids?.map((id) => trip.get('source', id)).filter(Boolean) ?? [];
  return (
    <div className="fact">
      <p>{fact.text}</p>
      <div className="fact-meta">
        <Evidence evidence={fact.evidence} />
        {fact.evidence?.note && <span className="fact-note">{fact.evidence.note}</span>}
        {sources.map((s) => (
          <a key={s.id} className="source-link" href={s.url} target="_blank" rel="noreferrer">
            {s.title}
            <Icon name="external" size={12} />
          </a>
        ))}
      </div>
    </div>
  );
}

export function Img({ media, className = '', eager = false }) {
  if (!media) return null;
  return (
    <img className={className} src={media.url} alt={media.alt} loading={eager ? 'eager' : 'lazy'} decoding="async"
      fetchPriority={eager ? 'high' : undefined} />
  );
}
