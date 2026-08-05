import { useMemo, useState } from "react";

const STAGES = [
  {
    id: "Past",
    label: "Past projects",
    eyebrow: "Built work",
    heading: "Completed places with a clear record of craft and delivery.",
    description: "A selection of completed residential and commercial work."
  },
  {
    id: "Current",
    label: "Current projects",
    eyebrow: "In progress",
    heading: "Projects currently moving from planning into delivery.",
    description: "Live work across residential and commercial planning."
  },
  {
    id: "Future",
    label: "Future projects",
    eyebrow: "On the board",
    heading: "Early studies, sensitive additions, and next-stage opportunities.",
    description: "Projects developing their brief, feasibility, and planning path."
  }
];

const CURRENT_PROJECT_IDS = new Set([
  "4l-coral-coast-drive-apartment",
  "185-leakes-road-commercial-development",
  "8-10-manly-street-office-mixed-use-development",
  "94-somerville-road-residential-infill",
  "115-123-alfred-road-aquatic-and-child-care-centre"
]);

const FUTURE_PROJECT_IDS = new Set([
  "250-ross-street-heritage-extension",
  "62-64-hook-street-multi-residential-development"
]);

const FEATURED_PROJECT_IDS = {
  Past: "2a-webster-street-residential-infill",
  Current: "4l-coral-coast-drive-apartment",
  Future: "62-64-hook-street-multi-residential-development"
};

const FEATURED_IMAGE_INDEXES = {
  Past: 2,
  Current: 1,
  Future: 0
};

const PAST_PROJECT_ORDER = [
  "28-linton-avenue-residential"
];

function stageForProject(project) {
  if (CURRENT_PROJECT_IDS.has(project.id)) {
    return "Current";
  }

  if (FUTURE_PROJECT_IDS.has(project.id)) {
    return "Future";
  }

  return "Past";
}

function previewProject(project, imageIndex) {
  const images = [...new Set([project.image, ...(Array.isArray(project.gallery) ? project.gallery : [])].filter(Boolean))];
  return { ...project, image: images[imageIndex] || images[0], gallery: [] };
}

function sortProjectsForStage(stageId, stageProjects) {
  if (stageId !== "Past") {
    return stageProjects;
  }

  return [...stageProjects].sort((first, second) => {
    const firstIndex = PAST_PROJECT_ORDER.indexOf(first.id);
    const secondIndex = PAST_PROJECT_ORDER.indexOf(second.id);
    const firstRank = firstIndex === -1 ? Number.MAX_SAFE_INTEGER : firstIndex;
    const secondRank = secondIndex === -1 ? Number.MAX_SAFE_INTEGER : secondIndex;
    return firstRank - secondRank;
  });
}

export default function Portfolio({ projects }) {
  const [activeStage, setActiveStage] = useState(null);
  const projectsByStage = useMemo(
    () => STAGES.reduce((groups, stage) => {
      const stageProjects = projects.filter((project) => stageForProject(project) === stage.id);
      groups[stage.id] = sortProjectsForStage(stage.id, stageProjects);
      return groups;
    }, {}),
    [projects]
  );

  const selectedStage = STAGES.find((stage) => stage.id === activeStage);

  return (
    <section className="section portfolio-section" id="portfolio">
      {selectedStage ? (
        <StageProjectList
          key={selectedStage.id}
          projects={projectsByStage[selectedStage.id]}
          stage={selectedStage}
          onBack={() => setActiveStage(null)}
          onChangeStage={setActiveStage}
        />
      ) : (
        <PortfolioOverview projectsByStage={projectsByStage} onSelectStage={setActiveStage} />
      )}
    </section>
  );
}

