// ── RECOMMENDATION CARD SELECTION ──
function toggleRec(card) {
  card.classList.toggle('selected');
  const n = document.querySelectorAll('.rec-card.selected').length;
  const bar = document.getElementById('rec-bar');
  const count = document.getElementById('rec-bar-count');
  if (n === 0) {
    bar.style.display = 'none';
  } else {
    bar.style.display = 'flex';
    count.textContent = n + ' selected';
  }
}

// ── PLAN COLLAPSE (still collapsible but stays in DOM) ──
document.getElementById('plan-header').addEventListener('click', function() {
  const body = document.getElementById('plan-body');
  const chevron = document.getElementById('plan-chevron');
  body.classList.toggle('collapsed');
  chevron.classList.toggle('open');
});

// ── WORKFLOW ROW EXPAND/COLLAPSE ──
function toggleWf(row) {
  const chevron = row.querySelector('.wf-chevron');
  const body = row.nextElementSibling;
  if (!body || !body.classList.contains('wf-body')) return;
  chevron.classList.toggle('open');
  body.classList.toggle('open');
}

// ── ACTION CARD SELECTION ──
function toggleAction(card) {
  card.classList.toggle('selected');
  updateExecuteButton();
}
function updateExecuteButton() {
  const selected = document.querySelectorAll('.action-card.selected').length;
  const btn = document.getElementById('execute-btn');
  if (selected === 0) {
    btn.classList.remove('visible');
    btn.textContent = 'Execute 1 Action';
  } else {
    btn.classList.add('visible');
    btn.textContent = `Execute ${selected} Action${selected > 1 ? 's' : ''}`;
  }
}

// ── CANVAS DOWNLOAD / SELECTION + CONTEXT STRIP ──
(function() {
  const dlBtn   = document.getElementById('cvDlBtn');
  const dlLabel = document.getElementById('cvDlLabel');
  const hint    = document.getElementById('cvHint');
  const toast   = document.getElementById('cvToast');
  const cards   = [0,1,2,3].map(i => document.getElementById('cv'+i));

  // Inner image chips row (inside composer-box)
  const imgRow = document.getElementById('inner-imgs-row');

  // Card metadata for chips
  const cardData = {
    cv0: { name: 'Product Shot',     color: 'linear-gradient(135deg,#1a5c3a,#237a4e)' },
    cv1: { name: 'Model Full',       color: 'linear-gradient(135deg,#0d4a32,#176040)' },
    cv2: { name: 'Close-up',         color: 'linear-gradient(135deg,#0a3d2c,#136042)' },
    cv3: { name: 'Product Variant',  color: 'linear-gradient(135deg,#1c5e3e,#2a7a52)' }
  };

  // ── Download mode state ──
  let mode = 'idle';
  const dlSel = new Set();
  let toastT = null;

  // ── Context selection state (shows chips in input box) ──
  const ctxSel = new Set();

  // ── Context strip helpers ──
  function rebuildStrip() {
    imgRow.innerHTML = '';
    ctxSel.forEach(id => {
      const d = cardData[id];
      const chip = document.createElement('div');
      chip.className = 'context-img-chip';
      chip.dataset.id = id;
      chip.innerHTML =
        '<div class="context-img-swatch" style="background:' + d.color + '"></div>' +
        '<span class="context-img-label">' + d.name + '</span>' +
        '<span class="context-img-remove" data-remove="' + id + '">' +
          '<svg width="9" height="9" viewBox="0 0 9 9" fill="none"><path d="M1.5 1.5l6 6M7.5 1.5l-6 6" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>' +
        '</span>';
      imgRow.appendChild(chip);
    });
    if (ctxSel.size === 0) imgRow.classList.remove('has-imgs');
    else imgRow.classList.add('has-imgs');
  }

  // Delegate remove-chip clicks inside the strip
  imgRow.addEventListener('click', function(e) {
    const btn = e.target.closest('[data-remove]');
    if (!btn) return;
    const id = btn.dataset.remove;
    ctxSel.delete(id);
    const card = document.getElementById(id);
    if (card) card.classList.remove('cv-ctx-sel');
    rebuildStrip();
  });

  function toggleCtxCard(c) {
    const id = c.id;
    if (ctxSel.has(id)) {
      ctxSel.delete(id);
      c.classList.remove('cv-ctx-sel');
    } else {
      ctxSel.add(id);
      c.classList.add('cv-ctx-sel');
    }
    rebuildStrip();
  }

  // ── Download mode helpers ──
  function setIdle() {
    mode = 'idle';
    dlSel.clear();
    cards.forEach(c => c.classList.remove('cv-in-sel','cv-sel','cv-unsel'));
    dlBtn.className = 'cv-dl-btn';
    dlLabel.textContent = 'Download';
    hint.classList.remove('cv-on');
  }

  function setSelecting() {
    mode = 'selecting';
    dlSel.clear();
    cards.forEach(c => { c.classList.add('cv-in-sel','cv-unsel'); c.classList.remove('cv-sel'); });
    dlBtn.className = 'cv-dl-btn cv-cancel';
    dlLabel.textContent = 'Cancel';
    hint.classList.add('cv-on');
  }

  function updateDlBtn() {
    const n = dlSel.size;
    if (n === 0) {
      mode = 'selecting';
      dlBtn.className = 'cv-dl-btn cv-cancel';
      dlLabel.textContent = 'Cancel';
    } else {
      mode = 'has-sel';
      dlBtn.className = 'cv-dl-btn cv-has-sel';
      dlLabel.textContent = 'Download (' + n + ')';
    }
  }

  function toggleDlCard(c) {
    const id = c.id;
    if (dlSel.has(id)) {
      dlSel.delete(id);
      c.classList.remove('cv-sel');
      c.classList.add('cv-unsel');
    } else {
      dlSel.add(id);
      c.classList.add('cv-sel');
      c.classList.remove('cv-unsel');
    }
    updateDlBtn();
  }

  function showToast(msg) {
    if (toastT) clearTimeout(toastT);
    toast.textContent = msg;
    toast.classList.add('cv-on');
    toastT = setTimeout(() => toast.classList.remove('cv-on'), 2400);
  }

  // ── Download button ──
  dlBtn.addEventListener('click', () => {
    if (mode === 'idle') { setSelecting(); }
    else if (mode === 'selecting') { setIdle(); }
    else if (mode === 'has-sel') {
      const n = dlSel.size;
      showToast('Downloading ' + n + ' image' + (n > 1 ? 's' : '') + '…');
      setIdle();
    }
  });

  // ── Card click ──
  cards.forEach(c => c.addEventListener('click', () => {
    if (mode === 'selecting' || mode === 'has-sel') {
      // In download mode: toggle download selection only
      toggleDlCard(c);
    } else {
      // Normal mode: toggle context selection → shows chip in input box
      toggleCtxCard(c);
    }
  }));

  // ── Global clearSelection (called by strip's ✕ button) ──
  window.clearSelection = function() {
    ctxSel.clear();
    cards.forEach(c => c.classList.remove('cv-ctx-sel'));
    rebuildStrip();
  };
})();

