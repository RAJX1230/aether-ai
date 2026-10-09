let currentUserEmail = "";
let currentUserId = "";
let userDocRef = null;

auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    currentUserEmail = user.email;
    currentUserId = user.uid;
    userDocRef = db.collection("users").doc(currentUserId);
    document.getElementById("userEmailDisplay").innerText = currentUserEmail;
    initApp();
  }
});

document.getElementById("logoutBtn").addEventListener("click", () => {
  auth.signOut().then(() => {
    window.location.href = "login.html";
  });
});

const chatBox = document.getElementById("chatBox");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");
const micBtn = document.getElementById("micBtn");
const menuBtn = document.getElementById("menuBtn");
const sidebar = document.getElementById("sidebar");
const sidebarOverlay = document.getElementById("sidebarOverlay");
const newChatBtn = document.getElementById("newChatBtn");
const chatList = document.getElementById("chatList");
const searchChats = document.getElementById("searchChats");
const attachBtn = document.getElementById("attachBtn");
const cameraInput = document.getElementById("cameraInput");
const galleryInput = document.getElementById("galleryInput");
const filesInput = document.getElementById("filesInput");
const filePreview = document.getElementById("filePreview");
const appTitle = document.getElementById("appTitle");
const exportBtn = document.getElementById("exportBtn");
const userAvatar = document.getElementById("userAvatar");

const attachMenu = document.getElementById("attachMenu");
const attachOverlay = document.getElementById("attachOverlay");
const cameraOption = document.getElementById("cameraOption");
const galleryOption = document.getElementById("galleryOption");
const filesOption = document.getElementById("filesOption");

const settingsBtn = document.getElementById("settingsBtn");

const API_URL = "https://aether-proxy.tstngfrm.workers.dev";

const SUMMARIZE_THRESHOLD = 20;
const KEEP_RECENT = 10;

// ===== Clean SVG icons (emoji ki jagah) =====
const ICONS = {
  edit: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  trash: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 6h18M8 6V4a2 2 0 012-2h4a2 2 0 012 2v2m3 0v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6h14z"/></svg>`,
  copy: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1"/></svg>`,
  check: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>`,
  speaker: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 5L6 9H2v6h4l5 4V5z"/><path d="M15.54 8.46a5 5 0 010 7.07"/></svg>`,
  refresh: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M20.49 9A9 9 0 005.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 013.51 15"/></svg>`,
  stop: `<svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="6" width="12" height="12" rx="2"/></svg>`,
  download: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16"/></svg>`,
  expand: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7"/></svg>`,
  sparkle: `<svg class="thinking-sparkle" width="17" height="17" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0 C12.8 6.5 14 9.5 24 12 C14 14.5 12.8 17.5 12 24 C11.2 17.5 10 14.5 0 12 C10 9.5 11.2 6.5 12 0 Z"/></svg>`,
  share: `<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>`
};

let chats = {};
let currentChatId = null;
let memoryFacts = [];
let currentAbortController = null;
let isGenerating = false;
let codeBlockStore = {};
let codeBlockCounter = 0;
let pendingFile = null;
let settings = { theme: "light", fontSize: "medium", aiName: "AETHER AI" };
let saveTimeout = null;

function getFriendlyError(data) {
  console.log("Raw error:", data);
  const code = data && data.error ? data.error.code : null;
  if (code === 429) return "Abhi thoda busy hoon (limit khatam ho gayi), thodi der baad try karein 🙏";
  if (code === 503) return "Server abhi high demand mein hai, thodi der mein dobara try karein 🙏";
  if (code === 400) return "Kuch galat request gayi, dobara try karein.";
  return "Kuch gadbad ho gayi, thodi der baad try karein 🙏";
}

exportBtn.addEventListener("click", () => {
  exportCurrentChat();
  closeSidebar();
});

function stripImagesForCloud(chatsObj) {
  const clone = JSON.parse(JSON.stringify(chatsObj));
  Object.values(clone).forEach(chat => {
    chat.history.forEach(item => {
      item.parts = item.parts.map(p => {
        if (p.inline_data) {
          return { strippedImage: true, fileName: p.fileName || "image" };
        }
        return p;
      });
    });
  });
  return clone;
}

function syncToCloud() {
  localStorage.setItem("aether_chats_" + currentUserEmail, JSON.stringify(chats));
  localStorage.setItem("aether_current_chat_" + currentUserEmail, currentChatId);
  localStorage.setItem("aether_memory_" + currentUserEmail, JSON.stringify(memoryFacts));
  localStorage.setItem("aether_settings_" + currentUserEmail, JSON.stringify(settings));

  if (!userDocRef) return;
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(() => {
    userDocRef.set({
      chats: stripImagesForCloud(chats),
      currentChatId: currentChatId,
      memoryFacts: memoryFacts,
      settings: settings,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true }).catch(err => console.log("Sync error:", err));
  }, 1000);
}

