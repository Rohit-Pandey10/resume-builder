import React from 'react';
import {
  Loader2,
  FileText,
  Sparkles,
  ExternalLink,
  Download,
} from '../icons';
import { Button } from '../primitives';

export default function PdfPreviewPlaceholder({
  _profile,
  onCompilePdf,
  isCompiling = false,
  lastCompiledPdfUrl = null,
  zoom = 100,
  compileElapsedSeconds = 0,
}) {
  const pdfViewerSrc = lastCompiledPdfUrl
    ? `${lastCompiledPdfUrl}#toolbar=0&navpanes=0&view=FitH`
    : null;

  return (
    <div
      className="jr-pdf-preview flex flex-col h-full w-full overflow-hidden"
      style={{ backgroundColor: 'var(--bg-canvas)' }}
    >
      {/* Main Paper Canvas Area */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-start justify-center">
        {lastCompiledPdfUrl ? (
          <div className="w-full flex flex-col items-center">
            {/* Quick action bar for mobile devices where embedded PDF iframes may not render */}
            <div
              className="w-full max-w-3xl mb-3 flex items-center justify-between px-3 py-2 rounded border sm:hidden"
              style={{
                backgroundColor: 'var(--bg-app)',
                borderColor: 'var(--border)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--ink-900)' }}>
                <FileText size={14} style={{ color: 'var(--accent)' }} />
                <span>PDF Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={lastCompiledPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 text-xs font-medium rounded border flex items-center gap-1.5"
                  style={{
                    borderColor: 'var(--border)',
                    color: 'var(--ink-900)',
                    background: 'var(--bg-canvas)',
                  }}
                >
                  <ExternalLink size={12} strokeWidth={1.5} />
                  <span>Open</span>
                </a>
                <a
                  href={lastCompiledPdfUrl}
                  download="resume.pdf"
                  className="px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1.5 text-white"
                  style={{ backgroundColor: 'var(--accent)' }}
                >
                  <Download size={12} strokeWidth={1.5} />
                  <span>Download</span>
                </a>
              </div>
            </div>

            <div
              className="jr-pdf-paper-frame w-full max-w-3xl transition-transform origin-top"
              style={{
                transform: `scale(${zoom / 100})`,
                minHeight: '850px',
                borderRadius: '2px',
                overflow: 'hidden',
                border: '0',
                backgroundColor: 'var(--surface)',
                boxShadow: 'var(--shadow-paper)',
              }}
            >
              <object
                data={pdfViewerSrc}
                type="application/pdf"
                className="w-full h-[900px] border-0"
                style={{ border: 0, outline: 'none' }}
                aria-label="Compiled Resume PDF"
              >
                <iframe
                  src={pdfViewerSrc}
                  title="Compiled Resume PDF"
                  className="w-full h-[900px] border-0"
                  style={{ border: 0, outline: 'none' }}
                />
              </object>
            </div>
          </div>
        ) : (
          /* Calm Empty State with ONE Primary Button */
          <div
            className="jr-pdf-empty-state w-full max-w-md my-auto p-8 rounded text-center space-y-4 border"
            style={{
              backgroundColor: 'var(--bg-app)',
              borderColor: 'var(--border)',
              borderRadius: 'var(--r-lg)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            <div
              className="w-10 h-10 mx-auto rounded flex items-center justify-center border"
              style={{
                backgroundColor: 'var(--bg-canvas)',
                borderColor: 'var(--border)',
                color: 'var(--accent)',
              }}
            >
              <FileText size={20} strokeWidth={1.5} />
            </div>

            <div className="space-y-1">
              <h3
                className="text-sm font-semibold"
                style={{ color: 'var(--ink-900)' }}
              >
                No PDF yet
              </h3>
              <p
                className="text-xs leading-relaxed max-w-xs mx-auto"
                style={{ color: 'var(--ink-600)' }}
              >
                Compile to preview your resume as a PDF.
              </p>
            </div>

            <div className="pt-2 flex flex-col items-center">
              <Button
                variant="primary"
                onClick={onCompilePdf}
                disabled={isCompiling}
                aria-busy={isCompiling}
              >
                {isCompiling ? (
                  <>
                    <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
                    <span>
                      <span className="block">Compiling… {compileElapsedSeconds}s</span>
                      {compileElapsedSeconds >= 10 && (
                        <span className="block text-[10px] font-normal">Still generating… please wait.</span>
                      )}
                    </span>
                  </>
                ) : (
                  <>
                    <Sparkles size={14} strokeWidth={1.5} />
                    <span>Compile PDF</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
