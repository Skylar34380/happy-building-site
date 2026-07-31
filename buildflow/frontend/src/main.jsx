import { useEffect, useMemo, useState } from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

const glyphs = {
  Projects: "▦", Documents: "▤", Approvals: "✓", Team: "○",
  Bell: "•", ChevronRight: "›", FileText: "▤", Plus: "+", Search: "⌕", ShieldCheck: "✓", Upload: "↑"
};

function Icon({ name, size = 18 }) {
  return <span className="ui-icon" style={{ fontSize: size }} aria-hidden="true">{glyphs[name]}</span>;
}

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5080";

const demoProjects = [
  { id: "BF-241", name: "250 Ross Street", client: "M. Patel", status: "Planning", documents: 14, review: "2 pending", updated: "Today, 10:32" },
  { id: "BF-238", name: "185 Leakes Road", client: "Leakes Property Group", status: "Active", documents: 32, review: "Ready", updated: "Yesterday" },
  { id: "BF-227", name: "4L Coral Coast Drive", client: "C. Lewis", status: "Active", documents: 19, review: "1 pending", updated: "28 Jul" },
  { id: "BF-204", name: "31 Gent Street", client: "Kensington Living", status: "Completed", documents: 48, review: "Archived", updated: "17 Jul" }
];

const activity = [
  ["Robert", "approved", "Architecture set v4", "250 Ross Street", "10:32"],
  ["Steve", "uploaded", "Structural coordination.pdf", "185 Leakes Road", "09:18"],
  ["Enrico", "requested review for", "Planning response v2", "4L Coral Coast Drive", "Yesterday"],
  ["Joon Wei", "replaced", "Floor plan set", "31 Gent Street", "28 Jul"]
];