function saveChats() { syncToCloud(); }
function saveCurrentChat() { syncToCloud(); }
function saveMemory() { syncToCloud(); }

function applySettings() {
  document.body.classList.toggle("dark-theme", settings.theme === "dark");
  document.body.classList.remove("font-small", "font-large");
  if (settings.fontSize === "small") document.body.classList.add("font-small");
  if (settings.fontSize === "large") document.body.classList.add("font-large");
  appTitle.innerText = settings.aiName || "AETHER AI";
}

settingsBtn.addEventListener("click", () => {
  window.location.href = "settings.html";
});

attachBtn.addEventListener("click", () => {
  attachMenu.classList.add("show");
  attachOverlay.classList.add("show");
});
function closeAttachMenu() {
  attachMenu.classList.remove("show");
  attachOverlay.classList.remove("show");
}
attachOverlay.addEventListener("click", closeAttachMenu);

cameraOption.addEventListener("click", () => {
  closeAttachMenu();
  cameraInput.click();
});
galleryOption.addEventListener("click", () => {
  closeAttachMenu();
  galleryInput.click();
});
filesOption.addEventListener("click", () => {
  closeAttachMenu();
  filesInput.click();
});

function handleFileSelect(file) {
  if (!file) return;
  if (file.size > 10 * 1024 * 1024) {
    alert("File 10MB se badi hai, chhoti file try karein.");
    return;
  }
  const reader = new FileReader();
  reader.onload = () => {
    const base64Data = reader.result.split(",")[1];
    pendingFile = {
      name: file.name,
      mimeType: file.type || "text/plain",
      base64: base64Data
    };
    showFilePreview();
  };
  reader.readAsDataURL(file);
}

cameraInput.addEventListener("change", () => {
  handleFileSelect(cameraInput.files[0]);
  cameraInput.value = "";
});
galleryInput.addEventListener("change", () => {
  handleFileSelect(galleryInput.files[0]);
  galleryInput.value = "";
});
filesInput.addEventListener("change", () => {
  handleFileSelect(filesInput.files[0]);
  filesInput.value = "";
});

function showFilePreview() {
  filePreview.classList.add("show");
  filePreview.innerHTML = "";

  if (pendingFile.mimeType.startsWith("image/")) {
    const img = document.createElement("img");
    img.src = `data:${pendingFile.mimeType};base64,${pendingFile.base64}`;
    filePreview.appendChild(img);
  }

  const info = document.createElement("div");
  info.className = "file-info";
  info.innerText = "Image attached";
  filePreview.appendChild(info);

  const removeBtn = document.createElement("button");
  removeBtn.className = "remove-file";
  removeBtn.innerText = "✕";
  removeBtn.onclick = () => {
    pendingFile = null;
    filePreview.classList.remove("show");
    filePreview.innerHTML = "";
  };
  filePreview.appendChild(removeBtn);
}

function createNewChat() {
  const id = "chat_" + Date.now();
  chats[id] = { title: "New Chat", history: [], summary: "", summarizedUpTo: 0 };
  currentChatId = id;
  saveChats();
  saveCurrentChat();
  renderChatList();
  renderMessages();
  closeSidebar();
}

function getCurrentHistory() {
  if (!currentChatId || !chats[currentChatId]) return [];
  return chats[currentChatId].history;
}

function sanitizeForAPI(history) {
  return history.map(item => ({
    role: item.role,
    parts: item.parts.filter(p => p.text !== undefined || p.inline_data).map(p => {
      if (p.inline_data) {
        return { inline_data: { mime_type: p.inline_data.mime_type, data: p.inline_data.data } };
      }
      return { text: p.text };
    })
  }));
}

async function maybeSummarizeChat(chatId) {
  const chat = chats[chatId];
  if (!chat) return;
  if (chat.summarizedUpTo === undefined) chat.summarizedUpTo = 0;
  if (chat.summary === undefined) chat.summary = "";

  const unsummarizedCount = chat.history.length - chat.summarizedUpTo;
  if (unsummarizedCount < SUMMARIZE_THRESHOLD) return;

  const cutoff = chat.history.length - KEEP_RECENT;
  const toSummarize = chat.history.slice(chat.summarizedUpTo, cutoff);
  if (toSummarize.length === 0) return;

  let transcript = "";
  toSummarize.forEach(item => {
    const textPart = item.parts.find(p => p.text);
    if (!textPart) return;
    const cleanText = textPart.text.replace(/Thinking:.*?Answer:/s, "").replace(/MEMORY:.*/s, "").trim();
    transcript += (item.role === "user" ? "User: " : "AI: ") + cleanText + "\n";
  });

  try {
    const prompt = `Ye ek purani conversation ka hissa hai. Ise 4-5 lines mein concise summary banao (Hinglish mein):\n\n${transcript}${chat.summary ? "\n\nPurana summary bhi merge karo:\n" + chat.summary : ""}`;

    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
    });
    const data = await response.json();
    if (data.candidates) {
      chat.summary = data.candidates[0].content.parts[0].text.trim();
      chat.summarizedUpTo = cutoff;
      saveChats();
    }
  } catch (err) {
    console.log("Summarization skipped:", err);
  }
}

