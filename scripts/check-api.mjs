import fs from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { fileURLToPath } from "node:url";

const run = promisify(execFile);

const apiRoot = new URL("../api/", import.meta.url);
const apiFiles = await findJavaScriptFiles(apiRoot);

for (const route of apiFiles) {
  const fileUrl = new URL(route, apiRoot);
  const source = await fs.readFile(fileUrl, "utf8");

  if (!source.trim()) {
    throw new Error(`API route is empty: ${route}`);
  }

  await run(process.execPath, ["--check", fileURLToPath(fileUrl)]);
}

console.log(`Syntax-checked ${apiFiles.length} API files successfully.`);

async function findJavaScriptFiles(directoryUrl, prefix = "") {
  const entries = await fs.readdir(directoryUrl, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    if (entry.name === "node_modules") {
      continue;
    }

    const relativePath = `${prefix}${entry.name}`;

    if (entry.isDirectory()) {
      files.push(...await findJavaScriptFiles(new URL(`${entry.name}/`, directoryUrl), `${relativePath}/`));
    } else if (entry.isFile() && entry.name.endsWith(".js")) {
      files.push(relativePath);
    }
  }

  return files.sort();
}
