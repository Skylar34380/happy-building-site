import { lazy, Suspense, useEffect, useState } from "react";
import Portfolio from "./components/Portfolio.jsx";
import { Reveal, SplitText } from "./components/ScrollText.jsx";
import SiteIntro from "./components/SiteIntro.jsx";
import { loadProjects } from "./lib/projectStore.js";

const ArchitecturalScene = lazy(() => import("./components/ArchitecturalScene.jsx"));
const RoomPlanningScene = lazy(() => import("./components/RoomPlanningScene.jsx"));

const team = [
  {
    name: "Robert",
    role: "Founder / Director",
    bio: "Leads the studio vision, client relationships, project direction, and the key decisions that shape each build."
  },
  {
    name: "Enricko",
    role: "Architect",
    bio: "Develops architectural concepts, spatial planning, design documentation, and buildable details for residential work."
  },
  {
    name: "Joon",
    role: "Architect",
    bio: "Focuses on planning, drawing coordination, material studies, and calm transitions from design intent to construction."
  },
  {
    name: "Steve",
    role: "Architect",
    bio: "Supports project delivery through working drawings, consultant coordination, site review, and design refinement."
  }
];

const services = [
  {
    title: "Future project",
    copy: "Early feasibility, budget guidance, site review, scope planning, and staged advice before construction begins."
  },
  {
    title: "Room planning",
    copy: "Spatial planning for kitchens, bathrooms, living areas, commercial suites, and interiors that need practical flow."
  },
  {
    title: "Working drawings",
    copy: "Drawing coordination, details, schedules, buildability review, and documentation support for accurate pricing."
  }
];

const whatWeDo = [
  {
    title: "Residential",
    copy: "Architectural homes, renovations, extensions, apartments, interiors, landscaping interfaces, and final handover."
  },
  {
    title: "Commercial",
    copy: "Boutique offices, hospitality, retail, lobbies, fit-outs, adaptive reuse, and staged works in operating buildings."
  }
];