// ── CONCEPT 4 — LIVE INPUT BINDING ──
const composer = document.getElementById('composer');
composer.addEventListener('input', function() {
  this.style.height = 'auto';
  this.style.height = Math.min(this.scrollHeight, 100) + 'px';
  const val = this.value.trim();
  const nameEl = document.getElementById('concept4-name');
  const summaryEl = document.getElementById('concept4-summary');
  if (nameEl && summaryEl) {
    if (val.length > 4) {
      nameEl.textContent = val.length > 32 ? val.slice(0, 32) + '…' : val;
      summaryEl.textContent = val;
      summaryEl.style.fontStyle = 'normal';
      summaryEl.style.color = 'var(--muted)';
    } else {
      nameEl.textContent = 'From your input';
      summaryEl.textContent = 'Type or paste your idea below to use it as Concept 4.';
      summaryEl.style.fontStyle = 'italic';
      summaryEl.style.color = 'var(--hint)';
    }
  }
});
function useInputConcept() {
  const val = composer.value.trim();
  if (!val) { composer.focus(); return; }
  const summaryEl = document.getElementById('concept4-summary');
  if (summaryEl) summaryEl.style.color = 'var(--green-text)';
}


// ── PLAN STEP UPDATER ──
const planStates = ['pending','pending','pending','pending','pending','pending'];
function setPlanStep(idx, state) {
  const el = document.getElementById('plan-' + idx);
  if (!el) return;
  el.className = 'plan-item ' + state;
  const iconEl = el.querySelector('.plan-step-icon');
  if (state === 'done') {
    iconEl.innerHTML = '<div class="plan-step-done"><svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M1.5 4l2 2 3-3" stroke="#2D6A4F" stroke-width="1.3" stroke-linecap="round"/></svg></div>';
  } else if (state === 'active') {
    iconEl.innerHTML = '<div class="plan-step-spin"></div>';
  } else {
    iconEl.innerHTML = '<div class="plan-step-circle"></div>';
  }
}


// Status dot
function setStatusDot(state) {
  const dot = document.getElementById('status-dot');
  dot.className = 'status-dot ' + state;
}

// Completion: update left panel
setTimeout(() => {
  clearInterval(labelInterval);
  clearInterval(etaInterval);
  setStatusDot('done');

  // Fade out preview strip
  const strip = document.getElementById('preview-strip');
  if (strip) {
    strip.style.transition = 'opacity 0.4s ease';
    strip.style.opacity = 0;
    setTimeout(() => strip.style.display = 'none', 400);
  }

  // Show workflow groups
  setTimeout(() => {
    const groups = document.getElementById('workflow-groups');
    if (groups) { groups.style.display = 'flex'; groups.style.animation = 'fadeIn 0.25s ease'; }
  }, 200);

  // Show AI response
  setTimeout(() => {
    const aiResp = document.getElementById('ai-response');
    if (aiResp) { aiResp.style.display = 'flex'; aiResp.style.animation = 'fadeIn 0.25s ease'; }
  }, 650);

  // Show what next
  setTimeout(() => {
    const wn = document.getElementById('what-next');
    if (wn) {
      wn.style.display = 'flex';
      wn.style.animation = 'fadeIn 0.25s ease';
      setTimeout(() => {
        document.getElementById('panel-feed').scrollTo({ top: 9999, behavior: 'smooth' });
      }, 100);
    }
  }, 900);

}, 7200);

// Elapsed timer (Previews pill) + ETA countdown
(function() {
  var elapsed = document.getElementById('ip-elapsed');
  var eta     = document.getElementById('ip-eta');
  if (!elapsed || !eta) return;
  var elSecs  = 0;
  var etaSecs = 80; // ~1m 20s
  function fmt(s) { return s < 60 ? s + 's' : Math.floor(s/60) + 'm ' + (s%60) + 's'; }
  setInterval(function() {
    elSecs++;
    elapsed.textContent = fmt(elSecs);
    if (etaSecs > 0) { etaSecs--; eta.textContent = fmt(etaSecs); }
  }, 1000);
})();
