// Turns a schema trip into lookup tables plus the labels every view shares.

const COLLECTIONS = {
  place: (t) => t.places,
  leg: (t) => t.legs,
  stay: (t) => t.stays,
  activity: (t) => t.activities,
  gear: (t) => t.gear,
  cost: (t) => t.budget.items,
  choice: (t) => t.choices,
  media: (t) => t.media,
  source: (t) => t.sources,
  section: (t) => t.flow,
};

// section field -> entity type
export const REFS = {
  place_ids: 'place', leg_ids: 'leg', stay_ids: 'stay', activity_ids: 'activity',
  gear_ids: 'gear', cost_ids: 'cost', choice_ids: 'choice', media_ids: 'media',
};

export function indexTrip(trip) {
  const by = Object.fromEntries(Object.entries(COLLECTIONS).map(([type, list]) => [type, new Map(list(trip).map((x) => [x.id, x]))]));
  const get = (type, id) => by[type].get(id);
  const refs = (section, type) => section[`${type}_ids`]?.map((id) => get(type, id)).filter(Boolean) ?? [];
  return { ...trip, by, get, refs };
}

export const EVIDENCE = {
  verified: { label: 'Checked', tone: 'ok' },
  booked: { label: 'Booked', tone: 'ok' },
  estimate: { label: 'Estimate', tone: 'warn' },
  proposed: { label: 'Proposed', tone: 'idea' },
  user_preference: { label: 'Preference', tone: 'accent' },
  unknown: { label: 'Unknown', tone: 'muted' },
};

export const SELECTION = {
  selected: { label: 'In the plan', tone: 'ok' },
  shortlisted: { label: 'Shortlisted', tone: 'accent' },
  candidate: { label: 'Idea', tone: 'idea' },
  rejected: { label: 'Ruled out', tone: 'muted' },
};
export const SELECTION_ORDER = ['selected', 'shortlisted', 'candidate', 'rejected'];

export const RECOMMENDATION = { core: 'Core', 'strong-option': 'Strong option', optional: 'Optional', stretch: 'Stretch goal' };

export const GUIDE = {
  'normally-independent': 'No guide needed',
  recommended: 'Guide recommended',
  'operator-required': 'Booked through an operator',
  'technical-guide-assessment': 'Technical guide required',
};

export const SECTION_KIND = {
  intro: 'The idea', route: 'Getting there', chapter: 'Chapter', lodging: 'Where we stay', activities: 'What we do',
  gear: 'Packing', budget: 'Costs', decision: 'To decide', join: 'Join us',
};

export const TRIP_STATUS = { idea: 'Idea', planning: 'Planning', scheduled: 'Scheduled', completed: 'Completed', cancelled: 'Cancelled' };

export const LEG_MODE = { flight: 'Fly', drive: 'Drive', bus: 'Bus', boat: 'Boat', train: 'Train', walk: 'Walk' };

export const humanize = (s) => (s ? s.charAt(0).toUpperCase() + s.slice(1).replace(/[-_]/g, ' ') : '');

export function duration(min) {
  if (min == null) return null;
  if (min < 60) return `${min} min`;
  const h = Math.round((min / 60) * 2) / 2;
  return `${h} h`;
}

export const km = (n) => (n == null ? null : `${+n.toFixed(1)} km`);
export const meters = (n) => (n == null ? null : `${n.toLocaleString('en-US')} m`);

export function money(n, currency = 'USD') {
  if (n == null) return 'TBD';
  return new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(n);
}

export function moneyRange(min, max, currency) {
  if (min == null && max == null) return 'TBD';
  if (min == null || max == null || Math.round(min) === Math.round(max)) return money(min ?? max, currency);
  return `${money(min, currency)}–${money(max, currency)}`;
}

export const flag = (cc) => (cc ? String.fromCodePoint(...[...cc.toUpperCase()].map((c) => 0x1f1a5 + c.charCodeAt(0))) : '');

// "Patagonia: a December adventure" -> ["Patagonia", "a December adventure"]
export function splitTitle(title) {
  const i = title.indexOf(': ');
  return i < 0 ? [title, null] : [title.slice(0, i), title.slice(i + 2)];
}

// strips the generator's repeated " — illustrative 14-day shared scenario" style suffix shared by every line item
export function costLabel(item, items) {
  const tail = item.label.match(/ — .+$/)?.[0];
  return tail && items.filter((i) => i.label.endsWith(tail)).length > 1 ? item.label.slice(0, -tail.length) : item.label;
}

export function sharedSuffix(items) {
  const tails = items.map((i) => i.label.match(/ — (.+)$/)?.[1]).filter(Boolean);
  return tails.length > 1 && tails.every((t) => t === tails[0]) ? tails[0] : null;
}
