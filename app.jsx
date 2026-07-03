// ═══════════════════════════════════════════════════════════
//  Ashforge Studio: interactive UI (services, testimonials,
//  credits, FAQ, tweaks). Compiled to app.js for production.
//  Source: app.jsx. To rebuild: run the build step in the design
//  environment, or hand-transpile with @babel/preset-react.
// ═══════════════════════════════════════════════════════════

const { useState, useEffect, useRef } = React;

// ── SERVICES DATA ─────────────────────────────────────
// Visual runes keyed by service id. Service text comes from content.json.
const SERVICE_RUNES = {
  adventure: (<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M3 19L11 3l8 16H3z" stroke="var(--ember)" strokeWidth="1.2" strokeLinejoin="round"/><path d="M7 14h8" stroke="var(--ember)" strokeWidth="1.2" strokeLinecap="round"/></svg>),
  lore: (<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="8" stroke="var(--ember)" strokeWidth="1.2"/><path d="M11 3C11 3 8 7 8 11s3 8 3 8M11 3c0 0 3 4 3 8s-3 8-3 8M3 11h16" stroke="var(--ember)" strokeWidth="1.2" strokeLinecap="round"/></svg>),
  crunch: (<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="3" y="3" width="16" height="16" rx="1.5" stroke="var(--ember)" strokeWidth="1.2"/><path d="M7 11h8M11 7v8" stroke="var(--ember)" strokeWidth="1.2" strokeLinecap="round"/></svg>),
  articles: (<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><rect x="4" y="3" width="14" height="16" rx="1" stroke="var(--ember)" strokeWidth="1.2"/><path d="M7 7h8M7 11h8M7 15h5" stroke="var(--ember)" strokeWidth="1.2" strokeLinecap="round"/></svg>),
  review: (<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="9" cy="9" r="5" stroke="var(--ember)" strokeWidth="1.2"/><path d="M13 13l5 5" stroke="var(--ember)" strokeWidth="1.2" strokeLinecap="round"/><path d="M6.5 9h5M9 6.5v5" stroke="var(--ember)" strokeWidth="1.2" strokeLinecap="round"/></svg>),
  editing: (<svg width="22" height="22" viewBox="0 0 22 22" fill="none"><path d="M4 17l2-2 9-9 2 2-9 9-4 0 0-2z" stroke="var(--ember)" strokeWidth="1.2" strokeLinejoin="round"/><path d="M13 6l3 3" stroke="var(--ember)" strokeWidth="1.2" strokeLinecap="round"/></svg>),
};

const SERVICES_FALLBACK = [
  { id: "adventure", name: "Adventure Module Writing", body: "Full adventure modules from 1-shot encounters to multi-session campaigns." },
  { id: "lore", name: "World Lore & Setting Writing", body: "Pantheons, history, factions, cultures, and regional lore." },
  { id: "crunch", name: "Mechanical Design & Stat Blocks", body: "Monster stat blocks, items, feats, spells, and subclasses tuned for 5e balance." },
  { id: "articles", name: "Article & Blog Writing", body: "Long-form articles and editorial features on TTRPG craft and design." },
  { id: "review", name: "TTRPG Mechanic Review", body: "Independent balance pass on homebrew content before publishing or playtesting." },
  { id: "editing", name: "TTRPG Editing & Proofreading", body: "Rules-aware editing for mechanics, tone, clarity, pacing, and formatting." },
];

function useServices() {
  const [services, setServices] = useState(
    (window.ASHFORGE_CONTENT && window.ASHFORGE_CONTENT.services) || SERVICES_FALLBACK
  );
  useEffect(() => {
    const handler = e => {
      if (e.detail && Array.isArray(e.detail.services) && e.detail.services.length) {
        setServices(e.detail.services);
      }
    };
    window.addEventListener("ashforge:content", handler);
    return () => window.removeEventListener("ashforge:content", handler);
  }, []);
  return services;
}

// ── SERVICES ACCORDION ─────────────────────────────────
function ServicesAccordion() {
  const services = useServices();
  const [openId, setOpenId] = useState("adventure");

  return (
    <div className="services-list" style={{ marginTop: 40 }}>
      {services.map(s => (
        <div
          key={s.id}
          className={`service-item ${openId === s.id ? "open" : ""}`}
          onClick={() => setOpenId(openId === s.id ? null : s.id)}
        >
          <div className="service-header">
            <div className="service-header-left">
              <div className="service-rune">{SERVICE_RUNES[s.id]}</div>
              <span className="service-name">{s.name}</span>
            </div>
            <span className="service-chevron">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
          </div>
          <div className="service-body">
            <div className="service-body-inner">
              {s.body}
              {s.priceNote && (
                <div className="service-price-note">{s.priceNote}</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── TESTIMONIALS ───────────────────────────────────────
const TESTIMONIALS_FALLBACK = [
  { id: "t1", quote: "Add a real client quote here via content.json - testimonials.0.", author: "Client name", role: "Role · Project" },
];

function useTestimonials() {
  const [items, setItems] = useState(
    (window.ASHFORGE_CONTENT && window.ASHFORGE_CONTENT.testimonials) || TESTIMONIALS_FALLBACK
  );
  useEffect(() => {
    const handler = e => {
      if (e.detail && Array.isArray(e.detail.testimonials) && e.detail.testimonials.length) {
        setItems(e.detail.testimonials);
      }
    };
    window.addEventListener("ashforge:content", handler);
    return () => window.removeEventListener("ashforge:content", handler);
  }, []);
  return items;
}

function Testimonials() {
  const items = useTestimonials();
  const featured = items.length === 1;
  useEffect(() => {
    const grid = document.getElementById("testimonials-grid");
    if (!grid) return;
    grid.classList.toggle("featured-single", featured);
  }, [featured]);

  return (
    <>
      {items.map(t => (
        <div key={t.id} className="testimonial-card">
          <div className="testimonial-quote-mark">“</div>
          {t.rating && (
            <div className="testimonial-stars" aria-label={`${t.rating} out of 5 stars`}>
              {[...Array(5)].map((_, i) => (
                <svg key={i} width="14" height="14" viewBox="0 0 14 14" fill={i < t.rating ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.2">
                  <path d="M7 1.5l1.7 3.45 3.8.55-2.75 2.68.65 3.78L7 10.18l-3.4 1.78.65-3.78L1.5 5.5l3.8-.55L7 1.5z" strokeLinejoin="round"/>
                </svg>
              ))}
            </div>
          )}
          <p className="testimonial-quote">{t.quote}</p>
          <div className="testimonial-attribution">
            <div className="testimonial-author">{t.author}</div>
            <div className="testimonial-role">{t.role}</div>
            {t.url && (
              <a href={t.url} target="_blank" rel="noopener" className="testimonial-source-link">
                View Credit
                <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                  <path d="M2 5.5h6.5M5.5 2.5l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </a>
            )}
          </div>
        </div>
      ))}
    </>
  );
}

// ── CREDITS ────────────────────────────────────────────
function useCredits() {
  const [items, setItems] = useState(
    (window.ASHFORGE_CONTENT && window.ASHFORGE_CONTENT.credits) || []
  );
  useEffect(() => {
    const handler = e => {
      if (e.detail && Array.isArray(e.detail.credits)) setItems(e.detail.credits);
    };
    window.addEventListener("ashforge:content", handler);
    return () => window.removeEventListener("ashforge:content", handler);
  }, []);
  return items;
}

function Credits() {
  const items = useCredits();
  useEffect(() => {
    const sec = document.getElementById("credits");
    if (sec) sec.style.display = items.length ? "" : "none";
  }, [items.length]);

  if (!items.length) return null;
  return (
    <>
      {items.map(c => {
        const Tag = c.url ? "a" : "div";
        const props = c.url ? { href: c.url, target: "_blank", rel: "noopener" } : {};
        return (
          <Tag key={c.id} className="credit-card" {...props}>
            {c.year && <div className="credit-year">{c.year}</div>}
            <div className="credit-body">
              <div className="credit-project">{c.project}</div>
              <div className="credit-publisher">{c.publisher}</div>
              {c.role && <div className="credit-role">{c.role}</div>}
            </div>
            {c.url && (
              <div className="credit-card-arrow">
                <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M3 9h11M10 4l5 5-5 5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            )}
          </Tag>
        );
      })}
    </>
  );
}

// ── FAQ ────────────────────────────────────────────────
const FAQ_FALLBACK = [
  { id: "q1", q: "Question goes here", a: "Edit FAQs via content.json - faq array." },
];

function useFaq() {
  const [items, setItems] = useState(
    (window.ASHFORGE_CONTENT && window.ASHFORGE_CONTENT.faq) || FAQ_FALLBACK
  );
  useEffect(() => {
    const handler = e => {
      if (e.detail && Array.isArray(e.detail.faq) && e.detail.faq.length) {
        setItems(e.detail.faq);
      }
    };
    window.addEventListener("ashforge:content", handler);
    return () => window.removeEventListener("ashforge:content", handler);
  }, []);
  return items;
}

function FAQ() {
  const items = useFaq();
  const [openId, setOpenId] = useState(items[0] && items[0].id);
  return (
    <>
      {items.map(f => (
        <div
          key={f.id}
          className={`faq-item ${openId === f.id ? "open" : ""}`}
          onClick={() => setOpenId(openId === f.id ? null : f.id)}
        >
          <div className="faq-header">
            <span className="faq-q">{f.q}</span>
            <span className="faq-toggle"></span>
          </div>
          <div className="faq-body">
            <div className="faq-body-inner">{f.a}</div>
          </div>
        </div>
      ))}
    </>
  );
}

// ── FORM ────────────────────────────────────────────────
function showToast() {
  const t = document.getElementById("toast");
  t.classList.add("show");
  setTimeout(() => t.classList.remove("show"), 3500);
}

const form = document.getElementById("commission-form");
if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = document.getElementById("f-name").value.trim();
    const email = document.getElementById("f-email").value.trim();
    const brief = document.getElementById("f-brief").value.trim();
    const nameEl = document.getElementById("f-name");
    const emailEl = document.getElementById("f-email");
    const errEl = document.getElementById("form-error");
    if (!name || !email) {
      nameEl.style.borderColor = !name ? "var(--crimson)" : "";
      emailEl.style.borderColor = !email ? "var(--crimson)" : "";
      nameEl.setAttribute("aria-invalid", !name ? "true" : "false");
      emailEl.setAttribute("aria-invalid", !email ? "true" : "false");
      if (errEl) errEl.textContent = "Please add your " + (!name && !email ? "name and email" : !name ? "name" : "email") + " so I can get back to you.";
      (!name ? nameEl : emailEl).focus();
      return;
    }
    nameEl.style.borderColor = "";
    emailEl.style.borderColor = "";
    nameEl.setAttribute("aria-invalid", "false");
    emailEl.setAttribute("aria-invalid", "false");
    if (errEl) errEl.textContent = "";

    const btn = document.getElementById("form-submit");
    btn.textContent = "Sending…";
    btn.disabled = true;

    try {
      const body = new FormData();
      body.append("entry.510684980", name);
      body.append("entry.1623533162", email);
      body.append("entry.1331834901", brief);

      await fetch(
        "https://docs.google.com/forms/u/0/d/1sDKbJzGvHX9v-ZBhAQxHGopMKmdpdUWZnQev1PQMbTc/formResponse",
        { method: "POST", body, mode: "no-cors" }
      );
      form.reset();
      showToast();
    } catch {
      window.location.href = `mailto:matthias.moore.pro@gmail.com?subject=Commission Inquiry&body=Name: ${encodeURIComponent(name)}%0AEmail: ${encodeURIComponent(email)}%0A%0A${encodeURIComponent(brief)}`;
    } finally {
      btn.textContent = "Send to the Forge";
      btn.disabled = false;
    }
  });
}

// ── TWEAKS (design-environment only; safely no-ops in production) ──
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "accentColor": "ember",
  "showHeroStats": true,
  "productCount": 3,
  "heroTagline": "Forged in Lore. Built for Tables."
}/*EDITMODE-END*/;

function TweaksApp() {
  if (typeof useTweaks === "undefined") return null;
  const { tweaks, setTweak } = useTweaks(TWEAK_DEFAULTS);
  if (!tweaks) return null;

  useEffect(() => {
    const root = document.documentElement;
    if (tweaks.accentColor === "ember") {
      root.style.setProperty("--ember", "oklch(68% 0.19 42)");
      root.style.setProperty("--ember-glow", "oklch(72% 0.22 38)");
      root.style.setProperty("--ember-dim", "oklch(50% 0.14 42)");
    } else if (tweaks.accentColor === "gold") {
      root.style.setProperty("--ember", "oklch(76% 0.14 78)");
      root.style.setProperty("--ember-glow", "oklch(80% 0.16 78)");
      root.style.setProperty("--ember-dim", "oklch(58% 0.10 78)");
    } else if (tweaks.accentColor === "crimson") {
      root.style.setProperty("--ember", "oklch(55% 0.20 15)");
      root.style.setProperty("--ember-glow", "oklch(60% 0.22 15)");
      root.style.setProperty("--ember-dim", "oklch(42% 0.16 15)");
    } else if (tweaks.accentColor === "arcane") {
      root.style.setProperty("--ember", "oklch(65% 0.22 295)");
      root.style.setProperty("--ember-glow", "oklch(70% 0.24 295)");
      root.style.setProperty("--ember-dim", "oklch(50% 0.18 295)");
    }
  }, [tweaks.accentColor]);

  useEffect(() => {
    const el = document.querySelector(".hero-stats");
    if (el) el.style.display = tweaks.showHeroStats ? "flex" : "none";
  }, [tweaks.showHeroStats]);

  return (
    <TweaksPanel>
      <TweakSection label="Accent Color">
        <TweakRadio
          value={tweaks.accentColor}
          options={[
            { value: "ember", label: "Ember" },
            { value: "gold", label: "Gold" },
            { value: "crimson", label: "Crimson" },
            { value: "arcane", label: "Arcane" },
          ]}
          onChange={v => setTweak("accentColor", v)}
        />
      </TweakSection>
      <TweakSection label="Hero Stats Bar">
        <TweakToggle
          label="Show Stats"
          value={tweaks.showHeroStats}
          onChange={v => setTweak("showHeroStats", v)}
        />
      </TweakSection>
      <TweakSection label="Hero Tagline">
        <TweakText
          value={tweaks.heroTagline}
          onChange={v => {
            setTweak("heroTagline", v);
            const lines = v.split(".");
            const l1 = document.querySelector(".hero-title-line1");
            const l2 = document.querySelector(".hero-title-line2");
            if (l1 && lines[0]) l1.textContent = lines[0].trim() + ".";
            if (l2 && lines[1]) l2.textContent = lines[1].trim() + ".";
          }}
        />
      </TweakSection>
    </TweaksPanel>
  );
}

// ── RENDER ──────────────────────────────────────────────
const tweaksRoot = document.createElement("div");
document.body.appendChild(tweaksRoot);
ReactDOM.createRoot(tweaksRoot).render(<TweaksApp />);

const servicesSlot = document.getElementById("services-list");
if (servicesSlot) {
  ReactDOM.createRoot(servicesSlot).render(<ServicesAccordion />);
}

const testimonialsSlot = document.getElementById("testimonials-grid");
if (testimonialsSlot) {
  ReactDOM.createRoot(testimonialsSlot).render(<Testimonials />);
}

const faqSlot = document.getElementById("faq-list");
if (faqSlot) {
  ReactDOM.createRoot(faqSlot).render(<FAQ />);
}

const creditsSlot = document.getElementById("credits-list");
if (creditsSlot) {
  ReactDOM.createRoot(creditsSlot).render(<Credits />);
}
