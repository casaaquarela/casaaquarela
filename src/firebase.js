import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBe-NXMNR-_dqDfBTO8dcfeNhBbaQ9okCI",
  authDomain: "casa-aquarela-sistema.firebaseapp.com",
  projectId: "casa-aquarela-sistema",
  storageBucket: "casa-aquarela-sistema.firebasestorage.app",
  messagingSenderId: "830950690226",
  appId: "1:830950690226:web:fdd49058ff5cec27d9a8ab"
};

const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const db = getFirestore(firebaseApp);
