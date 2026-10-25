import { useState } from 'react';
import Icon from './Icon.jsx';
import { Link } from '../lib/router.jsx';
import { splitTitle } from '../lib/trip.js';

// Password screen for the whole site (numeric PIN) and for trips with their own password.
// `account` is the hidden username: iOS keychain keeps one saved password per account.
export default function Gate({ title, kicker, text, image, account, numeric = false, back = false, onSubmit }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [name, subtitle] = splitTitle(title);

  const submit = async (e) => {
    e.preventDefault();
    if (!password.trim()) return;
    setBusy(true);
    setError('');
    try {
      await onSubmit(password);
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <div className="gate">
      {image && <img className="gate-img" src={image} alt="" />}
      <div className="hero-shade" />
      {back && (
        <Link to="" className="gate-back" aria-label="All trips">
          <Icon name="back" size={22} />
        </Link>
      )}
      <form className="gate-card" onSubmit={submit}>
        {kicker && <p className="hero-kicker">{kicker}</p>}
        <h1 className={`hero-title${name.length > 14 ? ' hero-title-long' : ''}`}>{name}</h1>
        {subtitle && <p className="hero-subtitle">{subtitle}</p>}
        <p className="gate-text">{text}</p>
        <input type="text" name="username" autoComplete="username" value={account} readOnly hidden />
        <label htmlFor="password" className="visually-hidden">
          Password
        </label>
        <div className="gate-field">
          <input id="password" name="password" type="password" autoComplete="current-password" enterKeyHint="go"
            placeholder={numeric ? '••••' : 'Password'}
            // numeric: iOS and Android open the number pad instead of the full keyboard
            inputMode={numeric ? 'numeric' : undefined} pattern={numeric ? '[0-9]*' : undefined}
            className={numeric ? 'gate-pin' : undefined}
            value={password} onChange={(e) => setPassword(numeric ? e.target.value.replace(/\D/g, '') : e.target.value)}
            aria-invalid={!!error} aria-describedby={error ? 'gate-error' : undefined} />
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
