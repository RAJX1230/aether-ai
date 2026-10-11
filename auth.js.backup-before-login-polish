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
    "auth/invalid-email": "Please enter a valid email address.",
    "auth/missing-password": "Please enter your password.",
    "auth/weak-password": "Password must be at least 6 characters long.",
    "auth/email-already-in-use": "This email is already registered. Please log in.",
    "auth/user-not-found": "No account found for this email. Please sign up.",
    "auth/wrong-password": "Incorrect password. Please try again.",
    "auth/invalid-credential": "Incorrect email or password.",
    "auth/too-many-requests": "Too many attempts. Please try again later.",
    "auth/network-request-failed": "Please check your internet connection."
  };
  return map[code] || "Something went wrong. Please try again.";
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
    authActionBtn.innerText = "Create account";
    authToggleText.innerHTML = 'Already have an account? <span id="toggleLink">Log in</span>';
  } else {
    authTitle.innerText = "AETHER AI Login";
    authActionBtn.innerText = "Log in";
    authToggleText.innerHTML = 'New to AETHER AI? <span id="toggleLink">Create account</span>';
  }
  attachToggleListener();
}

attachToggleListener();

forgotLink.addEventListener("click", () => {
  const email = emailInput.value.trim();
  authError.className = "auth-error";

  if (!email) {
    authError.innerText = "Enter your email address first.";
    return;
  }

  forgotLink.innerText = "Sending reset link...";

  auth.sendPasswordResetEmail(email)
    .then(() => {
      authError.className = "auth-success";
      authError.innerText = "Password reset link sent. Please check your inbox.";
      forgotLink.innerText = "Forgot password?";
    })
    .catch((err) => {
      authError.className = "auth-error";
      authError.innerText = getFriendlyAuthError(err.code);
      forgotLink.innerText = "Forgot password?";
    });
});

document.getElementById("googleLoginBtn").addEventListener("click", () => {
  const provider = new firebase.auth.GoogleAuthProvider();
  auth.signInWithPopup(provider)
    .then(() => { window.location.href = "index.html"; })
    .catch((err) => {
      authError.innerText = "Google sign-in failed. Please try again.";
    });
});

authActionBtn.addEventListener("click", () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  authError.className = "auth-error";
  authError.innerText = "";

  if (!email || !password) {
    authError.innerText = "Please enter both email and password.";
    return;
  }

  authActionBtn.disabled = true;
  authActionBtn.innerText = "Please wait...";

  if (isSignupMode) {
    auth.createUserWithEmailAndPassword(email, password)
      .then(() => {
        window.location.href = "index.html";
      })
      .catch((err) => {
        authError.innerText = getFriendlyAuthError(err.code);
        authActionBtn.disabled = false;
        authActionBtn.innerText = "Create account";
      });
  } else {
    auth.signInWithEmailAndPassword(email, password)
      .then(() => {
        window.location.href = "index.html";
      })
      .catch((err) => {
        authError.innerText = getFriendlyAuthError(err.code);
        authActionBtn.disabled = false;
        authActionBtn.innerText = "Log in";
      });
  }
});
