import React from 'react';
import { ArrowRight, Plus, User } from './icons';
import { Button, Card } from './primitives';

export default function EditorSectionCard({ sectionKey, title, caption, enabled = true, onToggle, onAdd, addLabel, nextLabel, onNext, isLast, children }) {
  return (
    <Card className={`jr-editor-section-card${enabled ? '' : ' is-disabled'}`}>
      <header className="jr-editor-section-card-header">
        <div><h2>{title}</h2><p>{caption}</p></div>
        {sectionKey === 'basics' ? <span className="jr-editor-section-icon"><User size={20} /></span> : <button type="button" className={`jr-section-switch${enabled ? ' is-on' : ''}`} role="switch" aria-checked={enabled} aria-label="Show in resume" title="Show in resume" onClick={onToggle}><span /></button>}
      </header>
      <div className="jr-editor-section-card-body">{children}</div>
      <footer className="jr-editor-section-card-footer">
        {onAdd ? <Button variant="secondary" size="md" className="jr-section-footer-btn" onClick={onAdd}><Plus size={18} />{addLabel}</Button> : <span />}
        <Button variant="primary" size="md" className="jr-section-footer-btn" onClick={onNext}>{isLast ? 'Preview PDF' : <>Next: {nextLabel}<ArrowRight size={18} /></>}</Button>
      </footer>
    </Card>
  );
}
