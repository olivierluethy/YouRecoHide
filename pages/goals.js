// Fallback so the page renders (and is previewable) outside the extension.
// Harmless in production: only activates when chrome.storage.sync is absent.
if (typeof chrome === "undefined" || !chrome.storage || !chrome.storage.sync) {
  const mem = {};
  window.chrome = window.chrome || {};
  window.chrome.storage = {
    sync: {
      get(key, cb) {
        const k = typeof key === "string" ? key : null;
        cb(k ? { [k]: mem[k] } : { ...mem });
      },
      set(obj, cb) {
        Object.assign(mem, obj);
        cb && cb();
      },
    },
  };
}

var input = document.getElementById("goalInput");
var goalsGrid = document.getElementById("goalsGrid");
const searchInput = document.getElementById("searchGoals");

// Modal selectors
const close = document.querySelector(".close");
const dialog = document.getElementById("myModal");
const closeBtn = document.querySelector(".closeBtn");

const rangeInput = document.querySelector(".goal-range");
const valueDisplay = document.querySelector(".range-value");
const subGoalButton = document.getElementById("subGoal");

// ---------- Small shared helpers ----------

// Paint the spectral fill + value bubble for any prism-range slider.
function updateRange(slider, display) {
  const min = Number(slider.min) || 0;
  const max = Number(slider.max) || 100;
  const v = Number(slider.value);
  const pct = ((v - min) / (max - min)) * 100;
  slider.style.setProperty("--p", pct + "%");
  if (display) display.textContent = v;
}

// Familiarity band label from a numeric value.
function bandLabel(v) {
  return v <= 33 ? "Beginner" : v <= 66 ? "Comfortable" : "Pro";
}

// Light up the familiarity band that matches the current value.
function highlightBand(v) {
  const active = v <= 33 ? "low" : v <= 66 ? "mid" : "high";
  document.querySelectorAll(".range-desc").forEach((el) => {
    const on = el.dataset.band === active;
    el.classList.toggle("text-text", on);
    el.classList.toggle("font-semibold", on);
    el.classList.toggle("text-muted", !on);
  });
}

// Enable/disable the Add button based on the input (no layout shift).
function updateAddButton() {
  const empty = input.value.trim() === "";
  subGoalButton.disabled = empty;
  subGoalButton.classList.toggle("opacity-40", empty);
  subGoalButton.classList.toggle("saturate-50", empty);
  subGoalButton.classList.toggle("pointer-events-none", empty);
}

// Drop a topic into the input and give a brief confirmation pulse.
function useTopic(topic) {
  input.value = topic;
  updateAddButton();
  input.focus();
  input.classList.add("ring-2", "ring-cyan/50");
  setTimeout(() => input.classList.remove("ring-2", "ring-cyan/50"), 450);
}

// ---------- Sorting / filtering state ----------

let currentSort = "newest";
let currentFilter = "all";
let cardSeq = 0; // monotonic creation order, used for date-based sorting

function goalBandKey(v) {
  return v <= 33 ? "low" : v <= 66 ? "mid" : "high";
}

// Non-blocking toast, used instead of alert().
function showToast(message, kind = "info") {
  const host = document.getElementById("toasts");
  const t = document.createElement("div");
  t.className =
    "pointer-events-auto max-w-xs rounded-xl border border-line bg-surface2/95 " +
    "px-4 py-2.5 text-sm text-text shadow-[0_20px_40px_-15px_rgba(0,0,0,0.85)] " +
    "backdrop-blur transition-all duration-300";
  if (kind === "error") t.classList.add("border-rose/40");
  if (kind === "success") t.classList.add("border-emerald/40");
  t.textContent = message;
  t.style.opacity = "0";
  t.style.transform = "translateY(8px)";
  host.appendChild(t);
  requestAnimationFrame(() => {
    t.style.opacity = "1";
    t.style.transform = "translateY(0)";
  });
  setTimeout(() => {
    t.style.opacity = "0";
    t.style.transform = "translateY(8px)";
    setTimeout(() => t.remove(), 300);
  }, 2500);
}

