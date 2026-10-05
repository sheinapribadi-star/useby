import '@fontsource/nunito/600.css';
import '@fontsource/nunito/700.css';
import '@fontsource/nunito/800.css';
import '@fontsource/fredoka/500.css';
import '@fontsource/fredoka/600.css';
import '@fontsource/fredoka/700.css';
import './style.css';

import { createVisionProvider } from './vision.js';
import {
  estimateDays, addDays, daysLeft, urgency, labelFor, EMOJI, guessCategory,
} from './shelfLife.js';
import { rankRecipes } from './recipes.js';
import { loadFridge, saveFridge, uid } from './storage.js';
import { TIPS } from './tips.js';

const vision = createVisionProvider();
const ONBOARD_KEY = 'useby.onboarded.v1';
const STATS_KEY = 'useby.stats.v1';

let fridge = loadFridge().map(enrich);
let editingId = null;
let sortMode = 'urgency';
let cookCtx = null;

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

function enrich(item) {
  const d = daysLeft(item.expires);
  return { ...item, daysLeft: d, urgency: urgency(d) };
}

function loadStats() {
  try { return JSON.parse(localStorage.getItem(STATS_KEY) || '{"cooked":0,"rescued":0}'); }
  catch { return { cooked: 0, rescued: 0 }; }
}
function saveStats(s) { localStorage.setItem(STATS_KEY, JSON.stringify(s)); }
let stats = loadStats();

function toast(msg) {
  const el = $('#toast');
  el.textContent = msg;
  el.hidden = false;
  clearTimeout(toast._t);
  toast._t = setTimeout(() => { el.hidden = true; }, 2800);
}

