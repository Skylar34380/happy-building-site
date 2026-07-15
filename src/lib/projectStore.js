const PROJECTS_URL = "/data/projects.json";

export async function loadProjects() {
  const response = await fetch(PROJECTS_URL);

  if (!response.ok) {
    throw new Error(`Could not load projects: ${response.status}`);
  }

  return response.json();
}

export function buildProjectRecord(formData) {
  const title = formData.get("title").trim();

  return {
    id: slugify(title),
    title,
    category: formData.get("category"),
    location: formData.get("location").trim(),
    year: Number(formData.get("year")),
    status: formData.get("status"),
    summary: formData.get("summary").trim(),
    service: formData.get("service"),
    image: formData.get("image").trim()
  };
}

export function downloadProjectDatabase(projects) {
  const blob = new Blob([`${JSON.stringify(projects, null, 2)}\n`], {
    type: "application/json"
  });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "projects.json";
  anchor.click();
  URL.revokeObjectURL(url);
}

export function mergeProject(projects, project) {
  return [project, ...projects.filter((item) => item.id !== project.id)];
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
