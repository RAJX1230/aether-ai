const API_URL_VOICE = "https://aether-proxy.tstngfrm.workers.dev";

const voiceScreen = document.getElementById("voiceScreen");
const statusText = document.getElementById("statusText");
const transcriptText = document.getElementById("transcriptText");
const muteBtn = document.getElementById("muteBtn");

let currentUserEmail = "";
let conversationHistory = [];
let isMuted = false;
let voiceModeActive = true;

auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    currentUserEmail = user.email;
    startListening();
  }
});

function setState(state, text) {
  voiceScreen.className = "voice-screen state-" + state;
  statusText.innerText = text;
}

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (!SpeechRecognition) {
  setState("idle", "Ye browser voice support nahi karta");
} else {
  recognition = new SpeechRecognition();
  recognition.lang = "hi-IN";
  recognition.continuous = false;
  recognition.interimResults = false;

  recognition.onstart = () => {
    setState("listening", "Sun raha hoon...");
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
      setState("idle", "Mic error, dobara try karein");
    }
  };

  recognition.onend = () => {
    // agar recognition khatam ho gayi bina result ke (jaise chup rehne pe), wapas suno
  };
}

function startListening() {
  if (!voiceModeActive || !recognition) return;
  try {
    recognition.start();
  } catch (e) {
    // pehle se chal raha ho to ignore karo
  }
}

async function handleUserSpeech(text) {
  if (!text || !text.trim()) {
    startListening();
    return;
  }

  setState("thinking", "Soch raha hoon...");

  conversationHistory.push({ role: "user", parts: [{ text: text }] });

  try {
    const systemInstruction = `Tum AETHER ho, ek friendly AI dost, jo abhi voice mein baat kar rahe ho. Chhote, natural, conversational jawaab do (2-3 sentences se zyada nahi, jaise koi phone pe baat kar raha ho). Koi "Thinking:" ya "Answer:" label mat likho, seedha jawaab do. Hinglish mein baat karo.`;

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
      setState("idle", "Kuch gadbad ho gayi, dobara try karein");
      setTimeout(startListening, 1500);
      return;
    }

    const replyText = data.candidates[0].content.parts[0].text.trim();
    conversationHistory.push({ role: "model", parts: [{ text: replyText }] });

    transcriptText.innerText = replyText;
    speakReply(replyText);

  } catch (err) {
    setState("idle", "Network error, dobara try karein");
    setTimeout(startListening, 1500);
  }
}

function speakReply(text) {
  if (isMuted) {
    startListening();
    return;
  }

  setState("speaking", "Bol raha hoon...");

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "hi-IN";
  utterance.rate = 1;

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
