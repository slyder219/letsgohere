const PATHS = {
  story: 'M2 5.5c3-1.5 7-1.5 10 1 3-2.5 7-2.5 10-1v13.5c-3-1.5-7-1.5-10 1-3-2.5-7-2.5-10-1zM12 6.5V20',
  explore: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM15.5 8.5l-2 5-5 2 2-5z',
  search: 'M11 18a7 7 0 1 0 0-14 7 7 0 0 0 0 14zM20 20l-4-4',
  close: 'M6 6l12 12M18 6L6 18',
  share: 'M12 3v12M8 7l4-4 4 4M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7',
  back: 'M15 18l-6-6 6-6',
  next: 'M9 18l6-6-6-6',
  down: 'M12 5v14M6 13l6 6 6-6',
  distance: 'M3 12h18M7 8l-4 4 4 4M17 8l4 4-4 4',
  ascent: 'M3 19l6-8 4 4 8-10M15 5h6v6',
  time: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM12 7v5l3 2',
  flight: 'M2 16l20-6-2-2-8 2-5-6H5l3 7-4 1-2-2H1z',
  drive: 'M3 16v-3l2-5h14l2 5v3zM3 16v2h3v-2M18 16v2h3v-2M7 13h.01M17 13h.01',
  train: 'M7 3h10a3 3 0 0 1 3 3v8a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V6a3 3 0 0 1 3-3zM4 10h16M8 14h.01M16 14h.01M8 17l-2 4M16 17l2 4',
  snow: 'M12 2v20M3.3 7l17.4 10M3.3 17l17.4-10M9 3.5l3 2 3-2M9 20.5l3-2 3 2',
  stay: 'M3 19V6M3 14h18v5M21 14a3 3 0 0 0-3-3h-7v3M7 12a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z',
  place: 'M12 21s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12zM12 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4z',
  mountain: 'M2 20l7-12 4 6 3-4 6 10z',
  money: 'M12 3v18M16.5 7.5C16 6 14.3 5 12 5 9.5 5 7.5 6.3 7.5 8.3c0 4.6 9.5 2.6 9.5 7.3 0 2-2 3.4-5 3.4-2.4 0-4.3-1-5-2.7',
  choice: 'M6 3v6a6 6 0 0 0 6 6h0a6 6 0 0 1 6 6M18 3v6a6 6 0 0 1-3 5.2M15 6l3-3 3 3M3 6l3-3 3 3',
  external: 'M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5',
  check: 'M5 12l5 5 9-10',
  lock: 'M7 11V8a5 5 0 0 1 10 0v3M5 11h14v10H5zM12 15v2',
  guide: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0',
  gear: 'M6 8h12l1 12H5zM9 8V6a3 3 0 0 1 6 0v2',
  source: 'M6 3h9l4 4v14H6zM14 3v5h5M9 13h7M9 17h7',
};

export default function Icon({ name, size = 20, className = '' }) {
  return (
    <svg className={`icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor"
      strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={PATHS[name]} />
    </svg>
  );
}
