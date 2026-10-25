const WORKER_URL = import.meta.env.DEV ? 'http://localhost:8787' : 'https://letsgohere-worker.seanlyder.workers.dev';
const SITE_KEY = 'lgh-site';
const TRIPS_KEY = 'lgh-sessions';

// need: 'site' (site password) or 'trip' (the trip's own password)
export class AuthError extends Error {
  constructor(message, need) {
    super(message);
    this.need = need;
  }
}

const read = (key) => {
  try {
    return JSON.parse(localStorage.getItem(key));
  } catch {
    return null;
  }
};
const write = (key, value) => {
  try {
    if (value == null) localStorage.removeItem(key);
    else localStorage.setItem(key, JSON.stringify(value));
  } catch {}
};
const live = (session) => (session?.expires > Date.now() ? session.token : null);

export const siteToken = () => live(read(SITE_KEY));
export const tripToken = (id) => live(read(TRIPS_KEY)?.[id]);
const storeTrip = (id, session) => write(TRIPS_KEY, { ...read(TRIPS_KEY), [id]: session ?? undefined });

// photos are private too: the Worker serves them only with the site token
export const mediaUrl = (path) => (path ? `${WORKER_URL}${path}?t=${encodeURIComponent(siteToken() ?? '')}` : null);

async function call(path, init = {}, tripId) {
  const headers = { ...init.headers };
  const site = siteToken();
  if (site) headers.Authorization = `Bearer ${site}`;
  const trip = tripId && tripToken(tripId);
  if (trip) headers['X-Trip-Token'] = trip;
  let res;
  try {
    res = await fetch(`${WORKER_URL}${path}`, { ...init, headers });
  } catch {
    throw new Error("Couldn't reach the server. Check your connection.");
  }
  const body = await res.json().catch(() => ({}));
  if (res.status === 401) {
    if (body.need === 'site') write(SITE_KEY, null);
    if (body.need === 'trip' && tripId) storeTrip(tripId, null);
    throw new AuthError(body.error ?? 'Please enter the password', body.need);
  }
  if (!res.ok) throw new Error(body.error ?? 'Something went wrong');
  return body;
}

const postPassword = (path, password, tripId) =>
  call(path, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password }) }, tripId);

export async function loginSite(password) {
  const session = await postPassword('/session', password);
  write(SITE_KEY, session);
  return session.token;
}

export async function loginTrip(id, password) {
  const session = await postPassword(`/trips/${id}/session`, password);
  storeTrip(id, session);
  return session.token;
}

export const listTrips = () => call('/trips');
export const sitePinLength = () => call('/site').then((s) => s.pinLength);
export const fetchTrip = (id) => call(`/trips/${id}`, {}, id);
