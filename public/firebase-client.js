let services;
let servicesPromise;
let configPromise;

function normalizeNickname(nickname) {
  const value = String(nickname || "").trim();
  return value.slice(0, 28) || "Coleccionista";
}

function hasPlaceholderConfig(config) {
  if (!config) return true;
  return ["apiKey", "authDomain", "projectId", "appId"].some((key) => {
    const value = config[key];
    return !value || String(value).startsWith("TU_");
  });
}

function isLocalHost() {
  const hostname = globalThis.location?.hostname;
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1";
}

async function loadConfig() {
  if (!configPromise) {
    configPromise = fetch(new URL("./firebase-config.js", import.meta.url), { method: "HEAD" })
      .then((response) => {
        if (!response.ok) return null;
        return import("./firebase-config.js");
      })
      .then((module) => {
        if (!module) return null;
        if (hasPlaceholderConfig(module.firebaseConfig)) return null;
        return {
          firebaseConfig: module.firebaseConfig,
          useEmulators: Boolean(module.USE_FIREBASE_EMULATORS),
          useCloudFunctions: Boolean(module.USE_CLOUD_FUNCTIONS ?? module.USE_FIREBASE_EMULATORS)
        };
      })
      .catch(() => null);
  }

  return configPromise;
}

async function loadFirebaseSdk() {
  const [appApi, authApi, dbApi, functionsApi] = await Promise.all([
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js"),
    import("https://www.gstatic.com/firebasejs/10.12.5/firebase-functions.js")
  ]);

  return { appApi, authApi, dbApi, functionsApi };
}

export async function isFirebaseConfigured() {
  return Boolean(await loadConfig());
}

export async function canUseGuestSignIn() {
  const config = await loadConfig();
  return Boolean(config?.useEmulators && isLocalHost());
}

export async function shouldUseCloudFunctions() {
  const config = await loadConfig();
  return Boolean(config?.useCloudFunctions);
}

async function upsertUserProfile(firebase, user, nickname) {
  const safeNickname = normalizeNickname(nickname);
  const userRef = firebase.dbApi.doc(firebase.db, "users", user.uid);
  const userSnap = await firebase.dbApi.getDoc(userRef);

  if (userSnap.exists()) {
    await firebase.dbApi.setDoc(userRef, {
      nickname: safeNickname,
      avatarId: userSnap.data().avatarId || "avatar-01",
      updatedAt: firebase.dbApi.serverTimestamp()
    }, { merge: true });
  } else {
    await firebase.dbApi.setDoc(userRef, {
      nickname: safeNickname,
      avatarId: "avatar-01",
      coins: 0,
      packsAvailable: 0,
      packsOpened: 0,
      starterPackClaimed: false,
      updatedAt: firebase.dbApi.serverTimestamp(),
      createdAt: firebase.dbApi.serverTimestamp()
    });
  }

  return safeNickname;
}

export async function initFirebase() {
  if (services) return services;
  if (servicesPromise) return servicesPromise;

  servicesPromise = (async () => {
    const config = await loadConfig();
    if (!config) return null;

    const { appApi, authApi, dbApi, functionsApi } = await loadFirebaseSdk();
    const app = appApi.getApps().length ? appApi.getApps()[0] : appApi.initializeApp(config.firebaseConfig);
    const auth = authApi.getAuth(app);
    const db = dbApi.getFirestore(app);
    const functions = functionsApi.getFunctions(app);

    if (config.useEmulators) {
      authApi.connectAuthEmulator(auth, "http://127.0.0.1:9099", { disableWarnings: true });
      dbApi.connectFirestoreEmulator(db, "127.0.0.1", 8080);
      functionsApi.connectFunctionsEmulator(functions, "127.0.0.1", 5001);
    }

    services = { app, auth, db, functions, authApi, dbApi, functionsApi };
    return services;
  })();

  return servicesPromise;
}

export async function listenToSession(callback) {
  const firebase = await initFirebase();
  if (!firebase) {
    callback(null);
    return () => {};
  }

  return firebase.authApi.onAuthStateChanged(firebase.auth, callback);
}

export async function signInGuest(nickname = "Coleccionista") {
  const firebase = await initFirebase();
  if (!firebase) throw new Error("Firebase no esta configurado.");
  if (!await canUseGuestSignIn()) {
    throw new Error("El acceso invitado solo esta disponible en desarrollo local con emuladores.");
  }

  const credential = await firebase.authApi.signInAnonymously(firebase.auth);
  const user = credential.user;
  const safeNickname = await upsertUserProfile(firebase, user, nickname);

  await firebase.authApi.updateProfile(user, { displayName: safeNickname });
  return user;
}

export async function signInWithGoogle(nickname = "Coleccionista") {
  const firebase = await initFirebase();
  if (!firebase) throw new Error("Firebase no esta configurado.");

  const provider = new firebase.authApi.GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  const credential = await firebase.authApi.signInWithPopup(firebase.auth, provider);
  const user = credential.user;
  await upsertUserProfile(firebase, user, nickname);
  return user;
}

