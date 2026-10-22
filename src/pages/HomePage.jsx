// import { Link } from "react-router-dom";

// export default function HomePage() {
//   return (
//     <div style={{ padding: 20, background: "lightgreen" }}>
//       <h1>Roompulse Home</h1>
//       <p>If you see this, routing with your pages works.</p>
//       <p>
//         <Link to="/login">Go to Login</Link>
//       </p>
//     </div>
//   );
// }


import { Link } from "react-router-dom";
import "./HomePage.css";

const pollOptions = [
  { label: "Interactive workshops", percent: 48, color: "violet" },
  { label: "Live quizzes", percent: 27, color: "blue" },
  { label: "Open discussions", percent: 17, color: "teal" },
  { label: "Quick surveys", percent: 8, color: "orange" },
];

const features = [
  {
    icon: "◉",
    title: "Live polls",
    description:
      "Ask a question and watch audience opinions come together in real time.",
    color: "violet",
  },
  {
    icon: "✳",
    title: "Interactive quizzes",
    description:
      "Turn presentations into fun, competitive experiences that keep people engaged.",
    color: "blue",
  },
  {
    icon: "▤",
    title: "Instant surveys",
    description:
      "Collect feedback, understand your audience, and make better decisions.",
    color: "teal",
  },
  {
    icon: "↗",
    title: "Live results",
    description:
      "Turn responses into clear visual insights as votes arrive.",
    color: "orange",
  },
];

function QrPreview() {
  // Decorative QR-style illustration for the landing page preview.
  // Replace it with a real QR code when connecting a live session.
  const cells = Array.from({ length: 225 }, (_, i) => {
    const x = i % 15;
    const y = Math.floor(i / 15);

    const inFinder = (ox, oy) =>
      x >= ox && x < ox + 5 && y >= oy && y < oy + 5;

    const finder = (ox, oy) => {
      const dx = x - ox;
      const dy = y - oy;
      return (
        dx === 0 ||
        dx === 4 ||
        dy === 0 ||
        dy === 4 ||
        (dx >= 2 && dx <= 2 && dy >= 2 && dy <= 2)
      );
    };

    const corner =
      (inFinder(0, 0) && finder(0, 0)) ||
      (inFinder(10, 0) && finder(10, 0)) ||
      (inFinder(0, 10) && finder(0, 10));

    const emptyCorner =
      (inFinder(0, 0) && !finder(0, 0)) ||
      (inFinder(10, 0) && !finder(10, 0)) ||
      (inFinder(0, 10) && !finder(0, 10));

    return { id: i, filled: corner || (!emptyCorner && ((i * 17 + x * y * 7 + x * 3) % 11 < 5)) };
  });

  return (
    <div className="rp-qr" aria-label="Decorative QR code preview">
      <div className="rp-qr-grid">
        {cells.map((cell) => (
          <span
            key={cell.id}
            className={cell.filled ? "rp-qr-cell filled" : "rp-qr-cell"}
          />
        ))}
      </div>
    </div>
  );
}

