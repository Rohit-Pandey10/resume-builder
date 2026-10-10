import React, { useState, useEffect } from 'react';
import {
  Copy,
  Check,
  ClipboardPaste,
  Trash2,
  AlertCircle,
  Loader2,
  X,
  ArrowRight,
  ArrowLeft,
  FileText,
} from 'lucide-react';
import { Button, IconButton } from './primitives';
import { AI_EXTRACTION_PROMPT } from '../utils/aiPromptTemplate';
import { parseImportedResume } from '../utils/jsonImporter';

export default function ImportResumeModal({ isOpen, onClose, onImport }) {
  const [currentStep, setCurrentStep] = useState(1);
  const [copied, setCopied] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseError, setParseError] = useState(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(AI_EXTRACTION_PROMPT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy prompt to clipboard:', err);
    }
  };

  const handlePasteFromClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText();
        if (text) {
          setRawInput(text);
          setParseError(null);
        }
      }
    } catch (err) {
      console.warn('Clipboard read access denied or unavailable:', err);
    }
  };

  const handleImportSubmit = async () => {
    setParseError(null);
    if (!rawInput.trim()) {
      setParseError('Please paste the JSON output before importing.');
      return;
    }

    setIsProcessing(true);
    try {
      const normalizedResume = parseImportedResume(rawInput);
      await onImport(normalizedResume);
      setRawInput('');
      setCurrentStep(1);
      onClose();
    } catch (err) {
      console.error('Import parsing error:', err);
      setParseError(err.message || 'Failed to parse resume JSON. Please verify the AI response.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4"
      style={{ background: 'rgba(28, 25, 23, 0.45)' }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-xl flex flex-col max-h-[90vh] overflow-hidden rounded-[10px] border"
        style={{
          background: 'var(--color-bg-base)',
          borderColor: 'var(--color-border)',
          boxShadow: 'var(--shadow-popover)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 border-b flex-shrink-0"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-bg-subtle)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded flex items-center justify-center flex-shrink-0"
              style={{
                background: 'var(--color-bg-base)',
                border: '1px solid var(--color-border)',
                color: 'var(--color-brand)',
              }}
            >
              <FileText size={16} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="text-xs font-semibold" style={{ color: 'var(--color-text-1)' }}>
                Import resume
              </h3>
              <p className="text-[11px]" style={{ color: 'var(--color-text-3)' }}>
                Extract resume structure from PDF via ChatGPT, Claude, or Gemini
              </p>
            </div>
          </div>

          <IconButton onClick={onClose} title="Dismiss">
            <X size={16} strokeWidth={1.5} />
          </IconButton>
        </div>

        {/* Step Tabs */}
        <div
          className="flex items-center border-b px-4 flex-shrink-0"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-bg-subtle)',
          }}
        >
          <button
            type="button"
            onClick={() => {
              setCurrentStep(1);
              setParseError(null);
            }}
            className="flex items-center gap-1.5 py-2 px-2 text-xs font-medium border-b-2 transition-colors"
            style={{
              borderColor: currentStep === 1 ? 'var(--color-brand)' : 'transparent',
              color: currentStep === 1 ? 'var(--color-text-1)' : 'var(--color-text-3)',
            }}
          >
            <span
              className="w-4 h-4 rounded text-[10px] flex items-center justify-center font-medium"
              style={{
                background: currentStep === 1 ? 'var(--color-brand)' : 'var(--color-bg-muted)',
                color: currentStep === 1 ? '#FFFFFF' : 'var(--color-text-3)',
              }}
            >
              1
            </span>
            <span>Copy prompt</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCurrentStep(2);
              setParseError(null);
            }}
            className="flex items-center gap-1.5 py-2 px-2 text-xs font-medium border-b-2 transition-colors"
            style={{
              borderColor: currentStep === 2 ? 'var(--color-brand)' : 'transparent',
              color: currentStep === 2 ? 'var(--color-text-1)' : 'var(--color-text-3)',
            }}
          >
            <span
              className="w-4 h-4 rounded text-[10px] flex items-center justify-center font-medium"
              style={{
                background: currentStep === 2 ? 'var(--color-brand)' : 'var(--color-bg-muted)',
                color: currentStep === 2 ? '#FFFFFF' : 'var(--color-text-3)',
              }}
            >
              2
            </span>
            <span>Paste output</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
          {currentStep === 1 && (
            <div className="space-y-3">
              <div
                className="p-3 rounded border text-xs space-y-1.5"
                style={{
                  background: 'var(--color-bg-subtle)',
                  borderColor: 'var(--color-border)',
                  color: 'var(--color-text-2)',
                }}
              >
                <div className="font-medium" style={{ color: 'var(--color-text-1)' }}>
                  Instructions
                </div>
                <ol className="list-decimal list-inside space-y-1 leading-relaxed pl-1 text-[11px]">
                  <li>Open ChatGPT, Claude, or Gemini.</li>
                  <li>Attach your existing resume PDF.</li>
                  <li>Copy and paste the prompt below, then send.</li>
                  <li>Copy the AI's JSON output and proceed to step 2.</li>
                </ol>
              </div>

              {/* Prompt box */}
              <div
                className="rounded border overflow-hidden"
                style={{
                  borderColor: 'var(--color-border)',
                  background: 'var(--color-bg-base)',
                }}
              >
                <div
                  className="flex items-center justify-between px-3 py-1.5 border-b text-[11px]"
                  style={{
                    borderColor: 'var(--color-border)',
                    background: 'var(--color-bg-subtle)',
                    color: 'var(--color-text-3)',
                  }}
                >
                  <span className="font-mono">extraction-prompt.txt</span>
                  <Button variant="secondary" size="sm" onClick={handleCopyPrompt}>
                    {copied ? (
                      <>
                        <Check size={14} strokeWidth={1.5} style={{ color: 'var(--color-brand)' }} />
                        <span>Copied</span>
                      </>
                    ) : (
                      <>
                        <Copy size={14} strokeWidth={1.5} />
                        <span>Copy prompt</span>
                      </>
                    )}
                  </Button>
                </div>
                <pre
                  className="p-3 text-[11px] font-mono overflow-x-auto max-h-52 leading-relaxed select-all m-0"
                  style={{ color: 'var(--color-text-2)' }}
                >
                  {AI_EXTRACTION_PROMPT}
                </pre>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium" style={{ color: 'var(--color-text-2)' }}>
                  Paste AI JSON response:
                </label>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={handlePasteFromClipboard}>
                    <ClipboardPaste size={14} strokeWidth={1.5} />
                    <span>Paste clipboard</span>
                  </Button>
                  {rawInput && (
                    <Button variant="ghost" size="sm" onClick={() => setRawInput('')}>
                      <Trash2 size={14} strokeWidth={1.5} />
                      <span>Clear</span>
                    </Button>
                  )}
                </div>
              </div>

              <textarea
                value={rawInput}
                onChange={(e) => {
                  setRawInput(e.target.value);
                  if (parseError) setParseError(null);
                }}
                rows={10}
                placeholder="Paste the raw AI JSON output here…"
                className="jr-textarea font-mono text-xs w-full leading-relaxed"
                autoFocus
              />

              {parseError && (
                <div
                  className="p-2.5 rounded border text-xs flex items-start gap-2"
                  style={{
                    background: 'var(--color-danger-subtle)',
                    borderColor: 'var(--color-danger)',
                    color: 'var(--color-danger-text)',
                  }}
                  role="alert"
                >
                  <AlertCircle size={14} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div className="flex-1">
                    <p className="font-semibold">Import validation error</p>
                    <p className="text-[11px] mt-0.5">{parseError}</p>
                  </div>
                  <IconButton onClick={() => setParseError(null)}>
                    <X size={14} strokeWidth={1.5} />
                  </IconButton>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-between px-4 py-2.5 border-t flex-shrink-0"
          style={{
            borderColor: 'var(--color-border)',
            background: 'var(--color-bg-subtle)',
          }}
        >
          {currentStep === 1 ? (
            <>
              <Button variant="secondary" size="sm" onClick={onClose}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={() => setCurrentStep(2)}>
                <span>Proceed to step 2</span>
                <ArrowRight size={14} strokeWidth={1.5} />
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => {
                  setCurrentStep(1);
                  setParseError(null);
                }}
              >
                <ArrowLeft size={14} strokeWidth={1.5} />
                <span>Back</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleImportSubmit}
                  disabled={!rawInput.trim() || isProcessing}
                >
                  {isProcessing ? (
                    <>
                      <Loader2 size={14} strokeWidth={1.5} className="animate-spin" />
                      <span>Importing…</span>
                    </>
                  ) : (
                    <span>Import resume</span>
                  )}
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
