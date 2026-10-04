const API_URL_SNAP = "https://aether-proxy.tstngfrm.workers.dev";

const captureZone = document.getElementById("captureZone");
const snapInput = document.getElementById("snapInput");
const previewImg = document.getElementById("previewImg");
const solveBtn = document.getElementById("solveBtn");
const loadingText = document.getElementById("loadingText");
const resultBox = document.getElementById("resultBox");

let capturedBase64 = null;
let capturedMime = null;

captureZone.addEventListener("click", () => snapInput.click());

snapInput.addEventListener("change", () => {
  const file = snapInput.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = () => {
    capturedBase64 = reader.result.split(",")[1];
    capturedMime = file.type || "image/jpeg";
    previewImg.src = reader.result;
    previewImg.style.display = "block";
    solveBtn.style.display = "block";
    resultBox.classList.remove("show");
    resultBox.innerHTML = "";
  };
  reader.readAsDataURL(file);
});

solveBtn.addEventListener("click", async () => {
  if (!capturedBase64) return;

  solveBtn.disabled = true;
  loadingText.style.display = "block";
  loadingText.innerText = "AETHER soch raha hai...";
  resultBox.classList.remove("show");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 30000);

  try {
    const prompt = `Ye ek homework/question ki photo hai. Ise dhyan se dekho aur:
1. Pehle samjho question kya pooch raha hai
2. Step-by-step solution do, har step clearly likho
3. Final answer clearly highlight karo
Hinglish mein samjhao, jaise ek acha teacher samjhata hai.`;

    const response = await fetch(API_URL_SNAP, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [{
          role: "user",
          parts: [
            { inline_data: { mime_type: capturedMime, data: capturedBase64 } },
            { text: prompt }
          ]
        }]
      })
    });

    clearTimeout(timeoutId);
    const data = await response.json();

    loadingText.style.display = "none";
    solveBtn.disabled = false;

    if (!data.candidates) {
      resultBox.innerText = "Solve nahi ho paya (network/quota issue), dobara try karein.";
      resultBox.classList.add("show");
      return;
    }

    let solution = data.candidates[0].content.parts[0].text;
    solution = solution.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
    solution = solution.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>");
    solution = solution.replace(/\n/g, "<br>");

    resultBox.innerHTML = solution;
    resultBox.classList.add("show");

  } catch (err) {
    clearTimeout(timeoutId);
    loadingText.style.display = "none";
    solveBtn.disabled = false;

    if (err.name === "AbortError") {
      resultBox.innerText = "Bahut der lag rahi hai (network slow ho sakta hai). 'Solve Karo' dobara dabayein.";
    } else {
      resultBox.innerText = "Kuch gadbad ho gayi, dobara try karein.";
    }
    resultBox.classList.add("show");
  }
});
