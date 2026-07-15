import { useEffect, useState } from "react";

export default function SiteIntro() {
  const [stage, setStage] = useState("loading");
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (reducedMotion) {
      setHidden(true);
      return undefined;
    }

    const openTimer = window.setTimeout(() => setStage("opening"), 1450);
    const hideTimer = window.setTimeout(() => setHidden(true), 2600);

    return () => {
      window.clearTimeout(openTimer);
      window.clearTimeout(hideTimer);
    };
  }, []);

  if (hidden) {
    return null;
  }

  return (
    <div className={`site-intro ${stage === "opening" ? "is-opening" : ""}`} aria-label="2Form Consulting loading">
      <div className="intro-panel intro-panel-left" />
      <div className="intro-panel intro-panel-right" />
      <div className="intro-content">
        <p className="intro-kicker">2Form Consulting Pty Ltd</p>
        <div className="intro-mark" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        <h1>Preparing the plan</h1>
        <div className="intro-progress" aria-hidden="true">
          <span />
        </div>
      </div>
    </div>
  );
}
