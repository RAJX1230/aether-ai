const API_URL_GROUP = "https://aether-proxy.tstngfrm.workers.dev";

const joinScreen = document.getElementById("joinScreen");
const groupChatBox = document.getElementById("groupChatBox");
const groupInputArea = document.getElementById("groupInputArea");
const roomCodeBadge = document.getElementById("roomCodeBadge");
const createRoomBtn = document.getElementById("createRoomBtn");
const joinRoomBtn = document.getElementById("joinRoomBtn");
const joinCodeInput = document.getElementById("joinCodeInput");
const groupInput = document.getElementById("groupInput");
const groupSendBtn = document.getElementById("groupSendBtn");
const groupAttachBtn = document.getElementById("groupAttachBtn");
const groupFileInput = document.getElementById("groupFileInput");
const groupMicBtn = document.getElementById("groupMicBtn");

let currentUserEmail = "";
let myName = "";
let currentRoomCode = null;
let roomListener = null;
let isAiThinking = false;

auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    currentUserEmail = user.email;
    let namePart = currentUserEmail.split("@")[0].replace(/[0-9._]+$/, "");
    myName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
  }
});

function generateRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

createRoomBtn.addEventListener("click", async () => {
  const code = generateRoomCode();
  await db.collection("rooms").doc(code).set({
    messages: [],
    createdAt: firebase.firestore.FieldValue.serverTimestamp()
  });
  enterRoom(code);
});

joinRoomBtn.addEventListener("click", () => {
  const code = joinCodeInput.value.trim().toUpperCase();
  if (code.length !== 6) {
    alert("6 character ka valid room code daalein.");
    return;
  }
  db.collection("rooms").doc(code).get().then(doc => {
    if (!doc.exists) {
      alert("Ye room nahi mila. Code check karein.");
      return;
    }
    enterRoom(code);
  });
});

function enterRoom(code) {
  currentRoomCode = code;
  joinScreen.style.display = "none";
  groupChatBox.classList.add("show");
  groupInputArea.classList.add("show");
  roomCodeBadge.style.display = "inline-block";
  roomCodeBadge.innerText = code;

  roomListener = db.collection("rooms").doc(code).onSnapshot(doc => {
    if (!doc.exists) return;
    renderGroupMessages(doc.data().messages || []);
  });
}

function renderGroupMessages(messages) {
  groupChatBox.innerHTML = "";
  messages.forEach(msg => {
    const div = document.createElement("div");
    const isMine = msg.sender === myName && msg.senderEmail === currentUserEmail;
    div.className = "g-msg " + (msg.isAI ? "ai" : (isMine ? "mine" : "other"));

    const senderLabel = document.createElement("div");
    senderLabel.className = "sender";
    senderLabel.innerText = msg.isAI ? "AETHER" : msg.sender;
    div.appendChild(senderLabel);

    if (msg.image) {
      const img = document.createElement("img");
      img.src = `data:${msg.imageMime || "image/jpeg"};base64,${msg.image}`;
      div.appendChild(img);
    }

    if (msg.text) {
      const textDiv = document.createElement("div");
      textDiv.innerText = msg.text;
      div.appendChild(textDiv);
    }

    groupChatBox.appendChild(div);
  });
  groupChatBox.scrollTop = groupChatBox.scrollHeight;
}

async function postMessage(text, isAI, imageData, imageMime) {
  const roomRef = db.collection("rooms").doc(currentRoomCode);
  const msgObj = {
    sender: isAI ? "AETHER" : myName,
    senderEmail: isAI ? "ai" : currentUserEmail,
    text: text || "",
    isAI: !!isAI,
    time: Date.now()
  };
  if (imageData) {
    msgObj.image = imageData;
    msgObj.imageMime = imageMime || "image/jpeg";
  }
  await roomRef.update({
    messages: firebase.firestore.FieldValue.arrayUnion(msgObj)
  });
}

