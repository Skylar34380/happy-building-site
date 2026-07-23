import { deleteProject, updateProject } from "../_lib/projectsDb.js";
import { handleError, readJson, requireAdmin, sendJson } from "../_lib/http.js";

export default async function handler(request, response) {
  if (request.method !== "PUT" && request.method !== "PATCH" && request.method !== "DELETE") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  try {
    requireAdmin(request);
    const { id } = request.query;

    if (request.method === "DELETE") {
      sendJson(response, 200, await deleteProject(id));
      return;
    }

    const project = normalizeProject(await readJson(request));
    sendJson(response, 200, await updateProject(id, project));
  } catch (error) {
    handleError(response, error);
  }
}

function normalizeProject(project) {
  return {
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
