const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

const PACK_SIZE = 5;
const STARTER_PACK_TYPE = "starter";

function requireAuth(request) {
  if (!request.auth) {
    throw new HttpsError("unauthenticated", "Debes iniciar sesión.");
  }
  return request.auth.uid;
}

function pickSticker(catalog) {
  const roll = Math.random();
  const rarity = roll < 0.05 ? "holografico" : roll < 0.30 ? "brillante" : "base";
  let pool = catalog.filter((sticker) => sticker.rarity === rarity);
  if (!pool.length) pool = catalog;
  return pool[Math.floor(Math.random() * pool.length)];
}

async function loadCatalog(transaction) {
  const snap = await transaction.get(db.collection("catalog").doc("stickers"));
  if (!snap.exists) {
    throw new HttpsError("failed-precondition", "Falta sembrar el catálogo de cromos.");
  }
  return snap.data().items || [];
}

exports.claimStarterPack = onCall(async (request) => {
  const uid = requireAuth(request);
  const userRef = db.collection("users").doc(uid);

  await db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    const user = userSnap.exists ? userSnap.data() : {};

    if (user.starterPackClaimed) {
      throw new HttpsError("already-exists", "El sobre inicial ya fue reclamado.");
    }

    transaction.set(userRef, {
      starterPackClaimed: true,
      packsAvailable: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp(),
      createdAt: userSnap.exists ? user.createdAt : FieldValue.serverTimestamp()
    }, { merge: true });
  });

  return { ok: true, packType: STARTER_PACK_TYPE };
});

exports.openPack = onCall(async (request) => {
  const uid = requireAuth(request);
  const packType = request.data?.packType || "normal";
  const userRef = db.collection("users").doc(uid);
  const inventoryRef = userRef.collection("inventory");
  const openingRef = db.collection("packOpenings").doc();
  let awarded = [];

  await db.runTransaction(async (transaction) => {
    const userSnap = await transaction.get(userRef);
    const user = userSnap.data() || {};
    const available = user.packsAvailable || 0;

    if (available <= 0) {
      throw new HttpsError("failed-precondition", "No tienes sobres disponibles.");
    }

    const catalog = await loadCatalog(transaction);
    awarded = Array.from({ length: PACK_SIZE }, () => pickSticker(catalog));

    transaction.update(userRef, {
      packsAvailable: FieldValue.increment(-1),
      packsOpened: FieldValue.increment(1),
      updatedAt: FieldValue.serverTimestamp()
    });

    for (const sticker of awarded) {
      transaction.set(inventoryRef.doc(sticker.id), {
        stickerId: sticker.id,
        copies: FieldValue.increment(1),
        updatedAt: FieldValue.serverTimestamp()
      }, { merge: true });
    }

    transaction.set(openingRef, {
      userId: uid,
      packType,
      stickerIds: awarded.map((s) => s.id),
      createdAt: FieldValue.serverTimestamp()
    });
  });

  return { ok: true, stickers: awarded };
});

exports.completeMission = onCall(async (request) => {
  const uid = requireAuth(request);
  const missionId = request.data?.missionId;
  if (!missionId) throw new HttpsError("invalid-argument", "missionId es requerido.");

  const userRef = db.collection("users").doc(uid);
  const missionRef = userRef.collection("missions").doc(missionId);

  await db.runTransaction(async (transaction) => {
    const missionSnap = await transaction.get(missionRef);
    if (missionSnap.exists && missionSnap.data().claimed) {
      throw new HttpsError("already-exists", "La misión ya fue cobrada.");
    }

    transaction.set(missionRef, {
      claimed: true,
      claimedAt: FieldValue.serverTimestamp(),
      reward: { coins: 25 }
    }, { merge: true });

    transaction.set(userRef, {
      coins: FieldValue.increment(25),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  });

  return { ok: true, coins: 25 };
});

exports.createTrade = onCall(async (request) => {
  const uid = requireAuth(request);
  const { toUserId, offered = [], requested = [] } = request.data || {};

  if (!toUserId || !offered.length || !requested.length) {
    throw new HttpsError("invalid-argument", "El intercambio necesita destinatario, oferta y solicitud.");
  }

  const tradeRef = db.collection("trades").doc();
  await tradeRef.set({
    fromUserId: uid,
    toUserId,
    offered,
    requested,
    status: "pending",
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp()
  });

  return { ok: true, tradeId: tradeRef.id };
});

exports.acceptTrade = onCall(async (request) => {
  const uid = requireAuth(request);
  const tradeId = request.data?.tradeId;
  if (!tradeId) throw new HttpsError("invalid-argument", "tradeId es requerido.");

  const tradeRef = db.collection("trades").doc(tradeId);

  await db.runTransaction(async (transaction) => {
    const tradeSnap = await transaction.get(tradeRef);
    if (!tradeSnap.exists) throw new HttpsError("not-found", "Intercambio no encontrado.");

    const trade = tradeSnap.data();
    if (trade.status !== "pending") throw new HttpsError("failed-precondition", "El intercambio ya no está pendiente.");
    if (trade.toUserId !== uid) throw new HttpsError("permission-denied", "No puedes aceptar este intercambio.");

    // TODO: validar copias disponibles antes de descontar.
    // TODO: descontar oferta de fromUserId y solicitud de toUserId.
    // TODO: sumar cromos a cada usuario con la misma transacción.

    transaction.update(tradeRef, {
      status: "accepted",
      acceptedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
  });

  return { ok: true };
});
