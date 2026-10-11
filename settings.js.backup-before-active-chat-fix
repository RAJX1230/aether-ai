let currentUserEmail = "";
let userDocRef = null;
let pageChats = {};
let pageCurrentChatId = null;
let pageMemoryFacts = [];
let pageSettings = { theme: "light", fontSize: "medium", aiName: "AETHER AI" };
let isPremium = false;

const pageAvatar = document.getElementById("pageAvatar");
const pageEmail = document.getElementById("pageEmail");
const pageStats = document.getElementById("pageStats");
const pageDarkBtn = document.getElementById("pageDarkBtn");
const pageLightBtn = document.getElementById("pageLightBtn");
const modelSmartBtn = document.getElementById("modelSmartBtn");
const modelFastBtn = document.getElementById("modelFastBtn");
const pageAiName = document.getElementById("pageAiName");
const memoryList = document.getElementById("memoryList");
const pageClearMemoryBtn = document.getElementById("pageClearMemoryBtn");
const memoryClearDivider = document.getElementById("memoryClearDivider");
const pageExportBtn = document.getElementById("pageExportBtn");
const pageClearBtn = document.getElementById("pageClearBtn");
const pageLogoutBtn = document.getElementById("pageLogoutBtn");
const pageSaveBtn = document.getElementById("pageSaveBtn");

auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = "login.html";
    return;
  }
  currentUserEmail = user.email;
  userDocRef = db.collection("users").doc(user.uid);
  loadPageData();
});

function getFirstNameFromEmail(email) {
  let namePart = email.split("@")[0];
  namePart = namePart.replace(/[0-9._]+$/, "");
  if (!namePart) namePart = email.split("@")[0];
  return namePart.charAt(0).toUpperCase() + namePart.slice(1);
}

async function loadPageData() {
  pageEmail.innerText = currentUserEmail;
  pageAvatar.innerText = getFirstNameFromEmail(currentUserEmail).charAt(0);

  try {
    const doc = await userDocRef.get();
    if (doc.exists) {
      const data = doc.data();
      pageChats = data.chats || {};
      pageCurrentChatId = data.currentChatId || null;
      pageMemoryFacts = data.memoryFacts || [];
      pageSettings = data.settings || { theme: "light", fontSize: "medium", aiName: "AETHER AI" };
    } else {
      pageMemoryFacts = JSON.parse(localStorage.getItem("aether_memory_" + currentUserEmail)) || [];
      pageSettings = JSON.parse(localStorage.getItem("aether_settings_" + currentUserEmail)) || { theme: "light", fontSize: "medium", aiName: "AETHER AI" };
    }
  } catch (err) {
    pageMemoryFacts = JSON.parse(localStorage.getItem("aether_memory_" + currentUserEmail)) || [];
    pageSettings = JSON.parse(localStorage.getItem("aether_settings_" + currentUserEmail)) || { theme: "light", fontSize: "medium", aiName: "AETHER AI" };
  }

  let totalMessages = 0;
  Object.values(pageChats).forEach(c => totalMessages += (c.history ? c.history.length : 0));
  isPremium = false;
  try {
    const doc2 = await userDocRef.get();
    isPremium = doc2.exists && doc2.data().isPremium === true;
  } catch (e) {}
  const tierLabel = isPremium ? " · ⭐ Premium" : " · Free";
  pageStats.innerText = `${Object.keys(pageChats).length} chats \u00b7 ${totalMessages} messages${tierLabel}`;

  applyPageSettings();
  renderMemoryList();
}

function applyPageSettings() {
  document.body.classList.toggle("dark-theme", pageSettings.theme === "dark");
  document.body.classList.remove("font-small", "font-large");
  if (pageSettings.fontSize === "small") document.body.classList.add("font-small");
  if (pageSettings.fontSize === "large") document.body.classList.add("font-large");

  pageAiName.value = pageSettings.aiName || "";

  pageDarkBtn.classList.toggle("active", pageSettings.theme === "dark");
  pageLightBtn.classList.toggle("active", pageSettings.theme === "light");

  const selectedModel = pageSettings.aiModel || "smart";
  if (modelSmartBtn) modelSmartBtn.classList.toggle("active", selectedModel !== "fast");
  if (modelFastBtn) modelFastBtn.classList.toggle("active", selectedModel === "fast");

  document.querySelectorAll(".pageFontOption").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.size === pageSettings.fontSize);
  });
}

pageDarkBtn.addEventListener("click", () => { pageSettings.theme = "dark"; applyPageSettings(); });
pageLightBtn.addEventListener("click", () => { pageSettings.theme = "light"; applyPageSettings(); });

if (modelSmartBtn) {
  modelSmartBtn.addEventListener("click", () => {
    pageSettings.aiModel = "smart";
    applyPageSettings();
    savePageSettings();
  });
}

if (modelFastBtn) {
  modelFastBtn.addEventListener("click", () => {
    pageSettings.aiModel = "fast";
    applyPageSettings();
    savePageSettings();
  });
}

document.querySelectorAll(".pageFontOption").forEach(btn => {
  btn.addEventListener("click", () => { pageSettings.fontSize = btn.dataset.size; applyPageSettings(); });
});

