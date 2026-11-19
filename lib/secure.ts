"use client";

/**
 * Where connector keys are kept.
 *
 * Keys are never sent to Keew's server and never written to the database.
 * They live in this browser, encrypted with AES-GCM using a key derived from
 * the signed-in account's email — so the ciphertext on disk is useless to
 * anyone else reading the browser profile, and each account has its own vault.
 *
 * Honest limit: a key held in a browser can be read by code running in that
 * browser. This protects the key at rest, in storage, from another account.
 * It does not protect against a compromised page.
 */

const DB_NAME = "keew-vault";
const STORE = "keys";
const SALT = "keew-ia-vault-v1";

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) req.result.createObjectStore(STORE);
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function deriveKey(owner: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const material = await crypto.subtle.importKey("raw", enc.encode(owner), "PBKDF2", false, [
    "deriveKey",
  ]);
  return crypto.subtle.deriveKey(
    { name: "PBKDF2", salt: enc.encode(SALT), iterations: 120_000, hash: "SHA-256" },
    material,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"],
  );
}

const b64 = (buf: ArrayBuffer) =>
  btoa(String.fromCharCode(...Array.from(new Uint8Array(buf))));

const unb64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0));

export async function putSecret(owner: string, id: string, value: string): Promise<void> {
  const key = await deriveKey(owner);
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipher = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv },
    key,
    new TextEncoder().encode(value),
  );
  const payload = JSON.stringify({ iv: b64(iv.buffer), data: b64(cipher) });

  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).put(payload, id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}

export async function getSecret(owner: string, id: string): Promise<string | null> {
  const db = await openDb();
  const payload = await new Promise<string | null>((resolve, reject) => {
    const tx = db.transaction(STORE, "readonly");
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(typeof req.result === "string" ? req.result : null);
    req.onerror = () => reject(req.error);
  });
  db.close();
  if (!payload) return null;

  try {
    const { iv, data } = JSON.parse(payload) as { iv: string; data: string };
    const key = await deriveKey(owner);
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: unb64(iv) }, key, unb64(data));
    return new TextDecoder().decode(plain);
  } catch {
    // wrong account, or the vault was written before a reset
    return null;
  }
}

export async function dropSecret(id: string): Promise<void> {
  const db = await openDb();
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, "readwrite");
    tx.objectStore(STORE).delete(id);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
  db.close();
}
