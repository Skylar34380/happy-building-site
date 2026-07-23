import fs from "node:fs/promises";

const dataPath = new URL("../public/data/projects.json", import.meta.url);
const requiredFields = ["id", "title", "category", "location", "year", "status", "service", "summary", "image"];
const allowedCategories = new Set(["Commercial", "Residential", "Renovation"]);
const allowedStatuses = new Set(["Completed", "In progress", "Planning"]);

const projects = JSON.parse(await fs.readFile(dataPath, "utf8"));

if (!Array.isArray(projects)) {
  throw new Error("data/projects.json must contain an array.");
}

const ids = new Set();

for (const [index, project] of projects.entries()) {
  for (const field of requiredFields) {
    if (project[field] === undefined || (field !== "image" && project[field] === "")) {
      throw new Error(`Project at index ${index} is missing "${field}".`);
    }
  }

  if (ids.has(project.id)) {
    throw new Error(`Duplicate project id: ${project.id}`);
  }
  ids.add(project.id);

  if (!allowedCategories.has(project.category)) {
    throw new Error(`Invalid category for ${project.id}: ${project.category}`);
  }

  if (!allowedStatuses.has(project.status)) {
    throw new Error(`Invalid status for ${project.id}: ${project.status}`);
  }

  if (!Number.isInteger(project.year) || project.year < 1900 || project.year > 2100) {
    throw new Error(`Invalid year for ${project.id}: ${project.year}`);
  }

  if (project.image && !isAllowedImageSource(project.image)) {
    throw new Error(`Image for ${project.id} should be a local /assets/ path or an Azure Blob URL.`);
  }

  if (project.gallery !== undefined) {
    if (!Array.isArray(project.gallery)) {
      throw new Error(`Gallery for ${project.id} should be an array.`);
    }

    for (const image of project.gallery) {
      if (!isAllowedImageSource(image)) {
        throw new Error(`Gallery image for ${project.id} should be a local /assets/ path or an Azure Blob URL.`);
      }
    }
  }
}

function isAllowedImageSource(image) {
  if (image.startsWith("/assets/")) {
    return true;
  }

  try {
    const url = new URL(image);
    return url.protocol === "https:" && url.hostname.endsWith(".blob.core.windows.net");
  } catch {
    return false;
  }
}

console.log(`Validated ${projects.length} projects.`);
