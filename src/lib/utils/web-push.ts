/**
 * Web Push signing and payload encryption using Web Crypto API.
 *
 * This module implements VAPID JWT signing and RFC 8291 payload encryption
 * without Node.js crypto dependencies, making it compatible with Cloudflare
 * Pages Functions (V8 isolate runtime).
 */

const VAPID_EXPIRY_SECONDS = 12 * 60 * 60; // 12 hours

/**
 * Encode a Uint8Array to base64url (RFC 4648 §5).
 */
function base64urlEncode(buffer: Uint8Array): string {
  const base64 = btoa(String.fromCharCode(...buffer));
  return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}

/**
 * Decode a base64url string to Uint8Array.
 */
function base64urlDecode(str: string): Uint8Array {
  const padding = "=".repeat((4 - (str.length % 4)) % 4);
  const base64 = str.replace(/-/g, "+").replace(/_/g, "/") + padding;
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Concatenate multiple Uint8Arrays.
 */
function concatArrays(...arrays: Uint8Array[]): Uint8Array {
  const totalLength = arrays.reduce((sum, arr) => sum + arr.length, 0);
  const result = new Uint8Array(totalLength);
  let offset = 0;
  for (const arr of arrays) {
    result.set(arr, offset);
    offset += arr.length;
  }
  return result;
}

/**
 * HKDF extract step: HMAC-SHA-256(key, data).
 */
async function hmacSha256(key: Uint8Array, data: Uint8Array): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, data);
  return new Uint8Array(signature);
}

/**
 * HKDF expand step.
 */
async function hkdfExpand(
  prk: Uint8Array,
  info: Uint8Array,
  length: number,
): Promise<Uint8Array> {
  const hashLen = 32; // SHA-256
  const n = Math.ceil(length / hashLen);
  if (n > 255) {
    throw new Error("HKDF expand length too large");
  }

  let okm = new Uint8Array(0);
  let t = new Uint8Array(0);

  for (let i = 1; i <= n; i++) {
    const counter = new Uint8Array([i]);
    t = await hmacSha256(prk, concatArrays(t, info, counter));
    okm = concatArrays(okm, t);
  }

  return okm.slice(0, length);
}

/**
 * Build a minimal ASN.1 DER length field.
 */
function asn1Length(length: number): Uint8Array {
  if (length < 128) {
    return new Uint8Array([length]);
  }
  const bytes: number[] = [];
  let temp = length;
  while (temp > 0) {
    bytes.unshift(temp & 0xff);
    temp >>= 8;
  }
  return new Uint8Array([0x80 | bytes.length, ...bytes]);
}

/**
 * Build an ASN.1 SEQUENCE from raw DER content.
 */
function asn1Sequence(content: Uint8Array): Uint8Array {
  const len = asn1Length(content.length);
  return concatArrays(new Uint8Array([0x30]), len, content);
}

/**
 * Build an ASN.1 OCTET STRING.
 */
function asn1OctetString(content: Uint8Array): Uint8Array {
  const len = asn1Length(content.length);
  return concatArrays(new Uint8Array([0x04]), len, content);
}

/**
 * Build an ASN.1 INTEGER from a small non-negative number.
 */
function asn1Integer(value: number): Uint8Array {
  return new Uint8Array([0x02, 0x01, value]);
}

/**
 * Wrap a raw 32-byte ECDSA P-256 private key into PKCS#8 format.
 *
 * Web Crypto requires PKCS#8 import, but VAPID keys are often stored as
 * raw 32-byte private keys. This function wraps them with the required
 * ASN.1 structure.
 */
function wrapRawEcdsaKeyToPkcs8(rawPrivateKey: Uint8Array): Uint8Array {
  // Ensure the private key is exactly 32 bytes
  if (rawPrivateKey.length !== 32) {
    throw new Error(`Expected 32-byte private key, got ${rawPrivateKey.length}`);
  }

  // OID ecPublicKey (1.2.840.10045.2.1)
  const ecPublicKeyOid = new Uint8Array([
    0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01,
  ]);
  // OID prime256v1 (1.2.840.10045.3.1.7)
  const prime256v1Oid = new Uint8Array([
    0x06, 0x08, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x03, 0x01, 0x07,
  ]);

  const algorithmIdentifier = asn1Sequence(
    concatArrays(ecPublicKeyOid, prime256v1Oid),
  );

  // ECPrivateKey structure (RFC 5915)
  // version INTEGER { ecPrivkeyVer1(1) }
  const version = asn1Integer(1);
  // privateKey OCTET STRING
  const privateKeyOctet = asn1OctetString(rawPrivateKey);

  const ecPrivateKey = asn1Sequence(
    concatArrays(version, privateKeyOctet),
  );

  const privateKeyInfo = asn1Sequence(
    concatArrays(
      asn1Integer(0), // version 0
      algorithmIdentifier,
      asn1OctetString(ecPrivateKey),
    ),
  );

  return privateKeyInfo;
}

