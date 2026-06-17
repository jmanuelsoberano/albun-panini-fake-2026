// Copia este archivo como public/firebase-config.js y reemplaza los valores
// con la configuración Web App de tu proyecto Firebase.

export const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "TU_PROJECT_ID.firebaseapp.com",
  projectId: "TU_PROJECT_ID",
  storageBucket: "TU_PROJECT_ID.appspot.com",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID"
};

// Cambiar a true para trabajar con Firebase Emulator Suite.
export const USE_FIREBASE_EMULATORS = false;

// Mantener false en Spark/free tier publicado.
// Cambiar a true solo si hay Cloud Functions desplegadas o emuladas.
export const USE_CLOUD_FUNCTIONS = false;