function persist() {
  saveFridge(fridge.map(({ daysLeft, urgency, ...rest }) => rest));
  fridge = fridge.map(enrich);
  render();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

/* ---------- Onboarding ---------- */
const SLIDES = [
  {
    emoji: '🧊',
    title: 'Open the fridge',
    body: 'Top shelf is racing the clock. Bottom shelf can wait. Tap ingredients to edit.',
  },
  {
    emoji: '📖',
    title: 'Flip the recipe book',
    body: 'Dishes get stars from urgency. Cook what expires first - cozy kitchen quest vibes.',
  },
  {
    emoji: '👩‍🍳',
    title: 'Cook mode is a mini-game',
    body: 'Prep → Cook → Plate with cheers and stars. Waste less. Play more.',
  },
];
let obIndex = 0;

function showOnboarding() {
  const ob = $('#onboard');
  if (ob) ob.hidden = false;
  // Keep shell mounted underneath so entry never blanks
  const shell = $('#shell');
  if (shell) shell.hidden = false;
  renderOb();
}
function finishOnboarding() {
  localStorage.setItem(ONBOARD_KEY, '1');
  const ob = $('#onboard');
  if (ob) ob.hidden = true;
  const shell = $('#shell');
  if (shell) shell.hidden = false;
  render();
  setView('kitchen');
}
function renderOb() {
  const s = SLIDES[obIndex];
  $('#ob-progress').innerHTML = SLIDES.map((_, i) =>
    `<span class="${i <= obIndex ? 'on' : ''}"></span>`).join('');
  $('#ob-slides').innerHTML = `
    <div class="ob-emoji">${s.emoji}</div>
    <h2>${s.title}</h2>
    <p>${s.body}</p>`;
  $('#ob-next').textContent = obIndex === SLIDES.length - 1 ? 'Let’s cook!' : 'Continue';
}

/* ---------- Views ---------- */
function setView(name) {
  $$('.tab').forEach((t) => t.classList.toggle('on', t.dataset.view === name));
  $$('.view').forEach((v) => {
    const on = v.id === `view-${name}`;
    v.classList.toggle('on', on);
    v.hidden = !on;
  });
  if (name === 'book') renderRecipes();
}

function renderStats() {
  const urgent = fridge.filter((i) => i.urgency === 'urgent').length;
  const tag = $('#streak-tag');
  const top = $('#top-stats');
  if (stats.cooked > 0) {
    tag.textContent = `${stats.cooked} meal${stats.cooked === 1 ? '' : 's'} cooked · ${stats.rescued} items rescued`;
    top.hidden = false;
    top.textContent = urgent ? `${urgent} need you` : 'fridge calm';
  } else {
    tag.textContent = 'cook what expires first';
    top.hidden = !urgent;
    if (urgent) top.textContent = `${urgent} use soon`;
  }
  const badge = $('#cook-badge');
  if (urgent) { badge.hidden = false; badge.textContent = String(urgent); }
  else badge.hidden = true;
}

function renderUrgency() {
  const bar = $('#urgency-bar');
  if (!fridge.length) { bar.hidden = true; return; }
  const c = { urgent: 0, soon: 0, ok: 0 };
  fridge.forEach((i) => { c[i.urgency] += 1; });
  bar.hidden = false;
  bar.innerHTML = [
    c.urgent ? `<div class="u-chip urgent">${c.urgent} use soon</div>` : '',
    c.soon ? `<div class="u-chip soon">${c.soon} this week</div>` : '',
    c.ok ? `<div class="u-chip ok">${c.ok} doing fine</div>` : '',
  ].join('');
}

function itemCard(item) {
  return `
    <button type="button" class="shelf-item" data-edit="${item.id}">
      <span class="shelf-item__emoji">${EMOJI[item.category] || '🫙'}</span>
      <span class="badge ${item.urgency}">${labelFor(item.daysLeft)}</span>
      <h3 class="shelf-item__name">${escapeHtml(item.name)}</h3>
    </button>`;
}

function updateIngProgress() {
  const bar = $('#ing-progress i') || $('#ing-progress')?.querySelector('i');
  const wrap = $('#ing-progress');
  if (!wrap) return;
  const n = fridge.length;
  const urgent = fridge.filter((i) => i.urgency === 'urgent').length;
  const pct = n ? Math.min(100, 28 + urgent * 18 + Math.min(n, 8) * 6) : 18;
  wrap.style.setProperty('--p', `${pct}%`);
  if (bar) bar.style.width = `${pct}%`;
}

function renderItems() {
  const hot = [];
  const soon = [];
  const ok = [];
  fridge.forEach((item) => {
    if (item.urgency === 'urgent') hot.push(item);
    else if (item.urgency === 'soon') soon.push(item);
    else ok.push(item);
  });
  hot.sort((a, b) => a.daysLeft - b.daysLeft);
  soon.sort((a, b) => a.daysLeft - b.daysLeft);
  ok.sort((a, b) => a.daysLeft - b.daysLeft);

  const fill = (id, list, emptyMsg) => {
    const el = $(id);
    if (!el) return;
    if (!list.length) {
      el.innerHTML = `<div class="shelf-empty">${emptyMsg}</div>`;
      return;
    }
    el.innerHTML = list.map(itemCard).join('');
  };

  if (!fridge.length) {
    fill('#shelf-hot', [], 'Empty - scan or add items');
    fill('#shelf-soon', [], '—');
    fill('#shelf-ok', [], '—');
    const hint = $('#fridge-hint');
    if (hint) hint.textContent = 'Fridge is empty. Back in the kitchen, scan a photo or try the sample.';
    updateIngProgress();
    return;
  }

  fill('#shelf-hot', hot, 'Nothing urgent - nice!');
  fill('#shelf-soon', soon, 'Quiet this week');
  fill('#shelf-ok', ok, 'No long-keepers yet');
  const hint = $('#fridge-hint');
  if (hint) {
    hint.textContent = `${hot.length} on top · ${soon.length} middle · ${ok.length} bottom. Tap an item to edit.`;
  }
  updateIngProgress();
}

function renderRecipes() {
  const maxTime = Number($('#max-time').value);
  const beginnerOnly = $('#beginner-only').checked;
  const ranked = rankRecipes(fridge, { maxTime, beginnerOnly });
  const lede = $('#cook-lede');
  const grid = $('#recipe-grid');
  const toc = $('#book-toc');

  if (!fridge.length) {
    lede.textContent = 'Stock the fridge first - then the book fills with urgency-ranked dishes.';
    grid.innerHTML = `
      <div class="empty card">
        <div class="illus">📖</div>
        <h3>Blank pages</h3>
        <p>Open the fridge and add ingredients to light up the book.</p>
        <button class="btn primary" type="button" data-go-fridge>Enter fridge</button>
      </div>`;
    if (toc) toc.innerHTML = '<li>Waiting for ingredients…</li>';
    grid.querySelector('[data-go-fridge]')?.addEventListener('click', () => setView('fridge'));
    return;
  }
  if (!ranked.length) {
    lede.textContent = 'No matches for these filters. Loosen time or turn off Beginner.';
    grid.innerHTML = `<div class="empty card"><div class="illus">🔍</div><h3>No recipe matches</h3><p>Try “Any” time or add more ingredients.</p></div>`;
    if (toc) toc.innerHTML = '<li>No matches</li>';
    return;
  }
  const urgentN = fridge.filter((i) => i.urgency === 'urgent').length;
  lede.textContent = urgentN
    ? `${ranked.length} recipes · prioritizing ${urgentN} item${urgentN > 1 ? 's' : ''} on the top shelf.`
    : `${ranked.length} recipes · sorted so earlier use-bys get cooked first.`;

  if (toc) {
    toc.innerHTML = ranked.slice(0, 8).map(({ recipe }, i) =>
      `<li>${i + 1}. ${escapeHtml(recipe.title)}</li>`).join('');
  }

  grid.innerHTML = ranked.map(({ recipe, score, used, missing, whyNow }) => {
    const hot = used.some((u) => u.urgency === 'urgent');
    const starN = hot ? 3 : score >= 40 ? 2 : 1;
    const heartN = Math.min(3, used.length || 1);
    const stars = '★'.repeat(starN) + '☆'.repeat(3 - starN);
    const hearts = '♥'.repeat(heartN) + '♡'.repeat(3 - heartN);
    return `
      <button type="button" class="dish ${hot ? 'hot' : ''}" data-recipe="${recipe.id}">
        <div class="dish__stars">${stars}</div>
        <div class="dish__emoji">${recipe.emoji}</div>
        <h3 class="dish__title">${escapeHtml(recipe.title)}</h3>
        <div class="dish__meta">${recipe.time} min · ${recipe.level}</div>
        <div class="dish__hearts">${hearts}</div>
        <div class="dish__why">${escapeHtml(whyNow)}</div>
      </button>`;
  }).join('');
}

function renderTips() {
  $('#tips-grid').innerHTML = TIPS.map((t) => `
    <article class="card tip"><h3>${t.title}</h3><p>${t.body}</p></article>
  `).join('');
}

function render() {
  renderStats();
  renderUrgency();
  renderItems();
  if ($('#view-book')?.classList.contains('on')) renderRecipes();
}

function itemsFromDetections(detected) {
  const today = new Date();
  return detected.map((d) => {
    const category = d.category || guessCategory(d.name);
    const days = estimateDays(d.name, category);
    return enrich({
      id: uid(),
      name: d.name,
      category,
      note: d.note || '',
      expires: addDays(today, days),
      confidence: d.confidence,
      source: 'vision',
    });
  });
}

async function runScan(file) {
  const note = $('#vision-note');
  if (note) note.textContent = 'Scanning… mock vision is reading your fridge.';
  $('#kitchen-room')?.classList.add('scanning');
  try {
    const detected = file ? await vision.detectFromImage(file) : await vision.detectSample();
    fridge = itemsFromDetections(detected);
    persist();
    if (note) note.textContent = `Found ${detected.length} items (${vision.mode} vision). Tap Edit on anything that’s off - you’re the source of truth.`;
    toast(`Fridge loaded · ${detected.length} items`);
    setView('fridge');
  } catch (err) {
    if (note) note.textContent = `Scan failed: ${err.message}`;
  } finally {
    $('#kitchen-room')?.classList.remove('scanning');
  }
}


function openItemDialog(item) {
  editingId = item?.id || null;
  $('#dialog-title').textContent = item ? 'Edit item' : 'Add item';
  const form = $('#item-form');
  form.name.value = item?.name || '';
  form.category.value = item?.category || 'veg';
  form.expires.value = item?.expires || addDays(new Date(), 5);
  form.note.value = item?.note || '';
  const rm = $('#dialog-remove');
  if (rm) {
    rm.hidden = !item;
    rm.onclick = () => {
      if (!editingId) return;
      fridge = fridge.filter((i) => i.id !== editingId);
      $('#item-dialog').close();
      persist();
      toast('Removed from fridge');
    };
  }
  $('#item-dialog').showModal();
}

function openRecipe(id) {
  const ranked = rankRecipes(fridge, {
    maxTime: Number($('#max-time').value),
    beginnerOnly: $('#beginner-only').checked,
  });
  const hit = ranked.find((r) => r.recipe.id === id);
  if (!hit) return;
  const { recipe, used, missing, whyNow } = hit;
  cookCtx = { recipe, used };
  $('#recipe-detail').innerHTML = `
    <div class="detail-hero">
      <div>
        <div class="eyebrow">${recipe.emoji} ${recipe.level} · ${recipe.time} min</div>
        <h3>${recipe.title}</h3>
      </div>
      <button class="btn ghost sm" type="button" id="close-recipe">Close</button>
    </div>
    <div class="why-box">${escapeHtml(whyNow)}</div>
    <p style="color:var(--muted);margin:0">${recipe.why}</p>
    <div>
      <div class="eyebrow">From your fridge</div>
      <div class="chips" style="margin-top:8px">
        ${used.map((u) => `<span class="chip use">${escapeHtml(u.name)} · ${labelFor(u.daysLeft)}</span>`).join('') || '<span class="chip"> - </span>'}
      </div>
    </div>
    ${missing.length ? `<p class="missing">Still handy to have: ${missing.map(escapeHtml).join(', ')}</p>` : ''}
    <div>
      <div class="eyebrow">Steps</div>
      <ol class="detail-list">${recipe.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
    </div>
    <p style="margin:0;color:var(--muted)"><strong>Tip:</strong> ${recipe.tip}</p>
    <div class="dialog-actions">
      <button class="btn primary" type="button" id="start-cook">Enter cook mode 🍳</button>
      <button class="btn ghost" type="button" id="mark-cooked">I cooked this</button>
    </div>
  `;
  $('#recipe-dialog').showModal();
  $('#close-recipe').onclick = () => $('#recipe-dialog').close();
  $('#start-cook').onclick = () => { $('#recipe-dialog').close(); openCookMode(); };
  $('#mark-cooked').onclick = () => markCooked();
}

const COOK_VERBS = ['Chop!', 'Stir!', 'Flip!', 'Taste!', 'Plate!', 'Next!'];
const COOK_PRAISE = ['Nice!', 'Perfect!', 'Yum!', 'Great timing!', 'Chef move!', 'So good!'];

function cookStageFor(step, total) {
  const t = (step + 1) / total;
  if (t <= 0.34) return 0; // Prep
  if (t <= 0.75) return 1; // Cook
  return 2; // Plate
}

function openCookMode() {
  if (!cookCtx) return;
  let step = 0;
  let finished = false;
  const { recipe } = cookCtx;
  const sheet = $('#cook-sheet');
  const stages = ['Prep', 'Cook', 'Plate'];
  const draw = () => {
    if (finished) {
      sheet.innerHTML = `
        <div class="cook-done">
          <div class="big">🌟</div>
          <h3>Dish cleared!</h3>
          <p class="fine" style="margin:0 0 14px">You cooked ${escapeHtml(recipe.title)}. Fridge quest complete.</p>
          <button class="btn primary block" type="button" id="cook-finish">Collect stars</button>
          <button class="btn ghost sm" type="button" id="cook-close" style="margin-top:8px;width:100%">Exit</button>
        </div>`;
      $('#cook-finish').onclick = () => { $('#cook-dialog').close(); markCooked(); };
      $('#cook-close').onclick = () => $('#cook-dialog').close();
      return;
    }
    const total = recipe.steps.length;
    const last = step >= total - 1;
    const stageIdx = cookStageFor(step, total);
    const stars = '★'.repeat(Math.min(3, step + 1)) + '☆'.repeat(Math.max(0, 3 - (step + 1)));
    const verb = last ? 'Done!' : COOK_VERBS[step % COOK_VERBS.length];
    const praise = step === 0 ? '' : `<div class="cook-praise">${COOK_PRAISE[(step - 1) % COOK_PRAISE.length]}</div>`;
    sheet.innerHTML = `
      <div class="cook-hud">
        <div class="cook-stage">
          ${stages.map((s, i) => {
            const cls = i < stageIdx ? 'done' : i === stageIdx ? 'on' : '';
            return `<span class="${cls}">${s}</span>`;
          }).join('')}
        </div>
        <div class="cook-stars" aria-label="${step + 1} of 3 star progress">${stars}</div>
      </div>
      <div class="cook-step">
        <div class="n">Step ${step + 1} / ${total} · ${escapeHtml(recipe.title)}</div>
        <p>${escapeHtml(recipe.steps[step])}</p>
        ${praise}
        <div class="fine">${escapeHtml(recipe.tip)}</div>
      </div>
      <div class="cook-nav">
        <button class="btn ghost" type="button" id="cook-back" ${step === 0 ? 'disabled' : ''}>Back</button>
        <button class="btn primary" type="button" id="cook-next">${verb}</button>
      </div>
      <button class="btn ghost sm" type="button" id="cook-close">Exit kitchen</button>`;
    $('#cook-back').onclick = () => { step -= 1; draw(); };
    $('#cook-next').onclick = () => {
      if (last) { finished = true; draw(); }
      else { step += 1; draw(); }
    };
    $('#cook-close').onclick = () => $('#cook-dialog').close();
  };
  draw();
  $('#cook-dialog').showModal();
}

function markCooked() {
  if (!cookCtx) return;
  const rescued = cookCtx.used.filter((u) => u.urgency === 'urgent' || u.daysLeft <= 3);
  // Remove consumed urgent-ish items (simple MVP consumption)
  const removeIds = new Set(rescued.map((u) => u.id));
  fridge = fridge.filter((i) => !removeIds.has(i.id));
  stats.cooked += 1;
  stats.rescued += rescued.length;
  saveStats(stats);
  $('#recipe-dialog').close();
  persist();
  toast(rescued.length
    ? `Stars earned - rescued ${rescued.length} item${rescued.length > 1 ? 's' : ''}`
    : 'Logged! Kitchen streak continues.');
  cookCtx = null;
  setView('kitchen');
}

/* Events */
$('#ob-skip')?.addEventListener('click', finishOnboarding);
$('#ob-next')?.addEventListener('click', () => {
  if (obIndex >= SLIDES.length - 1) finishOnboarding();
  else { obIndex += 1; renderOb(); }
});
$$('.tab').forEach((t) => t.addEventListener('click', () => setView(t.dataset.view)));
$('#demo-scan')?.addEventListener('click', () => runScan(null));
$('#fridge-photo')?.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (file) runScan(file);
});
$('#enter-fridge')?.addEventListener('click', () => setView('fridge'));
$('#open-book')?.addEventListener('click', () => setView('book'));
$('#leave-fridge')?.addEventListener('click', () => setView('kitchen'));
$('#add-item')?.addEventListener('click', () => openItemDialog(null));
$('#clear-fridge')?.addEventListener('click', () => {
  if (fridge.length && confirm('Clear all fridge items?')) {
    fridge = [];
    persist();
  }
});
$('#max-time')?.addEventListener('change', renderRecipes);
$('#beginner-only')?.addEventListener('change', renderRecipes);
$('#dialog-cancel')?.addEventListener('click', () => $('#item-dialog')?.close());
$('#item-form')?.addEventListener('submit', (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = {
    name: String(fd.get('name')).trim(),
    category: String(fd.get('category')),
    expires: String(fd.get('expires')),
    note: String(fd.get('note') || '').trim(),
  };
  if (editingId) {
    fridge = fridge.map((it) => (it.id === editingId ? enrich({ ...it, ...data }) : it));
  } else {
    fridge.push(enrich({ id: uid(), ...data, source: 'manual' }));
  }
  $('#item-dialog').close();
  persist();
  toast('Saved to fridge');
});
$('#shelves')?.addEventListener('click', (e) => {
  const edit = e.target.closest('[data-edit]');
  if (edit) openItemDialog(fridge.find((i) => i.id === edit.dataset.edit));
});
$('#recipe-grid')?.addEventListener('click', (e) => {
  const card = e.target.closest('[data-recipe]');
  if (card) openRecipe(card.dataset.recipe);
});

renderTips();
const shell = $('#shell');
if (shell) shell.hidden = false;
try {
  render(); // kitchen always ready under the quest card
  if (!localStorage.getItem(ONBOARD_KEY)) showOnboarding();
  else {
    const ob = $('#onboard');
    if (ob) ob.hidden = true;
  }
} catch (err) {
  console.error('UseBy boot', err);
  const ob = $('#onboard');
  if (ob) ob.hidden = true;
  try { render(); } catch (_) {}
}
