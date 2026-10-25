import MiniSearch from 'minisearch';
import { GUIDE, SELECTION, EVIDENCE, duration, km, meters, moneyRange, humanize } from './trip.js';

// Fuzzy matching misses intent ("how much", "is it hard"), so queries are widened with related words.
const SYNONYMS = {
  cost: ['price', 'budget', 'usd', 'clp', 'money', 'allowance'],
  costs: ['cost'], price: ['cost', 'budget'], expensive: ['cost', 'price'], cheap: ['cost', 'inexpensive'], money: ['cost', 'budget'],
  much: ['cost', 'price'], pay: ['cost', 'price'],
  hard: ['difficulty', 'strenuous', 'steep', 'technical'], difficult: ['difficulty', 'strenuous'], tough: ['strenuous', 'steep'],
  easy: ['easy', 'short', 'low'], fit: ['fitness', 'strenuous'], fitness: ['strenuous'],
  hike: ['hike', 'trail', 'walk', 'trek'], hikes: ['hike'], walk: ['hike', 'walking'], trek: ['hike', 'trek'],
  guide: ['guide', 'operator', 'guided'], guided: ['guide'],
  car: ['drive', 'rental', 'vehicle'], drive: ['car', 'driving'], rental: ['car', 'vehicle'],
  fly: ['flight'], flight: ['fly', 'flights'], plane: ['flight'],
  sleep: ['lodge', 'stay', 'lodging', 'refugio', 'base', 'nights'], hotel: ['lodge', 'lodging', 'stay'], stay: ['lodge', 'lodging'],
  when: ['december', 'dates', 'month'], dates: ['december', 'window'], long: ['days', 'duration', 'weeks'],
  ice: ['glacier'], glacier: ['ice', 'grey'], summit: ['ascent', 'climb', 'peak'], climb: ['climbing', 'summit', 'ascent'], peak: ['summit'],
  boat: ['cruise', 'kayak', 'navigation'], kayak: ['kayaking', 'paddling'],
  animals: ['wildlife', 'puma', 'condor'], wildlife: ['puma', 'condor'], horse: ['riding', 'horseback'],
  pack: ['gear', 'carry'], packing: ['gear'], bring: ['gear', 'carry'], gear: ['equipment', 'boots', 'crampons'],
  aurora: ['northern', 'lights', 'aurora'], northern: ['aurora'], lights: ['aurora'],
  husky: ['sledding', 'dogs', 'sled'], dogs: ['husky', 'sledding'], reindeer: ['sledding', 'sami'], sled: ['sledding', 'husky', 'reindeer'],
  snowmobile: ['snowmobiling', 'snowmobile'], ski: ['skiing', 'skis'], snowshoe: ['snowshoeing'], sauna: ['sauna', 'saunas'],
  train: ['rail', 'sleeper', 'night'], sleeper: ['train'], cabin: ['cabin', 'igloo', 'lodge'], igloo: ['igloo', 'glass'],
  food: ['meals', 'food', 'supplies'], eat: ['food', 'meals'],
};
const STOP = new Set('a an and are as at be can do does for from how i in is it of on or should the to was we what where which who will with you'.split(' '));

const processTerm = (t) => {
  const term = t.toLowerCase();
  return STOP.has(term) ? null : term;
};

const join = (...parts) => parts.flat().filter(Boolean).join('. ');
const notes = (x) => x.notes?.map((n) => n.text) ?? [];

export function buildIndex(trip) {
  const docs = [];
  const add = (type, item, title, text, meta = '') => docs.push({ id: `${type}:${item.id}`, type, ref: item.id, title, text, meta });

  for (const s of trip.flow) add('section', s, s.title, join(s.summary, s.timing?.label, s.content.map((c) => c.text)));
  for (const a of trip.activities)
    add('activity', a, a.title, join(a.difficulty, notes(a)),
      join(humanize(a.kind), humanize(a.objective_type), a.area, trip.get('place', a.place_id)?.name, SELECTION[a.selection]?.label,
        GUIDE[a.guide], km(a.distance_km), meters(a.ascent_m), duration(a.duration_minutes)));
  for (const p of trip.places) add('place', p, p.name, join(notes(p)), humanize(p.role));
  for (const l of trip.legs) {
    const from = trip.get('place', l.from_place_id)?.name;
    const to = trip.get('place', l.to_place_id)?.name;
    add('leg', l, `${from} → ${to}`, join(l.evidence?.note, notes(l)), join(l.mode, duration(l.duration_minutes)));
  }
  for (const s of trip.stays) add('stay', s, s.name, join(notes(s), s.evidence?.note), join(humanize(s.kind), trip.get('place', s.place_id)?.name));
  for (const c of trip.budget.items)
    add('cost', c, c.label, join(c.evidence?.note), join(moneyRange(c.amount_min, c.amount_max, c.currency), c.basis, EVIDENCE[c.evidence?.status]?.label));
  for (const c of trip.choices) add('choice', c, c.question, join(c.options.map((o) => `${o.label}: ${o.description}`)));
  for (const g of trip.gear) add('gear', g, g.name ?? g.label ?? g.id, join(notes(g)));
  for (const s of trip.sources) add('source', s, s.title, join(s.scope));

  const index = new MiniSearch({
    fields: ['title', 'text', 'meta'],
    storeFields: ['type', 'ref', 'title', 'text', 'meta'],
    processTerm,
  });
  index.addAll(docs);
  return index;
}

export function searchTrip(index, query) {
  const words = (query.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? []).filter((w) => !STOP.has(w));
  if (!words.length) return [];
  const extra = words.flatMap((w) => SYNONYMS[w] ?? []).filter((w) => !words.includes(w));
  const terms = [...words, ...new Set(extra)];
  return index.search(terms.join(' '), {
    boost: { title: 3, meta: 1.5 },
    prefix: (t) => t.length > 2,
    fuzzy: (t) => (t.length > 4 ? 0.2 : false),
    boostTerm: (term) => (words.includes(term) ? 1 : 0.4),
    combineWith: 'OR',
  });
}

// the passage around the first matched term, for result previews
export function snippet(text, terms, radius = 70) {
  if (!text) return '';
  const lower = text.toLowerCase();
  const hit = terms.map((t) => lower.indexOf(t)).filter((i) => i >= 0).sort((a, b) => a - b)[0];
  if (hit == null) return text.length > radius * 2 ? `${text.slice(0, radius * 2).trimEnd()}…` : text;
  const start = Math.max(0, text.lastIndexOf(' ', Math.max(0, hit - radius)) + 1);
  const end = Math.min(text.length, hit + radius);
  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
}
