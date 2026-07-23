import { createProject, listProjects } from "../_lib/projectsDb.js";
import { handleError, readJson, requireAdmin, sendJson } from "../_lib/http.js";

export default async function handler(request, response) {
  try {
    if (request.method === "GET") {
      sendJson(response, 200, await listProjects());
      return;
    }

    if (request.method === "POST") {
      requireAdmin(request);
      const project = normalizeProject(await readJson(request));
      sendJson(response, 201, await createProject(project));
      return;
    }

    sendJson(response, 405, { error: "Method not allowed." });
  } catch (error) {
    handleError(response, error);
  }
}

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
