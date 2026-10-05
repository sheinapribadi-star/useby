import '@fontsource/dm-sans/400.css';
import '@fontsource/dm-sans/600.css';
import '@fontsource/dm-sans/700.css';
import '@fontsource/fraunces/600.css';
import '@fontsource/fraunces/600-italic.css';
import './style.css';

import { createVisionProvider } from './vision.js';
import {
  estimateDays, addDays, daysLeft, urgency, labelFor, EMOJI, guessCategory,
} from './shelfLife.js';
import { rankRecipes } from './recipes.js';
import { loadFridge, saveFridge, uid } from './storage.js';
import { TIPS } from './tips.js';

const vision = createVisionProvider();
let fridge = loadFridge().map(enrich);
let editingId = null;

const $ = (s, el = document) => el.querySelector(s);
const $$ = (s, el = document) => [...el.querySelectorAll(s)];

function enrich(item) {
  const d = daysLeft(item.expires);
  return { ...item, daysLeft: d, urgency: urgency(d) };
}

function persist() {
  saveFridge(fridge.map(({ daysLeft, urgency, ...rest }) => rest));
  fridge = fridge.map(enrich);
  render();
}

function setView(name) {
  $$('.tab').forEach((t) => t.classList.toggle('on', t.dataset.view === name));
  $$('.view').forEach((v) => {
    const on = v.id === `view-${name}`;
    v.classList.toggle('on', on);
    v.hidden = !on;
  });
  if (name === 'cook') renderRecipes();
}

function renderUrgency() {
  const bar = $('#urgency-bar');
  if (!fridge.length) { bar.hidden = true; return; }
  bar.hidden = false;
  const c = { urgent: 0, soon: 0, ok: 0 };
  fridge.forEach((i) => { c[i.urgency] += 1; });
  $('#u-urgent').textContent = `${c.urgent} use soon`;
  $('#u-soon').textContent = `${c.soon} this week`;
  $('#u-ok').textContent = `${c.ok} doing fine`;
  bar.querySelector('.urgent').style.display = c.urgent ? '' : 'none';
  bar.querySelector('.soon').style.display = c.soon ? '' : 'none';
  bar.querySelector('.ok').style.display = c.ok ? '' : 'none';
}

function renderItems() {
  const grid = $('#item-grid');
  if (!fridge.length) {
    grid.innerHTML = `<div class="empty card"><h3>Fridge is empty</h3><p>Scan a photo or load the sample fridge to get started.</p></div>`;
    return;
  }
  const sorted = [...fridge].sort((a, b) => a.daysLeft - b.daysLeft);
  grid.innerHTML = sorted.map((item) => `
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
  const ranked = rankRecipes(fridge, maxTime);
  const lede = $('#cook-lede');
  const grid = $('#recipe-grid');
  if (!fridge.length) {
    lede.textContent = 'Add fridge items first — then we’ll rank recipes by what expires soonest.';
    grid.innerHTML = `<div class="empty card"><h3>Nothing to cook yet</h3><p>Scan your fridge on the Fridge tab.</p></div>`;
    return;
  }
  if (!ranked.length) {
    lede.textContent = 'No recipe matches for this time filter. Try “Any” or add more items.';
    grid.innerHTML = '';
    return;
  }
  lede.textContent = `Ranked so soon-to-expire ingredients get used first. ${ranked.length} matches.`;
  grid.innerHTML = ranked.map(({ recipe, score, used, missing }) => {
    const hot = used.some((u) => u.urgency === 'urgent');
    return `
      <article class="card recipe" data-recipe="${recipe.id}">
        <div class="recipe-banner ${hot ? 'hot' : ''}">
          <div style="font-size:1.8rem">${recipe.emoji}</div>
          <span class="score">Priority ${Math.round(score)}</span>
        </div>
        <div class="recipe-body">
          <h3>${recipe.title}</h3>
          <div class="stats">${recipe.time} min · ${recipe.level}</div>
          <p class="meta" style="margin:0;color:var(--muted);font-size:0.9rem">${recipe.why}</p>
          <div class="chips">
            ${used.map((u) => `<span class="chip use">${escapeHtml(u.name)}</span>`).join('')}
            ${missing.slice(0, 2).map((m) => `<span class="chip">need ${escapeHtml(m)}</span>`).join('')}
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function renderTips() {
  $('#tips-grid').innerHTML = TIPS.map((t) => `
    <article class="card tip"><h3>${t.title}</h3><p>${t.body}</p></article>
  `).join('');
}

function render() {
  renderUrgency();
  renderItems();
  if ($('#view-cook').classList.contains('on')) renderRecipes();
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
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
  note.textContent = 'Scanning… mock vision is looking at your fridge.';
  try {
    const detected = file
      ? await vision.detectFromImage(file)
      : await vision.detectSample();
    fridge = itemsFromDetections(detected);
    persist();
    note.textContent = `Found ${detected.length} items via ${vision.mode} vision. Edit any use-by date — estimates are typical shelf life, not gospel.`;
    setView('fridge');
    if (file) showPhoto(file);
  } catch (err) {
    note.textContent = `Scan failed: ${err.message}`;
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
  const ranked = rankRecipes(fridge, 999);
  const hit = ranked.find((r) => r.recipe.id === id);
  if (!hit) return;
  const { recipe, used, missing } = hit;
  $('#recipe-detail').innerHTML = `
    <div class="detail-hero">
      <div>
        <div class="eyebrow">${recipe.emoji} ${recipe.level} · ${recipe.time} min</div>
        <h3>${recipe.title}</h3>
      </div>
      <button class="btn ghost sm" type="button" id="close-recipe">Close</button>
    </div>
    <p style="color:var(--muted);margin:0">${recipe.why}</p>
    <div>
      <div class="eyebrow">Uses from your fridge</div>
      <div class="chips" style="margin-top:8px">
        ${used.map((u) => `<span class="chip use">${escapeHtml(u.name)} · ${labelFor(u.daysLeft)}</span>`).join('') || '<span class="chip">—</span>'}
      </div>
    </div>
    ${missing.length ? `<p class="missing">You might still need: ${missing.map(escapeHtml).join(', ')}</p>` : ''}
    <div>
      <div class="eyebrow">Steps</div>
      <ol class="detail-list">${recipe.steps.map((s) => `<li>${s}</li>`).join('')}</ol>
    </div>
    <p style="margin:0;color:var(--muted)"><strong>Tip:</strong> ${recipe.tip}</p>
  `;
  $('#recipe-dialog').showModal();
  $('#close-recipe').onclick = () => $('#recipe-dialog').close();
}

// Events
$$('.tab').forEach((t) => t.addEventListener('click', () => setView(t.dataset.view)));
$('#demo-scan').addEventListener('click', () => runScan(null));
$('#fridge-photo').addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (file) runScan(file);
});
$('#add-item').addEventListener('click', () => openItemDialog(null));
$('#clear-fridge').addEventListener('click', () => {
  if (fridge.length && confirm('Clear all fridge items?')) {
    fridge = [];
    persist();
  }
});
$('#max-time').addEventListener('change', renderRecipes);
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
render();
// Auto-load sample if empty so the demo isn't blank on first visit
if (!fridge.length) {
  // leave empty — user clicks sample; cleaner first impression with CTA
}
