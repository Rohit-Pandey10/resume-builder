import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './tokens.css';
import './primitives.css';
import './index.css';

const CANONICAL_HOST = 'jake-resume-builder10.vercel.app';
if (
  typeof window !== 'undefined' &&
  window.location.hostname.endsWith('.vercel.app') &&
  window.location.hostname !== CANONICAL_HOST
) {
  window.location.replace(`https://${CANONICAL_HOST}${window.location.pathname}${window.location.search}${window.location.hash}`);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