function App() {
  const [activeTab, setActiveTab] = useState("Projects");
  const [query, setQuery] = useState("");
  const [token, setToken] = useState(() => window.localStorage.getItem("buildflow-token"));
  const [projects, setProjects] = useState(demoProjects);
  const [selectedProject, setSelectedProject] = useState(demoProjects[0]);
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState("");
  const filtered = useMemo(() => projects.filter((project) => `${project.name} ${project.client}`.toLowerCase().includes(query.toLowerCase())), [query, projects]);

  useEffect(() => {
    if (!token) return;
    loadProjects(token);
  }, []);

  async function loadProjects(activeToken = token) {
    setLoading(true);
    setApiError("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/projects`, { headers: { Authorization: `Bearer ${activeToken}` } });
      if (!response.ok) throw new Error(response.status === 401 ? "Your session has expired. Please sign in again." : "Could not load live projects.");
      const payload = await response.json();
      const liveProjects = payload.map((project, index) => ({
        id: project.id,
        name: project.name,
        client: project.clientName,
        status: project.status,
        documents: project.documentCount,
        review: "Live record",
        updated: index === 0 ? "Latest" : "Recorded"
      }));
      setProjects(liveProjects);
      setSelectedProject(liveProjects[0] ?? null);
    } catch (error) {
      setApiError(error.message);
    } finally {
      setLoading(false);
    }
  }

  function completeLogin(accessToken) {
    window.localStorage.setItem("buildflow-token", accessToken);
    setToken(accessToken);
    loadProjects(accessToken);
  }

  function signOut() {
    window.localStorage.removeItem("buildflow-token");
    setToken(null);
    setProjects(demoProjects);
    setSelectedProject(demoProjects[0]);
    setApiError("");
  }

  if (!token) return <LoginScreen onLogin={completeLogin} />;

  return <main className="app-shell">
    <aside className="sidebar">
      <div className="wordmark"><span>BF</span><strong>BuildFlow</strong></div>
      <p className="workspace-label">2Form Consulting</p>
      <nav aria-label="Application navigation">
        {["Projects", "Documents", "Approvals", "Team"].map((label) =>
          <button key={label} className={activeTab === label ? "nav-item active" : "nav-item"} onClick={() => setActiveTab(label)}><Icon name={label}/>{label}</button>
        )}
      </nav>
      <div className="sidebar-footer"><Icon name="ShieldCheck" size={17}/><span>Secure workspace</span></div>
    </aside>

    <section className="workspace">
      <header className="topbar">
        <div><p className="eyebrow">Document control</p><h1>{activeTab}</h1></div>
        <div className="top-actions"><button className="icon-button" aria-label="Notifications"><Icon name="Bell" size={19}/></button><button className="avatar" onClick={signOut} title="Sign out">R</button></div>
      </header>

      <div className="overview-grid">
        <article><span>Live projects</span><strong>{String(projects.filter(project => project.status !== "Completed").length).padStart(2, "0")}</strong><small>{loading ? "Syncing live records" : "Role-controlled records"}</small></article>
        <article><span>Awaiting review</span><strong>03</strong><small>Across 2 projects</small></article>
        <article><span>Documents controlled</span><strong>113</strong><small>All versions traceable</small></article>
      </div>

      <section className="project-area">
        <div className="section-bar">
          <div className="search"><Icon name="Search"/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search project, client or address" /></div>
          <button className="primary-button"><Icon name="Plus" size={17}/> New project</button>
        </div>
        <div className="project-list" role="table">
          <div className="project-row headings" role="row"><span>Project</span><span>Status</span><span>Documents</span><span>Review</span><span>Updated</span><span /></div>
          {filtered.map((project) => <button className={selectedProject?.id === project.id ? "project-row selected" : "project-row"} key={project.id} onClick={() => setSelectedProject(project)}>
            <span><b>{project.name}</b><small>{project.id} · {project.client}</small></span><span><i className={`status ${project.status.toLowerCase()}`}/>{project.status}</span><span>{project.documents}</span><span>{project.review}</span><span>{project.updated}</span><Icon name="ChevronRight" size={22}/>
          </button>)}
        </div>{apiError && <p className="api-message">{apiError} The interface remains in preview mode until the local API is available.</p>}
      </section>

      <div className="detail-grid">
        <section className="document-panel">
          <div className="panel-heading"><div><p className="eyebrow">Selected project</p><h2>{selectedProject?.name ?? "No projects yet"}</h2></div><button className="outline-button"><Icon name="Upload" size={16}/> Upload document</button></div>
          <div className="document-list">
            {[ ["Architecture set", "PDF", "v4", "Approved", "2.8 MB"], ["Planning response", "PDF", "v2", "Pending", "1.1 MB"], ["Consultant coordination", "PDF", "v1", "Ready", "840 KB"] ].map(([name, type, version, state, size]) => <article key={name}>
              <span className="file-icon"><Icon name="FileText" size={19}/></span><div><strong>{name}</strong><small>{type} · {version} · {size}</small></div><span className={`document-state ${state.toLowerCase()}`}>{state}</span><button className="icon-button" aria-label={`Open ${name}`}><Icon name="ChevronRight" size={22}/></button>
            </article>)}
          </div>
          <button className="text-button">View full document register <Icon name="ChevronRight" size={20}/></button>
        </section>
        <section className="activity-panel">
          <div className="panel-heading"><div><p className="eyebrow">Audit trail</p><h2>Latest activity</h2></div></div>
          <ol>{activity.map(([person, action, item, project, time]) => <li key={`${person}-${item}`}><span className="initial">{person.split(" ").map(word => word[0]).join("")}</span><p><b>{person}</b> {action} <strong>{item}</strong><small>{project} · {time}</small></p></li>)}</ol>
        </section>
      </div>
    </section>
  </main>;
}

function LoginScreen({ onLogin }) {
  const [email, setEmail] = useState("director@buildflow.local");
  const [password, setPassword] = useState("BuildFlow!2026");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
      if (!response.ok) throw new Error("Sign-in failed. Check the development account or API URL.");
      const payload = await response.json();
      onLogin(payload.token);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setBusy(false);
    }
  }

  return <main className="login-shell"><form className="login-card" onSubmit={submit}>
    <div className="wordmark login-mark"><span>BF</span><strong>BuildFlow</strong></div>
    <p className="eyebrow">Construction operations</p><h1>Sign in to your workspace.</h1>
    <label>Email<input type="email" value={email} onChange={event => setEmail(event.target.value)} required /></label>
    <label>Password<input type="password" value={password} onChange={event => setPassword(event.target.value)} required /></label>
    {error && <p className="form-error">{error}</p>}
    <button className="primary-button" disabled={busy}>{busy ? "Signing in..." : "Sign in"}</button>
    <p className="login-note">Development credentials are prefilled. Production uses managed identities or an enterprise identity provider.</p>
  </form></main>;
}

createRoot(document.getElementById("root")).render(<App />);
