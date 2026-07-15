import { useEffect, useState } from "react";
import ProjectAdmin from "./components/ProjectAdmin.jsx";
import { loadProjects } from "./lib/projectStore.js";

const STAFF_USERNAME = "happy123";
const STAFF_PASSWORD = "happy789";

export default function Admin() {
  const [projects, setProjects] = useState([]);
  const [projectError, setProjectError] = useState("");
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loginError, setLoginError] = useState("");

  useEffect(() => {
    loadProjects()
      .then(setProjects)
      .catch((error) => setProjectError(error.message));
  }, []);

  function handleLogin(event) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const username = formData.get("username");
    const password = formData.get("password");

    if (username === STAFF_USERNAME && password === STAFF_PASSWORD) {
      setIsAuthenticated(true);
      setLoginError("");
      event.currentTarget.reset();
      return;
    }

    setLoginError("The username or password is incorrect.");
  }

  return (
    <>
      <header className="site-header">
        <a className="brand" href="/" aria-label="Happy Building Co. home">
          <span className="brand-mark">HB</span>
          <span>
            <strong>Happy Building</strong>
            <small>Staff</small>
          </span>
        </a>
        <nav className="site-nav" aria-label="Admin navigation">
          <a href="/">Public site</a>
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
          <ProjectAdmin projects={projects} onProjectsChange={setProjects} />
        )}
      </main>
    </>
  );
}