/**
 * Import a VAPID private key from base64url.
 *
 * Handles both raw 32-byte keys and PKCS#8-wrapped keys.
 */
async function importVapidPrivateKey(privateKeyBase64url: string): Promise<CryptoKey> {
  const privateKeyBytes = base64urlDecode(privateKeyBase64url);

  let pkcs8Bytes: Uint8Array;
  if (privateKeyBytes.length === 32) {
    // Raw 32-byte key — wrap it in PKCS#8
    pkcs8Bytes = wrapRawEcdsaKeyToPkcs8(privateKeyBytes);
  } else {
    // Already PKCS#8
    pkcs8Bytes = privateKeyBytes;
  }

  return crypto.subtle.importKey(
    "pkcs8",
    pkcs8Bytes.buffer,
    { name: "ECDSA", namedCurve: "P-256" },
    false,
    ["sign"],
  );
}

/**
 * Build the VAPID JWT and sign it.
 */
async function buildVapidJwt(
  endpoint: string,
  vapidPrivateKey: CryptoKey,
  vapidPublicKeyBase64url: string,
  subject: string,
): Promise<string> {
  const endpointUrl = new URL(endpoint);
  const audience = `${endpointUrl.protocol}//${endpointUrl.host}`;
  const now = Math.floor(Date.now() / 1000);
  const expires = now + VAPID_EXPIRY_SECONDS;

  const header = base64urlEncode(
    new TextEncoder().encode(JSON.stringify({ typ: "JWT", alg: "ES256" })),
  );
  const payload = base64urlEncode(
    new TextEncoder().encode(
      JSON.stringify({ sub: subject, aud: audience, exp: expires }),
    ),
  );

  const signingInput = new TextEncoder().encode(`${header}.${payload}`);
  const signature = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    vapidPrivateKey,
    signingInput,
  );

  const signatureBase64url = base64urlEncode(new Uint8Array(signature));
  return `${header}.${payload}.${signatureBase64url}`;
}

// ---------------------------------------------------------------------------
// Payload encryption (RFC 8291)
// ---------------------------------------------------------------------------

/**
 * Encrypt a push payload using RFC 8291.
 */
async function encryptPayload(
  payload: string,
  userPublicKeyBytes: Uint8Array,
  userAuthBytes: Uint8Array,
): Promise<{ ciphertext: Uint8Array; salt: Uint8Array; localPublicKey: Uint8Array }> {
  // Generate a local ECDH P-256 key pair
  const localKeyPair = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveBits"],
  );

  // Import the user's public key for ECDH
  const userPublicKey = await crypto.subtle.importKey(
    "raw",
    userPublicKeyBytes.buffer,
    { name: "ECDH", namedCurve: "P-256" },
    false,
    [],
  );

  // Derive shared secret
  const sharedSecret = new Uint8Array(
    await crypto.subtle.deriveBits(
      { name: "ECDH", public: userPublicKey },
      localKeyPair.privateKey,
      256,
    ),
  );

  // Export local public key
  const localPublicKeyBuffer = await crypto.subtle.exportKey("raw", localKeyPair.publicKey);
  const localPublicKey = new Uint8Array(localPublicKeyBuffer);

  // Generate salt
  const salt = crypto.getRandomValues(new Uint8Array(16));

  // RFC 8291 aes128gcm key derivation for Web Push:
  // 1. Intermediate secret = HKDF(auth_secret, sharedSecret,
  //    "WebPush: info\x00" || receiver_public || sender_public, 32)
  // 2. PRK = HKDF-Extract(salt, intermediate_secret)
  // 3. For aes128gcm, info strings are just "Content-Encoding: <label>\x00"
  //    (no context appended, unlike aesgcm)

  const webPushInfo = concatArrays(
    new TextEncoder().encode("WebPush: info\x00"),
    userPublicKeyBytes,
    localPublicKey,
  );
  const intermediateSecret = await hkdfExpand(
    await hmacSha256(userAuthBytes, sharedSecret),
    webPushInfo,
    32,
  );

  const contentEncodingAesInfo = new TextEncoder().encode("Content-Encoding: aes128gcm\x00");
  const contentEncodingNonceInfo = new TextEncoder().encode("Content-Encoding: nonce\x00");

  const prkKey = await hmacSha256(salt, intermediateSecret);
  const contentEncryptionKey = await hkdfExpand(prkKey, contentEncodingAesInfo, 16);
  const nonce = await hkdfExpand(prkKey, contentEncodingNonceInfo, 12);

  // Encrypt payload with AES-GCM; append 0x02 padding delimiter (last record per RFC 8188)
  const payloadBytes = new TextEncoder().encode(payload);
  const plaintext = concatArrays(payloadBytes, new Uint8Array([0x02]));

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    contentEncryptionKey,
    { name: "AES-GCM", length: 128 },
    false,
    ["encrypt"],
  );

  const ciphertext = new Uint8Array(
    await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, cryptoKey, plaintext),
  );

  return { ciphertext, salt, localPublicKey };
}

