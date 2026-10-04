const firebaseConfig = {
  apiKey: "AIzaSyBtT3PFqJD-5ljUgJ_i6DuNJkOk9zrfnf0",
  authDomain: "aether-ai-4335c.firebaseapp.com",
  projectId: "aether-ai-4335c",
  storageBucket: "aether-ai-4335c.firebasestorage.app",
  messagingSenderId: "248262004869",
  appId: "1:248262004869:web:4a1ce138b36d076a9059ec"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
