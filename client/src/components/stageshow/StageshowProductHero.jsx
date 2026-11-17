import React from 'react';
import { ChartBar, CheckCircle2, Code2 } from '../icons';
import './stageshow.css';

/**
 * Stageshow-grade authentic product showcase for JakeResume.
 * Follows Stageshow principles:
 * - Real product feel (Linear/Stripe caliber)
 * - Restraint & word budget (focal strings carry the story, quiet filler bars at edges)
 * - Framing & bleed (fills >2/3 of stage, confident right bleed)
 * - No AI slop (zero sparkles, zero purple gradients, zero pastel blob floating cards)
 */
export default function StageshowProductHero() {
  return (
    <div className="jr-stageshow-stage" aria-hidden="true">
      {/* Product Window */}
      <div className="jr-stageshow-window">
        {/* macOS Window Chrome */}
        <div className="jr-stageshow-chrome">
          <div className="jr-stageshow-traffic-lights">
            <span className="jr-light jr-light-close" />
            <span className="jr-light jr-light-min" />
            <span className="jr-light jr-light-max" />
          </div>
          <div className="jr-stageshow-address-pill">
            <span className="jr-stageshow-url-lock">🔒</span>
            <span className="jr-stageshow-url-text">jakeresume.app/edit/alex-carter</span>
          </div>
          <div className="jr-stageshow-chrome-spacer" aria-hidden="true" style={{ width: '54px' }} />
        </div>

        {/* Split Window Workspace */}
        <div className="jr-stageshow-body">
          {/* Left Column: Focused Resume Form Section */}
          <div className="jr-stageshow-col-editor">
            {/* Stepper bar */}
            <div className="jr-stageshow-stepper">
              <span className="jr-step-item">Basics</span>
              <span className="jr-step-item">Education</span>
              <span className="jr-step-item is-active">Experience</span>
              <span className="jr-step-item">Projects</span>
              <span className="jr-step-item">Skills</span>
            </div>

            {/* Form Section Card */}
            <div className="jr-stageshow-card">
              <div className="jr-stageshow-card-header">
                <div>
                  <div className="jr-stageshow-card-title">Experience</div>
                  <div className="jr-stageshow-card-subtitle">Work history & accomplishments</div>
                </div>
                <span className="jr-stageshow-badge">Section 3 of 6</span>
              </div>

              {/* Form Entry */}
              <div className="jr-stageshow-entry">
                <div className="jr-stageshow-field-row">
                  <div className="jr-stageshow-input-fake">
                    <span className="jr-input-label">Role</span>
                    <span className="jr-input-val">Senior Software Engineer</span>
                  </div>
                  <div className="jr-stageshow-input-fake">
                    <span className="jr-input-label">Company</span>
                    <span className="jr-input-val">Stripe</span>
                  </div>
                </div>

                <div className="jr-stageshow-field-row">
                  <div className="jr-stageshow-input-fake">
                    <span className="jr-input-label">Dates</span>
                    <span className="jr-input-val">May 2022 – Present</span>
                  </div>
                  <div className="jr-stageshow-input-fake">
                    <span className="jr-input-label">Location</span>
                    <span className="jr-input-val">San Francisco, CA</span>
                  </div>
                </div>

                {/* Bullets with restraint */}
                <div className="jr-stageshow-bullets">
                  <span className="jr-input-label">Accomplishments</span>
                  <div className="jr-stageshow-bullet-item">
                    <span className="jr-bullet-glyph">•</span>
                    <span className="jr-bullet-text">Architected real-time LaTeX compilation engine serving 50k+ monthly PDF exports</span>
                  </div>
                  <div className="jr-stageshow-bullet-item">
                    <span className="jr-bullet-glyph">•</span>
                    <span className="jr-bullet-text">Engineered dynamic character-wrapping budget estimator guaranteeing single-page density</span>
                  </div>
                  <div className="jr-stageshow-bullet-item is-filler">
                    <span className="jr-bullet-glyph">•</span>
                    <div className="jr-stageshow-bar-stack">
                      <span className="jr-stageshow-bar" style={{ width: '92%' }} />
                      <span className="jr-stageshow-bar" style={{ width: '64%' }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Jake's Classic LaTeX Resume Document */}
          <div className="jr-stageshow-col-preview">
            <div className="jr-stageshow-paper">
              {/* LaTeX Header */}
              <div className="jr-latex-header">
                <div className="jr-latex-name">ALEX CARTER</div>
                <div className="jr-latex-contact">
                  San Francisco, CA · (555) 019-2834 · alex@stripe.com · github.com/alex · linkedin.com/in/alex
                </div>
              </div>

              {/* LaTeX Section: Experience */}
              <div className="jr-latex-section">
                <div className="jr-latex-section-title">EXPERIENCE</div>
                <div className="jr-latex-rule" />

                <div className="jr-latex-row">
                  <div className="jr-latex-row-left">
                    <b>Senior Software Engineer</b> | <i>Stripe</i>
                  </div>
                  <div className="jr-latex-row-right">
                    May 2022 – Present | San Francisco, CA
                  </div>
                </div>
                <ul className="jr-latex-bullets">
                  <li>Architected real-time LaTeX compilation engine serving 50k+ monthly PDF exports.</li>
                  <li>Engineered dynamic character-wrapping budget estimator guaranteeing single-page density.</li>
                  <li>Eliminated PDF ligature dropouts with native glyphtounicode mapping.</li>
                </ul>
              </div>

              {/* LaTeX Section: Education */}
              <div className="jr-latex-section">
                <div className="jr-latex-section-title">EDUCATION</div>
                <div className="jr-latex-rule" />

                <div className="jr-latex-row">
                  <div className="jr-latex-row-left">
                    <b>University of California, Berkeley</b> | <i>B.S. in Computer Science</i>
                  </div>
                  <div className="jr-latex-row-right">
                    2018 – 2022
                  </div>
                </div>
              </div>

              {/* LaTeX Section: Skills (Quiet filler at bottom) */}
              <div className="jr-latex-section">
                <div className="jr-latex-section-title">TECHNICAL SKILLS</div>
                <div className="jr-latex-rule" />
                <div className="jr-latex-skills-line">
                  <b>Languages:</b> Python, TypeScript, Go, C++, LaTeX, SQL
                </div>
                <div className="jr-latex-skills-line">
                  <b>Frameworks & Tools:</b> React, Node.js, Express, Docker, Kubernetes, AWS
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Satellite Card: Live Page Budget Gauge (straddling the hero's edge) */}
      <div className="jr-stageshow-satellite">
        <div className="jr-satellite-top">
          <div className="jr-satellite-title-group">
            <span className="jr-satellite-icon">
              <ChartBar size={14} weight="bold" />
            </span>
            <span className="jr-satellite-label">Page Budget</span>
          </div>
          <span className="jr-satellite-status-pill">
            <span className="jr-satellite-green-dot" />
            Single Page Fit
          </span>
        </div>

        <div className="jr-satellite-meter-row">
          <div className="jr-satellite-number">42 <small>/ 48 lines</small></div>
          <div className="jr-satellite-pct">88%</div>
        </div>

        <div className="jr-satellite-bar-track">
          <div className="jr-satellite-bar-fill" style={{ width: '88%' }} />
        </div>

        <div className="jr-satellite-footer">
          <span className="jr-satellite-foot-item">
            <CheckCircle2 size={12} weight="bold" />
            <span>0% overflow risk</span>
          </span>
          <span className="jr-satellite-foot-item">
            <Code2 size={12} weight="bold" />
            <span>ATS Glyphtounicode</span>
          </span>
        </div>
      </div>
    </div>
  );
}