function chatMatchesFilter(chat, filter) {
  if (!filter) return true;
  const f = filter.toLowerCase();
  if (chat.title.toLowerCase().includes(f)) return true;
  return chat.history.some(item => {
    const textPart = item.parts.find(p => p.text);
    if (!textPart) return false;
    return textPart.text.toLowerCase().includes(f);
  });
}

function renderChatList(filter = "") {
  chatList.innerHTML = "";
  const ids = Object.keys(chats).sort((a, b) => b.localeCompare(a));

  ids.forEach(id => {
    const chat = chats[id];
    if (!chatMatchesFilter(chat, filter)) return;

    const item = document.createElement("div");
    item.className = "chat-item" + (id === currentChatId ? " active" : "");

    const titleSpan = document.createElement("span");
    titleSpan.className = "chat-item-title";
    titleSpan.innerText = chat.title;
    titleSpan.onclick = () => {
      currentChatId = id;
      saveCurrentChat();
      renderChatList(searchChats.value);
      renderMessages();
      closeSidebar();
    };

    const actions = document.createElement("div");
    actions.className = "chat-item-actions";

    const renameBtn = document.createElement("button");
    renameBtn.innerHTML = ICONS.edit;
    renameBtn.onclick = (e) => {
      e.stopPropagation();
      const newTitle = prompt("Naya naam dein:", chat.title);
      if (newTitle && newTitle.trim()) {
        chat.title = newTitle.trim();
        saveChats();
        renderChatList(searchChats.value);
      }
    };

    const deleteBtn = document.createElement("button");
    deleteBtn.innerHTML = ICONS.trash;
    deleteBtn.onclick = (e) => {
      e.stopPropagation();
      if (confirm(`"${chat.title}" delete karein?`)) {
        delete chats[id];
        saveChats();
        if (currentChatId === id) {
          currentChatId = null;
          saveCurrentChat();
        }
        renderChatList(searchChats.value);
        renderMessages();
      }
    };

    actions.appendChild(renameBtn);
    actions.appendChild(deleteBtn);
    item.appendChild(titleSpan);
    item.appendChild(actions);
    chatList.appendChild(item);
  });
}

function openSidebar() {
  sidebar.classList.add("open");
  sidebarOverlay.classList.add("show");
}
function closeSidebar() {
  sidebar.classList.remove("open");
  sidebarOverlay.classList.remove("show");
}
menuBtn.addEventListener("click", openSidebar);
sidebarOverlay.addEventListener("click", closeSidebar);
newChatBtn.addEventListener("click", createNewChat);
searchChats.addEventListener("input", () => renderChatList(searchChats.value));

