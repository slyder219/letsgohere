import { useEffect, useState } from 'react';
import { sitePinLength } from '../lib/api.js';
import Icon from './Icon.jsx';
import { Link } from '../lib/router.jsx';
import { splitTitle } from '../lib/trip.js';

// Password screen for a trip with its own password. Same layout as the site PIN screen: content in the
// top part of the screen so the keyboard never covers it. `account` is the hidden username: iOS keychain
// keeps one saved password per account.
export default function Gate({ title, kicker, text, image, account, back = false, onSubmit }) {
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
    <main className="pin-gate">
      {back && (
        <Link to="" className="gate-back" aria-label="All trips">
          <Icon name="back" size={22} />
        </Link>
      )}
      <form className="pin-card" onSubmit={submit}>
        {image && <img className="gate-thumb" src={image} alt="" />}
        {kicker && <p className="gate-kicker">{kicker}</p>}
        <h1>{name}</h1>
        {subtitle && <p className="gate-subtitle">{subtitle}</p>}
        <p className="pin-text">{text}</p>
        <input type="text" name="username" autoComplete="username" value={account} readOnly hidden />
        <label htmlFor="password" className="visually-hidden">
          Password
        </label>
        <div className="gate-field">
          <input id="password" name="password" type="password" autoComplete="current-password" enterKeyHint="go" placeholder="Password"
            autoFocus value={password} onChange={(e) => setPassword(e.target.value)}
            aria-invalid={!!error} aria-describedby={error ? 'gate-error' : undefined} />
          <button className="button" disabled={busy || !password.trim()}>
            {busy ? 'Opening…' : 'Open'}
          </button>
        </div>
        {error && (
          <p id="gate-error" className="pin-status pin-error" role="alert">
            {error}
          </p>
        )}
      </form>
    </main>
  );
}

// The site's front door, styled like the iPhone passcode screen: dots fill as digits are typed and it
// submits on the last one. A real (invisible) numeric password field sits on top, so the number pad,
// keychain autofill and paste all work. The PIN length comes from the Worker; without it, an Open button.
export function PinGate({ title, text, onSubmit }) {
  const [length, setLength] = useState(null);
  const [lengthFailed, setLengthFailed] = useState(false);
  useEffect(() => {
    sitePinLength().then(setLength, () => setLengthFailed(true));
  }, []);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [shake, setShake] = useState(0);

  const submit = async (value) => {
    setBusy(true);
    setError('');
    try {
      await onSubmit(value);
    } catch (err) {
      setError(err.message);
      setPin('');
      setShake((n) => n + 1);
      setBusy(false);
    }
  };

  const change = (e) => {
    if (busy) return;
    const value = e.target.value.replace(/\D/g, '').slice(0, length ?? undefined);
    setPin(value);
    if (error) setError('');
    if (length && value.length === length) submit(value);
  };

  return (
    <main className="pin-gate">
      <form className="pin-card" onSubmit={(e) => { e.preventDefault(); if (pin) submit(pin); }}>
        <img className="pin-icon" src="/apple-touch-icon.png" alt="" width="72" height="72" />
        <h1>{title}</h1>
        <p className="pin-text">{text}</p>
        <input type="text" name="username" autoComplete="username" value="letsgohere" readOnly hidden />
        <label className="pin-field" htmlFor="pin">
          <span key={shake} className={`pin-dots${shake ? ' shake' : ''}`} aria-hidden="true">
            {Array.from({ length: length ?? Math.max(pin.length, 4) }, (_, i) => (
              <span key={i} className={i < pin.length ? 'filled' : undefined} />
            ))}
          </span>
          <input id="pin" className="pin-input" type="password" inputMode="numeric" pattern="[0-9]*" autoComplete="current-password"
            enterKeyHint="go" maxLength={length ?? undefined} autoFocus value={pin} onChange={change} readOnly={busy}
            aria-label="Password" aria-invalid={!!error} aria-describedby="pin-status" />
        </label>
        <p id="pin-status" className={`pin-status${error ? ' pin-error' : ''}`} role={error ? 'alert' : undefined}>
          {error || (busy ? 'Checking…' : 'Tap the dots to type')}
        </p>
        {lengthFailed && (
          <button className="button" disabled={busy || !pin}>
            Open
          </button>
        )}
      </form>
    </main>
  );
}
