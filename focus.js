const timerText = document.getElementById("timerText");
const timerRing = document.getElementById("timerRing");
const modeLabel = document.getElementById("modeLabel");
const mainBtn = document.getElementById("mainBtn");
const focusModeBtn = document.getElementById("focusModeBtn");
const breakModeBtn = document.getElementById("breakModeBtn");
const streakBadge = document.getElementById("streakBadge");

let mode = "focus";
let totalSeconds = 10;
let secondsLeft = totalSeconds;
let timerInterval = null;
let isRunning = false;

function formatTime(s) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const sec = (s % 60).toString().padStart(2, "0");
  return `${m}:${sec}`;
}

function updateDisplay() {
  timerText.innerText = formatTime(secondsLeft);
}

function setMode(newMode) {
  mode = newMode;
  totalSeconds = mode === "focus" ? 10 : 5 * 60;
  secondsLeft = totalSeconds;
  modeLabel.innerText = mode === "focus" ? "FOCUS TIME" : "BREAK TIME";
  focusModeBtn.classList.toggle("active", mode === "focus");
  breakModeBtn.classList.toggle("active", mode === "break");
  updateDisplay();
}

focusModeBtn.addEventListener("click", () => { if (!isRunning) setMode("focus"); });
breakModeBtn.addEventListener("click", () => { if (!isRunning) setMode("break"); });

function startTimer() {
  isRunning = true;
  timerRing.classList.add("active");
  mainBtn.innerText = "Stop";
  mainBtn.classList.add("stop");

  timerInterval = setInterval(() => {
    secondsLeft--;
    updateDisplay();
    if (secondsLeft <= 0) {
      clearInterval(timerInterval);
      isRunning = false;
      timerRing.classList.remove("active");
      mainBtn.innerText = "Start";
      mainBtn.classList.remove("stop");
      if (mode === "focus") {
        recordStreak();
        alert("Focus session complete! 🎉 Break le lo.");
      } else {
        alert("Break khatam! Wapas focus karte hain.");
      }
      setMode(mode === "focus" ? "focus" : "focus");
    }
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  isRunning = false;
  timerRing.classList.remove("active");
  mainBtn.innerText = "Start";
  mainBtn.classList.remove("stop");
  secondsLeft = totalSeconds;
  updateDisplay();
}

mainBtn.addEventListener("click", () => {
  if (isRunning) stopTimer();
  else startTimer();
});

function getTodayString() {
  return new Date().toISOString().slice(0, 10);
}

function recordStreak() {
  const today = getTodayString();
  let data = JSON.parse(localStorage.getItem("aether_streak")) || { count: 0, lastDate: "" };

  if (data.lastDate === today) {
    // aaj already record ho chuka hai
  } else {
    const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
    if (data.lastDate === yesterday) {
      data.count += 1;
    } else {
      data.count = 1;
    }
    data.lastDate = today;
    localStorage.setItem("aether_streak", JSON.stringify(data));
  }
  loadStreak();
}

function loadStreak() {
  const data = JSON.parse(localStorage.getItem("aether_streak")) || { count: 0, lastDate: "" };
  streakBadge.innerText = `🔥 ${data.count} day streak`;
}

updateDisplay();
loadStreak();
