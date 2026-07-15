import { useState } from "react";
import { buildProjectRecord, downloadProjectDatabase, mergeProject } from "../lib/projectStore.js";

export default function ProjectAdmin({ projects, onProjectsChange }) {
  const [status, setStatus] = useState("");

  function handleSubmit(event) {
    event.preventDefault();
    const project = buildProjectRecord(new FormData(event.currentTarget));
    const nextProjects = mergeProject(projects, project);
    onProjectsChange(nextProjects);
    downloadProjectDatabase(nextProjects);
    setStatus(`Created ${project.title}. Replace public/data/projects.json with the downloaded file.`);
    event.currentTarget.reset();
  }

  return (
    <section className="section admin-section" id="database">
      <div className="section-heading split">
        <div>
          <p className="eyebrow">Project database</p>
          <h2>Upload new work without touching the React components.</h2>
        </div>
        <p>
          This first version uses a JSON project database. The form creates a fresh
          <code> projects.json </code>
          file; later this same store can connect to Supabase, Firebase, or a CMS.
        </p>
      </div>

      <div className="admin-grid">
        <form className="database-form" onSubmit={handleSubmit}>
          <label>
            Project name
            <input name="title" placeholder="Toorak Garden House" required />
          </label>
          <label>
            Category
            <select name="category" defaultValue="Residential">
              <option>Residential</option>
              <option>Commercial</option>
              <option>Renovation</option>
            </select>
          </label>
          <label>
            Service
            <select name="service" defaultValue="Working drawings">
              <option>Future project</option>
              <option>Room planning</option>
              <option>Working drawings</option>
            </select>
          </label>
          <label>
            Location
            <input name="location" placeholder="Melbourne, VIC" required />
          </label>
          <label>
            Year
            <input name="year" inputMode="numeric" placeholder="2026" required />
          </label>
          <label>
            Status
            <select name="status" defaultValue="Completed">
              <option>Completed</option>
              <option>In progress</option>
              <option>Planning</option>
            </select>
          </label>
          <label className="wide">
            Summary
            <textarea name="summary" rows="4" placeholder="Describe the project, scope, and result." required />
          </label>
          <label className="wide">
            Image path
            <input name="image" placeholder="Leave blank until real images are ready" />
          </label>
          <button className="button primary wide" type="submit">Download updated database</button>
          {status && <p className="form-status wide">{status}</p>}
        </form>

        <aside className="database-preview">
          <h3>Current records</h3>
          <div>
            {projects.map((project) => (
              <article key={project.id}>
                <strong>{project.title}</strong>
                <span>{project.category} / {project.service || "Construction"} / {project.status}</span>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}
