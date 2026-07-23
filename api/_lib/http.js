import crypto from "node:crypto";

const encoder = new TextEncoder();

export function sendJson(response, status, payload) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(payload));
}

export async function readJson(request) {
  const chunks = [];

  for await (const chunk of request) {
    chunks.push(chunk);
  }

  if (chunks.length === 0) {
    return {};
  }

  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export function createToken(payload) {
  const secret = process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  const header = { alg: "HS256", typ: "JWT" };
  const expiresAt = Math.floor(Date.now() / 1000) + 60 * 60 * 8;
  const body = { ...payload, exp: expiresAt };
  const unsigned = `${base64Url(JSON.stringify(header))}.${base64Url(JSON.stringify(body))}`;
  const signature = sign(unsigned, secret);

  return `${unsigned}.${signature}`;
}

export function requireAdmin(request) {
  const customToken = readHeader(request.headers, "x-admin-token");
  const authorization = readHeader(request.headers, "authorization");
  const token = customToken || (authorization.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : "");

  if (!token) {
    throw Object.assign(new Error("Missing admin token."), { statusCode: 401 });
  }

  const [encodedHeader, encodedPayload, signature] = token.split(".");
  const unsigned = `${encodedHeader}.${encodedPayload}`;

  if (!encodedHeader || !encodedPayload || !signature || !timingSafeEqual(signature, sign(unsigned, process.env.JWT_SECRET))) {
    throw Object.assign(new Error("Invalid admin token."), { statusCode: 401 });
  }

  const payload = JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8"));

  if (!payload.exp || payload.exp < Math.floor(Date.now() / 1000)) {
    throw Object.assign(new Error("Admin token has expired."), { statusCode: 401 });
  }

  return payload;
}

function readHeader(headers, name) {
  if (typeof headers?.get === "function") {
    return headers.get(name) || "";
  }

  return headers?.[name] || "";
}

export function handleError(response, error) {
  const status = error.statusCode || 500;
  sendJson(response, status, {
    error: status === 500 ? "Server error." : error.message
  });
}

function sign(value, secret) {
  return crypto.createHmac("sha256", encoder.encode(secret)).update(value).digest("base64url");
}

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

function timingSafeEqual(left, right) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}
