import { useState } from 'react';
import Icon from './Icon.jsx';
import { login } from '../lib/api.js';
import { Link } from '../lib/router.jsx';

export default function Gate({ summary, onToken }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    setBusy(true);
    setError('');
    try {
      onToken(await login(summary.id, password));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="gate">
      {summary.hero && <img className="gate-img" src={summary.hero} alt="" />}
      <div className="hero-shade" />
      <Link to="" className="gate-back" aria-label="All trips">
        <Icon name="back" size={22} />
      </Link>
      <form className="gate-card" onSubmit={submit}>
        <p className="hero-kicker">{summary.when}</p>
        <h1 className="hero-title">{summary.title}</h1>
        <p className="gate-text">This trip is shared with friends. Enter the password you were sent.</p>
        {/* a username field lets iOS save the password to the keychain */}
        <input type="text" name="username" autoComplete="username" value="friends" readOnly hidden />
        <label htmlFor="password" className="visually-hidden">Password</label>
        <div className="gate-field">
          <input id="password" name="password" type="password" autoComplete="current-password" placeholder="Password"
            enterKeyHint="go" value={password} onChange={(e) => setPassword(e.target.value)} aria-invalid={!!error}
            aria-describedby={error ? 'gate-error' : undefined} />
          <button className="button" disabled={busy || !password.trim()}>
            {busy ? 'Opening…' : 'Open'}
          </button>
        </div>
        {error && (
          <p id="gate-error" className="gate-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </div>
  );
}
