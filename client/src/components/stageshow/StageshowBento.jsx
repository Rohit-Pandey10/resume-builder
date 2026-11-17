import React from 'react';
import {
  FileCode,
  ChartBar,
  DownloadSimple,
  CheckCircle2,
  ExternalLink,
} from '../icons';

export default function StageshowBento() {
  return (
    <section className="jr-landing-features jr-stageshow-bento-grid" aria-label="JakeResume features">
      {/* Bento Tile 1: ATS-Compliant LaTeX Architecture */}
      <div className="jr-landing-feature-card jr-bento-card">
        <div className="jr-bento-card-top">
          <span className="jr-bento-tag">ENGINE</span>
          <span className="jr-bento-icon-pill">
            <FileCode size={18} weight="bold" />
          </span>
        </div>
        <div className="jr-bento-card-body">
          <h3 className="jr-bento-title">Jake&apos;s LaTeX Standard</h3>
          <p className="jr-bento-desc">
            Clean single-column LaTeX architecture compiled directly into ATS-compliant PDF with glyph-to-unicode mapping.
          </p>
        </div>
        <div className="jr-bento-code-preview" aria-hidden="true">
          <div className="jr-bento-code-line">
            <span className="jr-code-kw">\input</span>
            <span className="jr-code-arg">{'{glyphtounicode}'}</span>
          </div>
          <div className="jr-bento-code-line">
            <span className="jr-code-kw">\pdfgentounicode</span>=1
          </div>
          <div className="jr-bento-code-line">
            <span className="jr-code-kw">\documentclass</span>
            <span className="jr-code-opt">[letterpaper,11pt]</span>
            <span className="jr-code-arg">{'{article}'}</span>
          </div>
        </div>
      </div>

      {/* Bento Tile 2: Guaranteed Single-Page Budget */}
      <div className="jr-landing-feature-card jr-bento-card">
        <div className="jr-bento-card-top">
          <span className="jr-bento-tag">ALGORITHM</span>
          <span className="jr-bento-icon-pill">
            <ChartBar size={18} weight="bold" />
          </span>
        </div>
        <div className="jr-bento-card-body">
          <h3 className="jr-bento-title">1-Page Budget Gauge</h3>
          <p className="jr-bento-desc">
            Dynamic character-wrapping calculations monitor line heights in real time, preventing accidental spillover onto page two.
          </p>
        </div>
        <div className="jr-bento-meter-preview" aria-hidden="true">
          <div className="jr-bento-meter-header">
            <span className="jr-bento-meter-val">42 / 48 lines</span>
            <span className="jr-bento-meter-status">88% safe</span>
          </div>
          <div className="jr-bento-meter-track">
            <div className="jr-bento-meter-fill" style={{ width: '88%' }} />
          </div>
          <div className="jr-bento-meter-caption">
            <CheckCircle2 size={13} weight="bold" />
            <span>Optimal density for recruiter readability</span>
          </div>
        </div>
      </div>

      {/* Bento Tile 3: Private Storage & Multi-Format Export */}
      <div className="jr-landing-feature-card jr-bento-card">
        <div className="jr-bento-card-top">
          <span className="jr-bento-tag">PORTABILITY</span>
          <span className="jr-bento-icon-pill">
            <DownloadSimple size={18} weight="bold" />
          </span>
        </div>
        <div className="jr-bento-card-body">
          <h3 className="jr-bento-title">Export &amp; Local Privacy</h3>
          <p className="jr-bento-desc">
            Build anonymously in browser local storage or sync with Google. Export production PDFs, raw .tex files, or 1-click Overleaf.
          </p>
        </div>
        <div className="jr-bento-pills-preview" aria-hidden="true">
          <span className="jr-export-pill">
            <DownloadSimple size={12} weight="bold" />
            <span>PDF</span>
          </span>
          <span className="jr-export-pill">
            <FileCode size={12} weight="bold" />
            <span>.tex Source</span>
          </span>
          <span className="jr-export-pill">
            <ExternalLink size={12} weight="bold" />
            <span>Overleaf</span>
          </span>
        </div>
      </div>
    </section>
  );
}
