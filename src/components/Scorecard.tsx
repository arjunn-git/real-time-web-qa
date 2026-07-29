import React from 'react';
import { CheckCircle2, XCircle, AlertTriangle, PlusCircle, Split, Award, Percent, Layers } from 'lucide-react';
import type { QASummary } from '../types/qa';

interface ScorecardProps {
  summary: QASummary;
}

export const Scorecard: React.FC<ScorecardProps> = ({ summary }) => {
  const getGrade = (score: number) => {
    if (score >= 90) return { grade: 'A+', color: '#10b981', label: 'EXCELLENT MATCH' };
    if (score >= 80) return { grade: 'A', color: '#059669', label: 'GOOD MATCH' };
    if (score >= 70) return { grade: 'B', color: '#f59e0b', label: 'MODERATE ISSUES' };
    if (score >= 50) return { grade: 'C', color: '#d97706', label: 'NEEDS REVISION' };
    return { grade: 'F', color: '#ef4444', label: 'CRITICAL MISMATCHES' };
  };

  const gradeInfo = getGrade(summary.overallScore);

  return (
    <div className="scorecard-container">
      <div className="scorecard-main-card">
        {/* OVERALL SCORE GAUGE */}
        <div className="gauge-box">
          <div className="gauge-circle" style={{ borderColor: gradeInfo.color }}>
            <div className="gauge-number" style={{ color: gradeInfo.color }}>
              {summary.overallScore}
            </div>
            <div className="gauge-max">/ 100</div>
          </div>
          <div className="gauge-info">
            <div className="gauge-title-row">
              <Award size={20} style={{ color: gradeInfo.color }} />
              <h4>Overall QA Score</h4>
            </div>
            <div className="grade-badge" style={{ backgroundColor: `${gradeInfo.color}20`, color: gradeInfo.color }}>
              {gradeInfo.grade} — {gradeInfo.label}
            </div>
            <p className="score-desc">
              Dynamically calculated based on {summary.totalItems} extracted items across document and website sections.
            </p>
          </div>
        </div>

        {/* CONTENT MATCH PERCENTAGE */}
        <div className="metric-box">
          <div className="metric-icon-wrapper">
            <Percent size={24} />
          </div>
          <div className="metric-details">
            <span className="metric-label">Content Match Percentage</span>
            <div className="metric-value">{summary.contentMatchPercentage}%</div>
            <div className="progress-bar-bg">
              <div
                className="progress-bar-fill"
                style={{ width: `${summary.contentMatchPercentage}%`, backgroundColor: gradeInfo.color }}
              />
            </div>
          </div>
        </div>

        {/* TOTAL ITEMS */}
        <div className="metric-box">
          <div className="metric-icon-wrapper blue">
            <Layers size={24} />
          </div>
          <div className="metric-details">
            <span className="metric-label">Total Validated Items</span>
            <div className="metric-value">{summary.totalItems}</div>
            <span className="metric-sub">Processed section-by-section</span>
          </div>
        </div>
      </div>

      {/* STAT BREAKDOWN GRID */}
      <div className="stats-grid">
        <div className="stat-card correct">
          <div className="stat-header">
            <CheckCircle2 size={18} />
            <span>Correct Content</span>
          </div>
          <div className="stat-value">{summary.correctCount}</div>
          <span className="stat-unit">Exact / Semantic Matches</span>
        </div>

        <div className="stat-card missing">
          <div className="stat-header">
            <XCircle size={18} />
            <span>Missing Content</span>
          </div>
          <div className="stat-value">{summary.missingCount}</div>
          <span className="stat-unit">In Document, Absent on Site</span>
        </div>

        <div className="stat-card incorrect">
          <div className="stat-header">
            <AlertTriangle size={18} />
            <span>Incorrect Content</span>
          </div>
          <div className="stat-value">{summary.incorrectCount}</div>
          <span className="stat-unit">Site Mismatches / Changed Details</span>
        </div>

        <div className="stat-card additional">
          <div className="stat-header">
            <PlusCircle size={18} />
            <span>Additional Content</span>
          </div>
          <div className="stat-value">{summary.additionalCount}</div>
          <span className="stat-unit">Found on Site, Not in Doc</span>
        </div>

        <div className="stat-card partial">
          <div className="stat-header">
            <Split size={18} />
            <span>Partially Matched</span>
          </div>
          <div className="stat-value">{summary.partialCount}</div>
          <span className="stat-unit">Omitted / Changed Words</span>
        </div>
      </div>
    </div>
  );
};
