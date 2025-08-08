const BIN_ID = '6895ea2cae596e708fc51e96';
const API_KEY = '$2a$10$9sO/ja29sMebpWNvsWmp5.dJ6lv7CPeLBMRFaA/cAEwz42ii6qlCS';
const API_URL = 'https://api.jsonbin.io/v3/b/6895ea2cae596e708fc51e96';
const START_WEIGHT = 122.5;
const GOAL_WEIGHT = 99.5;

let state = { startWeight: START_WEIGHT, goalWeight: GOAL_WEIGHT, entries: [] };
let chart;

const dateInput = document.getElementById('dateInput');
const weightInput = document.getElementById('weightInput');
const saveBtn = document.getElementById('saveBtn');
const statusEl = document.getElementById('status');
const progressFill = document.getElementById('progressFill');
const progressPercent = document.getElementById('progressPercent');
const currentWeightLabel = document.getElementById('currentWeightLabel');
const startWeightLabel = document.getElementById('startWeightLabel');
const goalWeightLabel = document.getElementById('goalWeightLabel');
const lostLabel = document.getElementById('lostLabel');
const remainingLabel = document.getElementById('remainingLabel');
const tableBody = document.getElementById('tableBody');

function todayISO() {
const d = new Date();
d.setHours(0,0,0,0);
const tzOffset = d.getTimezoneOffset();
const local = new Date(d.getTime() - tzOffset * 60000);
return local.toISOString().slice(0,10);
}

function parseISO(s) {
const parts = s.split('-').map(Number);
return new Date(parts[0], parts[1] - 1, parts[2]);
}

function formatDisplayDate(iso) {
const d = parseISO(iso);
return d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
}

function clamp(n, min, max) {
return Math.max(min, Math.min(max, n));
}

function setStatus(msg, good) {
statusEl.textContent = msg || '';
statusEl.style.color = good ? '#0a0a0a' : '#6b6b6b';
}

async function fetchData() {
setStatus('Loading…');
try {
const res = await fetch(API_URL, {
method: 'GET',
headers: {
'X-Master-Key': '$2a$10$9sO/ja29sMebpWNvsWmp5.dJ6lv7CPeLBMRFaA/cAEwz42ii6qlCS',
'Accept': 'application/json'
}
});
if (!res.ok) throw new Error('Failed to load data');
const data = await res.json();
const record = data.record || {};
const entries = Array.isArray(record.entries) ? record.entries : [];
const startWeight = typeof record.startWeight === 'number' ? record.startWeight : START_WEIGHT;
const goalWeight = typeof record.goalWeight === 'number' ? record.goalWeight : GOAL_WEIGHT;
state = { startWeight, goalWeight, entries: normalizeEntries(entries) };
renderAll();
setStatus('');
} catch (e) {
setStatus('Unable to load from jsonbin.io. Check your internet or API key.');
state = { startWeight: START_WEIGHT, goalWeight: GOAL_WEIGHT, entries: [] };
renderAll();
}
}

function normalizeEntries(entries) {
const cleaned = entries
.map(e => ({ date: String(e.date).slice(0,10), weight: Number(e.weight) }))
.filter(e => e.date && !Number.isNaN(e.weight));
const map = new Map();
cleaned.forEach(e => map.set(e.date, e.weight));
const merged = Array.from(map, ([date, weight]) => ({ date, weight }));
merged.sort((a,b) => a.date.localeCompare(b.date));
return merged;
}

async function saveData() {
const body = JSON.stringify({
startWeight: state.startWeight,
goalWeight: state.goalWeight,
entries: state.entries
});
const res = await fetch(API_URL, {
method: 'PUT',
headers: {
'X-Master-Key': '$2a$10$9sO/ja29sMebpWNvsWmp5.dJ6lv7CPeLBMRFaA/cAEwz42ii6qlCS',
'Content-Type': 'application/json',
'Accept': 'application/json'
},
body
});
if (!res.ok) throw new Error('Failed to save');
}

