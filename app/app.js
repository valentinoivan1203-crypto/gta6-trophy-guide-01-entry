"use strict";

// Leonida Trophy Guide: an offline checklist and guide for the 55
// PlayStation 5 trophies of Grand Theft Auto VI. Loads the trophy list and
// the roadmap from the data files beside this script, renders the tracker,
// and keeps progress in the browser's local storage.

const TROPHY_DATA_URL = "data/trophies.json";
const ROADMAP_DATA_URL = "data/roadmap.json";
const STORAGE_KEY = "leonida-trophy-guide-v2";
const COMPLETE_STORAGE_KEY = "leonida-trophy-guide-v2-complete";
const SETTINGS_KEY = "leonida-trophy-guide-v2-settings";

const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
const GRADE_LABELS = { platinum: "Platinum", gold: "Gold", silver: "Silver", bronze: "Bronze" };
const KIND_LABELS = {
  story: "Story",
  missable: "Missable",
  collectible: "Collectible",
  activity: "Activity",
  crime: "Crime",
  exploration: "Exploration",
  money: "Money",
  platinum: "Platinum",
};

let trophyList = [];
let roadmap = null;
let earnedIds = new Set();
let completeDone = new Set();
let selectedId = null;
let filters = { query: "", kind: "all", grade: "all", sort: "default", hideEarned: false, spoiler: true };

function loadSavedState() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
    if (Array.isArray(saved)) earnedIds = new Set(saved.filter((id) => typeof id === "string"));
  } catch (err) {
    earnedIds = new Set();
  }
  try {
    const savedComplete = JSON.parse(localStorage.getItem(COMPLETE_STORAGE_KEY) || "[]");
    if (Array.isArray(savedComplete)) completeDone = new Set(savedComplete.filter((id) => typeof id === "string"));
  } catch (err) {
    completeDone = new Set();
  }
  try {
    const settings = JSON.parse(localStorage.getItem(SETTINGS_KEY) || "{}");
    if (typeof settings.spoiler === "boolean") filters.spoiler = settings.spoiler;
    if (typeof settings.hideEarned === "boolean") filters.hideEarned = settings.hideEarned;
  } catch (err) {
    // Keep the defaults when saved settings cannot be read.
  }
}

function saveProgress() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(earnedIds)));
  localStorage.setItem(COMPLETE_STORAGE_KEY, JSON.stringify(Array.from(completeDone)));
  localStorage.setItem(SETTINGS_KEY, JSON.stringify({ spoiler: filters.spoiler, hideEarned: filters.hideEarned }));
}

function trophyById(id) {
  return trophyList.find((t) => t.id === id) || null;
}

function computeProgress() {
  const earned = trophyList.filter((t) => earnedIds.has(t.id));
  const byGrade = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of earned) byGrade[t.grade] += 1;
  return { earned: earned.length, total: trophyList.length, byGrade };
}

function stageProgress(stage) {
  const ids = stage.trophyIds || [];
  const earned = ids.filter((id) => earnedIds.has(id)).length;
  return { earned, total: ids.length };
}

function renderProgress() {
  const progress = computeProgress();
  const text = document.getElementById("progressText");
  const fill = document.getElementById("progressFill");
  const counts = document.getElementById("gradeCounts");
  if (!text || !fill || !counts) return;
  text.textContent = progress.earned + " / " + progress.total + " earned";
  const pct = progress.total === 0 ? 0 : Math.round((100 * progress.earned) / progress.total);
  fill.style.width = pct + "%";
  const totals = { platinum: 0, gold: 0, silver: 0, bronze: 0 };
  for (const t of trophyList) totals[t.grade] += 1;
  counts.textContent =
    "Platinum " + progress.byGrade.platinum + "/" + totals.platinum +
    " · Gold " + progress.byGrade.gold + "/" + totals.gold +
    " · Silver " + progress.byGrade.silver + "/" + totals.silver +
    " · Bronze " + progress.byGrade.bronze + "/" + totals.bronze +
    " · " + pct + "% to the platinum";
}

function spoilerHides(trophy) {
  return filters.spoiler && trophy.kind === "story" && !earnedIds.has(trophy.id);
}

