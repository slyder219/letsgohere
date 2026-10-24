import Icon from './Icon.jsx';
import { Fact, Img } from './Bits.jsx';
import { ActivityCard, Budget, Choice, GearList, Places, Rail, Route, StayCard, useTrip } from './Cards.jsx';
import { SECTION_KIND, TRIP_STATUS, splitTitle } from '../lib/trip.js';
import { navigate } from '../lib/router.jsx';

export default function Story() {
  const { trip } = useTrip();
  const [intro, ...chapters] = trip.flow[0]?.kind === 'intro' ? trip.flow : [null, ...trip.flow];
  return (
    <>
      <Hero intro={intro} first={chapters[0]} />
      <QuickFacts intro={intro} />
      {chapters.map((s, i) => (
        <Chapter key={s.id} section={s} number={i + 1} />
      ))}
      <footer className="story-end">
        <p>That's the plan so far. Everything marked <em>Proposed</em> or <em>Estimate</em> can still change.</p>
        <button className="button" onClick={() => navigate(`${trip.id}/explore`)}>
          Browse every option <Icon name="next" size={16} />
        </button>
        <PhotoCredits />
      </footer>
    </>
  );
}

function Hero({ intro, first }) {
  const { trip, goToSection } = useTrip();
  const [name, subtitle] = splitTitle(trip.title);
  return (
    <header className="hero" id={intro?.id}>
      <Img media={trip.get('media', trip.introduction.hero_media_id)} className="hero-img" eager />
      <div className="hero-shade" />
      <div className="hero-body">
        <p className="hero-kicker">
          {TRIP_STATUS[trip.status] ?? trip.status} · {trip.window.label ?? 'Dates TBD'}
        </p>
        <h1 className={`hero-title${name.length > 14 ? ' hero-title-long' : ''}`}>{name}</h1>
        {subtitle && <p className="hero-subtitle">{subtitle}</p>}
        <p className="hero-headline">{trip.introduction.headline}</p>
        {trip.introduction.highlights.length > 0 && (
          <ul className="hero-highlights">
            {trip.introduction.highlights.map((h) => (
              <li key={h}>{h}</li>
            ))}
          </ul>
        )}
        {first && (
          <button className="hero-cta" onClick={() => goToSection(first.id)}>
            Start the story <Icon name="down" size={18} />
          </button>
        )}
      </div>
    </header>
  );
}

function QuickFacts({ intro }) {
  const { trip } = useTrip();
  const w = trip.window;
  const facts = [
    ['When', w.start_date && w.end_date ? `${w.start_date} – ${w.end_date}` : w.label ?? 'TBD'],
    ['How long', w.duration_days ? `About ${w.duration_days} days` : 'TBD'],
    ['From', trip.group.origin_label ?? 'TBD'],
    ['Group', trip.group.size ? `${trip.group.size} people` : 'Open — join us'],
  ];
  return (
    <section className="quick">
      <p className="quick-summary">{trip.introduction.summary}</p>
      <dl className="quick-facts">
        {facts.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
      {intro?.content.map((c, i) => <Fact key={i} fact={c} trip={trip} />)}
    </section>
  );
}

function Chapter({ section: s, number }) {
  const { trip } = useTrip();
  const [lead, ...gallery] = trip.refs(s, 'media');
  const places = trip.refs(s, 'place');
  const legs = trip.refs(s, 'leg');
  const stays = trip.refs(s, 'stay');
  const activities = trip.refs(s, 'activity');
  const choices = trip.refs(s, 'choice');
  const costs = trip.refs(s, 'cost');
  const gear = trip.refs(s, 'gear');
  return (
    <section className={`chapter kind-${s.kind}${lead ? ' has-media' : ''}`} id={s.id} aria-labelledby={`${s.id}-title`}>
      {lead && (
        <figure className="chapter-media">
          <Img media={lead} />
          <Credit media={lead} />
        </figure>
      )}
      <div className="chapter-body">
        <p className="kicker">
          <span className="kicker-num">{String(number).padStart(2, '0')}</span> {SECTION_KIND[s.kind] ?? s.kind}
        </p>
        <h2 id={`${s.id}-title`}>{s.title}</h2>
        {s.timing?.label && <p className="timing">{s.timing.label}</p>}
        <p className="lede">{s.summary}</p>
        {s.content.map((c, i) => (
          <Fact key={i} fact={c} trip={trip} />
        ))}
        {legs.length > 0 ? <Route legs={legs} /> : places.length > 0 && <Places places={places} />}
        {stays.length > 0 && (
          <div className="stack">
            {stays.map((st) => (
              <StayCard key={st.id} stay={st} />
            ))}
          </div>
        )}
        {choices.map((c) => (
          <Choice key={c.id} choice={c} />
        ))}
        {costs.length > 0 && <Budget items={costs} />}
        {gear.length > 0 && <GearList gear={gear} />}
        {s.kind === 'join' && <Join />}
      </div>
      {activities.length > 0 && (
        <Rail label={`${s.title} activities`}>
          {activities.map((a) => (
            <div role="listitem" key={a.id}>
              <ActivityCard activity={a} />
            </div>
          ))}
        </Rail>
      )}
      {gallery.length > 0 && (
        <div className="gallery" role="list" aria-label={`${s.title} photos`}>
          {gallery.map((m) => (
            <figure role="listitem" key={m.id}>
              <Img media={m} />
              <Credit media={m} />
            </figure>
          ))}
        </div>
      )}
    </section>
  );
}

function Credit({ media }) {
  if (!media?.credit) return null;
  return <figcaption className="credit">Photo: {[media.credit, media.license].filter(Boolean).join(' · ')}</figcaption>;
}

// attribution for every credited image, including the hero, which has no caption of its own
function PhotoCredits() {
  const { trip } = useTrip();
  const credited = trip.media.filter((m) => m.credit);
  if (!credited.length) return null;
  return (
    <details className="photo-credits">
      <summary>Photo credits</summary>
      <ul>
        {credited.map((m) => (
          <li key={m.id}>
            {m.alt} — {m.credit}
            {m.license && ` (${m.license})`}
          </li>
        ))}
      </ul>
    </details>
  );
}

function Join() {
  const { trip } = useTrip();
  const share = async () => {
    const url = location.origin + location.pathname;
    try {
      if (navigator.share) await navigator.share({ title: trip.title, url });
      else await navigator.clipboard.writeText(url);
    } catch {}
  };
  return (
    <div className="join">
      <p>Interested, even loosely? Tell me — dates and plans get shaped around who's in.</p>
      <button className="button" onClick={share}>
        <Icon name="share" size={18} /> Share this trip
      </button>
    </div>
  );
}