function renderMemoryList() {
  memoryList.innerHTML = "";

  if (pageMemoryFacts.length === 0) {
    memoryList.innerHTML = `<div class="s-row-sub">Abhi kuch bhi yaad nahi hai — chat karte hue AETHER khud seekh lega.</div>`;
    pageClearMemoryBtn.style.display = "none";
    memoryClearDivider.style.display = "none";
    return;
  }

  pageMemoryFacts.forEach((fact, idx) => {
    const item = document.createElement("div");
    item.className = "memory-item";

    const text = document.createElement("span");
    text.innerText = fact;
    item.appendChild(text);

    const removeBtn = document.createElement("button");
    removeBtn.innerText = "✕";
    removeBtn.onclick = () => {
      pageMemoryFacts.splice(idx, 1);
      saveMemoryToCloud();
      renderMemoryList();
    };
    item.appendChild(removeBtn);

    memoryList.appendChild(item);
  });

  pageClearMemoryBtn.style.display = "flex";
  memoryClearDivider.style.display = "block";
}

function saveMemoryToCloud() {
  if (userDocRef) {
    userDocRef.set({ memoryFacts: pageMemoryFacts }, { merge: true }).catch(err => console.log(err));
  }
  localStorage.setItem("aether_memory_" + currentUserEmail, JSON.stringify(pageMemoryFacts));
}

pageClearMemoryBtn.addEventListener("click", () => {
  if (!confirm("Kya aap saari memory clear karna chahte hain?")) return;
  pageMemoryFacts = [];
  saveMemoryToCloud();
  renderMemoryList();
});

function savePageSettings() {
  pageSettings.aiName = pageAiName.value.trim() || "AETHER AI";

  if (userDocRef) {
    userDocRef.set({ settings: pageSettings }, { merge: true }).catch(err => console.log(err));
  }
  localStorage.setItem("aether_settings_" + currentUserEmail, JSON.stringify(pageSettings));
}

pageSaveBtn.addEventListener("click", () => {
  savePageSettings();
  pageSaveBtn.innerText = "Saved ✓";
  setTimeout(() => { pageSaveBtn.innerText = "Save Changes"; }, 1500);
});

pageExportBtn.addEventListener("click", () => {
  if (!pageCurrentChatId || !pageChats[pageCurrentChatId] || pageChats[pageCurrentChatId].history.length === 0) {
    alert("Koi active chat nahi mili export karne ke liye.");
    return;
  }
  const chat = pageChats[pageCurrentChatId];
  let content = `AETHER AI - Chat Export\nChat Title: ${chat.title}\nExported: ${new Date().toLocaleString()}\n${"=".repeat(40)}\n\n`;

  chat.history.forEach(item => {
    if (item.role === "user") {
      const textPart = item.parts.find(p => p.text);
      content += `YOU: ${textPart ? textPart.text : "[file]"}\n\n`;
    } else {
      const textPart = item.parts.find(p => p.text);
      if (textPart) {
        const answerMatch = textPart.text.match(/Answer:(.*)/s);
        content += `AETHER: ${answerMatch ? answerMatch[1].trim() : textPart.text}\n\n`;
      }
    }
  });

  const blob = new Blob(["\ufeff" + content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${chat.title.replace(/[^a-z0-9]/gi, "_")}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

pageClearBtn.addEventListener("click", () => {
  if (!confirm("Kya aap sach mein saari chats delete karna chahte hain? Ye undo nahi ho sakta.")) return;

  pageChats = {};
  pageCurrentChatId = null;

  if (userDocRef) {
    userDocRef.set({ chats: {}, currentChatId: null }, { merge: true }).catch(err => console.log(err));
  }
  localStorage.setItem("aether_chats_" + currentUserEmail, JSON.stringify({}));
  localStorage.setItem("aether_current_chat_" + currentUserEmail, "");

  alert("Saari chats delete ho gayi.");
});

document.getElementById("backupAllBtn").addEventListener("click", () => {
  const backupData = {
    chats: pageChats,
    memoryFacts: pageMemoryFacts,
    settings: pageSettings,
    backupDate: new Date().toISOString(),
    email: currentUserEmail
  };
  const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `AETHER_Backup_${new Date().toISOString().slice(0,10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

const restoreFileInput = document.getElementById("restoreFileInput");
document.getElementById("restoreBackupBtn").addEventListener("click", () => {
  restoreFileInput.click();
});

restoreFileInput.addEventListener("change", () => {
  const file = restoreFileInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    try {
      const data = JSON.parse(reader.result);
      if (!data.chats) {
        alert("Ye valid AETHER backup file nahi hai.");
        return;
      }
      if (!confirm("Backup restore karne se abhi ki saari chats replace ho jayengi. Continue karein?")) return;

      pageChats = data.chats || {};
      pageMemoryFacts = data.memoryFacts || [];

      localStorage.setItem("aether_chats_" + currentUserEmail, JSON.stringify(pageChats));
      localStorage.setItem("aether_memory_" + currentUserEmail, JSON.stringify(pageMemoryFacts));

      if (userDocRef) {
        userDocRef.set({ chats: pageChats, memoryFacts: pageMemoryFacts }, { merge: true });
      }

      alert("Backup successfully restore ho gaya! Page refresh karein.");
      renderMemoryList();
    } catch (err) {
      alert("Backup file padhne mein error aaya.");
    }
  };
  reader.readAsText(file);
  restoreFileInput.value = "";
});

pageLogoutBtn.addEventListener("click", () => {
  if (!confirm("Kya aap logout karna chahte hain?")) return;
  auth.signOut().then(() => {
    window.location.href = "login.html";
  });
});
