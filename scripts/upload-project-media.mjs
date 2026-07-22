import fs from "node:fs/promises";
import path from "node:path";
import { putBinaryBlob, putJsonBlob } from "../api/_lib/azureBlob.js";

const imageExtensions = new Set([".jpg", ".jpeg", ".png", ".webp"]);
const projectDataPath = new URL("../public/data/projects.json", import.meta.url);
const mirrorDataPath = new URL("../data/projects.json", import.meta.url);
const manifestPath = new URL("../data/project-media-manifest.json", import.meta.url);
const projectsBlobName = process.env.AZURE_PROJECTS_BLOB_NAME || "data/projects.json";

async function main() {
  await loadLocalEnv();

  const sourceRoot = process.argv[2];

  if (!sourceRoot) {
    throw new Error("Usage: npm run upload-media -- /path/to/downloaded/mycloud-folder");
  }

  const absoluteSourceRoot = path.resolve(sourceRoot);
  const projects = JSON.parse(await fs.readFile(projectDataPath, "utf8"));
  const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
  const updatedProjects = [];

  for (const project of projects) {
    const entry = manifest.find((item) => item.id === project.id);

    if (!entry) {
      updatedProjects.push(project);
      console.warn(`No manifest entry for ${project.id}`);
      continue;
    }

    const folderPath = (await findFolder(absoluteSourceRoot, entry.folder)) || (await findFolder(absoluteSourceRoot, project.id));
    const imagePaths = folderPath
      ? await findGalleryImages(folderPath, entry.cover)
      : await findFlatCoverImages(absoluteSourceRoot, project.image, project.id);

    if (imagePaths.length === 0) {
      updatedProjects.push(project);
      console.warn(`Could not find image for ${project.id}`);
      continue;
    }

    const imageUrls = [];

    for (const [index, imagePath] of imagePaths.entries()) {
      const filename = path.basename(imagePath);
      const prefix = index === 0 ? "cover" : `gallery-${String(index + 1).padStart(2, "0")}`;
      const blobName = `projects/${project.id}/${prefix}-${sanitizeFilename(filename)}`;
      const buffer = await fs.readFile(imagePath);
      const imageUrl = await putBinaryBlob(blobName, buffer, getContentType(filename));
      imageUrls.push(imageUrl);
      console.log(`Uploaded ${project.title} image ${index + 1}: ${imageUrl}`);
    }

    updatedProjects.push({
      ...project,
      image: imageUrls[0],
      gallery: imageUrls
    });
  }

  await fs.writeFile(projectDataPath, `${JSON.stringify(updatedProjects, null, 2)}\n`);
  await fs.writeFile(mirrorDataPath, `${JSON.stringify(updatedProjects, null, 2)}\n`);
  await putJsonBlob(projectsBlobName, updatedProjects);
  console.log(`Updated ${projectsBlobName} in Azure Blob Storage.`);
}

async function loadLocalEnv() {
  const candidates = [new URL("../.env.local", import.meta.url), new URL("../.env", import.meta.url)];

  for (const candidate of candidates) {
    let content = "";

    try {
      content = await fs.readFile(candidate, "utf8");
    } catch {
      continue;
    }

    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();

      if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) {
        continue;
      }

      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts.join("=").trim().replace(/^['"]|['"]$/g, "");

      if (!process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

async function findFolder(root, expectedName) {
  const folders = await listFolders(root);
  return folders.find((folder) => normalize(path.basename(folder)) === normalize(expectedName));
}

async function listFolders(root) {
  const folders = [];
  const entries = await fs.readdir(root, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(root, entry.name);

    if (entry.isDirectory()) {
      folders.push(entryPath, ...(await listFolders(entryPath)));
    }
  }

  return folders;
}

async function findGalleryImages(folderPath, preferredCover) {
  const images = await findImages(folderPath);
  const sortedImages = images.sort((left, right) => naturalCompare(path.basename(left), path.basename(right)));

  if (preferredCover) {
    const cover = sortedImages.find((image) => path.basename(image) === preferredCover);

    if (cover) {
      return [cover, ...sortedImages.filter((image) => image !== cover)];
    }
  }

  return sortedImages;
}

async function findFlatCoverImages(root, currentImage, projectId) {
  const images = await findImages(root);
  const currentFilename = currentImage ? path.basename(currentImage) : "";

  if (currentFilename) {
    const exactMatch = images.find((image) => path.basename(image) === currentFilename);

    if (exactMatch) {
      return [exactMatch];
    }
  }

  const projectMatch = images.find((image) => path.basename(image).startsWith(projectId));
  return projectMatch ? [projectMatch] : [];
}

async function findImages(folderPath) {
  const images = [];
  const entries = await fs.readdir(folderPath, { withFileTypes: true });

  for (const entry of entries) {
    const entryPath = path.join(folderPath, entry.name);

    if (entry.isDirectory()) {
      images.push(...(await findImages(entryPath)));
    } else if (imageExtensions.has(path.extname(entry.name).toLowerCase())) {
      images.push(entryPath);
    }
  }

  return images;
}

function getContentType(filename) {
  const extension = path.extname(filename).toLowerCase();

  if (extension === ".png") {
    return "image/png";
  }

  if (extension === ".webp") {
    return "image/webp";
  }

  return "image/jpeg";
}

function normalize(value) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "");
}

function naturalCompare(left, right) {
  return left.localeCompare(right, undefined, {
    numeric: true,
    sensitivity: "base"
  });
}

function sanitizeFilename(filename) {
  return filename
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

main().catch((error) => {
  console.error(error.message);

  if (error.cause?.code) {
    console.error(`Cause: ${error.cause.code}`);
  }

  if (error.cause?.message) {
    console.error(`Cause message: ${error.cause.message}`);
  }

  process.exitCode = 1;
});