function visibleTrophies() {
  const query = filters.query.trim().toLowerCase();
  let list = trophyList.filter((t) => {
    if (filters.kind !== "all" && t.kind !== filters.kind) return false;
    if (filters.grade !== "all" && t.grade !== filters.grade) return false;
    if (filters.hideEarned && earnedIds.has(t.id)) return false;
    if (query) {
      const hay = (t.name + " " + t.description + " " + (KIND_LABELS[t.kind] || "")).toLowerCase();
      if (!hay.includes(query)) return false;
    }
    return true;
  });
  if (filters.sort === "name") {
    list = list.slice().sort((a, b) => (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  } else if (filters.sort === "grade") {
    list = list.slice().sort((a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  } else if (filters.sort === "difficulty") {
    list = list.slice().sort((a, b) => a.difficulty - b.difficulty || (a.name < b.name ? -1 : a.name > b.name ? 1 : 0));
  }
  return list;
}

function difficultyStars(level) {
  return "★".repeat(level) + "☆".repeat(5 - level);
}

function trophyRow(trophy) {
  const row = document.createElement("div");
  row.className = "trophy" + (earnedIds.has(trophy.id) ? " earned" : "") + (selectedId === trophy.id ? " selected" : "");
  row.dataset.trophyId = trophy.id;

  const check = document.createElement("input");
  check.type = "checkbox";
  check.checked = earnedIds.has(trophy.id);
  check.setAttribute("aria-label", "Mark " + trophy.name + " earned");
  check.addEventListener("click", (event) => {
    event.stopPropagation();
    toggleEarned(trophy.id, check.checked);
  });
  row.appendChild(check);

  const medal = document.createElement("span");
  medal.className = "medal " + trophy.grade;
  medal.title = GRADE_LABELS[trophy.grade];
  row.appendChild(medal);

  const body = document.createElement("div");
  const name = document.createElement("div");
  name.className = "trophy-name";
  if (spoilerHides(trophy)) {
    name.textContent = "Hidden story trophy";
    const hiddenTag = document.createElement("span");
    hiddenTag.className = "hidden-tag";
    hiddenTag.textContent = " — earn it to reveal";
    name.appendChild(hiddenTag);
  } else {
    name.textContent = trophy.name;
  }
  body.appendChild(name);

  const desc = document.createElement("div");
  desc.className = "trophy-desc";
  desc.textContent = spoilerHides(trophy) ? "A story trophy. Its name and description stay hidden until you earn it." : trophy.description;
  body.appendChild(desc);

  const tags = document.createElement("div");
  tags.className = "trophy-tags";
  const gradeTag = document.createElement("span");
  gradeTag.className = "tag grade-" + trophy.grade;
  gradeTag.textContent = GRADE_LABELS[trophy.grade];
  tags.appendChild(gradeTag);
  const kindTag = document.createElement("span");
  kindTag.className = "tag";
  kindTag.textContent = KIND_LABELS[trophy.kind] || trophy.kind;
  tags.appendChild(kindTag);
  if (trophy.hidden) {
    const hidden = document.createElement("span");
    hidden.className = "tag";
    hidden.textContent = "Hidden";
    tags.appendChild(hidden);
  }
  if (trophy.missable) {
    const miss = document.createElement("span");
    miss.className = "tag missable";
    miss.textContent = "Missable";
    tags.appendChild(miss);
  }
  if (trophy.chapter) {
    const chapter = document.createElement("span");
    chapter.className = "tag";
    chapter.textContent = "Chapter " + trophy.chapter;
    tags.appendChild(chapter);
  }
  if (trophy.count !== null && trophy.count !== undefined) {
    const count = document.createElement("span");
    count.className = "tag";
    count.textContent = trophy.count.toLocaleString("en-US") + " " + (trophy.countLabel || "");
    tags.appendChild(count);
  }
  body.appendChild(tags);
  row.appendChild(body);

  const diff = document.createElement("div");
  diff.className = "trophy-difficulty";
  diff.textContent = difficultyStars(trophy.difficulty) + " · " + trophy.time;
  row.appendChild(diff);

  row.addEventListener("click", () => selectTrophy(trophy.id));
  return row;
}

function renderChecklist() {
  const list = document.getElementById("trophyList");
  const summary = document.getElementById("listSummary");
  if (!list) return;
  list.replaceChildren();
  const shown = visibleTrophies();
  for (const trophy of shown) list.appendChild(trophyRow(trophy));
  if (summary) {
    summary.textContent = shown.length === trophyList.length
      ? "Showing all " + trophyList.length + " trophies."
      : "Showing " + shown.length + " of " + trophyList.length + " trophies.";
  }
}

function toggleEarned(id, earned) {
  if (earned) earnedIds.add(id);
  else earnedIds.delete(id);
  saveProgress();
  renderProgress();
  renderChecklist();
  renderRoadmap();
  renderDetail();
}

function nextUpTrophy() {
  if (!roadmap) return null;
  for (const stage of roadmap.stages) {
    for (const id of stage.trophyIds) {
      if (!earnedIds.has(id)) return trophyById(id);
    }
  }
  return null;
}

function detailMetaLine(trophy) {
  const parts = [GRADE_LABELS[trophy.grade]];
  if (trophy.hidden) parts.push("Hidden on PlayStation");
  if (trophy.chapter) parts.push("Chapter " + trophy.chapter);
  if (trophy.stage) parts.push("Roadmap stage " + trophy.stage);
  parts.push("Difficulty " + trophy.difficulty + " / 5");
  parts.push("About " + trophy.time);
  return parts.join(" · ");
}

function renderDetail() {
  const pane = document.getElementById("detail");
  if (!pane) return;
  pane.replaceChildren();
  const trophy = selectedId ? trophyById(selectedId) : null;
  if (!trophy) {
    const next = nextUpTrophy();
    const heading = document.createElement("h2");
    heading.textContent = "Your guide";
    pane.appendChild(heading);
    const intro = document.createElement("p");
    intro.textContent = "Select a trophy in the list to see its guide, its steps and its sources. Check trophies off as you earn them — progress is saved in this browser.";
    pane.appendChild(intro);
    if (next) {
      const box = document.createElement("div");
      box.className = "next-up";
      const nextHeading = document.createElement("h3");
      nextHeading.textContent = "Next up";
      box.appendChild(nextHeading);
      const nextName = document.createElement("p");
      const strong = document.createElement("strong");
      strong.textContent = spoilerHides(next) ? "Hidden story trophy" : next.name;
      nextName.appendChild(strong);
      nextName.appendChild(document.createTextNode(" — " + next.description));
      box.appendChild(nextName);
      const go = document.createElement("button");
      go.type = "button";
      go.textContent = "Open its guide";
      go.addEventListener("click", () => selectTrophy(next.id));
      box.appendChild(go);
      pane.appendChild(box);
    }
    return;
  }
  const heading = document.createElement("h2");
  heading.textContent = spoilerHides(trophy) ? "Hidden story trophy" : trophy.name;
  pane.appendChild(heading);
  const official = document.createElement("p");
  official.className = "official";
  official.textContent = spoilerHides(trophy)
    ? "Its name and description stay hidden while spoiler mode is on. Earn it to reveal the guide."
    : "“" + trophy.description + "”";
  pane.appendChild(official);
  const meta = document.createElement("div");
  meta.className = "meta";
  for (const part of detailMetaLine(trophy).split(" · ")) {
    const tag = document.createElement("span");
    tag.className = "tag";
    tag.textContent = part;
    meta.appendChild(tag);
  }
  pane.appendChild(meta);
  if (spoilerHides(trophy)) return;
  if (trophy.missable) {
    const warn = document.createElement("div");
    warn.className = "warn-box";
    warn.textContent = "Missable: the first meditation in Chapter 1 can be lost for good. Do it when Lucia offers it at Jason's house — see the steps below.";
    pane.appendChild(warn);
  }
  const guideHeading = document.createElement("h3");
  guideHeading.textContent = "Guide";
  pane.appendChild(guideHeading);
  const guide = document.createElement("p");
  guide.textContent = trophy.guide;
  pane.appendChild(guide);
  if (trophy.steps && trophy.steps.length > 0) {
    const stepsHeading = document.createElement("h3");
    stepsHeading.textContent = "Steps";
    pane.appendChild(stepsHeading);
    const steps = document.createElement("ol");
    for (const step of trophy.steps) {
      const item = document.createElement("li");
      item.textContent = step;
      steps.appendChild(item);
    }
    pane.appendChild(steps);
  }
  if (trophy.sources && trophy.sources.length > 0) {
    const sourcesHeading = document.createElement("h3");
    sourcesHeading.textContent = "Sources";
    pane.appendChild(sourcesHeading);
    const sources = document.createElement("ul");
    sources.className = "sources";
    for (const source of trophy.sources) {
      const item = document.createElement("li");
      const link = document.createElement("a");
      link.href = source.url;
      link.textContent = source.label;
      link.target = "_blank";
      link.rel = "noopener";
      item.appendChild(link);
      sources.appendChild(item);
    }
    pane.appendChild(sources);
  }
  const toggle = document.createElement("button");
  toggle.type = "button";
  toggle.textContent = earnedIds.has(trophy.id) ? "Mark as not earned" : "Mark as earned";
  toggle.addEventListener("click", () => toggleEarned(trophy.id, !earnedIds.has(trophy.id)));
  pane.appendChild(toggle);
}

function selectTrophy(id) {
  selectedId = id;
  renderChecklist();
  renderDetail();
}

function renderRoadmap() {
  const container = document.getElementById("roadmapList");
  const intro = document.getElementById("roadmapIntro");
  if (!container || !roadmap) return;
  if (intro) {
    intro.textContent = roadmap.title + ": " + roadmap.difficulty + " difficulty, " + roadmap.hoursTotal +
      ", " + roadmap.playthroughs + " playthrough. " + roadmap.note;
  }
  container.replaceChildren();
  for (const stage of roadmap.stages) {
    const card = document.createElement("article");
    card.className = "stage";
    const heading = document.createElement("h2");
    heading.textContent = "Stage " + stage.n + " — " + stage.title;
    card.appendChild(heading);
    const hours = document.createElement("p");
    hours.className = "hours";
    hours.textContent = stage.hours;
    card.appendChild(hours);
    const blurb = document.createElement("p");
    blurb.textContent = stage.blurb;
    card.appendChild(blurb);
    const progress = stageProgress(stage);
    const bar = document.createElement("div");
    bar.className = "stage-bar";
    const fill = document.createElement("span");
    fill.style.width = (progress.total === 0 ? 0 : Math.round((100 * progress.earned) / progress.total)) + "%";
    bar.appendChild(fill);
    card.appendChild(bar);
    const count = document.createElement("p");
    count.textContent = progress.earned + " / " + progress.total + " trophies in this stage";
    card.appendChild(count);
    if (stage.tips && stage.tips.length > 0) {
      const tips = document.createElement("ul");
      tips.className = "tips";
      for (const tip of stage.tips) {
        const item = document.createElement("li");
        item.textContent = tip;
        tips.appendChild(item);
      }
      card.appendChild(tips);
    }
    const chips = document.createElement("div");
    chips.className = "stage-trophies";
    for (const id of stage.trophyIds) {
      const trophy = trophyById(id);
      if (!trophy) continue;
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "stage-trophy" + (earnedIds.has(id) ? " done" : "");
      chip.textContent = (earnedIds.has(id) ? "✓ " : "") + (spoilerHides(trophy) ? "Hidden story trophy" : trophy.name);
      chip.addEventListener("click", () => {
        showView("tracker");
        selectTrophy(id);
      });
      chips.appendChild(chip);
    }
    card.appendChild(chips);
    const actions = document.createElement("div");
    actions.className = "stage-actions";
    const markAll = document.createElement("button");
    markAll.type = "button";
    markAll.textContent = progress.earned === progress.total ? "Clear this stage" : "Mark all in this stage earned";
    markAll.addEventListener("click", () => markStageTrophies(stage, progress.earned !== progress.total));
    actions.appendChild(markAll);
    card.appendChild(actions);
    container.appendChild(card);
  }
}

function markStageTrophies(stage, earned) {
  for (const id of stage.trophyIds) {
    if (earned) earnedIds.add(id);
    else earnedIds.delete(id);
  }
  saveProgress();
  renderProgress();
  renderChecklist();
  renderRoadmap();
  renderDetail();
}

function renderCompleteList() {
  const container = document.getElementById("completeList");
  const progressBox = document.getElementById("completeProgress");
  const intro = document.getElementById("completeIntro");
  if (!container || !roadmap) return;
  if (intro) {
    intro.textContent = "The in-game 100% checklist (Progress, then Stats, then 100% Completion) opens after the story. It asks for portions, not everything — 200 of 277 vehicles, 100 of 255 animals, 70 of 80 challenges. Check items off here as you finish them; this list is saved beside your trophy progress.";
  }
  let done = 0;
  let total = 0;
  for (const group of roadmap.complete) {
    for (const item of group.items) {
      total += 1;
      if (completeDone.has(item.id)) done += 1;
    }
  }
  if (progressBox) {
    progressBox.replaceChildren();
    const line = document.createElement("p");
    line.textContent = done + " / " + total + " checklist rows done (" + (total === 0 ? 0 : Math.round((100 * done) / total)) + "%)";
    progressBox.appendChild(line);
    const bar = document.createElement("div");
    bar.className = "stage-bar";
    const fill = document.createElement("span");
    fill.style.width = (total === 0 ? 0 : Math.round((100 * done) / total)) + "%";
    bar.appendChild(fill);
    progressBox.appendChild(bar);
  }
  container.replaceChildren();
  for (const group of roadmap.complete) {
    const section = document.createElement("section");
    section.className = "complete-group";
    const heading = document.createElement("h2");
    heading.textContent = group.group;
    section.appendChild(heading);
    for (const item of group.items) {
      const row = document.createElement("div");
      row.className = "complete-item" + (completeDone.has(item.id) ? " done" : "");
      const check = document.createElement("input");
      check.type = "checkbox";
      check.checked = completeDone.has(item.id);
      check.id = "complete-" + item.id;
      check.addEventListener("change", () => {
        if (check.checked) completeDone.add(item.id);
        else completeDone.delete(item.id);
        saveProgress();
        renderCompleteList();
      });
      row.appendChild(check);
      const label = document.createElement("label");
      label.htmlFor = check.id;
      label.textContent = item.label;
      row.appendChild(label);
      if (item.target !== null && item.target !== undefined) {
        const target = document.createElement("span");
        target.className = "target";
        target.textContent = item.unit === "$"
          ? "$" + item.target.toLocaleString("en-US")
          : item.target.toLocaleString("en-US") + " " + (item.unit || "");
        row.appendChild(target);
      }
      section.appendChild(row);
    }
    container.appendChild(section);
  }
}

function renderMissables() {
  const container = document.getElementById("missableList");
  if (!container) return;
  container.replaceChildren();
  const missable = trophyList.filter((t) => t.missable);
  for (const trophy of missable) {
    const card = document.createElement("article");
    card.className = "missable-card";
    const heading = document.createElement("h2");
    heading.textContent = trophy.name + " — the one missable trophy";
    card.appendChild(heading);
    const guide = document.createElement("p");
    guide.textContent = trophy.guide;
    card.appendChild(guide);
    const steps = document.createElement("ol");
    for (const step of trophy.steps) {
      const item = document.createElement("li");
      item.textContent = step;
      steps.appendChild(item);
    }
    card.appendChild(steps);
    const open = document.createElement("button");
    open.type = "button";
    open.textContent = "Open in the tracker";
    open.addEventListener("click", () => {
      showView("tracker");
      selectTrophy(trophy.id);
    });
    card.appendChild(open);
    container.appendChild(card);
  }
  const unconfirmed = trophyList.filter((t) => t.time === "Unknown");
  const card = document.createElement("article");
  card.className = "missable-card";
  const heading = document.createElement("h2");
  heading.textContent = "Unconfirmed triggers — flagged, not guessed";
  card.appendChild(heading);
  const note = document.createElement("p");
  note.textContent = "Five trophies have no confirmed unlock method yet. This guide names them and says so, instead of inventing steps. Check the cited sources for updates as players crack them.";
  card.appendChild(note);
  const list = document.createElement("ul");
  for (const trophy of unconfirmed) {
    const item = document.createElement("li");
    const strong = document.createElement("strong");
    strong.textContent = trophy.name;
    item.appendChild(strong);
    item.appendChild(document.createTextNode(" — " + trophy.description));
    list.appendChild(item);
  }
  card.appendChild(list);
  const saveCard = document.createElement("article");
  saveCard.className = "missable-card";
  const saveHeading = document.createElement("h2");
  saveHeading.textContent = "Protect the run";
  saveCard.appendChild(saveHeading);
  const saveNote = document.createElement("p");
  saveNote.textContent = "There is no mission replay, so keep a manual save at the start and end of each chapter (15 save slots). Cheats disable trophies and saving while active — keep the trophy run cheat-free. Everything else on the list can be earned after the story in free roam.";
  saveCard.appendChild(saveNote);
  container.appendChild(card);
  container.appendChild(saveCard);
}

function exportProgress() {
  const payload = {
    version: 2,
    guide: "Leonida Trophy Guide",
    exportedAt: new Date().toISOString(),
    earned: Array.from(earnedIds).sort(),
    complete: Array.from(completeDone).sort(),
    settings: { spoiler: filters.spoiler, hideEarned: filters.hideEarned },
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "leonida-trophy-progress.json";
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return payload;
}

function importProgressData(data) {
  if (!data || typeof data !== "object" || !Array.isArray(data.earned)) return false;
  const known = new Set(trophyList.map((t) => t.id));
  const earned = data.earned.filter((id) => known.has(id));
  earnedIds = new Set(earned);
  if (Array.isArray(data.complete)) {
    const knownComplete = new Set();
    if (roadmap) for (const group of roadmap.complete) for (const item of group.items) knownComplete.add(item.id);
    completeDone = new Set(data.complete.filter((id) => knownComplete.has(id)));
  }
  if (data.settings && typeof data.settings === "object") {
    if (typeof data.settings.spoiler === "boolean") filters.spoiler = data.settings.spoiler;
    if (typeof data.settings.hideEarned === "boolean") filters.hideEarned = data.settings.hideEarned;
  }
  saveProgress();
  syncToolbar();
  renderProgress();
  renderChecklist();
  renderRoadmap();
  renderCompleteList();
  renderDetail();
  return true;
}

function showView(name) {
  const views = ["tracker", "roadmap", "complete", "missables"];
  for (const view of views) {
    const section = document.getElementById("view-" + view);
    const tab = document.getElementById("tab-" + view);
    if (section) section.hidden = view !== name;
    if (tab) tab.classList.toggle("active", view === name);
  }
  if (name === "roadmap") renderRoadmap();
  if (name === "complete") renderCompleteList();
  if (name === "missables") renderMissables();
  if (window.location.hash !== "#" + name) window.location.hash = name;
}

function syncToolbar() {
  const spoiler = document.getElementById("spoilerToggle");
  if (spoiler) spoiler.checked = filters.spoiler;
  const hideEarned = document.getElementById("hideEarned");
  if (hideEarned) hideEarned.checked = filters.hideEarned;
  const search = document.getElementById("search");
  if (search) search.value = filters.query;
  const kindFilter = document.getElementById("kindFilter");
  if (kindFilter) {
    for (const chip of kindFilter.querySelectorAll(".kind-chip")) {
      chip.classList.toggle("active", chip.dataset.kind === filters.kind);
    }
  }
  const gradeFilter = document.getElementById("gradeFilter");
  if (gradeFilter) gradeFilter.value = filters.grade;
  const sortOrder = document.getElementById("sortOrder");
  if (sortOrder) sortOrder.value = filters.sort;
}

function bindToolbar() {
  const search = document.getElementById("search");
  if (search) {
    search.addEventListener("input", () => {
      filters.query = search.value;
      renderChecklist();
    });
  }
  const kindFilter = document.getElementById("kindFilter");
  if (kindFilter) {
    kindFilter.addEventListener("click", (event) => {
      const button = event.target.closest("[data-kind]");
      if (!button) return;
      filters.kind = button.dataset.kind;
      for (const chip of kindFilter.querySelectorAll(".kind-chip")) {
        chip.classList.toggle("active", chip === button);
      }
      renderChecklist();
    });
  }
  const gradeFilter = document.getElementById("gradeFilter");
  if (gradeFilter) {
    gradeFilter.addEventListener("change", () => {
      filters.grade = gradeFilter.value;
      renderChecklist();
    });
  }
  const sortOrder = document.getElementById("sortOrder");
  if (sortOrder) {
    sortOrder.addEventListener("change", () => {
      filters.sort = sortOrder.value;
      renderChecklist();
    });
  }
  const hideEarned = document.getElementById("hideEarned");
  if (hideEarned) {
    hideEarned.addEventListener("change", () => {
      filters.hideEarned = hideEarned.checked;
      saveProgress();
      renderChecklist();
    });
  }
  const spoiler = document.getElementById("spoilerToggle");
  if (spoiler) {
    spoiler.addEventListener("change", () => {
      filters.spoiler = spoiler.checked;
      saveProgress();
      renderChecklist();
      renderDetail();
      renderRoadmap();
    });
  }
  const exportBtn = document.getElementById("exportBtn");
  if (exportBtn) exportBtn.addEventListener("click", () => exportProgress());
  const importBtn = document.getElementById("importBtn");
  const importFile = document.getElementById("importFile");
  if (importBtn && importFile) {
    importBtn.addEventListener("click", () => importFile.click());
    importFile.addEventListener("change", () => {
      const file = importFile.files && importFile.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const ok = importProgressData(JSON.parse(String(reader.result)));
          if (!ok) window.alert("That file is not a Leonida Trophy Guide export.");
        } catch (err) {
          window.alert("That file could not be read as a progress export.");
        }
        importFile.value = "";
      };
      reader.readAsText(file);
    });
  }
  const tabs = document.getElementById("views");
  if (tabs) {
    tabs.addEventListener("click", (event) => {
      const button = event.target.closest("[data-view]");
      if (!button) return;
      showView(button.dataset.view);
    });
  }
}

async function loadGuideData() {
  const trophyResponse = await fetch(TROPHY_DATA_URL);
  if (!trophyResponse.ok) throw new Error("Could not load " + TROPHY_DATA_URL);
  const trophyJson = await trophyResponse.json();
  trophyList = trophyJson.trophies || [];
  const roadmapResponse = await fetch(ROADMAP_DATA_URL);
  if (!roadmapResponse.ok) throw new Error("Could not load " + ROADMAP_DATA_URL);
  roadmap = await roadmapResponse.json();
}

function readLaunchState() {
  const params = new URLSearchParams(window.location.search);
  const trophyParam = params.get("trophy");
  if (trophyParam && trophyById(trophyParam)) selectedId = trophyParam;
  const hash = window.location.hash.replace("#", "");
  if (["tracker", "roadmap", "complete", "missables"].includes(hash)) return hash;
  return "tracker";
}

async function bootGuide() {
  loadSavedState();
  bindToolbar();
  syncToolbar();
  try {
    await loadGuideData();
  } catch (err) {
    const list = document.getElementById("trophyList");
    if (list) list.textContent = "The guide data could not be loaded. Serve the app folder with a static server and reload.";
    return;
  }
  renderProgress();
  renderChecklist();
  renderDetail();
  renderRoadmap();
  renderCompleteList();
  renderMissables();
  showView(readLaunchState());
}

window.LeonidaGuide = {
  getState: () => ({ earned: Array.from(earnedIds).sort(), complete: Array.from(completeDone).sort(), filters: { ...filters }, selectedId }),
  setEarned: (id, earned) => { if (trophyById(id)) toggleEarned(id, earned); },
  setComplete: (id, done) => { if (done) completeDone.add(id); else completeDone.delete(id); saveProgress(); renderCompleteList(); },
  setFilters: (patch) => { Object.assign(filters, patch); syncToolbar(); renderChecklist(); renderDetail(); },
  selectTrophy: (id) => selectTrophy(id),
  showView: (name) => showView(name),
  exportData: () => exportProgress(),
  importData: (data) => importProgressData(data),
  trophies: () => trophyList.slice(),
  roadmap: () => roadmap,
};

bootGuide();
