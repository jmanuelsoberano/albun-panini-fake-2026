const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();
const db = getFirestore();

const PACK_SIZE = 5;
const STARTER_PACK_TYPE = "starter";
const MAX_TRADE_ITEMS = 8;
const MAX_ROOM_MEMBERS = 12;
const ROOM_CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

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

function normalizeStickerIds(fieldName, value) {
  if (!Array.isArray(value) || value.length === 0 || value.length > MAX_TRADE_ITEMS) {
    throw new HttpsError(
      "invalid-argument",
      `${fieldName} debe incluir entre 1 y ${MAX_TRADE_ITEMS} cromos.`
    );
  }

  const ids = value.map((item) => String(item || "").trim()).filter(Boolean);
  if (ids.length !== value.length) {
    throw new HttpsError("invalid-argument", `${fieldName} contiene cromos no validos.`);
  }

  return ids;
}

function countStickerIds(stickerIds) {
  return stickerIds.reduce((counts, stickerId) => {
    counts[stickerId] = (counts[stickerId] || 0) + 1;
    return counts;
  }, {});
}

function normalizeRoomCode(value) {
  return String(value || "").trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
}

function createRoomCode() {
  return Array.from({ length: 6 }, () =>
    ROOM_CODE_ALPHABET[Math.floor(Math.random() * ROOM_CODE_ALPHABET.length)]
  ).join("");
}

function safeRoomName(value) {
  const name = String(value || "").trim();
  return name.length > 0 ? name.slice(0, 42) : "Sala de coleccionistas";
}

async function loadCatalog(transaction) {
  const snap = await transaction.get(db.collection("catalog").doc("stickers"));
  if (!snap.exists) {
    throw new HttpsError("failed-precondition", "Falta sembrar el catálogo de cromos.");
  }
  return snap.data().items || [];
}

async function assertInventoryCopies(transaction, userId, counts, label) {
  const refs = Object.keys(counts).map((stickerId) => ({
    stickerId,
    quantity: counts[stickerId],
    ref: db.collection("users").doc(userId).collection("inventory").doc(stickerId)
  }));
  const snapshots = await Promise.all(refs.map((item) => transaction.get(item.ref)));

  snapshots.forEach((snapshot, index) => {
    const item = refs[index];
    const copies = Number(snapshot.data()?.copies || 0);
    if (!snapshot.exists || copies < item.quantity) {
      throw new HttpsError(
        "failed-precondition",
        `${label} no tiene copias disponibles para completar el cambio.`
      );
    }
  });
}

function applyInventoryMove(transaction, fromUserId, toUserId, counts) {
  for (const [stickerId, quantity] of Object.entries(counts)) {
    const fromRef = db.collection("users").doc(fromUserId).collection("inventory").doc(stickerId);
    const toRef = db.collection("users").doc(toUserId).collection("inventory").doc(stickerId);

    transaction.update(fromRef, {
      copies: FieldValue.increment(-quantity),
      updatedAt: FieldValue.serverTimestamp()
    });
    transaction.set(toRef, {
      stickerId,
      copies: FieldValue.increment(quantity),
      updatedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  }
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

exports.createRoom = onCall(async (request) => {
  const uid = requireAuth(request);
  const code = createRoomCode();
  const roomRef = db.collection("rooms").doc(code);
  const memberRef = roomRef.collection("members").doc(uid);

  await db.runTransaction(async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (roomSnap.exists) {
      throw new HttpsError("already-exists", "Intenta crear la sala de nuevo.");
    }

    transaction.set(roomRef, {
      code,
      name: safeRoomName(request.data?.name),
      ownerId: uid,
      memberIds: [uid],
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
    transaction.set(memberRef, {
      userId: uid,
      role: "owner",
      joinedAt: FieldValue.serverTimestamp()
    });
  });

  return { ok: true, roomId: code, code };
});

exports.joinRoom = onCall(async (request) => {
  const uid = requireAuth(request);
  const code = normalizeRoomCode(request.data?.code);
  if (code.length < 4) throw new HttpsError("invalid-argument", "Codigo de sala invalido.");

  const roomRef = db.collection("rooms").doc(code);
  const memberRef = roomRef.collection("members").doc(uid);

  await db.runTransaction(async (transaction) => {
    const roomSnap = await transaction.get(roomRef);
    if (!roomSnap.exists) throw new HttpsError("not-found", "Sala no encontrada.");

    const room = roomSnap.data();
    const memberIds = Array.isArray(room.memberIds) ? room.memberIds : [];
    if (memberIds.length >= MAX_ROOM_MEMBERS && !memberIds.includes(uid)) {
      throw new HttpsError("failed-precondition", "La sala ya esta llena.");
    }

    transaction.update(roomRef, {
      memberIds: FieldValue.arrayUnion(uid),
      updatedAt: FieldValue.serverTimestamp()
    });
    transaction.set(memberRef, {
      userId: uid,
      role: room.ownerId === uid ? "owner" : "member",
      joinedAt: FieldValue.serverTimestamp()
    }, { merge: true });
  });

  return { ok: true, roomId: code, code };
});

exports.createTrade = onCall(async (request) => {
  const uid = requireAuth(request);
  const { toUserId, roomId = null } = request.data || {};
  const offered = normalizeStickerIds("offered", request.data?.offered);
  const requested = normalizeStickerIds("requested", request.data?.requested);

  if (!toUserId || toUserId === uid) {
    throw new HttpsError("invalid-argument", "El intercambio necesita destinatario, oferta y solicitud.");
  }

  const offeredCounts = countStickerIds(offered);
  const tradeRef = db.collection("trades").doc();

  await db.runTransaction(async (transaction) => {
    if (roomId) {
      const roomSnap = await transaction.get(db.collection("rooms").doc(String(roomId)));
      const memberIds = roomSnap.exists && Array.isArray(roomSnap.data().memberIds)
        ? roomSnap.data().memberIds
        : [];
      if (!memberIds.includes(uid) || !memberIds.includes(toUserId)) {
        throw new HttpsError("permission-denied", "Ambos coleccionistas deben estar en la sala.");
      }
    }

    await assertInventoryCopies(transaction, uid, offeredCounts, "Tu oferta");

    transaction.set(tradeRef, {
      fromUserId: uid,
      toUserId,
      roomId: roomId ? String(roomId) : null,
      offered,
      requested,
      status: "pending",
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
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

    const offered = normalizeStickerIds("offered", trade.offered);
    const requested = normalizeStickerIds("requested", trade.requested);
    const offeredCounts = countStickerIds(offered);
    const requestedCounts = countStickerIds(requested);

    await assertInventoryCopies(transaction, trade.fromUserId, offeredCounts, "La oferta");
    await assertInventoryCopies(transaction, trade.toUserId, requestedCounts, "Tu album");

    applyInventoryMove(transaction, trade.fromUserId, trade.toUserId, offeredCounts);
    applyInventoryMove(transaction, trade.toUserId, trade.fromUserId, requestedCounts);

    transaction.update(tradeRef, {
      status: "accepted",
      acceptedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    });
  });

  return { ok: true };
});