function PortfolioOverview({ projectsByStage, onSelectStage }) {
  return (
    <>
      <div className="section-heading split">
        <div>
          <p className="eyebrow">Portfolio</p>
          <h2>Work at every stage, from proven delivery to the next opportunity.</h2>
        </div>
        <p>Explore the studio's built work, current commitments, and future planning studies without losing the wider picture.</p>
      </div>

      <div className="portfolio-stage-grid">
        {STAGES.map((stage) => {
          const stageProjects = projectsByStage[stage.id];
          const featured = stageProjects.find((project) => project.id === FEATURED_PROJECT_IDS[stage.id]) || stageProjects[0];

          if (!featured) {
            return null;
          }

          const preview = previewProject(featured, FEATURED_IMAGE_INDEXES[stage.id]);

          return (
            <article className="portfolio-stage" key={stage.id}>
              <div className="portfolio-stage-visual">
                <ProjectGallery project={preview} />
                <button
                  className="portfolio-stage-link"
                  type="button"
                  onClick={() => onSelectStage(stage.id)}
                  aria-label={`View ${stage.label}`}
                >
                  <span className="portfolio-stage-title">
                    {stage.label} <span aria-hidden="true">→</span>
                  </span>
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

function StageProjectList({ projects, stage, onBack, onChangeStage }) {
  const [selectedProjectId, setSelectedProjectId] = useState(projects[0]?.id);
  const selectedIndex = Math.max(0, projects.findIndex((project) => project.id === selectedProjectId));
  const selectedProject = projects[selectedIndex];
  const previousProject = projects[(selectedIndex - 1 + projects.length) % projects.length];
  const nextProject = projects[(selectedIndex + 1) % projects.length];

  if (!selectedProject) {
    return null;
  }

  return (
    <div className="portfolio-project-layout" aria-live="polite">
      <aside className="portfolio-project-directory" aria-label={`${stage.label} project directory`}>
        <button className="portfolio-back-link" type="button" onClick={onBack}>
          <span aria-hidden="true">←</span> Portfolio
        </button>
        <p className="eyebrow">{stage.label}</p>
        <div className="portfolio-project-links">
          {projects.map((project) => (
            <button
              className={project.id === selectedProject.id ? "portfolio-project-link active" : "portfolio-project-link"}
              key={project.id}
              type="button"
              onClick={() => setSelectedProjectId(project.id)}
            >
              {project.title}
            </button>
          ))}
        </div>
        <div className="stage-switcher" aria-label="Project stages">
          {STAGES.map((item) => (
            <button
              className={item.id === stage.id ? "stage-switch active" : "stage-switch"}
              key={item.id}
              type="button"
              onClick={() => onChangeStage(item.id)}
            >
              {item.id}
            </button>
          ))}
        </div>
      </aside>

      <div className="portfolio-project-content">
        <div className="portfolio-project-showcase">
          <div className="portfolio-project-hero">
            <ProjectGallery project={selectedProject} className="portfolio-project-gallery" />
          </div>

          <div className="portfolio-project-copy">
            <div className="portfolio-project-intro">
              <div className="portfolio-project-tags" aria-label="Project classification">
                <span>{selectedProject.category}</span>
              </div>
              <p className="eyebrow">{selectedProject.location}</p>
              <h2>{selectedProject.title}</h2>
            </div>
            <p className="portfolio-project-summary">{selectedProject.summary}</p>
          </div>
        </div>

        <div className="portfolio-project-pagination">
          <button type="button" onClick={() => setSelectedProjectId(previousProject.id)}>
            Previous
          </button>
          <button type="button" onClick={() => setSelectedProjectId(nextProject.id)}>
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function ProjectGallery({ project, className = "" }) {
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
    <div className={`project-gallery ${className}`.trim()}>
      <img src={activeImage} alt={`${project.title} project view ${activeIndex + 1}`} />
      {images.length > 1 && (
        <>
          <button className="gallery-arrow gallery-arrow-prev" type="button" onClick={showPrevious} aria-label="Previous project image">‹</button>
          <button className="gallery-arrow gallery-arrow-next" type="button" onClick={showNext} aria-label="Next project image">›</button>
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
