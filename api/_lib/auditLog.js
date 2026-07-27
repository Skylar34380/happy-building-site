import fs from "node:fs/promises";
import { getJsonBlob, hasAzureBlobConfig, putJsonBlob } from "./azureBlob.js";

const fallbackPath = new URL("../../data/audit-log.local.json", import.meta.url);
const auditBlobName = process.env.AZURE_AUDIT_LOG_BLOB_NAME || "data/audit-log.json";
const MAX_AUDIT_ENTRIES = 500;

export async function listAuditEntries({ limit = 30 } = {}) {
  const entries = await readAuditEntries();
  const safeLimit = Math.min(Math.max(Number(limit) || 30, 1), 100);

  return entries
    .slice()
    .sort((left, right) => new Date(right.occurredAt) - new Date(left.occurredAt))
    .slice(0, safeLimit);
}

export async function recordAuditEntry({ actor, action, project }) {
  const entries = await readAuditEntries();
  const entry = {
    id: crypto.randomUUID(),
    actor: String(actor || "Unknown staff member"),
    action,
    projectId: project.id,
    projectTitle: project.title,
    occurredAt: new Date().toISOString()
  };

  const nextEntries = [entry, ...entries].slice(0, MAX_AUDIT_ENTRIES);
  await writeAuditEntries(nextEntries);
  return entry;
}

async function readAuditEntries() {
  if (!hasAzureBlobConfig()) {
    try {
      return JSON.parse(await fs.readFile(fallbackPath, "utf8"));
    } catch (error) {
      if (error.code === "ENOENT") {
        return [];
      }
      throw error;
    }
  }

  try {
    return await getJsonBlob(auditBlobName);
  } catch (error) {
    if (error.statusCode === 404) {
      return [];
    }
    throw error;
  }
}

async function writeAuditEntries(entries) {
  if (hasAzureBlobConfig()) {
    await putJsonBlob(auditBlobName, entries);
    return;
  }

  await fs.writeFile(fallbackPath, `${JSON.stringify(entries, null, 2)}\n`);
}
