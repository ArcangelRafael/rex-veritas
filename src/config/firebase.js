import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage";

  const firebaseConfig = {
    apiKey: "AIzaSyBt5B_RAhucmsYhob_pd521FHEWVQNCAwE",
    authDomain: "rex-veritatis.firebaseapp.com",
    projectId: "rex-veritatis",
    storageBucket: "rex-veritatis.firebasestorage.app",
    messagingSenderId: "587668331995",
    appId: "1:587668331995:web:64c4e7c83c649e21e55bfe"
  };

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Exportar los servicios
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);