const API_URL_VOICE = "https://aether-proxy.tstngfrm.workers.dev";

const voiceScreen = document.getElementById("voiceScreen");
const statusText = document.getElementById("statusText");
const transcriptText = document.getElementById("transcriptText");
const muteBtn = document.getElementById("muteBtn");
const langToggleBtn = document.getElementById("langToggleBtn");

let currentUserEmail = "";
let conversationHistory = [];
let isMuted = false;
let voiceModeActive = true;
let currentLang = "hi-IN";
let bestVoice = null;

auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    currentUserEmail = user.email;
    startListening();
  }
});

function pickBestVoice() {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return;

  const wantLang = currentLang === "hi-IN" ? "hi" : "en";
  const candidates = voices.filter(v => v.lang.toLowerCase().startsWith(wantLang));

  bestVoice =
    candidates.find(v => /google/i.test(v.name) && /female/i.test(v.name)) ||
    candidates.find(v => /google/i.test(v.name)) ||
    (wantLang === "en" ? voices.find(v => v.lang === "en-IN") : null) ||
    candidates[0] ||
    voices[0];
}
if ("speechSynthesis" in window) {
  pickBestVoice();
  window.speechSynthesis.onvoiceschanged = pickBestVoice;
}

langToggleBtn.addEventListener("click", () => {
  currentLang = currentLang === "hi-IN" ? "en-IN" : "hi-IN";
  langToggleBtn.innerText = currentLang === "hi-IN" ? "हिं / EN" : "EN / हिं";
  pickBestVoice();
  if (recognition) recognition.lang = currentLang;
});

function setState(state, text) {
  voiceScreen.className = "voice-screen state-" + state;
  statusText.innerText = text;
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (!SpeechRecognition) {
  setState("idle", "Voice not supported on this browser");
} else {
  recognition = new SpeechRecognition();
  recognition.lang = currentLang;
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    setState("listening", "Listening...");
    transcriptText.innerText = "";
  };

  recognition.onresult = (event) => {
    const spokenText = event.results[0][0].transcript;
    transcriptText.innerText = spokenText;
    handleUserSpeech(spokenText);
  };

  recognition.onerror = (event) => {
    if (event.error === "no-speech") {
      startListening();
    } else {
      setState("idle", "Mic error, try again");
    }
  };

  recognition.onend = () => {};
}

function startListening() {
  if (!voiceModeActive || !recognition) return;
  try {
    recognition.start();
  } catch (e) {}
}

async function handleUserSpeech(text) {
  if (!text || !text.trim()) {
    startListening();
    return;
  }

  setState("thinking", "Thinking...");

  conversationHistory.push({ role: "user", parts: [{ text: text }] });

  try {
    const langNote = currentLang === "hi-IN"
      ? "Hinglish mein (Roman script) chhote, natural jawaab do."
      : "Reply naturally in English only.";

    const systemInstruction = `You are AETHER, a friendly AI companion having a live voice conversation. ${langNote} Keep replies short (2-3 sentences max), warm and conversational, like a real phone call. Never write labels like "Thinking:" or "Answer:" — just reply directly.`;

    const response = await fetch(API_URL_VOICE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemInstruction }] },
        contents: conversationHistory
      })
    });
    const data = await response.json();

    if (!data.candidates) {
      setState("idle", "Something went wrong, try again");
      setTimeout(startListening, 1500);
      return;
    }

    const replyText = data.candidates[0].content.parts[0].text.trim();
    conversationHistory.push({ role: "model", parts: [{ text: replyText }] });

    transcriptText.innerText = replyText;
    speakReply(replyText);

  } catch (err) {
    setState("idle", "Network error, try again");
    setTimeout(startListening, 1500);
  }
}

function speakReply(text) {
  if (isMuted) {
    startListening();
    return;
  }

  setState("speaking", "Speaking...");

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = currentLang;
  if (bestVoice) utterance.voice = bestVoice;
  utterance.rate = 0.97;
  utterance.pitch = 1.02;

  utterance.onend = () => {
    if (voiceModeActive) startListening();
  };

  window.speechSynthesis.speak(utterance);
}

muteBtn.addEventListener("click", () => {
  isMuted = !isMuted;
  muteBtn.classList.toggle("muted", isMuted);
  if (isMuted) {
    window.speechSynthesis.cancel();
  }
});

window.addEventListener("beforeunload", () => {
  voiceModeActive = false;
  if (recognition) recognition.abort();
  window.speechSynthesis.cancel();
});