async function triggerAiIfMentioned(text) {
  if (!text || !text.toLowerCase().includes("@aether") || isAiThinking) return;
  isAiThinking = true;
  try {
    const doc = await db.collection("rooms").doc(currentRoomCode).get();
    const messages = doc.data().messages || [];
    const recent = messages.slice(-10).map(m => `${m.isAI ? "AETHER" : m.sender}: ${m.text}`).join("\n");

    const prompt = `Tum AETHER ho, ek friendly AI jo ek group study session mein help kar raha hai. Neeche group ki recent chat hai. Tumhe @aether se tag kiya gaya hai — is discussion ko dekh ke, ek helpful, chhota (2-4 sentences), Hinglish jawaab do:\n\n${recent}`;

    const response = await fetch(API_URL_GROUP, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
    });
    const data = await response.json();

    if (data.candidates) {
      const aiReply = data.candidates[0].content.parts[0].text.trim();
      await postMessage(aiReply, true);
    }
  } catch (err) {
    console.log("AI reply error:", err);
  }
  isAiThinking = false;
}

let lastGroupMsgTime = 0;
const MAX_ROOM_MESSAGES = 300;

async function sendGroupMessage() {
  const text = groupInput.value.trim();
  if (!text || !currentRoomCode) return;

  const now = Date.now();
  if (now - lastGroupMsgTime < 1200) return;
  lastGroupMsgTime = now;

  if (text.length > 500) {
    alert("Message bahut lamba hai (max 500 characters).");
    return;
  }

  const doc = await db.collection("rooms").doc(currentRoomCode).get();
  const currentCount = (doc.data().messages || []).length;
  if (currentCount >= MAX_ROOM_MESSAGES) {
    alert("Ye room bahar bhar gaya hai (limit reach ho gayi). Naya room banayein.");
    return;
  }

  groupInput.value = "";
  await postMessage(text, false);
  triggerAiIfMentioned(text);
}

groupSendBtn.addEventListener("click", sendGroupMessage);
groupInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") sendGroupMessage();
});

// ===== IMAGE SHARING (compressed, taaki room bhare na) =====
groupAttachBtn.addEventListener("click", () => groupFileInput.click());

groupFileInput.addEventListener("change", () => {
  const file = groupFileInput.files[0];
  if (!file || !currentRoomCode) return;

  const img = new Image();
  const reader = new FileReader();

  reader.onload = () => {
    img.onload = async () => {
      const canvas = document.createElement("canvas");
      const maxWidth = 700;
      const scale = Math.min(1, maxWidth / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext("2d");
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.6);
      const base64Data = compressedDataUrl.split(",")[1];

      if (base64Data.length > 400000) {
        alert("Ye image bahut badi hai, chhoti/kam-resolution image try karein.");
        return;
      }

      const doc = await db.collection("rooms").doc(currentRoomCode).get();
      const currentCount = (doc.data().messages || []).length;
      if (currentCount >= 300) {
        alert("Ye room bahar bhar gaya hai (limit reach ho gayi). Naya room banayein.");
        return;
      }

      await postMessage("", false, base64Data, "image/jpeg");
    };
    img.src = reader.result;
  };
  reader.readAsDataURL(file);
  groupFileInput.value = "";
});

// ===== VOICE TO TEXT (bol ke type karwana) =====
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let groupRecognition = null;
let isGroupListening = false;

if (SpeechRecognition) {
  groupRecognition = new SpeechRecognition();
  groupRecognition.lang = "hi-IN";
  groupRecognition.continuous = false;
  groupRecognition.interimResults = false;

  groupRecognition.onstart = () => {
    isGroupListening = true;
    groupMicBtn.classList.add("listening");
  };
  groupRecognition.onend = () => {
    isGroupListening = false;
    groupMicBtn.classList.remove("listening");
  };
  groupRecognition.onresult = (event) => {
    groupInput.value = event.results[0][0].transcript;
  };
  groupRecognition.onerror = () => {
    isGroupListening = false;
    groupMicBtn.classList.remove("listening");
  };

  groupMicBtn.addEventListener("click", () => {
    if (isGroupListening) groupRecognition.stop();
    else groupRecognition.start();
  });
} else {
  groupMicBtn.addEventListener("click", () => {
    alert("Ye browser voice support nahi karta.");
  });
}

window.addEventListener("beforeunload", () => {
  if (roomListener) roomListener();
});
