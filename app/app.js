// Leonida Trophy Guide: an offline tracker for the 55 GTA VI trophies.
// Loads data/trophies.json and data/roadmap.json (same-origin files only),
// renders the checklist, the roadmap and the filters, and saves progress
// in the browser (localStorage) with export and import as a file.
const KEY = 'leonida-trophy-guide-earned-v1';
const SPOILER_KEY = 'leonida-trophy-guide-spoilers-v1';
const listEl = document.getElementById('trophy-list');
const emptyEl = document.getElementById('empty');
const kindFilter = document.getElementById('kind-filter');
const gradeFilter = document.getElementById('grade-filter');
const searchEl = document.getElementById('search');
const hideEarnedEl = document.getElementById('hide-earned');
const spoilerEl = document.getElementById('spoiler');

let trophies = [];
let roadmap = [];
let earned = new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]'));

function save() {
  localStorage.setItem(KEY, JSON.stringify([...earned]));
}

function gradeLabel(grade) {
  return grade.charAt(0).toUpperCase() + grade.slice(1);
}

function kindLabel(kind) {
  return kind.charAt(0).toUpperCase() + kind.slice(1);
}

function trophyMatches(t) {
  if (kindFilter.value === 'missable') {
    if (!t.missable) return false;
  } else if (kindFilter.value !== 'all' && t.kind !== kindFilter.value) {
    return false;
  }
  if (gradeFilter.value !== 'all' && t.grade !== gradeFilter.value) return false;
  if (hideEarnedEl.checked && earned.has(t.name)) return false;
  const q = searchEl.value.trim().toLowerCase();
  if (q && !(t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q))) return false;
  return true;
}

function renderRoadmap() {
  const ol = document.getElementById('roadmap-stages');
  ol.replaceChildren();
  for (const stage of roadmap) {
    const li = document.createElement('li');
    const h3 = document.createElement('h3');
    const num = document.createElement('span');
    num.className = 'stage-num';
    num.textContent = 'Stage ' + stage.stage;
    h3.append(num, document.createTextNode(stage.title));
    const p = document.createElement('p');
    p.textContent = stage.text;
    const count = document.createElement('p');
    count.className = 'stage-trophies';
    const done = stage.trophies.filter((id) => earned.has(trophies.find((t) => t.id === id)?.name)).length;
    count.textContent = done + ' of ' + stage.trophies.length + ' trophies in this stage earned';
    const src = document.createElement('p');
    src.className = 'stage-sources';
    src.append(document.createTextNode('Sources: '));
    stage.sources.forEach((s, i) => {
      if (i) src.append(document.createTextNode(' · '));
      const a = document.createElement('a');
      a.href = s.url;
      a.textContent = s.name;
      a.target = '_blank';
      a.rel = 'noopener';
      src.append(a);
    });
    li.append(h3, p, count, src);
    ol.append(li);
  }
}