export default function App() {
  const [projects, setProjects] = useState([]);
  const [projectError, setProjectError] = useState("");

  useEffect(() => {
    loadProjects()
      .then(setProjects)
      .catch((error) => setProjectError(error.message));
  }, []);

  return (
    <>
      <SiteIntro />
      <header className="site-header">
        <a className="brand" href="#home" aria-label="2Form Consulting Pty Ltd home">
          <span className="brand-mark">2F</span>
          <span>
            <strong>2Form Consulting</strong>
            <small>Pty Ltd</small>
          </span>
        </a>
        <nav className="site-nav" aria-label="Main navigation">
          <a href="#about">About</a>
          <a href="#team">Team</a>
          <a href="#portfolio">Portfolio</a>
          <a href="#services">Services</a>
          <a href="#what-we-do">What we do</a>
          <a href="#contact">Contact</a>
        </nav>
      </header>

      <main id="home">
        <section className="hero">
          <div className="hero-image-placeholder" aria-hidden="true" />
          <Suspense fallback={null}>
            <ArchitecturalScene />
          </Suspense>
          <div className="hero-content">
            <Reveal as="p" className="eyebrow">Residential and commercial construction</Reveal>
            <SplitText
              as="h1"
              text="Considered building for homes, workplaces, and future projects."
              delay={120}
              step={46}
            />
            <Reveal as="p" delay={520}>
              A premium React website structure for a construction company, designed around project proof,
              service clarity, and a simple project upload workflow.
            </Reveal>
            <Reveal className="action-row" delay={680}>
              <a className="button primary" href="#portfolio">View built projects</a>
              <a className="button secondary" href="#contact">Start an enquiry</a>
            </Reveal>
          </div>
        </section>

        <section className="section about-section" id="about">
          <div className="section-heading">
            <Reveal as="p" className="eyebrow">About the company</Reveal>
            <SplitText as="h2" text="A builder focused on design intent, careful planning, and exacting delivery." />
          </div>
          <div className="about-grid">
            <Reveal as="p">
              2Form Consulting Pty Ltd is a premium construction and design consulting company serving residential and commercial clients.
              The studio works with owners, designers, consultants, and trades to turn early ideas into well-managed
              building programs.
            </Reveal>
            <Reveal as="p" delay={120}>
              The company’s promise is simple: thoughtful advice before the build, disciplined communication during
              construction, and refined finishing at handover.
            </Reveal>
          </div>
        </section>

        <section className="scroll-story-section" aria-label="Building process statement">
          <div className="scroll-story-track">
            <Reveal as="p" className="eyebrow">Process in motion</Reveal>
            <SplitText
              as="p"
              className="scroll-story-line"
              text="Briefs become plans. Plans become rooms. Rooms become calm, buildable spaces."
              delay={80}
              step={42}
            />
            <Reveal as="p" className="scroll-story-copy" delay={620}>
              This is the kind of editorial movement we can reuse for case studies later:
              each project can open with a short cinematic statement before the details appear.
            </Reveal>
          </div>
        </section>

        <section className="section team-section" id="team">
          <div className="section-heading split">
            <div>
              <Reveal as="p" className="eyebrow">Team</Reveal>
              <SplitText as="h2" text="The people guiding clients from first brief to final key." />
            </div>
            <Reveal as="p" delay={180}>Replace these profiles with real team members once the company content is ready.</Reveal>
          </div>
          <div className="team-grid">
            {team.map((member) => (
              <Reveal as="article" className="team-member" key={member.name}>
                <div className="portrait">{member.name.split(" ").map((part) => part[0]).join("")}</div>
                <h3>{member.name}</h3>
                <span>{member.role}</span>
                <p>{member.bio}</p>
              </Reveal>
            ))}
          </div>
        </section>

        {projectError ? (
          <section className="section">
            <p>{projectError}</p>
          </section>
        ) : (
          <Portfolio projects={projects} />
        )}

        <section className="section services-section" id="services">
          <div className="section-heading">
            <Reveal as="p" className="eyebrow">Services</Reveal>
            <SplitText as="h2" text="Support for planning, documentation, and the next build." />
          </div>
          <div className="service-list">
            {services.map((service, index) => (
              <Reveal as="article" key={service.title} delay={index * 90}>
                <span>{String(index + 1).padStart(2, "0")}</span>
                <SplitText as="h3" text={service.title} step={38} />
                <p>{service.copy}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="section room-planning-section" id="room-planning">
          <div className="section-heading split">
            <div>
              <Reveal as="p" className="eyebrow">Room planning studio</Reveal>
              <SplitText as="h2" text="From measured plan to spatial preview." />
            </div>
            <Reveal as="p" delay={180}>
              A lightweight showcase for the way 2Form Consulting Pty Ltd can present future rooms:
              start with a working plan, test the layout, then show the space as an easy-to-read interior preview.
            </Reveal>
          </div>
          <div className="planning-showcase">
            <div className="plan-board" aria-label="Animated room plan preview">
              <svg viewBox="0 0 520 360" role="img" aria-labelledby="planTitle">
                <title id="planTitle">Residential room planning floor plan</title>
                <rect className="plan-paper" x="0" y="0" width="520" height="360" rx="0" />
                <path className="plan-line primary-line" d="M80 72H436V292H80Z" />
                <path className="plan-line" d="M80 162H214V292" />
                <path className="plan-line" d="M214 72V162H436" />
                <path className="plan-line" d="M318 162V292" />
                <path className="plan-line light-line" d="M104 96H184V138H104Z" />
                <path className="plan-line light-line" d="M344 196H410V262H344Z" />
                <path className="plan-line light-line" d="M238 96H300V132H238Z" />
                <path className="plan-window" d="M122 72H190" />
                <path className="plan-window" d="M436 188V252" />
                <path className="plan-arc" d="M214 162A52 52 0 0 1 162 214" />
                <path className="plan-arc" d="M318 292A52 52 0 0 0 266 240" />
                <circle className="plan-node" cx="80" cy="72" r="5" />
                <circle className="plan-node" cx="436" cy="292" r="5" />
                <text x="80" y="46">01 / measured plan</text>
                <text x="344" y="322">living</text>
                <text x="104" y="322">kitchen</text>
                <text x="232" y="146">entry</text>
              </svg>
            </div>
            <div className="room-preview">
              <Suspense fallback={<div className="room-scene-fallback" />}>
                <RoomPlanningScene />
              </Suspense>
              <div className="preview-copy">
                <Reveal as="p" className="eyebrow">02 / 3D room preview</Reveal>
                <SplitText as="h3" text="Plan, extrude, furnish, present." step={40} />
                <p>Use the same design logic for residential rooms, commercial suites, and early client presentations.</p>
              </div>
            </div>
          </div>
          <div className="planning-steps" aria-label="Room planning process">
            <article>
              <span>01</span>
              <strong>Trace</strong>
              <p>Convert measured rooms, existing layouts, or concept sketches into clean planning geometry.</p>
            </article>
            <article>
              <span>02</span>
              <strong>Test</strong>
              <p>Study circulation, furniture, sightlines, services, and the practical constraints of the room.</p>
            </article>
            <article>
              <span>03</span>
              <strong>Present</strong>
              <p>Turn the plan into an approachable spatial preview before committing to drawings or build.</p>
            </article>
          </div>
        </section>

        <section className="section what-section" id="what-we-do">
          <div className="section-heading split">
            <div>
              <Reveal as="p" className="eyebrow">What we do</Reveal>
              <SplitText as="h2" text="Residential and commercial work with the same level of control." />
            </div>
            <Reveal as="p" delay={180}>
              The design keeps these categories clear today, and gives you room to add Three.js or project-detail
              interactions later.
            </Reveal>
          </div>
          <div className="what-grid">
            {whatWeDo.map((item) => (
              <Reveal as="article" key={item.title}>
                <SplitText as="h3" text={item.title} step={42} />
                <p>{item.copy}</p>
              </Reveal>
            ))}
          </div>
        </section>

        <section className="section contact-section" id="contact">
          <div>
            <Reveal as="p" className="eyebrow">Contact us</Reveal>
            <SplitText as="h2" text="Start with the site, the brief, or the room you want to change." />
            <dl>
              <div>
                <dt>Email</dt>
                <dd><a href="mailto:hello@2formconsulting.example">hello@2formconsulting.example</a></dd>
              </div>
              <div>
                <dt>Phone</dt>
                <dd><a href="tel:+61000000000">+61 000 000 000</a></dd>
              </div>
              <div>
                <dt>Studio</dt>
                <dd>Melbourne, Victoria</dd>
              </div>
            </dl>
          </div>
          <form className="contact-form" action="mailto:hello@2formconsulting.example" method="post" encType="text/plain">
            <label>
              Name
              <input name="name" autoComplete="name" required />
            </label>
            <label>
              Email
              <input type="email" name="email" autoComplete="email" required />
            </label>
            <label>
              Enquiry type
              <select name="enquiryType" defaultValue="Future project">
                <option>Future project</option>
                <option>Room planning</option>
                <option>Working drawings</option>
                <option>Residential</option>
                <option>Commercial</option>
              </select>
            </label>
            <label>
              Message
              <textarea name="message" rows="5" required />
            </label>
            <button className="button primary" type="submit">Send enquiry</button>
          </form>
        </section>
      </main>

      <footer className="site-footer">
        <p>2Form Consulting Pty Ltd React structure and placeholder content ready for replacement.</p>
        <a href="/admin">Staff login</a>
      </footer>
    </>
  );
}
