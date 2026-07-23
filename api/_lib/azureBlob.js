import crypto from "node:crypto";

const DEFAULT_EXPIRY_MINUTES = 10;

export function hasAzureBlobConfig() {
  return Boolean(process.env.AZURE_STORAGE_ACCOUNT && process.env.AZURE_STORAGE_ACCOUNT_KEY && process.env.AZURE_STORAGE_CONTAINER);
}

export function createUploadTarget({ filename }) {
  const account = process.env.AZURE_STORAGE_ACCOUNT;
  const key = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  const container = process.env.AZURE_STORAGE_CONTAINER;

  if (!account || !key || !container) {
    throw Object.assign(new Error("Azure Blob Storage environment variables are not configured."), { statusCode: 501 });
  }

  const safeFilename = sanitizeFilename(filename);
  const blobName = `projects/${Date.now()}-${crypto.randomUUID()}-${safeFilename}`;
  const expiresOn = new Date(Date.now() + DEFAULT_EXPIRY_MINUTES * 60 * 1000);
  const startsOn = new Date(Date.now() - 60 * 1000);
  const sas = createBlobSas({
    account,
    key,
    container,
    blobName,
    startsOn,
    expiresOn,
    permissions: "cw"
  });
  const publicUrl = `https://${account}.blob.core.windows.net/${container}/${encodeURIComponentPath(blobName)}`;

  return {
    uploadUrl: `${publicUrl}?${sas}`,
    publicUrl,
    blobName,
    expiresOn: expiresOn.toISOString()
  };
}

export async function getJsonBlob(blobName) {
  const response = await azureBlobRequest(blobName, {
    method: "GET"
  });

  if (response.status === 404) {
    throw Object.assign(new Error(`Azure blob not found: ${blobName}`), { statusCode: 404 });
  }

  if (!response.ok) {
    throw Object.assign(new Error(await response.text()), { statusCode: response.status });
  }

  return response.json();
}

export async function putJsonBlob(blobName, value) {
  const body = `${JSON.stringify(value, null, 2)}\n`;
  const response = await azureBlobRequest(blobName, {
    method: "PUT",
    body,
    contentType: "application/json",
    extraHeaders: {
      "x-ms-blob-type": "BlockBlob"
    }
  });

  if (!response.ok) {
    throw Object.assign(new Error(await response.text()), { statusCode: response.status });
  }
}

export async function putBinaryBlob(blobName, buffer, contentType) {
  const response = await azureBlobRequest(blobName, {
    method: "PUT",
    body: buffer,
    contentType,
    extraHeaders: {
      "x-ms-blob-type": "BlockBlob"
    }
  });

  if (!response.ok) {
    throw Object.assign(new Error(await response.text()), { statusCode: response.status });
  }

  return `https://${process.env.AZURE_STORAGE_ACCOUNT}.blob.core.windows.net/${process.env.AZURE_STORAGE_CONTAINER}/${encodeURIComponentPath(blobName)}`;
}

function createBlobSas({ account, key, container, blobName, startsOn, expiresOn, permissions }) {
  const signedVersion = "2023-11-03";
  const canonicalizedResource = `/blob/${account}/${container}/${blobName}`;
  const signedResource = "b";
  const starts = formatAzureDate(startsOn);
  const expires = formatAzureDate(expiresOn);
  const signedProtocol = "https";
  const cacheControl = "";
  const contentDisposition = "";
  const contentEncoding = "";
  const contentLanguage = "";
  const stringToSign = [
    permissions,
    starts,
    expires,
    canonicalizedResource,
    "",
    "",
    signedProtocol,
    signedVersion,
    signedResource,
    "",
    "",
    cacheControl,
    contentDisposition,
    contentEncoding,
    contentLanguage,
    ""
  ].join("\n");
  const signature = crypto.createHmac("sha256", Buffer.from(key, "base64")).update(stringToSign, "utf8").digest("base64");

  return new URLSearchParams({
    sv: signedVersion,
    spr: signedProtocol,
    st: starts,
    se: expires,
    sr: signedResource,
    sp: permissions,
    sig: signature
  }).toString();
}

async function azureBlobRequest(blobName, { method, body = "", contentType = "", extraHeaders = {} }) {
  const account = process.env.AZURE_STORAGE_ACCOUNT;
  const key = process.env.AZURE_STORAGE_ACCOUNT_KEY;
  const container = process.env.AZURE_STORAGE_CONTAINER;

  if (!hasAzureBlobConfig()) {
    throw Object.assign(new Error("Azure Blob Storage environment variables are not configured."), { statusCode: 501 });
  }

  const url = `https://${account}.blob.core.windows.net/${container}/${encodeURIComponentPath(blobName)}`;
  const headers = {
    "x-ms-date": new Date().toUTCString(),
    "x-ms-version": "2023-11-03",
    ...extraHeaders
  };
  const bodyBuffer = typeof body === "string" ? Buffer.from(body) : body;

  if (contentType) {
    headers["Content-Type"] = contentType;
  }

  if (bodyBuffer.length > 0) {
    headers["Content-Length"] = String(bodyBuffer.length);
  }

  headers.Authorization = createSharedKeyAuthorization({
    account,
    key,
    method,
    container,
    blobName,
    headers,
    contentLength: bodyBuffer.length,
    contentType
  });

  return fetch(url, {
    method,
    headers,
    body: bodyBuffer.length > 0 ? bodyBuffer : undefined
  });
}

function createSharedKeyAuthorization({ account, key, method, container, blobName, headers, contentLength, contentType }) {
  const canonicalizedHeaders = Object.entries(headers)
    .filter(([name]) => name.toLowerCase().startsWith("x-ms-"))
    .map(([name, value]) => [name.toLowerCase(), String(value).trim()])
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, value]) => `${name}:${value}`)
    .join("\n");
  const canonicalizedResource = `/${account}/${container}/${blobName}`;
  const stringToSign = [
    method,
    "",
    "",
    contentLength > 0 ? String(contentLength) : "",
    "",
    contentType,
    "",
    "",
    "",
    "",
    "",
    "",
    canonicalizedHeaders,
    canonicalizedResource
  ].join("\n");
  const signature = crypto.createHmac("sha256", Buffer.from(key, "base64")).update(stringToSign, "utf8").digest("base64");

  return `SharedKey ${account}:${signature}`;
}

function sanitizeFilename(filename) {
  return String(filename || "upload")
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 96);
}

function encodeURIComponentPath(path) {
  return path.split("/").map(encodeURIComponent).join("/");
}

function formatAzureDate(date) {
  return date.toISOString().replace(/\.\d{3}Z$/, "Z");
}