function escapeHtml(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function highlightCode(code) {
  let html = escapeHtml(code);
  const placeholders = [];
  function stash(match) {
    placeholders.push(match);
    return "%%TOK" + (placeholders.length - 1) + "%%";
  }
  html = html.replace(/(#|\/\/).*$/gm, m => stash(`<span class="tok-comment">${m}</span>`));
  html = html.replace(/("(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*')/g, m => stash(`<span class="tok-str">${m}</span>`));
  const keywords = ["const","let","var","function","return","if","else","for","while","import","from","export","default","class","new","try","catch","async","await","def","elif","print","True","False","None","self","in","of","this","break","continue","switch","case"];
  const kwPattern = new RegExp("\\b(" + keywords.join("|") + ")\\b", "g");
  html = html.replace(kwPattern, m => stash(`<span class="tok-kw">${m}</span>`));
  html = html.replace(/\b([a-zA-Z_][a-zA-Z0-9_]*)(?=\()/g, m => stash(`<span class="tok-fn">${m}</span>`));
  html = html.replace(/\b(\d+\.?\d*)\b/g, m => stash(`<span class="tok-num">${m}</span>`));
  placeholders.forEach((val, i) => {
    html = html.replace("%%TOK" + i + "%%", val);
  });
  return html;
}

function formatText(text) {
  const fenceCount = (text.match(/```/g) || []).length;
  if (fenceCount % 2 !== 0) text = text + "\n```";
  let codeBlocks = [];
  let working = text.replace(/```(\w*)\n?([\s\S]*?)```/g, (match, lang, code) => {
    const id = "cb_" + (codeBlockCounter++);
    codeBlockStore[id] = code.trim();
    codeBlocks.push({ id, lang: lang || "code", code: code.trim() });
    return `%%CODEBLOCK_${id}%%`;
  });

  working = escapeHtml(working);
  working = working.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
  working = working.replace(/`([^`]+)`/g, '<span class="inline-code">$1</span>');
  working = working.replace(/^### (.*)$/gm, "<h3>$1</h3>");
  working = working.replace(/^## (.*)$/gm, "<h3>$1</h3>");
  working = working.replace(/^- (.*)$/gm, "<li>$1</li>");
  working = working.replace(/(<li>.*<\/li>)/gs, "<ul>$1</ul>");
  working = working.replace(/\n/g, "<br>");
  working = "<p>" + working + "</p>";

  codeBlocks.forEach(cb => {
    const highlighted = highlightCode(cb.code);
    const block = `
      <div class="code-block" id="${cb.id}">
        <div class="code-block-header">
          <span>${cb.lang}</span>
          <div class="code-block-actions">
            <button onclick="copyCodeBlock('${cb.id}', this)" title="Copy">${ICONS.copy}</button>
            <button onclick="toggleCodeExpand('${cb.id}')" title="Expand">${ICONS.expand}</button>
          </div>
        </div>
        <pre>${highlighted}</pre>
      </div>`;
    working = working.replace(`%%CODEBLOCK_${cb.id}%%`, block);
  });

  return working;
}

function copyCodeBlock(id, btn) {
  const code = codeBlockStore[id];
  navigator.clipboard.writeText(code);
  const original = btn.innerHTML;
  btn.innerHTML = ICONS.check + " Copied";
  setTimeout(() => (btn.innerHTML = original), 1500);
}
window.copyCodeBlock = copyCodeBlock;

function toggleCodeExpand(id) {
  const el = document.getElementById(id);
  if (el) el.classList.toggle("expanded");
}
window.toggleCodeExpand = toggleCodeExpand;

function speakText(text) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "hi-IN";
  utterance.rate = 1;
  window.speechSynthesis.speak(utterance);
}

function addUserMessage(text, index, fileData) {
  const msg = document.createElement("div");
  msg.className = "message user-msg";

  if (fileData) {
    if (fileData.notSynced) {
      const chip = document.createElement("div");
      chip.className = "file-chip";
      chip.innerText = "📎 " + fileData.name + " (is device tak limited)";
      msg.appendChild(chip);
    } else if (fileData.mimeType.startsWith("image/")) {
      const img = document.createElement("img");
      img.src = `data:${fileData.mimeType};base64,${fileData.base64}`;
      msg.appendChild(img);
    } else {
      const chip = document.createElement("div");
      chip.className = "file-chip";
      chip.innerText = "📎 " + fileData.name;
      msg.appendChild(chip);
    }
  }

  if (text) {
    const textDiv = document.createElement("div");
    textDiv.innerText = text;
    msg.appendChild(textDiv);
  }

  const actions = document.createElement("div");
  actions.className = "msg-actions";
  const editBtn = document.createElement("button");
  editBtn.innerHTML = ICONS.edit + " Edit";
  editBtn.onclick = () => editMessage(index);
  actions.appendChild(editBtn);
  msg.appendChild(actions);

  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}

function buildAIMessageActions(text, isLast) {
  const actions = document.createElement("div");
  actions.className = "msg-actions";

  const copyBtn = document.createElement("button");
  copyBtn.innerHTML = ICONS.copy + " Copy";
  copyBtn.onclick = () => {
    navigator.clipboard.writeText(text);
    copyBtn.innerHTML = ICONS.check + " Copied";
    setTimeout(() => (copyBtn.innerHTML = ICONS.copy + " Copy"), 1500);
  };
  actions.appendChild(copyBtn);

  const speakBtn = document.createElement("button");
  speakBtn.innerHTML = ICONS.speaker + " Sunein";
  speakBtn.onclick = () => speakText(text);
  actions.appendChild(speakBtn);

  if (navigator.share) {
    const shareBtn = document.createElement("button");
    shareBtn.innerHTML = ICONS.share + " Share";
    shareBtn.onclick = () => {
      navigator.share({ text: text, title: settings.aiName }).catch(() => {});
    };
    actions.appendChild(shareBtn);
  }

  if (isLast) {
    const regenBtn = document.createElement("button");
    regenBtn.innerHTML = ICONS.refresh + " Regenerate";
    regenBtn.onclick = () => regenerateResponse();
    actions.appendChild(regenBtn);
  }
  return actions;
}

function addAIMessage(text, isLast, animate) {
  const msg = document.createElement("div");
  msg.className = "message ai-msg";
  const hasCode = text.includes("```");
  if (hasCode) msg.classList.add("has-code");
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;

  if (!animate) {
    msg.innerHTML = formatText(text);
    msg.appendChild(buildAIMessageActions(text, isLast));
    return msg;
  }

  const textHolder = document.createElement("span");
  textHolder.style.padding = "0 14px";
  textHolder.style.display = "block";
  msg.appendChild(textHolder);

  let i = 0;
  const step = Math.max(2, Math.round(text.length / 120));
  const interval = setInterval(() => {
    i += step;
    textHolder.innerText = text.slice(0, i);
    chatBox.scrollTop = chatBox.scrollHeight;
    if (i >= text.length) {
      clearInterval(interval);
      msg.innerHTML = formatText(text);
      msg.appendChild(buildAIMessageActions(text, isLast));
      chatBox.scrollTop = chatBox.scrollHeight;
    }
  }, 18);

  return msg;
}

function addAIImageMessage(base64, mimeType, directUrl) {
  const msg = document.createElement("div");
  msg.className = "message ai-msg";

  const img = document.createElement("img");
  img.src = directUrl ? directUrl : `data:${mimeType};base64,${base64}`;
  msg.appendChild(img);

  const actions = document.createElement("div");
  actions.className = "msg-actions";

  const downloadBtn = document.createElement("button");
  downloadBtn.innerHTML = ICONS.download + " Download";
  downloadBtn.onclick = () => {
    const a = document.createElement("a");
    a.href = directUrl ? directUrl : `data:${mimeType};base64,${base64}`;
    a.target = "_blank";
    a.download = "aether_image_" + Date.now() + ".png";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  actions.appendChild(downloadBtn);

  msg.appendChild(actions);
  chatBox.appendChild(msg);
  chatBox.scrollTop = chatBox.scrollHeight;
  return msg;
}

const THINKING_PHRASES = [
  "Samajh raha hoon...",
  "Soch raha hoon...",
  "Dimaag laga raha hoon...",
  "Jawaab taiyar ho raha hai...",
  "Bas ek second..."
];

function addThinkingDots(label) {
  const el = document.createElement("div");
  el.className = "thinking-box thinking-sparkle-row";
  const textSpan = document.createElement("span");
  textSpan.innerText = label || THINKING_PHRASES[0];
  el.innerHTML = ICONS.sparkle;
  el.appendChild(textSpan);
  chatBox.appendChild(el);
  chatBox.scrollTop = chatBox.scrollHeight;

  if (!label) {
    let idx = 0;
    const cycleInterval = setInterval(() => {
      if (!document.body.contains(el)) {
        clearInterval(cycleInterval);
        return;
      }
      idx = (idx + 1) % THINKING_PHRASES.length;
      textSpan.innerText = THINKING_PHRASES[idx];
    }, 1800);
  }

  return el;
}

function addStopButton() {
  const btn = document.createElement("button");
  btn.className = "stop-btn";
  btn.innerHTML = ICONS.stop + " Stop";
  btn.onclick = () => {
    if (currentAbortController) currentAbortController.abort();
  };
  chatBox.appendChild(btn);
  chatBox.scrollTop = chatBox.scrollHeight;
  return btn;
}

function addRetryButton(onRetry) {
  const btn = document.createElement("button");
  btn.className = "stop-btn";
  btn.innerHTML = ICONS.refresh + " Retry";
  btn.onclick = () => {
    btn.remove();
    onRetry();
  };
  chatBox.appendChild(btn);
  chatBox.scrollTop = chatBox.scrollHeight;
  return btn;
}

function getFirstName() {
  let namePart = currentUserEmail.split("@")[0];
  namePart = namePart.replace(/[0-9._]+$/, "");
  if (!namePart) namePart = currentUserEmail.split("@")[0];
  return namePart.charAt(0).toUpperCase() + namePart.slice(1);
}

function getModeInstruction(latestUserText) {
  const t = (latestUserText || "").toLowerCase().trim();
  if (t.startsWith("/explain")) {
    return `\n\nSPECIAL MODE - EXPLAIN: Tum ek acha, patient teacher jaisa samjhao — chhote steps mein, simple words mein, ek real-life example zaroor do.`;
  }
  if (t.startsWith("/quiz")) {
    return `\n\nSPECIAL MODE - QUIZ: Upar attach ki gayi file/notes se 5 quiz questions banao (mix MCQ + short-answer), end mein "Answers:" section mein sabhi answers do.`;
  }
  if (t.startsWith("/summarize")) {
    return `\n\nSPECIAL MODE - SUMMARIZE: Content ka concise summary do, bullet points mein, sirf important key points.`;
  }
  if (t.startsWith("/flashcards")) {
    return `\n\nSPECIAL MODE - FLASHCARDS: Kam se kam 6 flashcard Q&A pairs banao: "Q: ...\\nA: ..." format mein.`;
  }
  if (t.startsWith("/debug")) {
    return `\n\nSPECIAL MODE - DEBUG: User ne code diya hai jisme error hai. Bug dhoondo, fixed code do (\`\`\` block mein), 1-2 line mein simple bhasha mein galti batao.`;
  }
  return "";
}

function showWelcome() {
  chatBox.innerHTML = `
    <div class="welcome-screen">
      <h2>Welcome, ${getFirstName()}!</h2>
      <p>Kuch bhi pucho — ya try karo: /explain, /quiz, /summarize, /flashcards, /debug</p>
      <div class="suggestions">
        <div class="suggestion-chip" data-text="/explain photosynthesis kaise hoti hai">Explain karo</div>
        <div class="suggestion-chip" data-text="/debug ">Debug code</div>
        <div class="suggestion-chip" data-text="Ek motivational quote batao">Motivation</div>
        <div class="suggestion-chip" data-text="Mera naam kya hai">Naam pucho</div>
      </div>
    </div>`;

  document.querySelectorAll(".suggestion-chip").forEach(chip => {
    chip.addEventListener("click", () => {
      userInput.value = chip.dataset.text;
      userInput.focus();
    });
  });
}

function renderMessages() {
  chatBox.innerHTML = "";
  const history = getCurrentHistory();

  if (!currentChatId || history.length === 0) {
    showWelcome();
    return;
  }

  history.forEach((item, idx) => {
    if (item.role === "user") {
      const textPart = item.parts.find(p => p.text);
      const filePart = item.parts.find(p => p.inline_data);
      const strippedPart = item.parts.find(p => p.strippedImage);
      let fileData = null;
      if (filePart) {
        fileData = {
          mimeType: filePart.inline_data.mime_type,
          base64: filePart.inline_data.data,
          name: filePart.fileName || "File"
        };
      } else if (strippedPart) {
        fileData = { notSynced: true, name: strippedPart.fileName || "Image" };
      }
      addUserMessage(textPart ? textPart.text : "", idx, fileData);
    } else {
      const imgPart = item.parts.find(p => p.inline_data);
      const urlPart = item.parts.find(p => p.imageUrl);
      const strippedImgPart = item.parts.find(p => p.strippedImage);
      if (imgPart) {
        addAIImageMessage(imgPart.inline_data.data, imgPart.inline_data.mime_type);
        return;
      }
      if (urlPart) {
        addAIImageMessage(null, null, urlPart.imageUrl);
        return;
      }
      if (strippedImgPart) {
        addAIMessage("📎 Ye image sirf us device pe hai jaha banayi gayi thi.", idx === history.length - 1, false);
        return;
      }
      const text = item.parts[0].text;
      const thinkMatch = text.match(/Thinking:(.*?)Answer:/s);
      const answerMatch = text.match(/Answer:(.*)/s);
      if (thinkMatch) {
        const t = document.createElement("div");
        t.className = "thinking-box";
        t.innerText = "💭 " + thinkMatch[1].trim();
        chatBox.appendChild(t);
      }
      const isLast = idx === history.length - 1;
      addAIMessage(answerMatch ? answerMatch[1].trim() : text, isLast, false);
    }
  });
}

function editMessage(index) {
  const history = getCurrentHistory();
  const textPart = history[index].parts.find(p => p.text);
  const oldText = textPart ? textPart.text : "";
  const newText = prompt("Message edit karein:", oldText);
  if (newText === null || !newText.trim()) return;

  history.splice(index);
  history.push({ role: "user", parts: [{ text: newText.trim() }] });
  if (chats[currentChatId].summarizedUpTo > history.length) {
    chats[currentChatId].summarizedUpTo = 0;
    chats[currentChatId].summary = "";
  }
  saveChats();
  renderMessages();
  generateResponse();
}

function regenerateResponse() {
  const history = getCurrentHistory();
  if (history.length > 0 && history[history.length - 1].role === "model") {
    history.pop();
  }
  saveChats();
  renderMessages();
  generateResponse();
}

async function generateImageFlow(prompt) {
  const history = getCurrentHistory();
  isGenerating = true;
  sendBtn.disabled = true;

  const thinkingEl = addThinkingDots(settings.aiName + " image bana raha hai");

  try {
    const response = await fetch(
      "https://aether-proxy.tstngfrm.workers.dev?provider=image",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt + ", highly detailed, sharp focus, professional quality, cinematic lighting",
          width: 1024,
          height: 1024
        })
      }
    );

    const data = await response.json();

    if (!response.ok || !data.image_url) {
      throw new Error(data?.error?.message || "Image generation failed");
    }

    const imageUrl = data.image_url;

    thinkingEl.remove();
    addAIImageMessage(null, null, imageUrl);

    history.push({ role: "model", parts: [{ imageUrl: imageUrl }] });
    saveChats();

  } catch (err) {
    thinkingEl.remove();
    console.error("AETHER image generation error:", err);
    addAIMessage("Image generate nahi ho payi. Service busy ho sakti hai ya request fail hui hai. Dobara try karein.", false, true);
    addRetryButton(() => generateImageFlow(prompt));
  } finally {
    sendBtn.disabled = false;
    isGenerating = false;
  }
}

async function generateResponse() {
  const history = getCurrentHistory();
  const chat = chats[currentChatId];
  isGenerating = true;
  sendBtn.disabled = true;

  const thinkingEl = addThinkingDots();
  const stopBtn = addStopButton();
  currentAbortController = new AbortController();

  try {
    const memoryContext = memoryFacts.length > 0
      ? `\n\nYe important baatein tumhe pehle se yaad hain user ke baare mein:\n${memoryFacts.map(f => "- " + f).join("\n")}`
      : "";

    const summaryContext = chat.summary
      ? `\n\nIs conversation ki purani baaton ka summary:\n${chat.summary}`
      : "";

    const lastUserMsg = [...history].reverse().find(h => h.role === "user");
    const lastUserText = lastUserMsg ? (lastUserMsg.parts.find(p => p.text) || {}).text : "";
    const modeInstruction = getModeInstruction(lastUserText);

    const modelIdentityInstruction = settings.aiModel === "fast"
      ? "Tumhara current model provider Groq hai aur configured model openai/gpt-oss-120b hai. Agar user model poochhe, ye naam sach-sach batao. Khud ko GPT-4 mat kehna."
      : "Tumhara current mode Gemini-powered Smart mode hai. Agar user model poochhe, Gemini-powered mode batao; bina pakke saboot ke GPT-4 ya kisi doosre model ka claim mat karna.";

    const systemInstruction = `Tum ${settings.aiName} ho — ek personal AI assistant, jise Vimal Raj aur Aniruddha ne co-create kiya hai.

Bahut zaroori: tum HAMESHA "${settings.aiName}" ke roop mein baat karte ho. Tum warm, casual aur natural Hinglish mein jawab dete ho. Apne creator, model ya capabilities ke baare mein kabhi galat daawa mat karo. ${modelIdentityInstruction}

Agar user koi file (image, PDF, text) bheje, to uske available content ko dekh/padh kar uske baare mein baat karo. Agar user image generate karne ko kahe, to available image-generation feature use karo; sirf image prompt likh kar ruk mat jaana.${modeInstruction}

Seedha useful jawaab do. Zaroorat pade to **bold** text, "- " se list, ya code ke liye \`\`\`language ... \`\`\` use kar sakte ho.${memoryContext}${summaryContext}

Agar user koi naya important fact bataye, to Answer ke end mein: MEMORY: <fact>. Agar naya fact nahi hai, to MEMORY line mat likhna.`;

    const apiHistory = history.slice(chat.summarizedUpTo || 0);
    const providerParam = settings.aiModel === "fast" ? "?provider=groq" : "";

    let data;
    for (let i = 0; i < 3; i++) {
      const response = await fetch(API_URL + providerParam, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: currentAbortController.signal,
        body: JSON.stringify({
          system_instruction: { parts: [{ text: systemInstruction }] },
          contents: sanitizeForAPI(apiHistory)
        })
      });
      data = await response.json();
      if (data.error && data.error.code === 503 && i < 2) {
        await new Promise(res => setTimeout(res, 1500 * (i + 1)));
        continue;
      }
      break;
    }

    thinkingEl.remove();
    stopBtn.remove();

    if (!data.candidates) {
      addAIMessage(getFriendlyError(data), false, true);
      addRetryButton(() => generateResponse());
      sendBtn.disabled = false;
      isGenerating = false;
      return;
    }

    let fullText = data.candidates[0].content.parts[0].text;

    const memMatch = fullText.match(/MEMORY:\s*(.*)/);
    if (memMatch) {
      const fact = memMatch[1].trim();
      if (fact && !memoryFacts.includes(fact)) {
        memoryFacts.push(fact);
        saveMemory();
      }
      fullText = fullText.replace(/MEMORY:\s*.*/, "").trim();
    }

    const thinkMatch = fullText.match(/Thinking:(.*?)Answer:/s);
    const answerMatch = fullText.match(/Answer:(.*)/s);

    if (thinkMatch) {
      const t = document.createElement("div");
      t.className = "thinking-box";
      t.innerText = "💭 " + thinkMatch[1].trim();
      chatBox.appendChild(t);
    }

    const finalAnswer = answerMatch ? answerMatch[1].trim() : fullText;
    addAIMessage(finalAnswer, true, true);

    history.push({ role: "model", parts: [{ text: fullText }] });
    saveChats();

    maybeSummarizeChat(currentChatId);

  } catch (err) {
    thinkingEl.remove();
    stopBtn.remove();
    if (err.name === "AbortError") {
      addAIMessage("⏹️ Response rok diya gaya.", false, true);
    } else {
      addAIMessage("Kuch gadbad ho gayi, dobara try karein 🙏", false, true);
      addRetryButton(() => generateResponse());
    }
  }

  sendBtn.disabled = false;
  isGenerating = false;
  currentAbortController = null;
}

let lastMessageTime = 0;

async function sendMessage() {
  const question = userInput.value.trim();
  if ((!question && !pendingFile) || isGenerating) return;

  const now = Date.now();
  if (now - lastMessageTime < 1200) {
    return;
  }
  lastMessageTime = now;

  if (question.length > 2000) {
    alert("Message bahut lamba hai (max 2000 characters).");
    return;
  }

  if (!currentChatId) createNewChat();

  const history = getCurrentHistory();
  if (history.length === 0) chatBox.innerHTML = "";

  const lowerQuestion = question.toLowerCase().trim();
  const explicitImageCommand = lowerQuestion.startsWith("/image ");
  const automaticImageRequest =
    /^(please\s+)?(generate|create|make|draw|design|paint)\s+(me\s+)?(an?\s+)?(image|picture|photo|illustration|artwork|drawing)\b/i.test(question) ||
    /^(please\s+)?(show|draw|create|generate)\s+(me\s+)?(a\s+)?(picture|photo|image)\s+of\b/i.test(question) ||
    /^(image|picture|photo)\s+of\b/i.test(question);

  if (explicitImageCommand || automaticImageRequest) {
    const imgPrompt = explicitImageCommand
      ? question.slice(7).trim()
      : question.trim();
    addUserMessage(question, history.length, null);
    userInput.value = "";
    history.push({ role: "user", parts: [{ text: question }] });

    if (chats[currentChatId].title === "New Chat" && history.length === 1) {
      chats[currentChatId].title = "🎨 " + imgPrompt.slice(0, 25);
      renderChatList(searchChats.value);
    }
    generateImageFlow(imgPrompt);
    return;
  }

  const parts = [];
  let fileForDisplay = null;

  if (pendingFile) {
    parts.push({
      inline_data: { mime_type: pendingFile.mimeType, data: pendingFile.base64 },
      fileName: pendingFile.name
    });
    fileForDisplay = pendingFile;
  }

  if (question) {
    parts.push({ text: question });
  }

  addUserMessage(question, history.length, fileForDisplay);
  userInput.value = "";

  history.push({ role: "user", parts: parts });

  if (chats[currentChatId].title === "New Chat" && history.length === 1) {
    chats[currentChatId].title = question ? question.slice(0, 30) : "📎 " + (pendingFile ? pendingFile.name : "File");
    renderChatList(searchChats.value);
  }

  pendingFile = null;
  filePreview.classList.remove("show");
  filePreview.innerHTML = "";

  generateResponse();
}

sendBtn.addEventListener("click", sendMessage);
userInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendMessage();
});

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;
let isListening = false;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "hi-IN";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => { isListening = true; micBtn.classList.add("listening"); };
  recognition.onend = () => { isListening = false; micBtn.classList.remove("listening"); };
  recognition.onresult = (event) => { userInput.value = event.results[0][0].transcript; };
  recognition.onerror = () => { isListening = false; micBtn.classList.remove("listening"); };

  micBtn.addEventListener("click", () => {
    if (isListening) recognition.stop();
    else recognition.start();
  });
} else {
  micBtn.addEventListener("click", () => {
    alert("Ye browser voice input support nahi karta. Chrome use karein.");
  });
}

async function initApp() {
  chatBox.innerHTML = `<div class="welcome-screen"><img src="logo.svg" class="splash-logo" alt="AETHER"></div>`;

  try {
    const doc = await userDocRef.get();
    const localChats = JSON.parse(localStorage.getItem("aether_chats_" + currentUserEmail)) || {};
    const hasLocalData = Object.keys(localChats).length > 0;

    if (doc.exists) {
      const data = doc.data();
      chats = hasLocalData ? localChats : (data.chats || {});
      memoryFacts = data.memoryFacts || [];
      settings = data.settings || { theme: "light", fontSize: "medium", aiName: "AETHER AI" };
    } else {
      chats = JSON.parse(localStorage.getItem("aether_chats_" + currentUserEmail)) || {};
      memoryFacts = JSON.parse(localStorage.getItem("aether_memory_" + currentUserEmail)) || [];
      settings = { theme: "light", fontSize: "medium", aiName: "AETHER AI" };
      syncToCloud();
    }
  } catch (err) {
    chats = JSON.parse(localStorage.getItem("aether_chats_" + currentUserEmail)) || {};
    memoryFacts = JSON.parse(localStorage.getItem("aether_memory_" + currentUserEmail)) || [];
    settings = JSON.parse(localStorage.getItem("aether_settings_" + currentUserEmail)) || { theme: "light", fontSize: "medium", aiName: "AETHER AI" };
  }

  Object.values(chats).forEach(c => {
    if (c.summary === undefined) c.summary = "";
    if (c.summarizedUpTo === undefined) c.summarizedUpTo = 0;
  });

  currentChatId = null;

  userAvatar.innerText = getFirstName().charAt(0);
  applySettings();
  renderChatList();
  renderMessages();
}
