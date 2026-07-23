import { useEffect, useRef, useState } from "react";
import {
  buildProjectRecord,
  deleteProject,
  downloadProjectDatabase,
  mergeProject,
  removeProject,
  saveProject,
  updateProject,
  uploadProjectFile
} from "../lib/projectStore.js";

const EMPTY_PROJECT = {
  title: "",
  category: "Residential",
  service: "",
  location: "",
  area: "",
  year: new Date().getFullYear(),
  status: "Completed",
  summary: ""
};

export default function ProjectAdmin({ adminToken, projects, onProjectsChange }) {
  const [draft, setDraft] = useState(EMPTY_PROJECT);
  const [editingId, setEditingId] = useState("");
  const [mediaItems, setMediaItems] = useState([]);
  const [status, setStatus] = useState("");
  const [statusType, setStatusType] = useState("success");
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const mediaRef = useRef(mediaItems);

  mediaRef.current = mediaItems;

  useEffect(() => () => {
    mediaRef.current.forEach(revokePreview);
  }, []);

  function updateField(event) {
    const { name, value } = event.currentTarget;
    setDraft((current) => ({ ...current, [name]: value }));
  }

  function startNewProject() {
    clearMedia();
    setDraft(EMPTY_PROJECT);
    setEditingId("");
    setStatus("");
  }

  function startEditing(project) {
    clearMedia();
    const gallery = Array.isArray(project.gallery) && project.gallery.length > 0
      ? project.gallery
      : project.image
        ? [project.image]
        : [];

    setDraft({
      title: project.title || "",
      category: project.category || "Residential",
      service: project.service || "",
      location: project.location || "",
      area: project.area || "",
      year: project.year || new Date().getFullYear(),
      status: project.status || "Completed",
      summary: project.summary || ""
    });
    setMediaItems(gallery.map((url) => ({ id: url, url, file: null })));
    setEditingId(project.id);
    setStatus(`Editing ${project.title}.`);
    setStatusType("success");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function addImages(event) {
    const files = Array.from(event.currentTarget.files || []);
    const acceptedFiles = files.filter((file) => file.size <= 15 * 1024 * 1024);

    if (acceptedFiles.length !== files.length) {
      setStatus("Some images were skipped because they exceed the 15 MB limit.");
      setStatusType("error");
    }

    const additions = acceptedFiles.map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${Date.now()}-${index}`,
      url: URL.createObjectURL(file),
      file
    }));

    setMediaItems((current) => [...current, ...additions]);
    event.currentTarget.value = "";
  }

  function moveImage(index, direction) {
    const targetIndex = index + direction;

    if (targetIndex < 0 || targetIndex >= mediaItems.length) {
      return;
    }

    setMediaItems((current) => {
      const next = current.slice();
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  }

  function makeCover(index) {
    setMediaItems((current) => {
      const next = current.slice();
      const [cover] = next.splice(index, 1);
      next.unshift(cover);
      return next;
    });
  }

  function removeImage(index) {
    setMediaItems((current) => {
      const next = current.slice();
      const [removed] = next.splice(index, 1);
      revokePreview(removed);
      return next;
    });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setIsSaving(true);
    setStatusType("success");

    try {
      const resolvedMedia = [];

      for (let index = 0; index < mediaItems.length; index += 1) {
        const item = mediaItems[index];
        if (item.file) {
          setStatus(`Uploading image ${index + 1} of ${mediaItems.length}...`);
          resolvedMedia.push(await uploadProjectFile(item.file, adminToken));
        } else {
          resolvedMedia.push(item.url);
        }
      }

      const gallery = [...new Set(resolvedMedia.filter(Boolean))];
      const formProject = buildProjectRecord(new FormData(event.currentTarget));
      const project = {
        ...formProject,
        id: editingId || formProject.id,
        image: gallery[0] || "",
        gallery
      };

      setStatus(editingId ? "Updating project..." : "Creating project...");
      const savedProject = editingId
        ? await updateProject(editingId, project, adminToken)
        : await saveProject(project, adminToken);
      onProjectsChange(mergeProject(projects, savedProject));
      clearMedia();
      setDraft(EMPTY_PROJECT);
      setEditingId("");
      setStatus(`${savedProject.title} has been saved. The public portfolio will use the new record.`);
    } catch (error) {
      setStatus(error.message);
      setStatusType("error");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleDelete(project) {
    const confirmed = window.confirm(`Delete ${project.title} from the portfolio? Azure image files will be kept.`);

    if (!confirmed) {
      return;
    }

    setDeletingId(project.id);
    setStatusType("success");
    setStatus(`Deleting ${project.title}...`);

    try {
      await deleteProject(project.id, adminToken);
      onProjectsChange(removeProject(projects, project.id));
      if (editingId === project.id) {
        startNewProject();
      }
      setStatus(`${project.title} was removed from the portfolio. Its Azure images were kept.`);
    } catch (error) {
      setStatus(error.message);
      setStatusType("error");
    } finally {
      setDeletingId("");
    }
  }

  function clearMedia() {
    mediaItems.forEach(revokePreview);
    setMediaItems([]);
  }

  return (
    <section className="section admin-section" id="database">
      <div className="admin-page-heading">
        <div>
          <p className="eyebrow">Project database</p>
          <h1>{editingId ? "Edit project" : "Add a project"}</h1>
          <p>Manage portfolio information and Azure-hosted project galleries.</p>
        </div>
        <div className="admin-heading-actions">
          <button className="button secondary" type="button" onClick={startNewProject}>New project</button>
          <button className="button secondary" type="button" onClick={() => downloadProjectDatabase(projects)}>Export JSON</button>
        </div>
      </div>

      <div className="admin-workspace">
        <form className="database-form" onSubmit={handleSubmit}>
          <div className="admin-form-heading wide">
            <div>
              <span>{editingId ? "Editing existing record" : "New portfolio record"}</span>
              <h2>{editingId ? draft.title : "Project details"}</h2>
            </div>
            {editingId && <button className="text-button" type="button" onClick={startNewProject}>Cancel edit</button>}
          </div>

          <label>
            Project name
            <input name="title" value={draft.title} onChange={updateField} placeholder="Toorak Garden House" required />
          </label>
          <label>
            Category
            <select name="category" value={draft.category} onChange={updateField}>
              <option>Residential</option>
              <option>Commercial</option>
              <option>Renovation</option>
            </select>
          </label>
          <label>
            Service
            <input name="service" value={draft.service} onChange={updateField} placeholder="Townhouse, apartment, working drawings..." required />
          </label>
          <label>
            Location
            <input name="location" value={draft.location} onChange={updateField} placeholder="Melbourne, VIC" required />
          </label>
          <label>
            Area
            <input name="area" value={draft.area} onChange={updateField} placeholder="325.48 sqm" />
          </label>
          <label>
            Year
            <input name="year" value={draft.year} onChange={updateField} inputMode="numeric" min="1900" max="2100" type="number" required />
          </label>
          <label>
            Status
            <select name="status" value={draft.status} onChange={updateField}>
              <option>Completed</option>
              <option>In progress</option>
              <option>Planning</option>
            </select>
          </label>
          <label className="wide">
            Summary
            <textarea name="summary" value={draft.summary} onChange={updateField} rows="4" placeholder="Describe the project, scope, and result." required />
          </label>

          <div className="media-manager wide">
            <div className="media-manager-heading">
              <div>
                <h3>Project images</h3>
                <p>The first image is the cover. Move images to control gallery order.</p>
              </div>
              <label className="button secondary upload-button">
                Add images
                <input accept="image/jpeg,image/png,image/webp" multiple type="file" onChange={addImages} />
              </label>
            </div>

            {mediaItems.length > 0 ? (
              <div className="media-grid">
                {mediaItems.map((item, index) => (
                  <article className={`media-item${index === 0 ? " is-cover" : ""}`} key={item.id}>
                    <div className="media-image-wrap">
                      <img src={item.url} alt={`Project media ${index + 1}`} />
                      <span>{index === 0 ? "Cover" : String(index + 1).padStart(2, "0")}</span>
                    </div>
                    <div className="media-actions">
                      <button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0} aria-label="Move image left" title="Move left">&larr;</button>
                      <button type="button" onClick={() => moveImage(index, 1)} disabled={index === mediaItems.length - 1} aria-label="Move image right" title="Move right">&rarr;</button>
                      {index > 0 && <button type="button" onClick={() => makeCover(index)}>Cover</button>}
                      <button className="danger" type="button" onClick={() => removeImage(index)}>Remove</button>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <label className="media-empty">
                <strong>Choose project images</strong>
                <span>JPEG, PNG or WebP, up to 15 MB each</span>
                <input accept="image/jpeg,image/png,image/webp" multiple type="file" onChange={addImages} />
              </label>
            )}
          </div>

          <button className="button primary wide" type="submit" disabled={isSaving}>
            {isSaving ? "Saving..." : editingId ? "Update project" : "Publish project"}
          </button>
          {status && <p className={`form-status ${statusType} wide`} role="status">{status}</p>}
        </form>

        <aside className="database-preview">
          <div className="database-preview-header">
            <div>
              <p className="eyebrow">Portfolio records</p>
              <h2>Projects</h2>
            </div>
            <span>{projects.length}</span>
          </div>
          <div className="admin-project-list" aria-label="Current project records">
            {projects.map((project) => (
              <article className={`admin-project-row${editingId === project.id ? " is-editing" : ""}`} key={project.id}>
                {project.image ? (
                  <img src={project.image} alt="" />
                ) : (
                  <div className="admin-image-placeholder"><span>Image pending</span></div>
                )}
                <div className="admin-project-copy">
                  <strong>{project.title}</strong>
                  <span>{project.category} / {project.status}</span>
                  <small>{project.gallery?.length || (project.image ? 1 : 0)} images</small>
                </div>
                <div className="admin-record-actions">
                  <button type="button" onClick={() => startEditing(project)}>Edit</button>
                  <button className="danger" type="button" disabled={deletingId === project.id} onClick={() => handleDelete(project)}>
                    {deletingId === project.id ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        </aside>
      </div>
    </section>
  );
}

function revokePreview(item) {
  if (item?.file && item.url) {
    URL.revokeObjectURL(item.url);
  }
}