// Order + filter the visible cards based on current sort, filter and search.
function applyView() {
  const cards = Array.from(goalsGrid.querySelectorAll(".goal-card"));
  const q = searchInput.value.toLowerCase().trim();

  const visible = cards.filter(
    (c) =>
      currentFilter === "all" ||
      goalBandKey(Number(c.dataset.value)) === currentFilter
  );

  const ordered = visible.slice();
  if (q) {
    ordered.sort(
      (a, b) =>
        levenshteinDistance((a.dataset.goal || "").toLowerCase(), q) -
        levenshteinDistance((b.dataset.goal || "").toLowerCase(), q)
    );
  } else {
    ordered.sort((a, b) => {
      switch (currentSort) {
        case "oldest":
          return Number(a.dataset.seq) - Number(b.dataset.seq);
        case "famhigh":
          return Number(b.dataset.value) - Number(a.dataset.value);
        case "famlow":
          return Number(a.dataset.value) - Number(b.dataset.value);
        case "name":
          return (a.dataset.goal || "").localeCompare(b.dataset.goal || "");
        default:
          return Number(b.dataset.seq) - Number(a.dataset.seq); // newest
      }
    });
  }

  cards.forEach((c) => (c.style.display = "none"));
  ordered.forEach((c) => {
    c.style.display = "";
    goalsGrid.appendChild(c);
  });

  document
    .getElementById("noMatch")
    .classList.toggle("hidden", ordered.length > 0 || cards.length === 0);
}

// Switch the active band filter and its chip styling.
function setFilter(band) {
  currentFilter = band;
  document.querySelectorAll(".filter-chip").forEach((chip) => {
    const on = chip.dataset.filter === band;
    chip.classList.toggle("border-cyan/50", on);
    chip.classList.toggle("bg-surface2", on);
    chip.classList.toggle("text-text", on);
    chip.classList.toggle("border-line", !on);
    chip.classList.toggle("text-muted", !on);
  });
  applyView();
}

// Download all goals as a JSON file.
function exportGoals() {
  chrome.storage.sync.get("goals", function (data) {
    const goals = data.goals || [];
    if (goals.length === 0) {
      showToast("No goals to export", "error");
      return;
    }
    const blob = new Blob([JSON.stringify(goals, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "youtube-goals.json";
    a.click();
    URL.revokeObjectURL(url);
    showToast("Goals exported", "success");
  });
}

// Remove every goal after a confirmation.
function clearGoals() {
  if (!goalsGrid.querySelector(".goal-card")) return;
  if (!confirm("Remove all goals? This cannot be undone.")) return;
  goalsGrid.innerHTML = "";
  chrome.storage.sync.set({ goals: [] }, function () {});
  refreshGoalsUI();
  showToast("All goals cleared", "success");
}

// ---------- Collection UI: empty state, count, search, snapshot ----------

function refreshGoalsUI() {
  const cards = Array.from(goalsGrid.querySelectorAll(".goal-card"));
  const count = cards.length;

  document.getElementById("goalCount").textContent = count;
  document.getElementById("goalsEmpty").classList.toggle("hidden", count > 0);
  goalsGrid.classList.toggle("hidden", count === 0);

  const controls = document.getElementById("goalsControls");
  const filterBar = document.getElementById("filterBar");
  controls.classList.toggle("hidden", count === 0);
  controls.classList.toggle("flex", count > 0);
  filterBar.classList.toggle("hidden", count === 0);
  filterBar.classList.toggle("flex", count > 0);

  const statsPanel = document.querySelector(".stats-panel");
  statsPanel.classList.toggle("hidden", count === 0);

  if (count > 0) {
    const values = cards.map((c) => Number(c.dataset.value) || 0);
    const avg = Math.round(values.reduce((a, b) => a + b, 0) / count);
    document.getElementById("statTotal").textContent = count;
    document.getElementById("statAvg").textContent = avg;
    document.getElementById("statAvgBar").style.width = avg + "%";
    document.getElementById("statBeginner").textContent = values.filter(
      (v) => v <= 33
    ).length;
    document.getElementById("statComfortable").textContent = values.filter(
      (v) => v > 33 && v <= 66
    ).length;
    document.getElementById("statPro").textContent = values.filter(
      (v) => v > 66
    ).length;
  }

  applyView();
}

updateRange(rangeInput, valueDisplay);
highlightBand(Number(rangeInput.value));
updateAddButton();
refreshGoalsUI();

rangeInput.addEventListener("input", () => {
  updateRange(rangeInput, valueDisplay);
  highlightBand(Number(rangeInput.value));
});

// ---------- Seamless marquee of example topics ----------

const tickerTopics = [
  "C#", "Dancing", "Video Editing", "Fusion 360", "Cooking", "Drone Building",
  "Climbing", "Photoshop", "Photography", "Baking", "Painting", "Drawing",
  "Guitar", "Woodworking", "Gardening", "Writing", "Reading", "Chess", "Algebra",
];

const flickerTopics = [
  "Yoga", "3D Printing", "Calligraphy", "Sculpting", "Singing", "Piano",
  "Traveling", "Fishing", "Swimming", "Puzzles", "Bird Watching", "DIY Projects",
  "Martial Arts", "German", "Origami", "Astronomy", "Cake Decorating",
];

// Two identical groups butted together; the track slides exactly -50%,
// so the loop is seamless — no jump, no jitter.
function buildMarquee(selector, topics, reverse) {
  const container = document.querySelector(selector);
  if (!container) return;
  container.innerHTML = "";

  const track = document.createElement("div");
  track.className =
    "marquee-track flex w-max animate-marquee will-change-transform " +
    "group-hover:[animation-play-state:paused] motion-reduce:animate-none";
  if (reverse) track.classList.add("[animation-direction:reverse]");

  for (let g = 0; g < 2; g++) {
    const group = document.createElement("div");
    // pr-3 matches the internal gap-3 so spacing stays uniform across the seam.
    group.className = "flex shrink-0 items-center gap-3 pr-3";
    if (g === 1) group.setAttribute("aria-hidden", "true");

    topics.forEach((topic) => {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.title = `Use ${topic}`;
      chip.textContent = topic;
      chip.className =
        "shrink-0 whitespace-nowrap rounded-full border border-line " +
        "bg-surface2/70 px-4 py-2 text-sm text-text/90 transition duration-200 " +
        "hover:-translate-y-0.5 hover:scale-105 hover:border-cyan/50 " +
        "hover:bg-surface2 hover:text-white " +
        "hover:shadow-[0_8px_24px_-6px_rgba(34,211,238,0.55)] " +
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan/50";
      chip.addEventListener("click", () => useTopic(topic));
      group.appendChild(chip);
    });

    track.appendChild(group);
  }

  container.appendChild(track);
}

buildMarquee(".stock-ticker", tickerTopics, false);
buildMarquee(".stock-flicker", flickerTopics, true);

// Load saved goals when the page loads
chrome.storage.sync.get("goals", function (data) {
  if (data.goals) {
    data.goals.forEach(function (goal) {
      addGoalToList(goal.text, goal.value, goal.date);
    });
  }
});

// ---------- Fuzzy search (Levenshtein) ----------

function levenshteinDistance(a, b) {
  const matrix = [];
  for (let i = 0; i <= b.length; i++) matrix[i] = [i];
  for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          Math.min(matrix[i][j - 1] + 1, matrix[i - 1][j] + 1)
        );
      }
    }
  }
  return matrix[b.length][a.length];
}

