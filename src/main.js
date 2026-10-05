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
    emoji: '⏰',
    title: 'Race the fridge clock',
    body: 'Every item gets a use-by estimate. Cook the ones flashing first - like a kitchen mini-quest.',
  },
  {
    emoji: '📸',
    title: 'Snap, tweak, go',
    body: 'Scan a fridge photo or try the sample. Edit any date. Estimates are typical shelf life, yours to own.',
  },
  {
    emoji: '👩‍🍳',
    title: 'Cook mode = tiny game',
    body: 'Step through dishes with stars and cheers. Each recipe shows why it wins tonight.',
  },
];
let obIndex = 0;

function showOnboarding() {
  $('#onboard').hidden = false;
  $('#shell').hidden = true;
  renderOb();
}
function finishOnboarding() {
  localStorage.setItem(ONBOARD_KEY, '1');
  $('#onboard').hidden = true;
  $('#shell').hidden = false;
  render();
}
function renderOb() {
  const s = SLIDES[obIndex];
  $('#ob-progress').innerHTML = SLIDES.map((_, i) =>
    `<span class="${i <= obIndex ? 'on' : ''}"></span>`).join('');
  $('#ob-slides').innerHTML = `
    <div class="ob-emoji">${s.emoji}</div>
    <h2>${s.title}</h2>
    <p>${s.body}</p>`;
  $('#ob-next').textContent = obIndex === SLIDES.length - 1 ? 'Let’s cook!' : 'Next';
}

