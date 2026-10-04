const emailInput = document.getElementById("emailInput");
const passwordInput = document.getElementById("passwordInput");
const togglePassword = document.getElementById("togglePassword");
const authActionBtn = document.getElementById("authActionBtn");
const authTitle = document.getElementById("authTitle");
const toggleLink = document.getElementById("toggleLink");
const authToggleText = document.getElementById("authToggleText");
const forgotLink = document.getElementById("forgotLink");
const authError = document.getElementById("authError");

let isSignupMode = false;

auth.onAuthStateChanged((user) => {
  if (user) {
    window.location.href = "index.html";
  }
});

togglePassword.addEventListener("click", () => {
  if (passwordInput.type === "password") {
    passwordInput.type = "text";
    togglePassword.innerText = "Hide";
  } else {
    passwordInput.type = "password";
    togglePassword.innerText = "Show";
  }
});

function getFriendlyAuthError(code) {
  const map = {
    "auth/invalid-email": "Email sahi format mein nahi hai.",
    "auth/missing-password": "Password bharna zaroori hai.",
    "auth/weak-password": "Password kam se kam 6 characters ka hona chahiye.",
    "auth/email-already-in-use": "Ye email pehle se registered hai, Login karein.",
    "auth/user-not-found": "Ye email registered nahi hai, pehle Signup karein.",
    "auth/wrong-password": "Password galat hai, dobara try karein.",
    "auth/invalid-credential": "Email ya password galat hai.",
    "auth/too-many-requests": "Bahut zyada attempts ho gaye, thodi der baad try karein.",
    "auth/network-request-failed": "Internet connection check karein."
  };
  return map[code] || "Kuch gadbad ho gayi, dobara try karein.";
}

function attachToggleListener() {
  document.getElementById("toggleLink").addEventListener("click", handleToggle);
}

function handleToggle() {
  isSignupMode = !isSignupMode;
  authError.innerText = "";
  authError.className = "auth-error";
  if (isSignupMode) {
    authTitle.innerText = "AETHER AI Signup";
    authActionBtn.innerText = "Signup";
    authToggleText.innerHTML = 'Pehle se account hai? <span id="toggleLink">Login karein</span>';
  } else {
    authTitle.innerText = "AETHER AI Login";
    authActionBtn.innerText = "Login";
    authToggleText.innerHTML = 'Naya account nahi hai? <span id="toggleLink">Signup karein</span>';
  }
  attachToggleListener();
}

attachToggleListener();

forgotLink.addEventListener("click", () => {
  const email = emailInput.value.trim();
  authError.className = "auth-error";

  if (!email) {
    authError.innerText = "Pehle apna email daalein, phir yahan tap karein.";
    return;
  }

  forgotLink.innerText = "Bhej rahe hain...";

  auth.sendPasswordResetEmail(email)
    .then(() => {
      authError.className = "auth-success";
      authError.innerText = "Reset link aapke email par bhej diya gaya hai. Inbox check karein.";
      forgotLink.innerText = "Password bhool gaye?";
    })
    .catch((err) => {
      authError.className = "auth-error";
      authError.innerText = getFriendlyAuthError(err.code);
      forgotLink.innerText = "Password bhool gaye?";
    });
});

authActionBtn.addEventListener("click", () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  authError.className = "auth-error";
  authError.innerText = "";

  if (!email || !password) {
    authError.innerText = "Email aur password dono bharein.";
    return;
  }

  authActionBtn.disabled = true;
  authActionBtn.innerText = "Wait...";

  if (isSignupMode) {
    auth.createUserWithEmailAndPassword(email, password)
      .then(() => {
        window.location.href = "index.html";
      })
      .catch((err) => {
        authError.innerText = getFriendlyAuthError(err.code);
        authActionBtn.disabled = false;
        authActionBtn.innerText = "Signup";
      });
  } else {
    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        window.location.href = "index.html";
      })
      .catch((err) => {
        authError.innerText = getFriendlyAuthError(err.code);
        authActionBtn.disabled = false;
        authActionBtn.innerText = "Login";
      });
  }
});
