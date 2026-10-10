import React, { useEffect, useRef, useState } from 'react';

const GIS_SCRIPT_URL = 'https://accounts.google.com/gsi/client';
let gisScriptPromise;

function loadGoogleIdentityServices() {
  if (window.google?.accounts?.id) return Promise.resolve(window.google);
  if (gisScriptPromise) return gisScriptPromise;

  gisScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${GIS_SCRIPT_URL}"]`);
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google));
      existingScript.addEventListener('error', reject);
      return;
    }

    const script = document.createElement('script');
    script.src = GIS_SCRIPT_URL;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve(window.google);
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return gisScriptPromise;
}

export default function GoogleSignInButton({ onCredential, disabled = false }) {
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const containerRef = useRef(null);
  const callbackRef = useRef(onCredential);
  const [scriptReady, setScriptReady] = useState(false);
  const [scriptFailed, setScriptFailed] = useState(false);

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    if (!clientId) return undefined;
    let active = true;
    loadGoogleIdentityServices()
      .then(() => {
        if (active) setScriptReady(true);
      })
      .catch(() => {
        if (active) setScriptFailed(true);
      });
    return () => {
      active = false;
    };
  }, [clientId]);

  useEffect(() => {
    if (!scriptReady || !containerRef.current || !window.google?.accounts?.id) return undefined;

    const renderButton = () => {
      const container = containerRef.current;
      if (!container) return;
      container.innerHTML = '';
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response) => callbackRef.current?.(response.credential),
        auto_select: false,
      });
      window.google.accounts.id.renderButton(container, {
        type: 'standard',
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'rectangular',
        logo_alignment: 'left',
        width: Math.min(container.clientWidth || 400, 400),
      });
    };

    renderButton();
    const observer = new ResizeObserver(renderButton);
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [clientId, scriptReady]);

  if (!clientId) return null;

  return (
    <div aria-label="Continue with Google" role="group">
      <div
        ref={containerRef}
        aria-disabled={disabled}
        style={{
          minHeight: '40px',
          pointerEvents: disabled ? 'none' : 'auto',
          opacity: disabled ? 0.55 : 1,
        }}
      />
      {scriptFailed && (
        <p className="mt-2 text-center text-xs" style={{ color: 'var(--color-text-3)' }}>
          Google sign-in is unavailable. Use guest mode instead.
        </p>
      )}
    </div>
  );
}