searchInput.addEventListener("input", applyView);

document.getElementById("sortGoals").addEventListener("change", function () {
  currentSort = this.value;
  applyView();
});

document.querySelectorAll(".filter-chip").forEach((chip) => {
  chip.addEventListener("click", () => setFilter(chip.dataset.filter));
});

document.getElementById("exportGoals").addEventListener("click", exportGoals);
document.getElementById("clearGoals").addEventListener("click", clearGoals);

// Press "/" to jump to the goal input.
document.addEventListener("keydown", (e) => {
  if (
    e.key === "/" &&
    !dialog.open &&
    document.activeElement !== input &&
    document.activeElement !== searchInput
  ) {
    e.preventDefault();
    input.focus();
  }
});

// ---------- Goal cards ----------

function addGoalToList(goalText, rangeValue, date) {
  const v = Number(rangeValue) || 0;

  const card = document.createElement("article");
  card.className =
    "goal-card row-enter group relative overflow-hidden rounded-2xl border " +
    "border-line bg-surface/60 p-4 transition hover:border-white/15 hover:bg-surface/80";
  card.dataset.goal = goalText;
  card.dataset.value = rangeValue;
  card.dataset.seq = cardSeq++;

  const top = document.createElement("div");
  top.className = "flex items-start justify-between gap-2";

  const name = document.createElement("h3");
  name.className = "goal-name min-w-0 truncate font-display text-lg font-bold text-text";
  name.textContent = goalText;
  name.title = goalText;

  const actions = document.createElement("div");
  actions.className = "flex shrink-0 items-center gap-1";

  const editButton = document.createElement("button");
  editButton.title = "Edit goal";
  editButton.setAttribute("aria-label", "Edit goal");
  editButton.textContent = "✎";
  editButton.className =
    "grid h-7 w-7 place-items-center rounded-lg text-muted transition " +
    "hover:bg-surface2 hover:text-amber";
  editButton.onclick = function () {
    editGoal(card);
  };

  const removeButton = document.createElement("button");
  removeButton.title = "Remove goal";
  removeButton.setAttribute("aria-label", "Remove goal");
  removeButton.textContent = "✕";
  removeButton.className =
    "grid h-7 w-7 place-items-center rounded-lg text-muted transition " +
    "hover:bg-surface2 hover:text-rose";
  removeButton.onclick = function () {
    removeGoal(card);
  };

  actions.append(editButton, removeButton);
  top.append(name, actions);

  const meta = document.createElement("div");
  meta.className = "mt-3 flex items-baseline justify-between text-xs";
  const band = document.createElement("span");
  band.className = "goal-band text-muted";
  band.textContent = bandLabel(v);
  const val = document.createElement("span");
  val.className = "goal-value font-semibold tabular-nums text-text";
  val.textContent = rangeValue;
  meta.append(band, val);

  const barTrack = document.createElement("div");
  barTrack.className = "mt-2 h-1.5 overflow-hidden rounded-full bg-white/10";
  const barFill = document.createElement("div");
  barFill.className = "goal-bar h-full spectral-bg";
  barFill.style.width = v + "%";
  barTrack.appendChild(barFill);

  const dateEl = document.createElement("p");
  dateEl.className = "mt-3 text-xs text-muted";
  dateEl.textContent = date;

  card.append(top, meta, barTrack, dateEl);
  goalsGrid.appendChild(card);

  refreshGoalsUI();
}

