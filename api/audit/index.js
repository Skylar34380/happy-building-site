import { listAuditEntries } from "../_lib/auditLog.js";
import { handleError, requireAdmin, sendJson } from "../_lib/http.js";

export default async function handler(request, response) {
  if (request.method !== "GET") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  try {
    requireAdmin(request);
    sendJson(response, 200, await listAuditEntries({ limit: request.query?.limit }));
  } catch (error) {
    handleError(response, error);
  }
}
