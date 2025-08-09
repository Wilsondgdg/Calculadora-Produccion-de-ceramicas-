// firebase-config.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-app.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.6.0/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyA05TH7JSrtoGG9bbaZ_cYB-g4vk0Fl90o",
    authDomain: "registro-valores-dc.firebaseapp.com",
    projectId: "registro-valores-dc",
    storageBucket: "registro-valores-dc.firebasestorage.app",
    messagingSenderId: "841782453974",
    appId: "1:841782453974:web:46093cdf300c0402054b77",
    measurementId: "G-9LCNX02ZYY"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