function renderList() {
  listEl.replaceChildren();
  let shown = 0;
  for (const t of trophies) {
    if (!trophyMatches(t)) continue;
    shown += 1;
    const card = document.createElement('article');
    card.className = 'trophy' + (earned.has(t.name) ? ' earned' : '');
    card.dataset.trophyId = String(t.id);
    if (t.story && spoilerEl.checked && !earned.has(t.name)) card.classList.add('spoiler-hidden');

    const head = document.createElement('div');
    head.className = 'trophy-head';
    const box = document.createElement('input');
    box.type = 'checkbox';
    box.className = 'trophy-check';
    box.checked = earned.has(t.name);
    box.setAttribute('aria-label', 'Mark ' + t.name + ' as earned');
    box.addEventListener('change', () => {
      if (box.checked) earned.add(t.name);
      else earned.delete(t.name);
      save();
      renderAll();
    });
    const nameWrap = document.createElement('div');
    const name = document.createElement('div');
    name.className = 'trophy-name';
    name.textContent = t.name;
    const desc = document.createElement('div');
    desc.className = 'trophy-desc';
    desc.textContent = t.description;
    nameWrap.append(name, desc);
    head.append(box, nameWrap);

    const meta = document.createElement('div');
    meta.className = 'trophy-meta';
    const grade = document.createElement('span');
    grade.className = 'badge ' + t.grade;
    grade.textContent = gradeLabel(t.grade);
    const kind = document.createElement('span');
    kind.className = 'badge kind';
    kind.textContent = kindLabel(t.kind);
    meta.append(grade, kind);
    if (t.missable) {
      const m = document.createElement('span');
      m.className = 'badge missable';
      m.textContent = 'Missable';
      meta.append(m);
    }
    if (t.story) {
      const s = document.createElement('span');
      s.className = 'badge kind';
      s.textContent = 'Story';
      meta.append(s);
    }

    const guide = document.createElement('p');
    guide.className = 'trophy-guide';
    const guideLabel = document.createElement('strong');
    guideLabel.textContent = 'Guide: ';
    guide.append(guideLabel, document.createTextNode(t.guide));

    const sources = document.createElement('p');
    sources.className = 'trophy-sources';
    sources.append(document.createTextNode('Sources: '));
    t.sources.forEach((s) => {
      const a = document.createElement('a');
      a.href = s.url;
      a.textContent = s.name;
      a.target = '_blank';
      a.rel = 'noopener';
      sources.append(a);
    });

    card.append(head, meta, guide, sources);
    listEl.append(card);
  }
  document.getElementById('shown-count').textContent = '(' + shown + ' shown)';
  emptyEl.hidden = shown !== 0;
}

function renderProgress() {
  const total = trophies.length || 55;
  const count = earned.size;
  const pct = total ? Math.round((count / total) * 100) : 0;
  document.getElementById('earned-count').textContent = String(count);
  document.getElementById('total-count').textContent = String(total);
  document.getElementById('progress-fill').style.width = pct + '%';
  document.getElementById('progress-pct').textContent = pct + '% to the Platinum';
  document.getElementById('progress-note').textContent =
    count === total
      ? 'Every trophy earned — Vice Got a Price! is yours.'
      : count === 0
        ? 'Tick a trophy off and it stays ticked, even after you close the page.'
        : 'Next up: the roadmap stage with the most unearned trophies.';
}

function renderAll() {
  renderProgress();
  renderRoadmap();
  renderList();
}

document.getElementById('export').addEventListener('click', () => {
  const payload = { app: 'leonida-trophy-guide', version: 1, earned: [...earned].sort() };
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }));
  a.download = 'leonida-trophy-progress.json';
  a.click();
  URL.revokeObjectURL(a.href);
});

document.getElementById('import').addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;
  try {
    const data = JSON.parse(await file.text());
    const names = Array.isArray(data) ? data : data.earned;
    const known = new Set(trophies.map((t) => t.name));
    earned = new Set((names ?? []).filter((n) => known.has(n)));
    save();
    renderAll();
  } catch (err) {
    alert('That file is not a Leonida Trophy Guide progress file.');
  }
  e.target.value = '';
});

spoilerEl.addEventListener('change', () => {
  localStorage.setItem(SPOILER_KEY, spoilerEl.checked ? '1' : '0');
  renderList();
});
spoilerEl.checked = localStorage.getItem(SPOILER_KEY) === '1';
for (const el of [kindFilter, gradeFilter, searchEl, hideEarnedEl]) {
  el.addEventListener('input', renderList);
  el.addEventListener('change', renderList);
}

const [trophyDoc, roadmapDoc] = await Promise.all([
  (await fetch('data/trophies.json')).json(),
  (await fetch('data/roadmap.json')).json(),
]);
trophies = trophyDoc.trophies ?? trophyDoc;
roadmap = roadmapDoc.roadmap ?? roadmapDoc;
renderAll();
window.__ready = true;
