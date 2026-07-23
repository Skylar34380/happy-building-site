import crypto from "node:crypto";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import { createUploadTarget } from "./api/_lib/azureBlob.js";
import { createToken, requireAdmin } from "./api/_lib/http.js";
import { createProject, deleteProject, listProjects, updateProject } from "./api/_lib/projectsDb.js";

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const allowedImageTypes = new Set(["image/jpeg", "image/png", "image/webp"]);

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  [
    "ADMIN_USERNAME",
    "ADMIN_PASSWORD",
    "JWT_SECRET",
    "AZURE_STORAGE_ACCOUNT",
    "AZURE_STORAGE_ACCOUNT_KEY",
    "AZURE_STORAGE_CONTAINER",
    "AZURE_PROJECTS_BLOB_NAME"
  ].forEach((key) => {
    if (env[key]) {
      process.env[key] = env[key];
    }
  });

  return {
    plugins: [react(), localAdminApi()]
  };
});

function localAdminApi() {
  const pendingUploads = new Map();

  return {
    name: "twoform-local-admin-api",
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        const url = new URL(request.url, "http://127.0.0.1");

        if (!url.pathname.startsWith("/api/")) {
          next();
          return;
        }

        try {
          if (request.method === "POST" && url.pathname === "/api/auth/login") {
            const { username, password } = await readBodyJson(request);

            if (username !== process.env.ADMIN_USERNAME || password !== process.env.ADMIN_PASSWORD) {
              sendJson(response, 401, { error: "The username or password is incorrect." });
              return;
            }

            sendJson(response, 200, { token: createToken({ role: "admin", username }) });
            return;
          }

          if (request.method === "GET" && url.pathname === "/api/projects") {
            sendJson(response, 200, await listProjects());
            return;
          }

          if (request.method === "POST" && url.pathname === "/api/projects") {
            requireAdmin(request);
            const project = normalizeProject(await readBodyJson(request));
            sendJson(response, 201, await createProject(project));
            return;
          }

          const projectMatch = url.pathname.match(/^\/api\/projects\/([^/]+)$/);
          if (projectMatch && ["PUT", "PATCH", "DELETE"].includes(request.method)) {
            requireAdmin(request);
            const projectId = decodeURIComponent(projectMatch[1]);

            if (request.method === "DELETE") {
              sendJson(response, 200, await deleteProject(projectId));
            } else {
              sendJson(response, 200, await updateProject(projectId, normalizeProject(await readBodyJson(request))));
            }
            return;
          }

          if (request.method === "POST" && url.pathname === "/api/uploads/sign") {
            requireAdmin(request);
            const { filename, contentType, size } = await readBodyJson(request);

            if (!filename || !allowedImageTypes.has(contentType)) {
              sendJson(response, 400, { error: "Only JPEG, PNG and WebP images are allowed." });
              return;
            }

            if (!Number.isFinite(Number(size)) || Number(size) <= 0 || Number(size) > MAX_IMAGE_BYTES) {
              sendJson(response, 400, { error: "File exceeds the 15 MB upload limit." });
              return;
            }

            const target = createUploadTarget({ filename, contentType });
            const uploadId = crypto.randomUUID();
            pendingUploads.set(uploadId, {
              azureUrl: target.uploadUrl,
              contentType,
              expiresAt: Date.now() + 10 * 60 * 1000,
              maxBytes: MAX_IMAGE_BYTES
            });
            sendJson(response, 200, {
              ...target,
              uploadUrl: `/api/uploads/local/${uploadId}`
            });
            return;
          }

          const uploadMatch = url.pathname.match(/^\/api\/uploads\/local\/([^/]+)$/);
          if (request.method === "PUT" && uploadMatch) {
            const upload = pendingUploads.get(uploadMatch[1]);

            if (!upload || upload.expiresAt < Date.now()) {
              sendJson(response, 401, { error: "The upload link has expired." });
              return;
            }

            const body = await readBodyBuffer(request, upload.maxBytes);
            const azureResponse = await fetch(upload.azureUrl, {
              method: "PUT",
              headers: {
                "Content-Type": upload.contentType,
                "x-ms-blob-type": "BlockBlob"
              },
              body
            });

            if (!azureResponse.ok) {
              throw Object.assign(new Error(`Azure upload failed: ${azureResponse.status}`), { statusCode: 502 });
            }

            pendingUploads.delete(uploadMatch[1]);
            response.statusCode = 201;
            response.end();
            return;
          }

          sendJson(response, 404, { error: "API route not found." });
        } catch (error) {
          sendJson(response, error.statusCode || 500, {
            error: error.statusCode ? error.message : "Server error."
          });
        }
      });
    }
  };
}

function normalizeProject(project) {
  const gallery = Array.isArray(project.gallery) ? [...new Set(project.gallery.filter(Boolean))] : [];

  return {
    id: project.id,
    title: project.title,
    category: project.category,
    location: project.location,
    year: Number(project.year),
    status: project.status,
    service: project.service,
    summary: project.summary,
    image: gallery[0] || project.image || "",
    gallery,
    model_url: project.model_url || null
  };
}

async function readBodyJson(request) {
  const body = await readBodyBuffer(request, 1024 * 1024);
  return body.length > 0 ? JSON.parse(body.toString("utf8")) : {};
}

async function readBodyBuffer(request, maxBytes) {
  const chunks = [];
  let totalBytes = 0;

  for await (const chunk of request) {
    totalBytes += chunk.length;
    if (totalBytes > maxBytes) {
      throw Object.assign(new Error("Request body is too large."), { statusCode: 413 });
    }
    chunks.push(chunk);
  }

  return Buffer.concat(chunks);
}

function sendJson(response, status, payload) {
  response.statusCode = status;
  response.setHeader("Content-Type", "application/json");
  response.end(JSON.stringify(payload));
}
