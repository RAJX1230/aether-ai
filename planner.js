const API_URL_PLAN = "https://aether-proxy.tstngfrm.workers.dev";

const inputCard = document.getElementById("inputCard");
const planOutput = document.getElementById("planOutput");
const generateBtn = document.getElementById("generateBtn");
const examName = document.getElementById("examName");
const numDays = document.getElementById("numDays");
const syllabusText = document.getElementById("syllabusText");

let currentUserEmail = "";
let userDocRef = null;
let currentPlan = null;

auth.onAuthStateChanged((user) => {
  if (!user) {
    window.location.href = "login.html";
  } else {
    currentUserEmail = user.email;
    userDocRef = db.collection("users").doc(user.uid);
    loadExistingPlan();
  }
});

async function loadExistingPlan() {
  try {
    const doc = await userDocRef.get();
    if (doc.exists && doc.data().studyPlan) {
      currentPlan = doc.data().studyPlan;
      renderPlan();
    }
  } catch (err) {
    const saved = localStorage.getItem("aether_plan_" + currentUserEmail);
    if (saved) {
      currentPlan = JSON.parse(saved);
      renderPlan();
    }
  }
}

function savePlan() {
  if (userDocRef) {
    userDocRef.set({ studyPlan: currentPlan }, { merge: true }).catch(err => console.log(err));
  }
  localStorage.setItem("aether_plan_" + currentUserEmail, JSON.stringify(currentPlan));
}

generateBtn.addEventListener("click", async () => {
  const exam = examName.value.trim();
  const days = parseInt(numDays.value);
  const syllabus = syllabusText.value.trim();

  if (!exam || !days || !syllabus) {
    alert("Sab fields bharna zaroori hai.");
    return;
  }

  generateBtn.disabled = true;
  generateBtn.innerText = "Plan ban raha hai...";
  planOutput.innerHTML = "";

  try {
    const prompt = `Tum ek study planner ho. User ka exam/goal: "${exam}". Total ${days} din hain. Syllabus/topics: "${syllabus}".

Ek din-by-din study plan banao jisme har din ke liye 2-4 chhoti, specific tasks ho (jaise "Chapter 1 padhna", "10 practice questions solve karna"). Poora syllabus sab dino mein cover hona chahiye, aur last din revision/practice test rakhna.

SIRF is exact JSON format mein jawaab do, koi extra text nahi, koi \`\`\`json bhi nahi likhna, sirf raw JSON:
[{"day":"Day 1","tasks":["task1","task2"]},{"day":"Day 2","tasks":["task1","task2"]}]`;

    const response = await fetch(API_URL_PLAN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ role: "user", parts: [{ text: prompt }] }] })
    });
    const data = await response.json();

    generateBtn.disabled = false;
    generateBtn.innerText = "Plan Banao";

    if (!data.candidates) {
      planOutput.innerHTML = `<div class="loading-msg">Plan nahi ban paya, dobara try karein.</div>`;
      return;
    }

    let rawText = data.candidates[0].content.parts[0].text.trim();
    rawText = rawText.replace(/```json/gi, "").replace(/```/g, "").trim();

    let planDays;
    try {
      planDays = JSON.parse(rawText);
    } catch (e) {
      const jsonMatch = rawText.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        planDays = JSON.parse(jsonMatch[0]);
      } else {
        planOutput.innerHTML = `<div class="loading-msg">Plan format samajh nahi aaya, dobara try karein.</div>`;
        return;
      }
    }

    currentPlan = {
      examName: exam,
      days: planDays.map(d => ({
        day: d.day,
        tasks: d.tasks.map(t => ({ text: t, done: false }))
      }))
    };

    savePlan();
    renderPlan();
    inputCard.style.display = "none";

  } catch (err) {
    generateBtn.disabled = false;
    generateBtn.innerText = "Plan Banao";
    planOutput.innerHTML = `<div class="loading-msg">Kuch gadbad ho gayi, dobara try karein.</div>`;
  }
});

function renderPlan() {
  if (!currentPlan) return;
  inputCard.style.display = "none";

  let totalTasks = 0;
  let doneTasks = 0;
  currentPlan.days.forEach(d => {
    d.tasks.forEach(t => {
      totalTasks++;
      if (t.done) doneTasks++;
    });
  });
  const percent = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;

  let html = `
    <div class="progress-wrap">
      <div class="progress-bar-bg"><div class="progress-bar-fill" style="width:${percent}%"></div></div>
      <div class="progress-label">${doneTasks}/${totalTasks} tasks complete — ${percent}%</div>
    </div>`;

  currentPlan.days.forEach((d, dIdx) => {
    html += `<div class="day-card"><div class="day-title">${d.day} — ${currentPlan.examName}</div>`;
    d.tasks.forEach((t, tIdx) => {
      html += `
        <div class="task-row ${t.done ? "done" : ""}">
          <input type="checkbox" ${t.done ? "checked" : ""} onchange="toggleTask(${dIdx}, ${tIdx})">
          <span>${t.text}</span>
        </div>`;
    });
    html += `</div>`;
  });

  html += `<button class="clear-plan-btn" onclick="clearPlan()">Naya Plan Banao</button>`;

  planOutput.innerHTML = html;
}

function toggleTask(dayIdx, taskIdx) {
  currentPlan.days[dayIdx].tasks[taskIdx].done = !currentPlan.days[dayIdx].tasks[taskIdx].done;
  savePlan();
  renderPlan();
}
window.toggleTask = toggleTask;

function clearPlan() {
  if (!confirm("Kya aap naya plan banana chahte hain? Purana plan delete ho jayega.")) return;
  currentPlan = null;
  if (userDocRef) userDocRef.set({ studyPlan: null }, { merge: true });
  localStorage.removeItem("aether_plan_" + currentUserEmail);
  planOutput.innerHTML = "";
  inputCard.style.display = "block";
  examName.value = "";
  numDays.value = "";
  syllabusText.value = "";
}
window.clearPlan = clearPlan;
