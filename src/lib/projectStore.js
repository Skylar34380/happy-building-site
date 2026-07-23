const API_PROJECTS_URL = "/api/projects";
const FALLBACK_PROJECTS_URL = "/data/projects.json";
const TOKEN_STORAGE_KEY = "twoform_admin_token";

export async function loadProjects() {
  try {
    const response = await fetch(API_PROJECTS_URL);
    const contentType = response.headers.get("content-type") || "";

    if (response.ok && contentType.includes("application/json")) {
      return response.json();
    }
  } catch {
    // Local development can run without the API; fall back to the static JSON below.
  }

  const fallbackResponse = await fetch(FALLBACK_PROJECTS_URL);

  if (!fallbackResponse.ok) {
    throw new Error(`Could not load projects: ${fallbackResponse.status}`);
  }

  return fallbackResponse.json();
}

export function getAdminToken() {
  return window.localStorage.getItem(TOKEN_STORAGE_KEY);
}

export function clearAdminToken() {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export async function loginAdmin({ username, password }) {
  const response = await fetch("/api/auth/login", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ username, password })
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  const result = await response.json();
  window.localStorage.setItem(TOKEN_STORAGE_KEY, result.token);
  return result.token;
}

export async function uploadProjectFile(file, token) {
  const signResponse = await fetch("/api/uploads/sign", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      filename: file.name,
      contentType: file.type,
      size: file.size
    })
  });

  if (!signResponse.ok) {
    throw new Error(await readApiError(signResponse));
  }

  const target = await signResponse.json();
  const uploadResponse = await fetch(target.uploadUrl, {
    method: "PUT",
    headers: {
      "x-ms-blob-type": "BlockBlob",
      "Content-Type": file.type
    },
    body: file
  });

  if (!uploadResponse.ok) {
    throw new Error(`Azure upload failed: ${uploadResponse.status}`);
  }

  return target.publicUrl;
}

export async function saveProject(project, token) {
  const response = await fetch(API_PROJECTS_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(project)
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return response.json();
}

export async function updateProject(projectId, project, token) {
  const response = await fetch(`${API_PROJECTS_URL}/${encodeURIComponent(projectId)}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify(project)
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return response.json();
}

export async function deleteProject(projectId, token) {
  const response = await fetch(`${API_PROJECTS_URL}/${encodeURIComponent(projectId)}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(await readApiError(response));
  }

  return response.json();
}

export function buildProjectRecord(formData) {
  const title = String(formData.get("title") || "").trim();

  return {
    id: slugify(title),
    title,
    category: formData.get("category"),
    location: String(formData.get("location") || "").trim(),
    area: String(formData.get("area") || "").trim(),
    year: Number(formData.get("year")),
    status: formData.get("status"),
    summary: String(formData.get("summary") || "").trim(),
    service: formData.get("service"),
    image: String(formData.get("image") || "").trim(),
    gallery: parseGalleryUrls(formData.get("gallery"))
  };
}

export function downloadProjectDatabase(projects) {
  const blob = new Blob([`${JSON.stringify(projects, null, 2)}\n`], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "projects.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function mergeProject(projects, project) {
  const existingIndex = projects.findIndex((item) => item.id === project.id);

  if (existingIndex === -1) {
    return [project, ...projects];
  }

  return projects.map((item) => (item.id === project.id ? project : item));
}

export function removeProject(projects, projectId) {
  return projects.filter((project) => project.id !== projectId);
}

async function readApiError(response) {
  try {
    const payload = await response.json();
    return payload.error || `Request failed: ${response.status}`;
  } catch {
    return `Request failed: ${response.status}`;
  }
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function parseGalleryUrls(value) {
  return String(value || "")
    .split(/[\n,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
}
