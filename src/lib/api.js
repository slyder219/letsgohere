const WORKER_URL = import.meta.env.DEV ? 'http://localhost:8787' : 'https://letsgohere-worker.seanlyder.workers.dev';
const KEY = 'lgh-sessions';

export class AuthError extends Error {}

// { tripId: { token, expires } } — each trip has its own password, so its own session
function sessions() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {};
  } catch {
    return {};
  }
}

function store(id, session) {
  try {
    const all = sessions();
    if (session) all[id] = session;
    else delete all[id];
    localStorage.setItem(KEY, JSON.stringify(all));
  } catch {}
}

export function savedToken(id) {
  const s = sessions()[id];
  return s?.expires > Date.now() ? s.token : null;
}

async function call(path, init, tripId) {
  let res;
  try {
    res = await fetch(`${WORKER_URL}${path}`, init);
  } catch {
    throw new Error("Couldn't reach the server. Check your connection.");
  }
  const body = await res.json().catch(() => ({}));
  if (res.status === 401) {
    if (tripId) store(tripId, null);
    throw new AuthError(body.error ?? 'Please enter the password');
  }
  if (!res.ok) throw new Error(body.error ?? 'Something went wrong');
  return body;
}

export const listTrips = () => call('/trips');

export async function login(id, password) {
  const session = await call(`/trips/${id}/session`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  store(id, session);
  return session.token;
}

export const fetchTrip = (id, token) => call(`/trips/${id}`, { headers: { Authorization: `Bearer ${token}` } }, id);
