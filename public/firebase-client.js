import { initializeApp, getApps } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";
import {
  getAuth,
  connectAuthEmulator,
  onAuthStateChanged,
  signInAnonymously,
  updateProfile
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore,
  connectFirestoreEmulator,
  doc,
  setDoc,
  serverTimestamp,
  onSnapshot,
  collection
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import {
  getFunctions,
  connectFunctionsEmulator,
  httpsCallable
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-functions.js";
import { firebaseConfig, USE_FIREBASE_EMULATORS } from "./firebase-config.js";

let services;

export function initFirebase() {
  if (services) return services;

  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);
  const functions = getFunctions(app);

  if (USE_FIREBASE_EMULATORS) {
    connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
    connectFirestoreEmulator(db, "127.0.0.1", 8080);
    connectFunctionsEmulator(functions, "127.0.0.1", 5001);
  }

  services = { app, auth, db, functions };
  return services;
}

export function listenToSession(callback) {
  const { auth } = initFirebase();
  return onAuthStateChanged(auth, callback);
}

export async function signInGuest(nickname = "Coleccionista") {
  const { auth, db } = initFirebase();
  const credential = await signInAnonymously(auth);
  const user = credential.user;

  await updateProfile(user, { displayName: nickname });
  await setDoc(doc(db, "users", user.uid), {
    nickname,
    avatarId: "avatar-01",
    coins: 0,
    packsAvailable: 0,
    packsOpened: 0,
    starterPackClaimed: false,
    updatedAt: serverTimestamp(),
    createdAt: serverTimestamp()
  }, { merge: true });

  return user;
}

export function listenToInventory(userId, callback) {
  const { db } = initFirebase();
  return onSnapshot(collection(db, "users", userId, "inventory"), (snapshot) => {
    const copies = {};
    snapshot.forEach((item) => {
      const data = item.data();
      copies[data.stickerId || item.id] = data.copies || 0;
    });
    callback(copies);
  });
}

export function listenToUserProfile(userId, callback) {
  const { db } = initFirebase();
  return onSnapshot(doc(db, "users", userId), (snapshot) => {
    callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
  });
}

export function claimStarterPack() {
  const { functions } = initFirebase();
  return httpsCallable(functions, "claimStarterPack")({});
}

export function openPack(packType = "normal") {
  const { functions } = initFirebase();
  return httpsCallable(functions, "openPack")({ packType });
}

export function completeMission(missionId) {
  const { functions } = initFirebase();
  return httpsCallable(functions, "completeMission")({ missionId });
}

export function createTrade(payload) {
  const { functions } = initFirebase();
  return httpsCallable(functions, "createTrade")(payload);
}

export function acceptTrade(tradeId) {
  const { functions } = initFirebase();
  return httpsCallable(functions, "acceptTrade")({ tradeId });
}