/**
 * Build the encrypted body for the push request (RFC 8188 / 8291).
 */
function buildEncryptedBody(
  salt: Uint8Array,
  recordSize: number,
  localPublicKey: Uint8Array,
  ciphertext: Uint8Array,
): Uint8Array {
  // Header: salt (16) + record size (4) + key id length (1) + key id (localPublicKey.length)
  const keyIdLength = localPublicKey.length;
  const header = new Uint8Array(16 + 4 + 1 + keyIdLength);
  header.set(salt, 0);

  // Record size as big-endian uint32
  header[16] = (recordSize >> 24) & 0xff;
  header[17] = (recordSize >> 16) & 0xff;
  header[18] = (recordSize >> 8) & 0xff;
  header[19] = recordSize & 0xff;

  header[20] = keyIdLength;
  header.set(localPublicKey, 21);

  return concatArrays(header, ciphertext);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface PushSubscriptionKeys {
  endpoint: string;
  p256dh: string;
  auth: string;
}

export interface SendPushMessageOptions {
  endpoint: string;
  p256dh: string;
  auth: string;
  vapidPrivateKey: string;
  vapidPublicKey: string;
  vapidSubject: string;
  title: string;
  body: string;
  tag?: string;
  icon?: string;
  badge?: string;
}

export interface SendPushMessageResult {
  ok: boolean;
  status: number;
  statusText: string;
  permanentFailure: boolean;
}

/**
 * Send a push message to a single subscription.
 *
 * Implements VAPID authentication and RFC 8291 payload encryption
 * using only the Web Crypto API.
 */
export async function sendPushMessage(
  options: SendPushMessageOptions,
): Promise<SendPushMessageResult> {
  const {
    endpoint,
    p256dh,
    auth,
    vapidPrivateKey,
    vapidPublicKey,
    vapidSubject,
    title,
    body,
    tag = "familytodo-weekly-reminder",
    icon = "/icons/icon-192.png",
    badge = "/icons/icon-192.png",
  } = options;

  const payload = JSON.stringify({ title, body, tag, icon, badge });

  // Import VAPID keys
  const privateKey = await importVapidPrivateKey(vapidPrivateKey);

  // Build VAPID JWT
  const jwt = await buildVapidJwt(endpoint, privateKey, vapidPublicKey, vapidSubject);

  // Encrypt payload
  const userPublicKeyBytes = base64urlDecode(p256dh);
  const userAuthBytes = base64urlDecode(auth);
  const { ciphertext, salt, localPublicKey } = await encryptPayload(
    payload,
    userPublicKeyBytes,
    userAuthBytes,
  );

  const recordSize = 4096; // Standard record size
  const encryptedBody = buildEncryptedBody(salt, recordSize, localPublicKey, ciphertext);

  // Send the push request
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/octet-stream",
      "Content-Encoding": "aes128gcm",
      TTL: "86400",
      Authorization: `vapid t=${jwt}, k=${vapidPublicKey}`,
    },
    body: encryptedBody,
  });

  const permanentFailure = response.status === 410 || response.status === 404;

  return {
    ok: response.ok,
    status: response.status,
    statusText: response.statusText,
    permanentFailure,
  };
}

/**
 * Generate a new VAPID key pair using Web Crypto.
 *
 * Returns base64url-encoded private and public keys.
 */
export async function generateVapidKeyPair(): Promise<{
  privateKey: string;
  publicKey: string;
}> {
  const keyPair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    true,
    ["sign", "verify"],
  );

  const privateKeyBuffer = await crypto.subtle.exportKey("pkcs8", keyPair.privateKey);
  const publicKeyBuffer = await crypto.subtle.exportKey("spki", keyPair.publicKey);

  return {
    privateKey: base64urlEncode(new Uint8Array(privateKeyBuffer)),
    publicKey: base64urlEncode(new Uint8Array(publicKeyBuffer)),
  };
}
