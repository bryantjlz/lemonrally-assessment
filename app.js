/* ==========================================
   Lemon Rally Club — Skill Assessment Logic
   All content is driven by config.json.
   Edit config.json to change questions, bands,
   styles, club colors, or copy — no code changes needed.
   ========================================== */

(function () {
  let config = null;
  let step = 0;
  let answers = {};
  let sel = null;

  const els = {
    card: document.getElementById('mc-card'),
    progressWrap: document.getElementById('mc-progress-wrap'),
    progressFill: document.getElementById('mc-progress-fill'),
    stepCounter: document.getElementById('mc-step-counter')
  };

  // ---------- Load config ----------
  async function loadConfig() {
    try {
      const res = await fetch('config.json', { cache: 'no-store' });
      config = await res.json();
      applyBranding(config);
      render();
    } catch (err) {
      console.error('Failed to load config.json', err);
      els.card.innerHTML = '<p style="color:#fff;text-align:center;padding:40px;">Failed to load assessment. Please try again.</p>';
    }
  }

  // ---------- Apply club branding from config ----------
  function applyBranding(cfg) {
    const root = document.documentElement;
    const c = cfg.club || {};
    if (c.primaryColor) root.style.setProperty('--club-primary', c.primaryColor);
    if (c.accentColor) root.style.setProperty('--club-accent', c.accentColor);
    if (c.darkColor) root.style.setProperty('--club-dark', c.darkColor);
    if (c.lightColor) root.style.setProperty('--club-light', c.lightColor);

    // Update intro copy
    const intro = cfg.intro || {};
    const eyebrow = document.querySelector('#mc-intro .eyebrow');
    const title = document.querySelector('#mc-intro h1.mc-title');
    const lead = document.querySelector('#mc-intro .lead');
    const cta = document.getElementById('startCta');

    if (intro.eyebrow && eyebrow) eyebrow.textContent = intro.eyebrow;
    if (intro.title && title) title.innerHTML = intro.title;
    if (intro.lead && lead) lead.innerHTML = intro.lead;
    if (intro.cta && cta) cta.textContent = intro.cta;

    // Stats
    const statsContainer = document.querySelector('#mc-intro .stats');
    if (intro.stats && statsContainer) {
      statsContainer.innerHTML = intro.stats.map(s =>
        `<div class="stat"><span class="stat-num">${s.num}</span><div class="stat-label">${s.label}</div></div>`
      ).join('');
    }

    // Features
    const featuresContainer = document.querySelector('#mc-intro .features');
    if (intro.features && featuresContainer) {
      featuresContainer.innerHTML = intro.features.map(f =>
        `<div class="feature"><span class="feature-icon">${f.icon}</span><div class="feature-title">${f.title}</div><p class="feature-desc">${f.desc}</p></div>`
      ).join('');
    }
  }

  // ---------- Render ----------
  function render() {
    const total = config.questions.length;

    if (step === 0) {
      els.progressWrap.style.display = 'none';
      els.stepCounter.textContent = '';
      els.card.innerHTML = introHTML();
    } else if (step > total) {
      els.progressWrap.style.display = 'block';
      els.progressFill.style.width = '100%';
      els.stepCounter.textContent = '';
      els.card.innerHTML = resultsHTML();
    } else {
      els.progressWrap.style.display = 'block';
      els.progressFill.style.width = Math.round((step / total) * 100) + '%';
      els.stepCounter.textContent = step + ' / ' + total;
      els.card.innerHTML = qHTML();
    }
  }

  // ---------- Intro screen (inside quiz card) ----------
  function introHTML() {
    const c = config.club || {};
    return `
      <div style="text-align:center">
        <div class="mc-title" style="font-size:13px;letter-spacing:0.12em;color:rgba(255,255,255,0.6);margin-bottom:14px;">${c.name} Player Assessment</div>
        <div class="mc-title" style="font-size:44px;color:#fff;margin-bottom:10px;line-height:1.05;">WHAT'S YOUR <span style="background:linear-gradient(135deg,#e8e000,#f0a000);-webkit-background-clip:text;-webkit-text-fill-color:transparent;">LEVEL?</span></div>
        <p style="color:rgba(255,255,255,0.75);font-size:15px;line-height:1.7;margin-bottom:28px;">10 questions. 3 minutes. Find your skill rating, see where you shine, and get matched to the right players.</p>
        <div class="mc-tags-row">
          <span class="mc-tag">Skill Rating</span>
          <span class="mc-tag">Category Breakdown</span>
          <span class="mc-tag">Style Profile</span>
          <span class="mc-tag">Find Club Matches</span>
        </div>
        <button class="mc-btn-primary" onclick="mcStart()" style="font-size:20px;padding:14px 44px;">LET'S GO</button>
      </div>`;
  }

  // ---------- Question screen ----------
  function qHTML() {
    const q = config.questions[step - 1];
    const opts = q.opts.map(o =>
      `<button class="mc-opt ${sel === o.s ? 'sel' : ''}" onclick="window.mcSel(${o.s}, this)">
        <div class="mc-radio">${sel === o.s ? '✓' : ''}</div>
        <span>${o.l ? `<strong style="color:#FDCE00">${o.l}:</strong> ` : ''}${o.t}</span>
      </button>`
    ).join('');

    return `
      <span class="mc-tag">${q.cat}</span>
      <div class="mc-title" style="font-size:22px;color:#fff;margin:10px 0 22px;line-height:1.2;">${q.q}</div>
      <div>${opts}</div>
      <div class="mc-nav">
        <button class="mc-btn-back" onclick="window.mcBack()">← Back</button>
        <button class="mc-btn-primary" id="mc-next" onclick="window.mcNext()" ${sel === null ? 'disabled' : ''} style="font-size:17px;padding:11px 28px;">
          ${step === total ? 'SEE MY RATING' : 'NEXT'}
        </button>
      </div>`;
  }

  // ---------- Results screen ----------
  function resultsHTML() {
    const skillQs = config.questions.filter(q => !q.isStyle);
    const avg = skillQs.reduce((s, q) => s + (answers[q.id] || 1), 0) / skillQs.length;
    const sc = Math.min(5, Math.max(1, Math.round(avg * 2) / 2));
    const b = band(sc);
    const st = config.styles[answers.sty || 3];
    const cats = config.categories.map(cat => {
      const qs = skillQs.filter(q => q.cat === cat);
      const vals = qs.map(q => answers[q.id] || 1);
      const s = vals.reduce((a, b) => a + b, 0) / vals.length;
      const pct = ((s - 1) / 4) * 100;
      return `
        <div style="margin-bottom:14px;">
          <div style="display:flex;justify-content:space-between;margin-bottom:5px;">
            <span style="font-size:14px;color:#fff;">${cat}</span>
            <span style="font-size:13px;color:#FDCE00;font-weight:700;">${s.toFixed(1)}</span>
          </div>
          <div class="mc-bar-bg"><div class="mc-bar-fill" style="width:${pct}%"></div></div>
        </div>`;
    }).join('');

    const r = config.results || {};
    const findPlayersText = (r.findPlayers || 'FIND PLAYERS AT YOUR {score} LEVEL').replace('{score}', sc.toFixed(1));

    return `
      <div style="text-align:center;margin-bottom:24px;">
        <p style="color:rgba(255,255,255,0.6);font-size:11px;letter-spacing:0.15em;text-transform:uppercase;margin-bottom:16px;">Your Skill Rating</p>
        <div class="mc-score-circle"><span class="mc-score-num">${sc.toFixed(1)}</span></div>
        <div class="mc-title" style="font-size:32px;color:#fff;margin-bottom:10px;">${b.label}</div>
        <p style="color:rgba(255,255,255,0.85);font-size:15px;line-height:1.6;">${b.desc}</p>
      </div>
      <div class="mc-divider-w"></div>
      <div style="margin-bottom:24px;">
        <div class="mc-title" style="font-size:18px;color:#fff;margin-bottom:16px;">Breakdown by Category</div>
        ${cats}
      </div>
      <div class="mc-divider-w"></div>
      <div style="margin-bottom:24px;">
        <div class="mc-title" style="font-size:18px;color:#fff;margin-bottom:14px;">Your Playing Style</div>
        <div class="mc-style-card">
          <span style="font-size:30px;">${st.emoji}</span>
          <div>
            <div class="mc-title" style="font-size:20px;color:#FDCE00;margin-bottom:6px;">${st.label}</div>
            <p style="color:rgba(255,255,255,0.85);font-size:14px;line-height:1.5;margin:0;">${st.desc}</p>
          </div>
        </div>
      </div>
      <div class="mc-divider-w"></div>
      <div class="mc-cta-box">
        <div class="saved-pill">${r.ctaSubtext || '🏓 Your rating is saved — don\'t lose it'}</div>
        <div class="mc-title" style="font-size:26px;color:#fff;margin-bottom:10px;line-height:1.1;">${findPlayersText}</div>
        <p style="color:rgba(255,255,255,0.8);font-size:14px;margin-bottom:18px;line-height:1.6;">${r.findPlayersDesc || 'Connect with club members at your skill level.'}</p>
        <button class="mc-btn-primary" onclick="window.mcRetake()" style="font-size:18px;padding:12px 32px;">${r.retake || 'Retake Assessment'}</button>
      </div>`;
  }

  // ---------- Helpers ----------
  function band(sc) {
    return config.bands.find(b => sc >= b.min && sc <= b.max) || config.bands[config.bands.length - 1];
  }

  // ---------- Global actions (called from inline HTML) ----------
  window.mcStart = function () {
    step = 1;
    sel = null;
    render();
    els.card.scrollIntoView({ behavior: 'smooth' });
  };

  window.mcSel = function (s, el) {
    sel = s;
    document.querySelectorAll('#mc-card .mc-opt').forEach(e => {
      e.classList.remove('sel');
      const radio = e.querySelector('.mc-radio');
      if (radio) radio.textContent = '';
    });
    el.classList.add('sel');
    const radio = el.querySelector('.mc-radio');
    if (radio) radio.textContent = '✓';
    const nb = document.getElementById('mc-next');
    if (nb) nb.disabled = false;
  };

  window.mcNext = function () {
    if (sel === null) return;
    answers[config.questions[step - 1].id] = sel;
    step++;
    sel = (config.questions[step - 1] && answers[config.questions[step - 1].id]) !== undefined ? answers[config.questions[step - 1].id] : null;
    render();
    els.card.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  window.mcBack = function () {
    if (step <= 1) {
      step = 0;
      answers = {};
      sel = null;
      render();
      return;
    }
    step--;
    sel = answers[config.questions[step - 1].id] || null;
    render();
  };

  window.mcRetake = function () {
    step = 0;
    answers = {};
    sel = null;
    render();
  };

  // ---------- Boot ----------
  loadConfig();
})();
