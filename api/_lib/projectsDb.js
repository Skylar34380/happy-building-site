import fs from "node:fs/promises";
import { getJsonBlob, hasAzureBlobConfig, putJsonBlob } from "./azureBlob.js";

const fallbackPath = new URL("../../public/data/projects.json", import.meta.url);
const projectsBlobName = process.env.AZURE_PROJECTS_BLOB_NAME || "data/projects.json";

export async function listProjects() {
  if (!hasAzureBlobConfig()) {
    const fallback = await fs.readFile(fallbackPath, "utf8");
    return JSON.parse(fallback);
  }

  try {
    return await getJsonBlob(projectsBlobName);
  } catch (error) {
    if (error.statusCode !== 404) {
      throw error;
    }

    const fallback = JSON.parse(await fs.readFile(fallbackPath, "utf8"));
    await putJsonBlob(projectsBlobName, fallback);
    return fallback;
  }
}

export async function createProject(project) {
  const projects = await listProjects();
  const nextProjects = [project, ...projects.filter((item) => item.id !== project.id)];
  await putJsonBlob(projectsBlobName, nextProjects);
  return project;
}

export async function updateProject(id, project) {
  const projects = await listProjects();
  const index = projects.findIndex((item) => item.id === id);

  if (index === -1) {
    throw Object.assign(new Error("Project not found."), { statusCode: 404 });
  }

  const updatedProject = {
    ...projects[index],
    ...project,
    id
  };
  const nextProjects = projects.slice();
  nextProjects[index] = updatedProject;
  await putJsonBlob(projectsBlobName, nextProjects);

  return updatedProject;
}

export async function deleteProject(id) {
  const projects = await listProjects();
  const project = projects.find((item) => item.id === id);

  if (!project) {
    throw Object.assign(new Error("Project not found."), { statusCode: 404 });
  }

  await putJsonBlob(
    projectsBlobName,
    projects.filter((item) => item.id !== id)
  );

  return { id, deleted: true };
}
