/* ══════════════════════════════════════
   FAKE NEWS DETECTOR — script.js
══════════════════════════════════════ */

// ── Nav active state ──
(function setActiveNav() {
  const page = location.pathname.split('/').pop() || 'index.html';
  document.querySelectorAll('.nav-links a').forEach(a => {
    const href = a.getAttribute('href');
    if (href === page || (page === '' && href === 'index.html')) {
      a.classList.add('active');
    }
  });
})();

// ── Mobile hamburger ──
const hamburger = document.querySelector('.nav-hamburger');
const navLinks  = document.querySelector('.nav-links');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    hamburger.innerHTML = navLinks.classList.contains('open')
      ? `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 6L6 18M6 6l12 12"/></svg>`
      : `<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>`;
  });
}

// ── Scroll fade-in ──
const observer = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      observer.unobserve(e.target);
    }
  });
}, { threshold: 0.12 });
document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));

// ── Counter animation ──
function animateCounter(el, target, suffix = '') {
  let current = 0;
  const duration = 1800;
  const step = target / (duration / 16);
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = Math.floor(current).toLocaleString() + suffix;
    if (current >= target) clearInterval(timer);
  }, 16);
}
const counterObserver = new IntersectionObserver((entries) => {
  entries.forEach(e => {
    if (e.isIntersecting && !e.target.dataset.animated) {
      e.target.dataset.animated = '1';
      const target = parseFloat(e.target.dataset.target);
      const suffix = e.target.dataset.suffix || '';
      animateCounter(e.target, target, suffix);
    }
  });
}, { threshold: 0.5 });
document.querySelectorAll('[data-target]').forEach(el => counterObserver.observe(el));


/* ══════════════════════════════════════
   DETECTION PAGE
══════════════════════════════════════ */
const newsInput        = document.getElementById('newsInput');
const detectBtn        = document.getElementById('detectBtn');
const clearBtn         = document.getElementById('clearBtn');
const charCountEl      = document.getElementById('charCount');
const wordCountEl      = document.getElementById('wordCount');
const detectingEl      = document.querySelector('.detecting-indicator');
const resultCard       = document.querySelector('.result-card');

if (newsInput) {

  // Character / word counter
  newsInput.addEventListener('input', () => {
    const text = newsInput.value;
    const chars = text.length;
    const words = text.trim() === '' ? 0 : text.trim().split(/\s+/).length;
    if (charCountEl) charCountEl.textContent = `${chars} / 2000`;
    if (wordCountEl) wordCountEl.textContent = `${words} word${words !== 1 ? 's' : ''}`;
    if (chars > 1900 && charCountEl) charCountEl.style.color = 'var(--red)';
    else if (charCountEl) charCountEl.style.color = '';
  });

  // Clear
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      newsInput.value = '';
      newsInput.dispatchEvent(new Event('input'));
      if (resultCard) { resultCard.className = 'result-card'; resultCard.style.display = 'none'; }
      if (detectingEl) detectingEl.classList.remove('show');
      newsInput.focus();
    });
  }

  // Detect
  if (detectBtn) {
    detectBtn.addEventListener('click', () => runDetection());
  }

  // Enter shortcut hint
  newsInput.addEventListener('keydown', e => {
    if (e.ctrlKey && e.key === 'Enter') runDetection();
  });
}

// ── Analysis data bank ──
const FAKE_SIGNALS = [
  { reason: "The text contains emotionally charged and sensationalist language designed to trigger strong reactions rather than inform.",
    indicators: ["Excessive use of ALL CAPS or exclamation marks", "Emotionally loaded or fear-based phrasing", "Lack of verifiable source citations", "Absolute claims with no nuance"],
    rec: "Cross-check this claim on trusted fact-checking sites such as Snopes, PolitiFact, or Reuters Fact Check before sharing." },
  { reason: "Multiple factual inconsistencies and unverifiable claims were detected, which are characteristic patterns in misinformation.",
    indicators: ["Anonymous or unnamed sources cited", "Extraordinary claims without evidence", "Contradicts widely-verified information", "Overly one-sided narrative"],
    rec: "Search for this story across multiple reputable news outlets. If only fringe sites cover it, treat with high skepticism." },
  { reason: "The writing style and structure resemble known misinformation patterns — provocative headlines mismatched with weak body content.",
    indicators: ["Headline doesn't match article body", "No publication date or author name", "Manipulative framing detected", "Appeals to conspiracy or distrust of institutions"],
    rec: "Verify the publisher's credibility. Check if the domain mimics a legitimate news outlet with slight spelling variations." },
];