// Unique id per goal, generated once at creation time.
async function generateUniqueID(goal) {
  const stringToHash = `${goal.text}-${goal.value}-${goal.prompt || ""}`;
  const salt = Math.random().toString(36).substring(2, 15);
  const combinedString = stringToHash + salt;

  const encoder = new TextEncoder();
  const data = encoder.encode(combinedString);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");

  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 5);
  return `${timestamp}-${randomString}-${hash.substring(0, 16)}`;
}

// ---------- Modal close (slide up with a soft bounce) ----------

function closeDialog() {
  dialog.classList.add("closing");
  dialog.addEventListener(
    "animationend",
    () => {
      dialog.classList.remove("closing");
      dialog.close();
    },
    { once: true }
  );
}

closeBtn.addEventListener("click", closeDialog);
close.addEventListener("click", closeDialog);
dialog.addEventListener("click", (e) => {
  if (e.target === dialog) closeDialog();
});
dialog.addEventListener("cancel", (e) => {
  e.preventDefault();
  closeDialog();
});

// ---------- Prompt + date helpers ----------

function generatePrompt(goalText, rangeValue) {
  const value = Number(rangeValue) || 0;
  // Quote multi-word topics so YouTube keeps the phrase together.
  const t = goalText.trim();
  const topic = /\s/.test(t) ? `"${t}"` : t;

  // Bands match the UI slider labels (Beginner ≤33, Comfortable ≤66, Pro).
  let pool;
  if (value <= 33) {
    pool = [
      `${topic} tutorial for beginners`,
      `${topic} explained step by step`,
      `Learn ${topic} from scratch`,
      `${topic} complete beginner's guide`,
      `${topic} basics tutorial`,
    ];
  } else if (value <= 66) {
    pool = [
      `${topic} full tutorial`,
      `${topic} intermediate guide`,
      `How to get better at ${topic}`,
      `${topic} techniques explained`,
      `${topic} practical course`,
    ];
  } else {
    pool = [
      `Advanced ${topic} techniques`,
      `${topic} masterclass`,
      `${topic} pro tips and workflow`,
      `${topic} deep dive`,
    ];
  }

  return pool[Math.floor(Math.random() * pool.length)];
}

function formatDateForGoalWithYearAndTime() {
  const date = new Date();
  const day = date.getDate();
  const month = date.toLocaleString("default", { month: "long" });
  const year = date.getFullYear();

  const hours = date.getHours();
  const minutes = date.getMinutes();
  const ampm = hours >= 12 ? "PM" : "AM";
  const formattedHours = hours % 12 || 12;
  const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;

  const suffix = (day) => {
    if (day > 3 && day < 21) return "th";
    switch (day % 10) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        return "th";
    }
  };

  return `${month} ${day}${suffix(day)}, ${year} at ${formattedHours}:${formattedMinutes} ${ampm}`;
}

// ---------- Add a goal ----------

input.addEventListener("input", updateAddButton);

subGoalButton.addEventListener("click", function () {
  const goalText = input.value.trim();
  const rangeValue = rangeInput.value;
  getEnteredInputInformation(goalText, rangeValue);
});

