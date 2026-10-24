import { StrictMode, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';

const WORKER_URL = import.meta.env.DEV
  ? 'http://localhost:8787'
  : 'https://letsgohere-worker.seanlyder.workers.dev';

const BASE = import.meta.env.BASE_URL;
const TRIPS = [{ id: 'patagonia', name: 'Patagonia' }];

function Home() {
  return (
    <main>
      <h1>Let's Go Here</h1>
      <p>Trips I'm planning. Come along.</p>
      <ul className="trips">
        {TRIPS.map((t) => (
          <li key={t.id}><a href={`${BASE}${t.id}`}>{t.name}</a></li>
        ))}
      </ul>
    </main>
  );
}

function Trip({ id }) {
  const [password, setPassword] = useState(() => sessionStorage.getItem('pw') ?? '');
  const [trip, setTrip] = useState(null);
  const [error, setError] = useState('');

  async function load(pw) {
    setError('');
    try {
      const res = await fetch(`${WORKER_URL}/trips/${id}`, { headers: { 'x-password': pw } });
      const body = await res.json();
      if (!res.ok) return setError(body.error ?? 'Something went wrong');
      sessionStorage.setItem('pw', pw);
      setTrip(body);
    } catch {
      setError("Couldn't reach the server");
    }
  }

  useEffect(() => {
    if (password) load(password);
  }, []);

  if (trip) {
    return (
      <main>
        <a href={BASE}>← All trips</a>
        <h1>{trip.title}</h1>
        <p className="tagline">{trip.tagline}</p>
        <p><strong>When:</strong> {trip.when}</p>
        <ul>{trip.highlights.map((h) => <li key={h}>{h}</li>)}</ul>
        {trip.notes && <p>{trip.notes}</p>}
      </main>
    );
  }

  return (
    <main>
      <a href={BASE}>← All trips</a>
      <form onSubmit={(e) => { e.preventDefault(); load(password); }}>
        <label htmlFor="pw">Password</label>
        <input id="pw" type="password" autoFocus value={password} onChange={(e) => setPassword(e.target.value)} />
        <button>Open</button>
        {error && <p role="alert" className="error">{error}</p>}
      </form>
    </main>
  );
}

const path = (location.pathname + '/').slice(BASE.length).replace(/\/$/, '').toLowerCase();
const page = !path ? <Home /> : TRIPS.some((t) => t.id === path) ? <Trip id={path} /> : <main><h1>Not found</h1><a href={BASE}>Home</a></main>;

createRoot(document.getElementById('root')).render(<StrictMode>{page}</StrictMode>);