const REAL_SIGNALS = [
  { reason: "The text demonstrates balanced reporting with attributable sources, measured language, and factual structure consistent with verified journalism.",
    indicators: ["Named, credible sources referenced", "Measured, neutral tone throughout", "Specific dates and verifiable details", "Multiple perspectives presented"],
    rec: "Content appears credible. Always cross-reference with 2–3 additional reputable sources for full context on any important story." },
  { reason: "Linguistic and structural analysis indicates professional journalistic writing with proper sourcing and factual grounding.",
    indicators: ["Clear attribution to named sources", "Consistent factual claims", "Absence of sensationalist language", "Logical narrative structure"],
    rec: "This content reads as reliable. Still recommended to verify specific statistics mentioned by checking primary sources directly." },
  { reason: "The content aligns with verified reporting conventions: neutral language, sourced claims, and absence of manipulation tactics.",
    indicators: ["Context and background provided", "Nuanced treatment of the subject", "No emotional manipulation detected", "Traceable to verifiable events"],
    rec: "Content appears authentic. For important decisions, always seek original documents or official statements when cited." },
];

// ── Core detection logic (heuristic + randomised simulation) ──
function analyseText(text) {
  const lower = text.toLowerCase();

  // Fake signals scoring
  let fakeScore = 0;
  const fakeKeywords = ['breaking','exclusive','shocking','unbelievable','they don\'t want you','secret','cover-up',
    'mainstream media','deep state','wake up','truth','exposed','hoax','fake','fraud','corrupt','lie','lies',
    '!!!','???','wake up','share before removed','must see','you won\'t believe','bombshell','urgent'];
  const realKeywords = ['according to','reported by','said in a statement','officials confirmed','researchers found',
    'study shows','data indicates','spokesperson','press release','on record','analysts say','experts note',
    'per the report','evidence suggests','source confirmed'];

  fakeKeywords.forEach(k => { if (lower.includes(k)) fakeScore += 1.8; });
  realKeywords.forEach(k => { if (lower.includes(k)) fakeScore -= 2.2; });

  // Caps ratio
  const capsRatio = (text.match(/[A-Z]/g) || []).length / Math.max(text.length, 1);
  if (capsRatio > 0.18) fakeScore += 4;

  // Exclamation density
  const exclCount = (text.match(/!/g) || []).length;
  if (exclCount > 2) fakeScore += exclCount * 1.2;

  // Short text penalty
  const wordCount = text.trim().split(/\s+/).length;
  if (wordCount < 20) fakeScore += 2;

  // Source-like patterns
  if (/\b(www\.|https?:|\.com|\.org|\.gov)\b/i.test(text)) fakeScore -= 2;

  // Add a small random variance for realism
  fakeScore += (Math.random() - 0.5) * 4;

  const isFake = fakeScore > 3;
  // Confidence 55–97 range
  const rawConf = Math.min(97, Math.max(55, Math.abs(fakeScore) * 6 + 55));
  const confidence = Math.round(rawConf);

  const pool = isFake ? FAKE_SIGNALS : REAL_SIGNALS;
  const detail = pool[Math.floor(Math.random() * pool.length)];

  return { isFake, confidence, ...detail };
}

