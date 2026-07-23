import { useMemo, useState } from "react";

export default function Portfolio({ projects }) {
  const [activeFilter, setActiveFilter] = useState("All");
  const filters = useMemo(
    () => ["All", ...new Set(projects.map((project) => project.category).filter(Boolean))],
    [projects]
  );

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
            <ProjectGallery project={project} />
            <div className="project-body">
              <div className="project-meta">
                <span>{project.category}</span>
                <span>{project.status}</span>
                {project.area && <span>{project.area}</span>}
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

function ProjectGallery({ project }) {
  const images = useMemo(() => {
    const gallery = Array.isArray(project.gallery) ? project.gallery : [];
    return [...new Set([project.image, ...gallery].filter(Boolean))];
  }, [project.gallery, project.image]);
  const [activeIndex, setActiveIndex] = useState(0);
  const activeImage = images[activeIndex];

  function showPrevious() {
    setActiveIndex((current) => (current === 0 ? images.length - 1 : current - 1));
  }

  function showNext() {
    setActiveIndex((current) => (current === images.length - 1 ? 0 : current + 1));
  }

  if (!activeImage) {
    return (
      <div className="project-image-placeholder" aria-label={`${project.title} image placeholder`}>
        <span>Image pending</span>
      </div>
    );
  }

  return (
    <div className="project-gallery">
      <img src={activeImage} alt={`${project.title} project view ${activeIndex + 1}`} />
      {images.length > 1 && (
        <>
          <button className="gallery-arrow gallery-arrow-prev" type="button" onClick={showPrevious} aria-label="Previous project image">
            ‹
          </button>
          <button className="gallery-arrow gallery-arrow-next" type="button" onClick={showNext} aria-label="Next project image">
            ›
          </button>
          <div className="gallery-dots" aria-label={`${project.title} image selector`}>
            {images.map((image, index) => (
              <button
                className={index === activeIndex ? "gallery-dot active" : "gallery-dot"}
                key={image}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Show image ${index + 1}`}
                aria-pressed={index === activeIndex}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
