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

function stageForProject(project) {
  if (CURRENT_PROJECT_IDS.has(project.id)) {
    return "Current";
  }

  if (FUTURE_PROJECT_IDS.has(project.id)) {
    return "Future";
  }

  return "Past";
}

export default function Portfolio({ projects }) {
  const [activeStage, setActiveStage] = useState(null);
  const projectsByStage = useMemo(
    () => STAGES.reduce((groups, stage) => {
      groups[stage.id] = projects.filter((project) => stageForProject(project) === stage.id);
      return groups;
    }, {}),
    [projects]
  );

  const selectedStage = STAGES.find((stage) => stage.id === activeStage);

  return (
    <section className="section portfolio-section" id="portfolio">
      {selectedStage ? (
        <StageProjectList
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

          return (
            <article className="portfolio-stage" key={stage.id}>
              <div className="portfolio-stage-heading">
                <div>
                  <p className="eyebrow">{stage.eyebrow}</p>
                  <h3>
                    <button className="portfolio-stage-title" type="button" onClick={() => onSelectStage(stage.id)}>
                      {stage.label} <span aria-hidden="true">→</span>
                    </button>
                  </h3>
                </div>
              </div>
              <ProjectGallery project={featured} />
              <div className="project-body portfolio-stage-body">
                <div className="project-meta">
                  <span>{featured.category}</span>
                  <span>{stage.id}</span>
                  {featured.area && <span>{featured.area}</span>}
                </div>
                <h4>{featured.title}</h4>
                <p className="project-summary" tabIndex="0">{featured.summary}</p>
                <strong>{featured.location}</strong>
              </div>
            </article>
          );
        })}
      </div>
    </>
  );
}

function StageProjectList({ projects, stage, onBack, onChangeStage }) {
  return (
    <>
      <div className="section-heading split portfolio-list-heading">
        <div>
          <p className="eyebrow">{stage.eyebrow}</p>
          <h2>{stage.heading}</h2>
        </div>
        <div className="portfolio-list-actions">
          <button className="portfolio-back-link" type="button" onClick={onBack}>
            <span aria-hidden="true">←</span> Portfolio overview
          </button>
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
        </div>
      </div>

      <div className="project-grid" aria-live="polite">
        {projects.map((project) => <ProjectCard project={project} stage={stage.id} key={project.id} />)}
      </div>
    </>
  );
}

function ProjectCard({ project, stage }) {
  return (
    <article className="project-card">
      <ProjectGallery project={project} />
      <div className="project-body">
        <div className="project-meta">
          <span>{project.category}</span>
          <span>{stage}</span>
          {project.area && <span>{project.area}</span>}
        </div>
        <h3>{project.title}</h3>
        <p className="project-summary" tabIndex="0">{project.summary}</p>
        <strong>{project.location}</strong>
      </div>
    </article>
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