function runDetection() {
  const text = newsInput ? newsInput.value.trim() : '';
  if (!text || text.length < 15) {
    shakeInput();
    showToast('Please enter at least 15 characters of news text.');
    return;
  }

  // Show loading
  if (resultCard)   { resultCard.className = 'result-card'; resultCard.style.display = 'none'; }
  if (detectingEl)  detectingEl.classList.add('show');
  if (detectBtn)    { detectBtn.disabled = true; detectBtn.textContent = 'Analysing…'; }

  // Simulate processing time
  const delay = 1400 + Math.random() * 800;
  setTimeout(() => {
    const result = analyseText(text);
    if (detectingEl) detectingEl.classList.remove('show');
    if (detectBtn)   { detectBtn.disabled = false; detectBtn.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg> Detect`; }
    renderResult(result);
  }, delay);
}

function renderResult(result) {
  if (!resultCard) return;

  const { isFake, confidence, reason, indicators, rec } = result;
  const cls       = isFake ? 'fake-news' : 'real-news';
  const badgeCls  = isFake ? 'fake' : 'real';
  const label     = isFake ? '🚨 FAKE NEWS' : '✅ REAL NEWS';
  const barCls    = isFake ? 'fake' : 'real';
  const pctCls    = isFake ? 'fake-color' : 'real-color';

  resultCard.className = `result-card ${cls} show`;

  resultCard.innerHTML = `
    <div class="verdict-row">
      <div class="verdict-badge ${badgeCls}">${label}</div>
      <div class="score-text">Confidence: <strong>${confidence}%</strong></div>
    </div>

    <div class="confidence-section">
      <div class="conf-header">
        <span class="conf-label">Confidence Level</span>
        <span class="conf-pct ${pctCls}" id="confPctDisplay">0%</span>
      </div>
      <div class="conf-bar-wrap">
        <div class="conf-bar ${barCls}" id="confBar" style="width:0%"></div>
      </div>
    </div>

    <div class="result-divider"></div>

    <div class="analysis-grid">
      <div class="analysis-block">
        <h4>🔍 Reason for Prediction</h4>
        <p>${reason}</p>
      </div>
      <div class="analysis-block">
        <h4>⚠️ Key Indicators</h4>
        <ul>${indicators.map(i => `<li>${i}</li>`).join('')}</ul>
      </div>
      <div class="analysis-block" style="grid-column:1/-1">
        <h4>💡 Recommendation</h4>
        <p>${rec}</p>
      </div>
    </div>
  `;

  // Animate confidence bar
  requestAnimationFrame(() => {
    setTimeout(() => {
      const bar = document.getElementById('confBar');
      const pctDisplay = document.getElementById('confPctDisplay');
      if (bar) bar.style.width = confidence + '%';
      // Animate number
      let current = 0;
      const step = confidence / 60;
      const timer = setInterval(() => {
        current = Math.min(current + step, confidence);
        if (pctDisplay) pctDisplay.textContent = Math.round(current) + '%';
        if (current >= confidence) clearInterval(timer);
      }, 16);
    }, 100);
  });

  resultCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function shakeInput() {
  if (!newsInput) return;
  newsInput.style.animation = 'none';
  newsInput.style.border = '1.5px solid var(--red)';
  setTimeout(() => { newsInput.style.border = ''; }, 1000);
}

function showToast(msg) {
  const toast = document.createElement('div');
  toast.style.cssText = `
    position:fixed;bottom:24px;left:50%;transform:translateX(-50%) translateY(10px);
    background:#1e293b;color:#fff;padding:12px 22px;border-radius:10px;
    font-size:.88rem;font-weight:500;z-index:999;
    box-shadow:0 8px 32px rgba(0,0,0,.25);
    opacity:0;transition:all .3s;pointer-events:none;
  `;
  toast.textContent = msg;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    toast.style.opacity = '1';
    toast.style.transform = 'translateX(-50%) translateY(0)';
  });
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 2800);
}


/* ══════════════════════════════════════
   CONTACT PAGE
══════════════════════════════════════ */
const contactForm = document.getElementById('contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', e => {
    e.preventDefault();
    const btn = contactForm.querySelector('button[type="submit"]');
    const successEl = document.querySelector('.submit-success');

    btn.disabled = true;
    btn.textContent = 'Sending…';

    setTimeout(() => {
      btn.textContent = 'Message Sent ✓';
      btn.style.background = 'var(--green)';
      if (successEl) successEl.classList.add('show');
      contactForm.reset();
      setTimeout(() => {
        btn.disabled = false;
        btn.textContent = 'Send Message';
        btn.style.background = '';
        if (successEl) successEl.classList.remove('show');
      }, 4000);
    }, 1200);
  });
}

// ── FAQ accordion ──
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const item = btn.closest('.faq-item');
    const isOpen = item.classList.contains('open');
    document.querySelectorAll('.faq-item').forEach(i => i.classList.remove('open'));
    if (!isOpen) item.classList.add('open');
  });
});

document.getElementById("detectBtn").addEventListener("click", function () {

    const text = document.getElementById("newsInput").value;

    fetch("/predict", {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            news: text
        })
    })
    .then(response => response.json())
    .then(data => {

        const resultCard = document.querySelector(".result-card");

        resultCard.innerHTML =
        `
        <h3>Prediction Result</h3>
        <p style="font-size:20px;font-weight:bold">${data.prediction}</p>
        `;

        resultCard.style.display = "block";

    })
    .catch(error => console.error(error));

});