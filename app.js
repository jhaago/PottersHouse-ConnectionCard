const DB_NAME = "pottershouse-connection-card";
const DB_VERSION = 1;
const STORE = "connections";
let db;

document.addEventListener("DOMContentLoaded", async () => {
  db = await openDb();

  const altarWorker = localStorage.getItem("defaultAltarWorker") || localStorage.getItem("defaultRecorder") || "";
  document.getElementById("defaultAltarWorker").value = altarWorker;
  document.getElementById("altarWorker").value = altarWorker;
  document.getElementById("syncUrl").value = localStorage.getItem("syncUrl") || "";
  setToday();

  bindNavigation();
  bindForm();
  bindSettings();
  bindSync();

  window.addEventListener("online", () => {
    updateConnectivity();
    syncPending(false);
  });
  window.addEventListener("offline", updateConnectivity);

  updateConnectivity();
  await refreshEntries();

  if ("serviceWorker" in navigator) {
    navigator.serviceWorker.register("sw.js").catch(console.error);
  }

  if (navigator.onLine) syncPending(false);
});

function openDb() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const database = request.result;
      if (!database.objectStoreNames.contains(STORE)) {
        const store = database.createObjectStore(STORE, { keyPath: "id" });
        store.createIndex("createdAt", "createdAt", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function saveRecord(record) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(record);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

function deleteRecord(id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = resolve;
    tx.onerror = () => reject(tx.error);
  });
}

function getAllRecords() {
  return new Promise((resolve, reject) => {
    const request = db.transaction(STORE, "readonly").objectStore(STORE).getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
}

function bindNavigation() {
  document.querySelectorAll(".nav-button").forEach(button => {
    button.addEventListener("click", () => showView(button.dataset.view));
  });
}

function showView(id) {
  document.querySelectorAll(".view").forEach(view => view.classList.remove("active"));
  document.querySelectorAll(".nav-button").forEach(button => button.classList.remove("active"));
  document.getElementById(id).classList.add("active");
  document.querySelector(`[data-view="${id}"]`).classList.add("active");
  if (id === "entriesView") refreshEntries();
}

function bindForm() {
  document.getElementById("connectionForm").addEventListener("submit", async event => {
    event.preventDefault();

    const decision = document.querySelector('input[name="firstTimeDecision"]:checked');
    const altarWorker = value("altarWorker");

    const record = {
      id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
      createdAt: new Date().toISOString(),
      name: value("name"),
      email: value("email"),
      phone: value("phone"),
      address: value("address"),
      altarWorker,
      cardDate: value("cardDate"),
      firstTimeDecision: decision ? decision.value : "",
      age: value("age"),
      synced: false,
      syncedAt: ""
    };

    await saveRecord(record);

    if (altarWorker) {
      localStorage.setItem("defaultAltarWorker", altarWorker);
      document.getElementById("defaultAltarWorker").value = altarWorker;
    }

    event.target.reset();
    document.getElementById("altarWorker").value = localStorage.getItem("defaultAltarWorker") || "";
    setToday();

    showToast("Saved on this phone — waiting to sync");
    await refreshEntries();

    if (navigator.onLine) syncPending(false);
  });
}

function bindSettings() {
  document.getElementById("saveSettings").addEventListener("click", () => {
    const altarWorker = value("defaultAltarWorker");
    const syncUrl = value("syncUrl");

    localStorage.setItem("defaultAltarWorker", altarWorker);
    localStorage.setItem("syncUrl", syncUrl);
    document.getElementById("altarWorker").value = altarWorker;

    showToast("Settings saved");
  });
}

function bindSync() {
  document.getElementById("syncButton").addEventListener("click", () => syncPending(true));
}

function updateConnectivity() {
  const pill = document.getElementById("statusPill");
  if (navigator.onLine) {
    pill.textContent = "Online";
    pill.className = "status-pill online";
  } else {
    pill.textContent = "Offline ready";
    pill.className = "status-pill offline";
  }
}

function setToday() {
  const dateInput = document.getElementById("cardDate");
  if (!dateInput || dateInput.value) return;
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  dateInput.value = `${year}-${month}-${day}`;
}

async function refreshEntries() {
  const records = (await getAllRecords()).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const pending = records.filter(record => !record.synced).length;

  document.getElementById("entriesSummary").textContent = `${records.length} saved · ${pending} waiting to sync`;

  const badge = document.getElementById("queueBadge");
  badge.textContent = pending;
  badge.classList.toggle("hidden", pending === 0);

  const list = document.getElementById("entriesList");
  list.innerHTML = "";
  document.getElementById("emptyState").classList.toggle("hidden", records.length !== 0);

  for (const record of records) {
    const cardDate = record.cardDate || formatLegacyDate(record.createdAt);
    const worker = record.altarWorker || record.recordedBy || "";
    const node = document.createElement("article");
    node.className = "entry";
    node.innerHTML = `
      <div class="entry-top">
        <div>
          <div class="entry-name">${escapeHtml(record.name || "Unnamed")}</div>
          <div class="entry-meta">
            ${cardDate ? escapeHtml(displayDate(cardDate)) : ""}
            ${record.phone ? " · " + escapeHtml(record.phone) : ""}
            ${worker ? "<br>Altar worker: " + escapeHtml(worker) : ""}
          </div>
        </div>
        <span class="sync-state ${record.synced ? "synced" : "waiting"}">${record.synced ? "✓ Synced" : "Waiting"}</span>
      </div>
      ${record.synced ? "" : `<div class="entry-actions"><button class="danger" data-delete="${record.id}">DELETE</button></div>`}
    `;
    list.appendChild(node);
  }

  document.querySelectorAll("[data-delete]").forEach(button => {
    button.addEventListener("click", async () => {
      if (!confirm("Delete this unsynced entry from this phone?")) return;
      await deleteRecord(button.dataset.delete);
      await refreshEntries();
      showToast("Entry deleted");
    });
  });
}

async function syncPending(showMessages = true) {
  const url = (localStorage.getItem("syncUrl") || "").trim();

  if (!navigator.onLine) {
    if (showMessages) showToast("No internet — entries are safe on this phone");
    return;
  }

  if (!url) {
    if (showMessages) {
      showToast("Add the Google sync URL in Settings first");
      showView("settingsView");
    }
    return;
  }

  const records = await getAllRecords();
  const pending = records.filter(record => !record.synced);

  if (!pending.length) {
    if (showMessages) showToast("Everything is already synced");
    return;
  }

  if (showMessages) showToast(`Syncing ${pending.length} entr${pending.length === 1 ? "y" : "ies"}...`);

  let success = 0;

  for (const record of pending) {
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(record)
      });

      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const result = await response.json();
      if (!result.ok) throw new Error(result.error || "Sync rejected");

      record.synced = true;
      record.syncedAt = new Date().toISOString();
      await saveRecord(record);
      success++;
    } catch (error) {
      console.error("Sync failed", error);
      break;
    }
  }

  await refreshEntries();

  if (showMessages) {
    showToast(
      success === pending.length
        ? `Synced ${success} entr${success === 1 ? "y" : "ies"}`
        : `${success} synced. Remaining entries are safe on this phone.`
    );
  }
}

function formatLegacyDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function displayDate(value) {
  const parts = String(value).split("-");
  if (parts.length !== 3) return value;
  return `${parts[2]}/${parts[1]}/${parts[0]}`;
}

function value(id) {
  return document.getElementById(id).value.trim();
}

function showToast(message) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => toast.classList.add("hidden"), 2800);
}

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