function PollPreview() {
  return (
    <div className="rp-demo-card">
      <div className="rp-demo-top">
        <div className="rp-demo-brand">
          <span className="rp-mini-logo">R</span>
          <span>RoomPulse</span>
        </div>
        <span className="rp-live">
          <span /> LIVE SESSION
        </span>
      </div>

      <div className="rp-demo-body">
        <div className="rp-poll-copy">
          <span className="rp-eyebrow">AUDIENCE POLL · QUESTION 01</span>
          <h3>What makes a great team meeting?</h3>
          <p>Responses are updating as people vote.</p>
        </div>

        <div className="rp-poll-options">
          {pollOptions.map((option) => (
            <div className="rp-poll-option" key={option.label}>
              <div className="rp-option-label">
                <span>{option.label}</span>
                <strong>{option.percent}%</strong>
              </div>
              <div className="rp-progress-track">
                <div
                  className={`rp-progress-fill ${option.color}`}
                  style={{ width: `${option.percent}%` }}
                />
              </div>
            </div>
          ))}
        </div>

        <div className="rp-demo-footer">
          <div className="rp-participants">
            <span className="rp-avatar">J</span>
            <span className="rp-avatar">M</span>
            <span className="rp-avatar">A</span>
            <span className="rp-avatar rp-avatar-more">+</span>
            <span><strong>128</strong> responses</span>
          </div>
          <span className="rp-updating">
            <span /> Updating live
          </span>
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  return (
    <main className="rp-page">
      <header className="rp-header">
        <div className="rp-container rp-nav">
          <Link to="/" className="rp-brand" aria-label="RoomPulse home">
            <span className="rp-logo">
              <span />
              <span />
              <span />
            </span>
            <span>Room<span className="rp-brand-accent">Pulse</span></span>
          </Link>

          <nav className="rp-nav-links" aria-label="Main navigation">
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <a href="#use-cases">Who it's for</a>
          </nav>

          <div className="rp-nav-actions">
            <Link to="/login" className="rp-login">Log in</Link>
            <Link to="/login" className="rp-button rp-button-small">
              Get started <span>↗</span>
            </Link>
          </div>
        </div>
      </header>

      <section className="rp-hero">
        <div className="rp-hero-glow" />
        <div className="rp-container rp-hero-grid">
          <div className="rp-hero-copy">
            <div className="rp-announcement">
              <span className="rp-announcement-dot" />
              YOUR AUDIENCE. YOUR MOMENT.
              <span>✳</span>
            </div>

            <h1>
              Make every voice
              <br />
              <span className="rp-gradient-text">part of the room.</span>
            </h1>

            <p className="rp-hero-description">
              Turn presentations into conversations. Create live polls,
              quizzes, and surveys that bring everyone in — with instant
              results your whole audience can see.
            </p>

            <div className="rp-hero-actions">
              <Link to="/login" className="rp-button">
                Start engaging <span>→</span>
              </Link>
              <a href="#how-it-works" className="rp-button rp-button-ghost">
                See how it works <span>↓</span>
              </a>
            </div>

            <div className="rp-hero-proof">
              <div className="rp-proof-icon">✓</div>
              <p><strong>No complicated setup.</strong> Just scan, respond, and connect.</p>
            </div>
          </div>

          <div className="rp-hero-visual">
            <div className="rp-visual-orb rp-orb-one" />
            <div className="rp-visual-orb rp-orb-two" />

            <div className="rp-floating-tag rp-tag-top">
              <span className="rp-tag-icon">↗</span>
              <span><strong>Real-time insights</strong><small>Every vote counts</small></span>
            </div>

            <PollPreview />

            <div className="rp-join-card">
              <div className="rp-join-heading">
                <div>
                  <span className="rp-eyebrow">JOIN THE SESSION</span>
                  <h3>You're invited!</h3>
                </div>
                <span className="rp-join-sparkle">✳</span>
              </div>
              <div className="rp-join-content">
                <QrPreview />
                <div>
                  <strong>Scan to participate</strong>
                  <p>Open your camera, scan the code, and make your voice heard.</p>
                  <span className="rp-join-status"><span /> No app download needed</span>
                </div>
              </div>
            </div>

            <div className="rp-floating-tag rp-tag-bottom">
              <span className="rp-tag-check">✓</span>
              <span><strong>128 people joined</strong><small>And counting...</small></span>
            </div>
          </div>
        </div>

        <div className="rp-container rp-trust-strip">
          <span>MADE FOR MOMENTS THAT MATTER</span>
          <div>
            <span>◈ Classrooms</span>
            <span>▥ Meetings</span>
            <span>✳ Events</span>
            <span>◎ Workshops</span>
          </div>
        </div>
      </section>

      <section className="rp-features rp-section" id="features">
        <div className="rp-container">
          <div className="rp-section-heading">
            <span className="rp-eyebrow">LESS TALKING AT PEOPLE. MORE TALKING WITH THEM.</span>
            <h2>Engagement that happens <span>in the moment.</span></h2>
            <p>Everything you need to turn a passive audience into an active one.</p>
          </div>

          <div className="rp-feature-grid">
            {features.map((feature) => (
              <article className="rp-feature-card" key={feature.title}>
                <div className={`rp-feature-icon ${feature.color}`}>
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
                <a href="#how-it-works" aria-label={`Learn how ${feature.title} works`}>
                  Explore feature <span>↗</span>
                </a>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="rp-how rp-section" id="how-it-works">
        <div className="rp-container rp-how-grid">
          <div className="rp-how-copy">
            <span className="rp-eyebrow">SIMPLE BY DESIGN</span>
            <h2>From question to insight in <span>three easy steps.</span></h2>
            <p>
              No new apps to download. No awkward pauses. Just a simple
              experience that gets everyone involved.
            </p>

            <div className="rp-steps">
              <div className="rp-step">
                <span className="rp-step-number">01</span>
                <div>
                  <h3>Create your session</h3>
                  <p>Organizers create a poll, quiz, or survey and display the joining QR code.</p>
                </div>
              </div>
              <div className="rp-step">
                <span className="rp-step-number">02</span>
                <div>
                  <h3>Let everyone join in</h3>
                  <p>Participants scan with their phones and respond in seconds.</p>
                </div>
              </div>
              <div className="rp-step">
                <span className="rp-step-number">03</span>
                <div>
                  <h3>See the room come alive</h3>
                  <p>Responses turn into visual results as votes come in.</p>
                </div>
              </div>
            </div>

            <Link to="/login" className="rp-button">
              Create your first session <span>→</span>
            </Link>
          </div>

          <div className="rp-how-visual">
            <div className="rp-insight-card">
              <div className="rp-insight-header">
                <div>
                  <span className="rp-eyebrow">SESSION OVERVIEW</span>
                  <h3>Team workshop</h3>
                </div>
                <span className="rp-insight-live"><span /> LIVE</span>
              </div>
              <div className="rp-insight-stat">
                <div>
                  <span>Total responses</span>
                  <strong>128</strong>
                </div>
                <div>
                  <span>Participation</span>
                  <strong>94<span className="rp-stat-percent">%</span></strong>
                </div>
              </div>
              <div className="rp-chart-heading">
                <strong>What should we focus on next?</strong>
                <span>LIVE RESULTS</span>
              </div>
              <div className="rp-chart">
                {[
                  { label: "Communication", height: 62 },
                  { label: "Teamwork", height: 88 },
                  { label: "Innovation", height: 48 },
                  { label: "Wellbeing", height: 73 },
                  { label: "Growth", height: 56 },
                ].map((bar) => (
                  <div className="rp-chart-column" key={bar.label}>
                    <div className="rp-chart-bar-wrap">
                      <div className="rp-chart-bar" style={{ height: `${bar.height}%` }} />
                    </div>
                    <span>{bar.label}</span>
                  </div>
                ))}
              </div>
              <div className="rp-insight-bottom">
                <span>✳ Your audience is participating</span>
                <span>Updated just now</span>
              </div>
            </div>
            <div className="rp-insight-decoration">✳</div>
          </div>
        </div>
      </section>

      <section className="rp-audience rp-section" id="use-cases">
        <div className="rp-container rp-audience-inner">
          <div>
            <span className="rp-eyebrow">ONE TOOL. SO MANY ROOMS.</span>
            <h2>Wherever people gather, <span>RoomPulse fits.</span></h2>
          </div>
          <div className="rp-audience-pills">
            <span>🎓 Education</span>
            <span>💼 Team meetings</span>
            <span>🎤 Conferences</span>
            <span>🤝 Workshops</span>
            <span>💬 Community events</span>
          </div>
        </div>
      </section>

      <section className="rp-cta">
        <div className="rp-container rp-cta-inner">
          <div className="rp-cta-spark">✳</div>
          <span className="rp-eyebrow">YOUR NEXT GREAT SESSION STARTS HERE</span>
          <h2>Don't just fill the room.<br /><span>Bring it to life.</span></h2>
          <p>Give every participant a voice. Start your first RoomPulse session today.</p>
          <Link to="/login" className="rp-button rp-button-white">
            Get started with RoomPulse <span>→</span>
          </Link>
          <small>Built for real conversations, one response at a time.</small>
        </div>
      </section>

      <footer className="rp-footer">
        <div className="rp-container rp-footer-inner">
          <Link to="/" className="rp-brand">
            <span className="rp-logo">
              <span />
              <span />
              <span />
            </span>
            <span>room<span className="rp-brand-accent">pulse</span></span>
          </Link>
          <p>Better questions. Bigger participation.</p>
          <div>
            <a href="#features">Features</a>
            <a href="#how-it-works">How it works</a>
            <Link to="/login">Organizer login</Link>
          </div>
          <span className="rp-copyright">© {new Date().getFullYear()} RoomPulse</span>
        </div>
      </footer>
    </main>
  );
}