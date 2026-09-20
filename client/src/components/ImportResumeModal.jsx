import React, { useState } from 'react';
import {
  Sparkles,
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
  Bot,
} from 'lucide-react';
import { AI_EXTRACTION_PROMPT } from '../utils/aiPromptTemplate';
import { parseImportedResume } from '../utils/jsonImporter';

export default function ImportResumeModal({ isOpen, onClose, onImport }) {
  const [currentStep, setCurrentStep] = useState(1); // 1: Copy Prompt, 2: Paste Output
  const [copied, setCopied] = useState(false);
  const [rawInput, setRawInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [parseError, setParseError] = useState(null);

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
      setParseError('Please paste the JSON output from your AI tool before importing.');
      return;
    }

    setIsProcessing(true);
    try {
      // 1. Sanitize & parse client-side
      const normalizedResume = parseImportedResume(rawInput);

      // 2. Delegate to parent for backend persistence and state update
      await onImport(normalizedResume);

      // 3. Reset and close on success
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-zinc-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl w-full max-w-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-zinc-800 flex-shrink-0 bg-zinc-950/50">
          <div className="flex items-center gap-2.5">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-zinc-800 text-zinc-200 border border-zinc-700">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-100 flex items-center gap-2">
                Import Resume via AI
                <span className="text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded bg-zinc-800 text-zinc-300 border border-zinc-700 font-mono">
                  No API Key Needed
                </span>
              </h3>
              <p className="text-xs text-zinc-400">
                Extract details from your existing resume PDF using ChatGPT, Claude, or Gemini.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Tabs */}
        <div className="flex items-center border-b border-zinc-800 bg-zinc-950/30 px-5 pt-2 flex-shrink-0">
          <button
            type="button"
            onClick={() => {
              setCurrentStep(1);
              setParseError(null);
            }}
            className={`flex items-center gap-2 pb-2 px-3 text-xs font-medium border-b-2 transition-all ${
              currentStep === 1
                ? 'border-zinc-200 text-zinc-100'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${
                currentStep === 1 ? 'bg-zinc-100 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              1
            </div>
            <span>Copy Extraction Prompt</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setCurrentStep(2);
              setParseError(null);
            }}
            className={`flex items-center gap-2 pb-2 px-3 text-xs font-medium border-b-2 transition-all ${
              currentStep === 2
                ? 'border-zinc-200 text-zinc-100'
                : 'border-transparent text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <div
              className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center ${
                currentStep === 2 ? 'bg-zinc-100 text-zinc-950 font-bold' : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              2
            </div>
            <span>Paste AI Output & Import</span>
          </button>
        </div>

        {/* Body (Scrollable) */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {/* STEP 1: Prompt & Instructions */}
          {currentStep === 1 && (
            <div className="space-y-3.5">
              {/* How it works card */}
              <div className="bg-zinc-950 border border-zinc-800 rounded-lg p-3.5 space-y-2 text-xs">
                <div className="font-medium text-zinc-200 flex items-center gap-1.5">
                  <Bot className="w-4 h-4 text-zinc-400" />
                  <span>How to extract your resume in 30 seconds:</span>
                </div>
                <ol className="list-decimal list-inside space-y-1 text-zinc-400 leading-relaxed pl-1">
                  <li>
                    Open <span className="text-zinc-200 font-medium">ChatGPT</span>,{' '}
                    <span className="text-zinc-200 font-medium">Claude</span>, or{' '}
                    <span className="text-zinc-200 font-medium">Gemini</span>.
                  </li>
                  <li>
                    <strong className="text-zinc-200">Attach your existing resume PDF</strong> to
                    the message.
                  </li>
                  <li>
                    Click <strong className="text-zinc-200">"Copy Extraction Prompt"</strong>{' '}
                    below, paste it as the prompt text, and send.
                  </li>
                  <li>Copy the AI's response and proceed to Step 2.</li>
                </ol>
              </div>

              {/* Read-only Prompt Preview */}
              <div className="relative rounded-lg border border-zinc-800 bg-zinc-950 overflow-hidden">
                <div className="flex items-center justify-between px-3 py-2 bg-zinc-900 border-b border-zinc-800 text-[11px] font-medium text-zinc-400">
                  <span className="font-mono">extraction-prompt.txt</span>
                  <button
                    type="button"
                    onClick={handleCopyPrompt}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                      copied
                        ? 'bg-emerald-600 text-white'
                        : 'bg-zinc-100 hover:bg-white text-zinc-950 shadow-sm'
                    }`}
                  >
                    {copied ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Copied to Clipboard</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copy Prompt</span>
                      </>
                    )}
                  </button>
                </div>
                <pre className="p-3.5 text-[11px] font-mono text-zinc-300 overflow-x-auto max-h-56 leading-relaxed select-all">
                  {AI_EXTRACTION_PROMPT}
                </pre>
              </div>
            </div>
          )}

          {/* STEP 2: Paste Output & Import */}
          {currentStep === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-zinc-300 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-zinc-400" />
                  <span>Paste AI Response:</span>
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handlePasteFromClipboard}
                    className="text-[11px] text-zinc-300 hover:text-white flex items-center gap-1 transition-colors"
                  >
                    <ClipboardPaste className="w-3 h-3" />
                    <span>Paste Clipboard</span>
                  </button>
                  {rawInput && (
                    <button
                      type="button"
                      onClick={() => setRawInput('')}
                      className="text-[11px] text-zinc-500 hover:text-rose-400 flex items-center gap-1 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Clear</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={rawInput}
                  onChange={(e) => {
                    setRawInput(e.target.value);
                    if (parseError) setParseError(null);
                  }}
                  rows={10}
                  placeholder={`Paste the raw AI output here...\n\nMarkdown fences (\`\`\`json) and conversational text are handled automatically.`}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-xs font-mono text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 focus:ring-1 focus:ring-zinc-500 transition-colors resize-none leading-relaxed"
                  autoFocus
                />
              </div>

              {/* Error Banner */}
              {parseError && (
                <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-200 flex items-start gap-2.5 animate-in fade-in">
                  <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-1">
                    <p className="font-semibold text-rose-300">Import Validation Error</p>
                    <p className="text-rose-200/90 leading-relaxed">{parseError}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setParseError(null)}
                    className="text-rose-400 hover:text-rose-200 p-0.5"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-zinc-800 bg-zinc-950/50 flex-shrink-0">
          {currentStep === 1 ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-md text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-1.5 rounded-md text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 flex items-center gap-1.5 transition-all shadow-sm"
              >
                <span>Proceed to Step 2</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => {
                  setCurrentStep(1);
                  setParseError(null);
                }}
                className="px-3.5 py-1.5 rounded-md text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 flex items-center gap-1.5 transition-colors"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back to Prompt</span>
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-3.5 py-1.5 rounded-md text-xs font-medium text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleImportSubmit}
                  disabled={!rawInput.trim() || isProcessing}
                  className="px-4 py-1.5 rounded-md text-xs font-medium bg-zinc-100 hover:bg-white text-zinc-950 flex items-center gap-2 transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5 text-zinc-800" />
                      <span>Import Resume</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
