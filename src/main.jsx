import { Component, StrictMode, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './style.css';
import TripView from './components/TripView.jsx';
import Icon from './components/Icon.jsx';
import { listTrips } from './lib/api.js';
import { splitTitle } from './lib/trip.js';
import { Link, useLocation } from './lib/router.jsx';

// The trip list comes from the Worker, so adding a trip folder there is enough to give it a page here.
function useTrips() {
  const [state, setState] = useState({ trips: null, error: null });
  const load = () => {
    setState({ trips: null, error: null });
    listTrips().then(
      (trips) => setState({ trips, error: null }),
      (e) => setState({ trips: null, error: e.message }),
    );
  };
  useEffect(load, []);
  return { ...state, retry: load };
}

function App() {
  const { parts, params } = useLocation();
  const { trips, error, retry } = useTrips();
  const summary = trips?.find((t) => t.id === parts[0]);
  const view = ['explore', 'search'].includes(parts[1]) ? parts[1] : '';

  useEffect(() => {
    if (!parts.length) document.title = "Let's Go Here";
  }, [parts.length]);

  if (error)
    return (
      <div className="center-screen">
        <p>{error}</p>
        <button className="button" onClick={retry}>
          Try again
        </button>
      </div>
    );
  if (!parts.length) return <Home trips={trips} />;
  if (!trips) return <div className="center-screen" aria-busy="true" />;
  if (!summary)
    return (
      <div className="center-screen">
        <h1>Not found</h1>
        <Link to="" className="button">
          All trips
        </Link>
      </div>
    );
  return <TripView key={summary.id} summary={summary} view={view} params={params} />;
}

function Home({ trips }) {
  return (
    <main className="home">
      <header className="home-head">
        <h1>Let's Go Here</h1>
        <p>Trips I'm thinking about.</p>
      </header>
      {trips && <p className="home-count">{trips.length === 1 ? '1 trip' : `${trips.length} trips`}</p>}
      <ul className="home-list" aria-busy={!trips}>
        {(trips ?? []).map((t) => (
          <li key={t.id}>
            <Link to={`${t.id}/`} className="trip-card">
              {t.hero && <img src={t.hero} alt={t.heroAlt} />}
              <div className="hero-shade" />
              <div className="trip-card-body">
                <div className="trip-card-text">
                  <p className="hero-kicker">{t.when}</p>
                  <h2>{splitTitle(t.title)[0]}</h2>
                  <p>{t.tagline}</p>
                </div>
                <span className="trip-card-go" aria-hidden="true">
                  <Icon name="next" size={20} />
                </span>
              </div>
            </Link>
          </li>
        ))}
        {!trips && [0, 1].map((i) => <li key={i} className="trip-card trip-card-loading" />)}
      </ul>
      <OwnTrip />
    </main>
  );
}

function OwnTrip() {
  const dialog = useRef(null);
  return (
    <>
      <button className="own-trip" onClick={() => dialog.current.showModal()}>
        Want to plan your own trip?
      </button>
      <dialog ref={dialog} className="no-dialog" aria-label="Plan your own trip" onClick={(e) => e.target === dialog.current && dialog.current.close()}>
        <p>No.</p>
        <button className="button" onClick={() => dialog.current.close()} autoFocus>
          OK
        </button>
      </dialog>
    </>
  );
}

// trip data is generated, so one unexpected value shouldn't blank the whole page
class Boundary extends Component {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  render() {
    return this.state.failed ? (
      <div className="center-screen">
        <p>Something went wrong showing this page.</p>
        <button className="button" onClick={() => location.reload()}>
          Reload
        </button>
      </div>
    ) : (
      this.props.children
    );
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <Boundary>
      <App />
    </Boundary>
  </StrictMode>,
);