export async function listenToInventory(userId, callback, onError = console.error) {
  const firebase = await initFirebase();
  if (!firebase) return () => {};

  return firebase.dbApi.onSnapshot(firebase.dbApi.collection(firebase.db, "users", userId, "inventory"), (snapshot) => {
    const copies = {};
    snapshot.forEach((item) => {
      const data = item.data();
      copies[data.stickerId || item.id] = data.copies || 0;
    });
    callback(copies);
  }, onError);
}

export async function listenToUserProfile(userId, callback, onError = console.error) {
  const firebase = await initFirebase();
  if (!firebase) return () => {};

  return firebase.dbApi.onSnapshot(firebase.dbApi.doc(firebase.db, "users", userId), (snapshot) => {
    callback(snapshot.exists() ? { id: snapshot.id, ...snapshot.data() } : null);
  }, onError);
}

export async function claimStarterPack() {
  const firebase = await initFirebase();
  if (!firebase) throw new Error("Firebase no esta configurado.");

  return firebase.functionsApi.httpsCallable(firebase.functions, "claimStarterPack")({});
}

export async function claimStarterPackInFirestore() {
  const firebase = await initFirebase();
  if (!firebase) throw new Error("Firebase no esta configurado.");
  const user = firebase.auth.currentUser;
  if (!user) throw new Error("Inicia sesion para continuar.");

  const userRef = firebase.dbApi.doc(firebase.db, "users", user.uid);

  await firebase.dbApi.runTransaction(firebase.db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    if (!userSnap.exists()) {
      throw new Error("Primero inicia sesion para crear tu perfil.");
    }

    const profile = userSnap.data();

    if (profile.starterPackClaimed) {
      throw new Error("El sobre inicial ya fue reclamado.");
    }

    transaction.set(userRef, {
      starterPackClaimed: true,
      packsAvailable: (profile.packsAvailable || 0) + 1,
      packsOpened: profile.packsOpened || 0,
      coins: profile.coins || 0,
      nickname: profile.nickname || normalizeNickname(user.displayName),
      avatarId: profile.avatarId || "avatar-01",
      updatedAt: firebase.dbApi.serverTimestamp(),
      createdAt: profile.createdAt || firebase.dbApi.serverTimestamp()
    }, { merge: true });
  });

  return { ok: true, packType: "starter", source: "firestore-client" };
}

export async function openPack(packType = "normal") {
  const firebase = await initFirebase();
  if (!firebase) throw new Error("Firebase no esta configurado.");

  return firebase.functionsApi.httpsCallable(firebase.functions, "openPack")({ packType });
}

export async function openPackInFirestore(stickers, packType = "normal") {
  const firebase = await initFirebase();
  if (!firebase) throw new Error("Firebase no esta configurado.");
  const user = firebase.auth.currentUser;
  if (!user) throw new Error("Inicia sesion para continuar.");
  if (!Array.isArray(stickers) || stickers.length !== 5) {
    throw new Error("El sobre debe contener 5 cromos.");
  }

  const userRef = firebase.dbApi.doc(firebase.db, "users", user.uid);
  const openingRef = firebase.dbApi.doc(firebase.dbApi.collection(firebase.db, "packOpenings"));
  const inventoryRefs = stickers.map((sticker) => (
    firebase.dbApi.doc(firebase.db, "users", user.uid, "inventory", sticker.id)
  ));

  await firebase.dbApi.runTransaction(firebase.db, async (transaction) => {
    const userSnap = await transaction.get(userRef);
    const profile = userSnap.exists() ? userSnap.data() : {};
    const available = profile.packsAvailable || 0;

    if (available <= 0) {
      throw new Error("No tienes sobres disponibles.");
    }

    const inventorySnaps = [];
    for (const ref of inventoryRefs) {
      inventorySnaps.push(await transaction.get(ref));
    }

    transaction.update(userRef, {
      packsAvailable: available - 1,
      packsOpened: (profile.packsOpened || 0) + 1,
      updatedAt: firebase.dbApi.serverTimestamp()
    });

    transaction.set(openingRef, {
      userId: user.uid,
      packType,
      stickerIds: stickers.map((sticker) => sticker.id),
      source: "firestore-client",
      createdAt: firebase.dbApi.serverTimestamp()
    });

    inventoryRefs.forEach((ref, index) => {
      const snap = inventorySnaps[index];
      const currentCopies = snap.exists() ? snap.data().copies || 0 : 0;
      transaction.set(ref, {
        stickerId: stickers[index].id,
        copies: currentCopies + 1,
        lastOpeningId: openingRef.id,
        updatedAt: firebase.dbApi.serverTimestamp()
      }, { merge: true });
    });
  });

  return { ok: true, stickers, source: "firestore-client" };
}

export async function completeMission(missionId) {
  const firebase = await initFirebase();
  if (!firebase) throw new Error("Firebase no esta configurado.");

  return firebase.functionsApi.httpsCallable(firebase.functions, "completeMission")({ missionId });
}

export async function createTrade(payload) {
  const firebase = await initFirebase();
  if (!firebase) throw new Error("Firebase no esta configurado.");

  return firebase.functionsApi.httpsCallable(firebase.functions, "createTrade")(payload);
}

export async function acceptTrade(tradeId) {
  const firebase = await initFirebase();
  if (!firebase) throw new Error("Firebase no esta configurado.");

  return firebase.functionsApi.httpsCallable(firebase.functions, "acceptTrade")({ tradeId });
}