async function getEnteredInputInformation(goalText, rangeValue) {
  const isValidInput = /^[a-zA-Z0-9\s#\-_äöüÄÖÜ]*$/.test(goalText);

  if (isValidInput) {
    const duplicate = Array.from(goalsGrid.querySelectorAll(".goal-card")).some(
      (c) => (c.dataset.goal || "").toLowerCase() === goalText.toLowerCase()
    );
    if (duplicate) {
      showToast(`"${goalText}" is already in your goals`, "error");
      input.value = "";
      updateAddButton();
      return;
    }

    const currentDate = formatDateForGoalWithYearAndTime();
    input.value = "";
    updateAddButton();

    chrome.storage.sync.get("goals", async function (data) {
      const goals = data.goals || [];
      const prompt = generatePrompt(goalText, rangeValue);
      const hash = await generateUniqueID({
        text: goalText,
        value: rangeValue,
        prompt: prompt,
      });

      goals.push({
        id: hash,
        text: goalText,
        value: rangeValue,
        date: currentDate,
        prompt: prompt,
      });

      addGoalToList(goalText, rangeValue, currentDate);
      showToast(`"${goalText}" added`, "success");

      chrome.storage.sync.set({ goals: goals }, function () {
        console.log("Goals saved:", goals);
      });
    });
  } else {
    showToast("No special characters allowed in a goal", "error");
  }
}

input.addEventListener("keypress", function (event) {
  if (event.key === "Enter") {
    event.preventDefault();
    const goalText = input.value.trim();
    const rangeValue = rangeInput.value;
    if (goalText) {
      getEnteredInputInformation(goalText, rangeValue);
    } else {
      showToast("Type a goal first", "error");
    }
  }
});

// ---------- Edit a goal ----------

function editGoal(card) {
  const goalInput = document.getElementById("goalTextEdit");
  const valueInput = document.getElementById("rangeValueEdit");
  const rangeValueDisplay = document.querySelector(".range-valueEdit");

  const originalText = card.dataset.goal;
  const originalValue = parseInt(card.dataset.value, 10);

  goalInput.value = originalText;
  valueInput.value = originalValue;
  updateRange(valueInput, rangeValueDisplay);

  dialog.showModal();

  valueInput.oninput = function () {
    updateRange(valueInput, rangeValueDisplay);
  };

  document.getElementById("saveChanges").onclick = function () {
    const updatedText = goalInput.value.trim();
    const updatedValue = parseInt(valueInput.value, 10);

    if (updatedText === originalText && updatedValue === originalValue) {
      closeDialog();
      return;
    }

    const newPrompt = generatePrompt(updatedText, updatedValue);

    chrome.storage.sync.get("goals", function (data) {
      const goals = data.goals || [];
      const goalIndex = goals.findIndex((goal) => goal.text === originalText);

      if (goalIndex !== -1) {
        if (updatedText !== originalText) {
          chrome.storage.sync.get("doubleGoals", (res) => {
            let storedGoals = res.doubleGoals || {};
            delete storedGoals[originalText];
            chrome.storage.sync.set({ doubleGoals: storedGoals });
          });
        }

        goals[goalIndex].text = updatedText;
        goals[goalIndex].value = updatedValue;
        goals[goalIndex].prompt = newPrompt;
      }

      chrome.storage.sync.set({ goals: goals }, function () {
        console.log("Updated goals:", goals);
      });
    });

    // Update the card in place
    card.dataset.goal = updatedText;
    card.dataset.value = updatedValue;
    const nameEl = card.querySelector(".goal-name");
    nameEl.textContent = updatedText;
    nameEl.title = updatedText;
    card.querySelector(".goal-value").textContent = updatedValue;
    card.querySelector(".goal-band").textContent = bandLabel(updatedValue);
    card.querySelector(".goal-bar").style.width = updatedValue + "%";

    refreshGoalsUI();
    closeDialog();
    showToast("Goal updated", "success");
  };
}

// ---------- Remove a goal ----------

function removeGoal(card) {
  const originalText = card.dataset.goal;
  card.remove();

  chrome.storage.sync.get("goals", function (data) {
    let goals = data.goals || [];
    goals = goals.filter((goal) => goal.text !== originalText);
    chrome.storage.sync.set({ goals: goals }, function () {
      console.log("Updated goals after removal:", goals);
    });
  });

  refreshGoalsUI();
  showToast(`"${originalText}" removed`);
}
