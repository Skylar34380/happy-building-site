import { useMemo, useState } from "react";

const filters = ["All", "Residential", "Commercial", "Renovation"];

export default function Portfolio({ projects }) {
  const [activeFilter, setActiveFilter] = useState("All");

  const visibleProjects = useMemo(() => {
    if (activeFilter === "All") {
      return projects;
    }

    return projects.filter((project) => project.category === activeFilter);
  }, [activeFilter, projects]);

  return (
    <section className="section portfolio-section" id="portfolio">
      <div className="section-heading split">
        <div>
          <p className="eyebrow">Portfolio</p>
          <h2>Built projects with a clear record of scope and finish.</h2>
        </div>
        <div className="filter-row" aria-label="Project filters">
          {filters.map((filter) => (
            <button
              className={filter === activeFilter ? "filter-button active" : "filter-button"}
              key={filter}
              type="button"
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      <div className="project-grid" aria-live="polite">
        {visibleProjects.map((project) => (
          <article className="project-card" key={project.id}>
            <div className="project-image-placeholder" aria-label={`${project.title} image placeholder`} />
            <div className="project-body">
              <div className="project-meta">
                <span>{project.category}</span>
                <span>{project.status}</span>
                <span>{project.year}</span>
              </div>
              <h3>{project.title}</h3>
              <p>{project.summary}</p>
              <strong>{project.location}</strong>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
