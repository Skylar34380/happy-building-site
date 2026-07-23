import { createToken, handleError, readJson, sendJson } from "../_lib/http.js";

export default async function handler(request, response) {
  if (request.method !== "POST") {
    sendJson(response, 405, { error: "Method not allowed." });
    return;
  }

  try {
    const { username, password } = await readJson(request);
    const expectedUsername = process.env.ADMIN_USERNAME;
    const expectedPassword = process.env.ADMIN_PASSWORD;

    if (!expectedUsername || !expectedPassword) {
      throw Object.assign(new Error("Admin credentials are not configured."), { statusCode: 501 });
    }

    if (username !== expectedUsername || password !== expectedPassword) {
      throw Object.assign(new Error("The username or password is incorrect."), { statusCode: 401 });
    }

    sendJson(response, 200, {
      token: createToken({ role: "admin", username })
    });
  } catch (error) {
    handleError(response, error);
  }
}
