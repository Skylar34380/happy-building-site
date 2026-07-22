import fs from "node:fs/promises";
import { putJsonBlob } from "../api/_lib/azureBlob.js";

const projectDataPath = new URL("../public/data/projects.json", import.meta.url);
const projectsBlobName = process.env.AZURE_PROJECTS_BLOB_NAME || "data/projects.json";

await loadLocalEnv();

const projects = JSON.parse(await fs.readFile(projectDataPath, "utf8"));
await putJsonBlob(projectsBlobName, projects);
console.log(`Synced ${projects.length} projects to ${projectsBlobName}.`);

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
