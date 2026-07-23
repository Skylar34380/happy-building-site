import { createUploadTarget } from "../_lib/azureBlob.js";
import { handleError, readJson, requireAdmin, sendJson } from "../_lib/http.js";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "model/gltf-binary"]);
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_MODEL_BYTES = 100 * 1024 * 1024;

export default async function handler(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  try {
    requireAdmin(request);
    const { filename, contentType, size } = await readJson(request);

    if (!filename || !contentType) {
      throw Object.assign(new Error("filename and contentType are required."), { statusCode: 400 });
    }

    if (!allowedTypes.has(contentType)) {
      throw Object.assign(new Error("This file type is not allowed."), { statusCode: 400 });
    }

    const maxBytes = contentType === "model/gltf-binary" ? MAX_MODEL_BYTES : MAX_IMAGE_BYTES;

    if (!Number.isFinite(Number(size)) || Number(size) <= 0 || Number(size) > maxBytes) {
      throw Object.assign(new Error(`File exceeds the ${maxBytes / 1024 / 1024} MB upload limit.`), { statusCode: 400 });
    }

    sendJson(response, 200, createUploadTarget({ filename, contentType }));
  } catch (error) {
    handleError(response, error);
  }
}
