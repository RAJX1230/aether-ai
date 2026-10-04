const API_URL_LEC = "https://aether-proxy.tstngfrm.workers.dev";

const recDot = document.getElementById("recDot");
const recStatusText = document.getElementById("recStatusText");
const transcriptBox = document.getElementById("transcriptBox");
const notesOutput = document.getElementById("notesOutput");
const recBtn = document.getElementById("recBtn");
const notesBtn = document.getElementById("notesBtn");

let fullTranscript = "";
let isRecording = false;

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
let recognition = null;

if (SpeechRecognition) {
  recognition = new SpeechRecognition();
  recognition.lang = "hi-IN";
  recognition.continuous = true;
  recognition.interimResults = false;

  recognition.onresult = (event) => {
    for (let i = event.resultIndex; i < event.results.length; i++) {
      if (event.results[i].isFinal) {
        fullTranscript += event.results[i][0].transcript + " ";
        renderTranscript();
      }
    }
  };

  recognition.onerror = (event) => {
    console.log("Recognition error:", event.error);
    if (isRecording && event.error !== "no-speech") {
      // kuch der baad khud restart karega neeche onend se
    }
  };

  recognition.onend = () => {
    if (isRecording) {
      try { recognition.start(); } catch (e) {}
    }
  };
} else {
  recStatusText.innerText = "Ye browser voice support nahi karta";
  recBtn.disabled = true;
}

function renderTranscript() {
  transcriptBox.classList.remove("empty");
  transcriptBox.innerText = fullTranscript;
  transcriptBox.scrollTop = transcriptBox.scrollHeight;
}

recBtn.addEventListener("click", () => {
  if (!recognition) return;

  if (!isRecording) {
    isRecording = true;
    recognition.start();
    recDot.classList.add("live");
    recStatusText.innerText = "Recording... class ki baatein sun raha hoon";
    recBtn.innerText = "Stop Recording";
    recBtn.classList.add("recording");
  } else {
    isRecording = false;
    recognition.stop();
    recDot.classList.remove("live");
    recStatusText.innerText = "Recording stopped";
    recBtn.innerText = "Start Recording";
    recBtn.classList.remove("recording");
  }
});

notesBtn.addEventListener("click", async () => {
  if (!fullTranscript.trim()) {
    alert("Abhi tak kuch record nahi hua. Pehle recording start karein.");
    return;
  }

  notesBtn.disabled = true;
  notesBtn.innerText = "Notes ban rahe hain...";

  try {
    const prompt = `Ye ek class lecture ka raw transcript hai (voice-to-text se aaya hai, isliye thoda messy ho sakta hai). Ise ek organized, clean study notes mein convert karo — headings ke saath, important terms **bold** karke, bullet points mein key points, aur agar koi definitions/formulas mile to unhe highlight karo. Hinglish mein likho:\n\n${fullTranscript}`;

    const response = await fetch(API_URL_LEC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
    });
    const data = await response.json();

    if (!data.candidates) {
      notesOutput.innerText = "Notes banane mein error aaya, dobara try karein.";
      notesOutput.classList.add("show");
      return;
    }

    let notesText = data.candidates[0].content.parts[0].text;
    notesText = notesText.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    notesText = notesText.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    notesText = notesText.replace(/\n/g, "<br>");

    notesOutput.innerHTML = notesText;
    notesOutput.classList.add("show");

  } catch (err) {
    notesOutput.innerText = "Kuch gadbad ho gayi, dobara try karein.";
    notesOutput.classList.add("show");
  }

  notesBtn.disabled = false;
  notesBtn.innerText = "Generate Notes";
});
