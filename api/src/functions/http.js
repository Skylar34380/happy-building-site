import { app } from "@azure/functions";
import { createUploadTarget } from "../../_lib/azureBlob.js";
import { createProject, deleteProject, listProjects, updateProject } from "../../_lib/projectsDb.js";
import { createToken, requireAdmin } from "../../_lib/http.js";

const allowedUploadTypes = new Set(["image/jpeg", "image/png", "image/webp", "model/gltf-binary"]);
const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_MODEL_BYTES = 100 * 1024 * 1024;

app.http("login", {
  route: "auth/login",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request) => withErrorHandling(async () => {
    const { username, password } = await request.json();
    const expectedUsername = process.env.ADMIN_USERNAME;
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (!expectedUsername || !expectedPassword) {
      throw Object.assign(new Error("Admin credentials are not configured."), { statusCode: 501 });
    }

    if (username !== expectedUsername || password !== expectedPassword) {
      throw Object.assign(new Error("The username or password is incorrect."), { statusCode: 401 });
    }

    return json(200, {
      token: createToken({ role: "admin", username })
    });
  })
});

app.http("projects", {
  route: "projects",
  methods: ["GET", "POST"],
  authLevel: "anonymous",
  handler: async (request) => withErrorHandling(async () => {
    if (request.method === "GET") {
      return json(200, await listProjects());
    }

    requireAdmin(toAuthRequest(request));
    const project = normalizeProject(await request.json());
    return json(201, await createProject(project));
  })
});

app.http("projectById", {
  route: "projects/{id}",
  methods: ["PUT", "PATCH", "DELETE"],
  authLevel: "anonymous",
  handler: async (request) => withErrorHandling(async () => {
    requireAdmin(toAuthRequest(request));

    if (request.method === "DELETE") {
      return json(200, await deleteProject(getProjectId(request)));
    }

    const project = normalizeProject(await request.json());
    return json(200, await updateProject(getProjectId(request), project));
  })
});

app.http("signUpload", {
  route: "uploads/sign",
  methods: ["POST"],
  authLevel: "anonymous",
  handler: async (request) => withErrorHandling(async () => {
    requireAdmin(toAuthRequest(request));
    const { filename, contentType, size } = await request.json();

    if (!filename || !contentType) {
      throw Object.assign(new Error("filename and contentType are required."), { statusCode: 400 });
    }

    if (!allowedUploadTypes.has(contentType)) {
      throw Object.assign(new Error("This file type is not allowed."), { statusCode: 400 });
    }

    const maxBytes = contentType === "model/gltf-binary" ? MAX_MODEL_BYTES : MAX_IMAGE_BYTES;

    if (!Number.isFinite(Number(size)) || Number(size) <= 0 || Number(size) > maxBytes) {
      throw Object.assign(new Error(`File exceeds the ${maxBytes / 1024 / 1024} MB upload limit.`), { statusCode: 400 });
    }

    return json(200, createUploadTarget({ filename }));
  })
});

function normalizeProject(project) {
  return {
    id: project.id,
    title: project.title,
    category: project.category,
    location: project.location,
    year: Number(project.year),
    status: project.status,
    service: project.service,
    summary: project.summary,
    image: project.image || "",
    gallery: normalizeGallery(project),
    model_url: project.model_url || null
  };
}

function normalizeGallery(project) {
  return Array.isArray(project.gallery)
    ? [...new Set(project.gallery.filter(Boolean))]
    : project.image
      ? [project.image]
      : [];
}

async function withErrorHandling(callback) {
  try {
    return await callback();
  } catch (error) {
    const status = error.statusCode || 500;
    return json(status, {
      error: status === 500 ? "Server error." : error.message
    });
  }
}

function json(status, payload) {
  return {
    status,
    jsonBody: payload
  };
}

function toAuthRequest(request) {
  return {
    headers: {
      "x-admin-token": request.headers.get("x-admin-token") || "",
      authorization: request.headers.get("authorization") || ""
    }
  };
}

function getProjectId(request) {
  if (request.params?.id) {
    return request.params.id;
  }

  const pathname = new URL(request.url).pathname;
  return decodeURIComponent(pathname.split("/").filter(Boolean).at(-1));
}
