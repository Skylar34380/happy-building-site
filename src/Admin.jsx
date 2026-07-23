import { useEffect, useState } from "react";
import ProjectAdmin from "./components/ProjectAdmin.jsx";
import { clearAdminToken, getAdminToken, loadProjects, loginAdmin } from "./lib/projectStore.js";

const STAFF_USERNAME = "happy123";
const STAFF_PASSWORD = "happy789";

export default function Admin() {
  const [projects, setProjects] = useState([]);
  const [projectError, setProjectError] = useState("");
  const [adminToken, setAdminToken] = useState(() => getAdminToken());
  const [loginError, setLoginError] = useState("");
  const isAuthenticated = Boolean(adminToken);

  useEffect(() => {
    loadProjects()
      .then(setProjects)
      .catch((error) => setProjectError(error.message));
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = formData.get("username");
    const password = formData.get("password");

    try {
      const token = await loginAdmin({ username, password });
      setAdminToken(token);
      setLoginError("");
      event.currentTarget.reset();
      return;
    } catch (error) {
      if (import.meta.env.DEV && username === STAFF_USERNAME && password === STAFF_PASSWORD) {
        setAdminToken("local-prototype-token");
        setLoginError("");
        event.currentTarget.reset();
        return;
      }

      setLoginError(error.message);
    }
  }

  function handleLogout() {
    clearAdminToken();
    setAdminToken("");
  }

  return (
    <>
      <header className="site-header admin-header">
        <a className="brand" href="/" aria-label="2Form Consulting Pty Ltd home">
          <img className="brand-logo" src="/assets/2form-logo.jpg" alt="" />
          <span>
            <strong>2Form Consulting</strong>
            <small>Staff</small>
          </span>
        </a>
        <nav className="site-nav" aria-label="Admin navigation">
          <a href="/">Public site</a>
          {isAuthenticated && <button className="nav-button" type="button" onClick={handleLogout}>Log out</button>}
        </nav>
      </header>

      <main>
        {!isAuthenticated ? (
          <section className="admin-login-shell">
            <form className="admin-login-card" onSubmit={handleLogin}>
              <p className="eyebrow">Staff only</p>
              <h1>Project admin login</h1>
              <p>Sign in to update built projects and download the latest project database.</p>
              <label>
                Account
                <input name="username" autoComplete="username" required />
              </label>
              <label>
                Password
                <input type="password" name="password" autoComplete="current-password" required />
              </label>
              <button className="button primary" type="submit">Log in</button>
              {loginError && <p className="login-error">{loginError}</p>}
            </form>
          </section>
        ) : projectError ? (
          <section className="section">
            <p>{projectError}</p>
          </section>
        ) : (
          <ProjectAdmin adminToken={adminToken} projects={projects} onProjectsChange={setProjects} />
        )}
      </main>
    </>
  );
}
