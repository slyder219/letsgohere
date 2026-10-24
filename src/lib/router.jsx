import { useEffect, useState } from 'react';

export const BASE = import.meta.env.BASE_URL;

function read() {
  const parts = (location.pathname + '/').slice(BASE.length).split('/').filter(Boolean).map((p) => decodeURIComponent(p).toLowerCase());
  return { parts, params: new URLSearchParams(location.search) };
}

export function useLocation() {
  const [loc, setLoc] = useState(read);
  useEffect(() => {
    const update = () => setLoc(read());
    addEventListener('popstate', update);
    return () => removeEventListener('popstate', update);
  }, []);
  return loc;
}

export const href = (path) => BASE + path.replace(/^\//, '');

export function navigate(path, { replace = false, state = null } = {}) {
  history[replace ? 'replaceState' : 'pushState'](state, '', href(path));
  dispatchEvent(new PopStateEvent('popstate'));
}

export function Link({ to, onClick, ...props }) {
  return (
    <a
      href={href(to)}
      onClick={(e) => {
        onClick?.(e);
        if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        navigate(to);
      }}
      {...props}
    />
  );
}