function currentWeight() {
if (state.entries.length === 0) return state.startWeight;
return state.entries[state.entries.length - 1].weight;
}

function updateProgressUI() {
startWeightLabel.textContent = state.startWeight.toFixed(1);
goalWeightLabel.textContent = state.goalWeight.toFixed(1);
const cur = currentWeight();
currentWeightLabel.textContent = cur.toFixed(1);
const totalDelta = state.startWeight - state.goalWeight;
const nowDelta = state.startWeight - cur;
const pct = clamp((nowDelta / totalDelta) * 100, 0, 100);
progressFill.style.width = pct.toFixed(1) + '%';
progressPercent.textContent = Math.round(pct) + '%';
const lost = Math.max(0, nowDelta);
const remaining = Math.max(0, cur - state.goalWeight);
lostLabel.textContent = lost.toFixed(1);
remainingLabel.textContent = remaining.toFixed(1);
}

function updateTable() {
const rows = [...state.entries].sort((a,b) => b.date.localeCompare(a.date));
tableBody.innerHTML = rows.map(e => {
const d = formatDisplayDate(e.date);
const w = Number(e.weight).toFixed(1);
return '<tr><td>' + d + '</td><td>' + w + '</td></tr>';
}).join('');
}

function updateChart() {
  const ctx = document.getElementById('weightChart').getContext('2d');
  const labels = state.entries.map(e => e.date);
  const data = state.entries.map(e => e.weight);
  const minW = Math.min(state.goalWeight, ...data, state.startWeight);
  const maxW = Math.max(state.goalWeight, ...data, state.startWeight);
  const padding = Math.max(0.5, (maxW - minW) * 0.08);
  const yMin = Math.max(0, minW - padding);
  const yMax = maxW + padding;

  // ✅ Destroy existing chart if it exists
  if (chart) {
    chart.destroy();
  }

  chart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [{
        label: 'Weight',
        data,
        borderColor: '#111111',
        backgroundColor: 'rgba(0,0,0,0.06)',
        pointBackgroundColor: '#111111',
        pointRadius: 3,
        borderWidth: 2,
        fill: true,
        tension: 0.25
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          intersect: false,
          mode: 'index',
          callbacks: {
            label: ctx => ctx.parsed.y.toFixed(1) + ' kg'
          }
        }
      },
      scales: {
        x: {
          grid: { color: '#f0f0f0' },
          ticks: {
            autoSkip: true,
            maxTicksLimit: 8,

callback: v => {
  const s = labels[v]; // ✅ Use local variable instead of chart.data.labels
  if (!s) return '';
  const d = parseISO(s);
  return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

          }
        },
        y: {
          grid: { color: '#f3f3f3' },
          ticks: { callback: v => v + '' },
          suggestedMin: yMin,
          suggestedMax: yMax
        }
      }
    }
  });
}


function renderAll() {
updateProgressUI();
updateTable();
updateChart();
}

function upsertEntry(dateISO, weight) {
const idx = state.entries.findIndex(e => e.date === dateISO);
if (idx >= 0) state.entries[idx].weight = weight;
else state.entries.push({ date: dateISO, weight });
state.entries.sort((a,b) => a.date.localeCompare(b.date));
}

function initForm() {
const t = todayISO();
dateInput.value = t;
dateInput.max = t;
}

document.getElementById('logForm').addEventListener('submit', async (e) => {
e.preventDefault();
const date = dateInput.value;
const weight = Number(weightInput.value);
if (!date) {
setStatus('Please select a date.');
return;
}
if (!weight || Number.isNaN(weight) || weight < 30 || weight > 300) {
setStatus('Enter a valid weight between 30 and 300 kg.');
return;
}
saveBtn.disabled = true;
setStatus('Saving…');
try {
upsertEntry(date, Number(weight.toFixed(1)));
await saveData();
renderAll();
setStatus('Saved successfully.', true);
weightInput.value = '';
} catch (err) {
setStatus('Failed to save to jsonbin.io. Try again.');
} finally {
saveBtn.disabled = false;
}
});

initForm();
fetchData();
