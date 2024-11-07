import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";

const firebaseConfig = {
  apiKey: "AIzaSyBtxFcRd62UhS4IfKk7ZomPAsd_BPTUgyQ",
  authDomain: "firsttwenli-df79a.firebaseapp.com",
  databaseURL:
    "https://firsttwenli-df79a-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "firsttwenli-df79a",
  storageBucket: "firsttwenli-df79a.appspot.com",
  messagingSenderId: "114801264499",
  appId: "1:114801264499:web:6bcac3282b0ef894aae706",
  measurementId: "G-2L4JCE5Y2H",
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
