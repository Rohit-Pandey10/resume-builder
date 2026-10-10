import React from 'react';
import {
  Loader2,
  FileText,
  Sparkles,
  ExternalLink,
  Download,
} from 'lucide-react';
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
      className="flex flex-col h-full w-full overflow-hidden"
      style={{ backgroundColor: 'var(--color-bg-subtle)' }}
    >
      {/* Main Paper Canvas Area */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 flex items-start justify-center">
        {lastCompiledPdfUrl ? (
          <div className="w-full flex flex-col items-center">
            {/* Quick action bar for mobile devices where embedded PDF iframes may not render */}
            <div
              className="w-full max-w-3xl mb-3 flex items-center justify-between px-3 py-2 rounded border sm:hidden"
              style={{
                backgroundColor: 'var(--color-bg-base)',
                borderColor: 'var(--color-border)',
                boxShadow: 'var(--shadow-popover)',
              }}
            >
              <div className="flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--color-text-1)' }}>
                <FileText size={14} className="text-[#0F766E]" />
                <span>PDF Ready</span>
              </div>
              <div className="flex items-center gap-2">
                <a
                  href={lastCompiledPdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1 text-xs font-medium rounded border flex items-center gap-1.5"
                  style={{
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-1)',
                    background: 'var(--color-bg-subtle)',
                  }}
                >
                  <ExternalLink size={12} strokeWidth={1.5} />
                  <span>Open</span>
                </a>
                <a
                  href={lastCompiledPdfUrl}
                  download="resume.pdf"
                  className="px-2.5 py-1 text-xs font-medium rounded flex items-center gap-1.5 text-white"
                  style={{ backgroundColor: 'var(--color-accent, #0F766E)' }}
                >
                  <Download size={12} strokeWidth={1.5} />
                  <span>Download</span>
                </a>
              </div>
            </div>

            <div
              className="w-full max-w-3xl transition-transform origin-top"
              style={{
                transform: `scale(${zoom / 100})`,
                minHeight: '850px',
                borderRadius: 'var(--radius-panel)',
                overflow: 'hidden',
                border: '1px solid var(--color-border)',
                backgroundColor: 'var(--color-bg-base)',
                boxShadow: 'var(--shadow-popover)',
              }}
            >
              <object
                data={pdfViewerSrc}
                type="application/pdf"
                className="w-full h-[900px] border-0"
                aria-label="Compiled Resume PDF"
              >
                <iframe
                  src={pdfViewerSrc}
                  title="Compiled Resume PDF"
                  className="w-full h-[900px] border-0"
                />
              </object>
            </div>
          </div>
        ) : (
          /* Calm Empty State with ONE Primary Button */
          <div
            className="w-full max-w-md my-auto p-8 rounded text-center space-y-4 border"
            style={{
              backgroundColor: 'var(--color-bg-base)',
              borderColor: 'var(--color-border)',
              borderRadius: 'var(--radius-panel)',
              boxShadow: 'var(--shadow-popover)',
            }}
          >
            <div
              className="w-10 h-10 mx-auto rounded flex items-center justify-center border"
              style={{
                backgroundColor: 'var(--color-bg-subtle)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-brand)',
              }}
            >
              <FileText size={20} strokeWidth={1.5} />
            </div>

            <div className="space-y-1">
              <h3
                className="text-sm font-semibold"
                style={{ color: 'var(--color-text-1)' }}
              >
                No PDF compiled yet
              </h3>
              <p
                className="text-xs leading-relaxed max-w-xs mx-auto"
                style={{ color: 'var(--color-text-2)' }}
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
