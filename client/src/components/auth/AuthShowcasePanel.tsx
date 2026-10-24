import React from 'react';
import { CuteMascot } from '../avatar/CuteMascot';

interface AuthShowcasePanelProps {
  currentStep?: string;
}

export const AuthShowcasePanel: React.FC<AuthShowcasePanelProps> = ({ currentStep }) => {
  return (
    <section className="left-showcase hidden lg:flex" aria-label="INARO Companion Showcase">
      <div className="showcase-card">
        {/* Handwritten Motivational Micro-Doodles */}
        <div className="doodle doodle-1">Better Days Ahead ♡</div>
        <div className="doodle doodle-2">You got this ♡</div>
        <div className="doodle doodle-3">Take a deep breath ✦</div>
        <div className="doodle doodle-4">Safe space ✿</div>

        {/* Showcase Header */}
        <div className="showcase-header">
          <div className="showcase-chip">
            <span>✦</span> GEN-Z MENTAL WELL-BEING
          </div>
          <h2 className="showcase-title">
            Meet your <span className="gradient-text">empathetic</span> AI companion.
          </h2>
          <p className="showcase-desc">
            A private, non-clinical sanctuary built for your daily emotional peace. Express your thoughts freely without judgment.
          </p>
        </div>

        {/* Live Mascot Showcase Stage */}
        <div className="avatar-stage-box" title="INARO Mental Wellness Companion">
          <div className="py-2">
            <CuteMascot />
          </div>
          <div className="avatar-hint-tooltip">✦ Tap companion to say hi!</div>
        </div>

        {/* Bottom Feature Badges Ribbon */}
        <div className="student-badges-ribbon">
          <div className="badge-item">
            <span className="badge-icon">🔒</span>
            <span>Encrypted Journaling</span>
          </div>
          <div className="badge-item">
            <span className="badge-icon">🌸</span>
            <span>Tamil & English Chat</span>
          </div>
          <div className="badge-item">
            <span className="badge-icon">🛡️</span>
            <span>Verified Crisis Helplines</span>
          </div>
        </div>
      </div>
    </section>
  );
};