/* ---------- Views ---------- */
function setView(name) {
  $$('.tab').forEach((t) => t.classList.toggle('on', t.dataset.view === name));
  $$('.view').forEach((v) => {
    const on = v.id === `view-${name}`;
    v.classList.toggle('on', on);
    v.hidden = !on;
  });
  if (name === 'cook') renderRecipes();
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

function renderItems() {
  const grid = $('#item-grid');
  if (!fridge.length) {
    grid.innerHTML = `
      <div class="empty card">
        <div class="illus">🧊</div>
        <h3>Fridge is empty</h3>
        <p>Scan a photo or load the sample fridge. We’ll estimate use-bys and queue tonight’s dinner quest.</p>
        <button class="btn primary" type="button" id="empty-sample">Try sample fridge</button>
      </div>`;
    $('#empty-sample')?.addEventListener('click', () => runScan(null));
    return;
  }
  let list = [...fridge];
  if (sortMode === 'urgency') list.sort((a, b) => a.daysLeft - b.daysLeft);
  else list.sort((a, b) => a.name.localeCompare(b.name));

  grid.innerHTML = list.map((item) => `
    <article class="card item" data-id="${item.id}">
      <div class="item-top">
        <span class="item-emoji">${EMOJI[item.category] || '🫙'}</span>
        <span class="badge ${item.urgency}">${labelFor(item.daysLeft)}</span>
      </div>
      <h3>${escapeHtml(item.name)}</h3>
      <div class="meta">Use by ${item.expires}${item.note ? ` · ${escapeHtml(item.note)}` : ''}</div>
      <div class="item-actions">
        <button class="btn ghost sm" data-edit="${item.id}" type="button">Edit</button>
        <button class="btn ghost sm danger" data-del="${item.id}" type="button">Remove</button>
      </div>
    </article>
  `).join('');
}

function renderRecipes() {
  const maxTime = Number($('#max-time').value);
  const beginnerOnly = $('#beginner-only').checked;
  const ranked = rankRecipes(fridge, { maxTime, beginnerOnly });
  const lede = $('#cook-lede');
  const grid = $('#recipe-grid');

  if (!fridge.length) {
    lede.textContent = 'Add fridge items first - then we rank by what expires soonest.';
    grid.innerHTML = `
      <div class="empty card">
        <div class="illus">📝</div>
        <h3>Nothing to cook yet</h3>
        <p>Your recipe list lights up once the fridge has something in it.</p>
        <button class="btn primary" type="button" data-go-fridge>Go to Fridge</button>
      </div>`;
    grid.querySelector('[data-go-fridge]')?.addEventListener('click', () => setView('fridge'));
    return;
  }
  if (!ranked.length) {
    lede.textContent = 'No matches for these filters. Loosen time or turn off Beginner.';
    grid.innerHTML = `<div class="empty card"><div class="illus">🔍</div><h3>No recipe matches</h3><p>Try “Any” time or add more ingredients.</p></div>`;
    return;
  }
  const urgentN = fridge.filter((i) => i.urgency === 'urgent').length;
  lede.textContent = urgentN
    ? `${ranked.length} matches · prioritizing ${urgentN} item${urgentN > 1 ? 's' : ''} that need you soon.`
    : `${ranked.length} matches · sorted so earlier use-bys get cooked first.`;

  grid.innerHTML = ranked.map(({ recipe, score, used, missing, whyNow }) => {
    const hot = used.some((u) => u.urgency === 'urgent');
    return `
      <button type="button" class="recipe" data-recipe="${recipe.id}">
        <div class="recipe-banner ${hot ? 'hot' : ''}">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:1.6rem">${recipe.emoji}</span>
            <span class="score">Priority ${Math.round(score)}</span>
          </div>
          <div class="why-now">${escapeHtml(whyNow)}</div>
        </div>
        <div class="recipe-body">
          <div class="recipe-top">
            <h3>${recipe.title}</h3>
          </div>
          <div class="stats">${recipe.time} min · ${recipe.level} · ${used.length} from fridge</div>
          <div class="chips">
            ${used.slice(0, 4).map((u) => `<span class="chip use">${escapeHtml(u.name)}</span>`).join('')}
            ${missing.slice(0, 2).map((m) => `<span class="chip">need ${escapeHtml(m)}</span>`).join('')}
          </div>
        </div>
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
  if ($('#view-cook').classList.contains('on')) renderRecipes();
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
  note.textContent = 'Scanning… mock vision is reading your fridge.';
  $('#fridge-hero').classList.add('scanning');
  try {
    const detected = file ? await vision.detectFromImage(file) : await vision.detectSample();
    fridge = itemsFromDetections(detected);
    persist();
    note.textContent = `Found ${detected.length} items (${vision.mode} vision). Tap Edit on anything that’s off - you’re the source of truth.`;
    toast(`Fridge loaded · ${detected.length} items`);
    setView('fridge');
    if (file) showPhoto(file);
  } catch (err) {
    note.textContent = `Scan failed: ${err.message}`;
  } finally {
    $('#fridge-hero').classList.remove('scanning');
  }
}

function showPhoto(file) {
  const url = URL.createObjectURL(file);
  $('#photo-preview').innerHTML = `<div class="photo-frame"><img src="${url}" alt="Your fridge photo" /></div>`;
}

function openItemDialog(item) {
  editingId = item?.id || null;
  $('#dialog-title').textContent = item ? 'Edit item' : 'Add item';
  const form = $('#item-form');
  form.name.value = item?.name || '';
  form.category.value = item?.category || 'veg';
  form.expires.value = item?.expires || addDays(new Date(), 5);
  form.note.value = item?.note || '';
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
  setView('fridge');
}

/* Events */
$('#ob-skip').addEventListener('click', finishOnboarding);
$('#ob-next').addEventListener('click', () => {
  if (obIndex >= SLIDES.length - 1) finishOnboarding();
  else { obIndex += 1; renderOb(); }
});
$$('.tab').forEach((t) => t.addEventListener('click', () => setView(t.dataset.view)));
$('#demo-scan').addEventListener('click', () => runScan(null));
$('#fridge-photo').addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (file) runScan(file);
});
$('#add-item').addEventListener('click', () => openItemDialog(null));
$('#sort-toggle').addEventListener('click', () => {
  sortMode = sortMode === 'urgency' ? 'name' : 'urgency';
  $('#sort-toggle').textContent = `Sort: ${sortMode}`;
  renderItems();
});
$('#clear-fridge').addEventListener('click', () => {
  if (fridge.length && confirm('Clear all fridge items?')) {
    fridge = [];
    persist();
  }
});
$('#max-time').addEventListener('change', renderRecipes);
$('#beginner-only').addEventListener('change', renderRecipes);
$('#dialog-cancel').addEventListener('click', () => $('#item-dialog').close());
$('#item-form').addEventListener('submit', (e) => {
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
$('#item-grid').addEventListener('click', (e) => {
  const del = e.target.closest('[data-del]');
  const edit = e.target.closest('[data-edit]');
  if (del) {
    fridge = fridge.filter((i) => i.id !== del.dataset.del);
    persist();
  } else if (edit) {
    openItemDialog(fridge.find((i) => i.id === edit.dataset.edit));
  }
});
$('#recipe-grid').addEventListener('click', (e) => {
  const card = e.target.closest('[data-recipe]');
  if (card) openRecipe(card.dataset.recipe);
});

renderTips();
if (!localStorage.getItem(ONBOARD_KEY)) showOnboarding();
else {
  $('#onboard').hidden = true;
  $('#shell').hidden = false;
  render();
}
