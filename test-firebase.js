import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged } from "firebase/auth";

const app = initializeApp({ apiKey: "dummy_api_key", projectId: "dummy" });
const auth = getAuth(app);
console.log("Waiting for auth state...");
const timeout = setTimeout(() => console.log("TIMEOUT!"), 5000);
onAuthStateChanged(auth, (user) => {
  console.log("Auth state fired:", user);
  clearTimeout(timeout);
});
