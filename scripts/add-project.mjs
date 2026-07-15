import fs from "node:fs/promises";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const dataPath = new URL("../public/data/projects.json", import.meta.url);
const rl = readline.createInterface({ input, output });

function slugify(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

async function ask(label, fallback = "") {
  const suffix = fallback ? ` (${fallback})` : "";
  const answer = await rl.question(`${label}${suffix}: `);
  return answer.trim() || fallback;
}

async function main() {
  const raw = await fs.readFile(dataPath, "utf8");
  const projects = JSON.parse(raw);

  const title = await ask("Project name");
  const project = {
    id: slugify(title),
    title,
    category: await ask("Category", "Commercial"),
    location: await ask("Location", "Melbourne, VIC"),
    year: Number(await ask("Year", String(new Date().getFullYear()))),
    status: await ask("Status", "Completed"),
    service: await ask("Service", "Future project"),
    summary: await ask("Short description"),
    image: await ask("Image path", "/assets/premium-hero.png")
  };

  if (!project.title || !project.summary) {
    throw new Error("Project name and short description are required.");
  }

  const nextProjects = [project, ...projects.filter((item) => item.id !== project.id)];
  await fs.writeFile(dataPath, `${JSON.stringify(nextProjects, null, 2)}\n`);
  console.log(`Added ${project.title} to public/data/projects.json`);
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(() => {
    rl.close();
  });
