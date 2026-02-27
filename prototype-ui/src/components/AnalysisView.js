import React, { useState } from 'react';
import './AnalysisView.css';

const dummyFindings = [
  {
    id: 1,
    severity: 'critical',
    section: '4.2 Study Objectives',
    title: 'Primary Endpoint Not Explicitly Defined',
    documentText: 'The study will measure efficacy through various clinical assessments.',
    regulatoryText: 'ICH E6(R2) Section 6.9.4 states: "The primary endpoint(s) should be clearly defined and specified in the protocol."',
    citation: 'ICH E6(R2) Section 6.9.4',
    gap: 'No specific primary endpoint is identified. The text mentions "various assessments" but doesn\'t designate which is primary.',
    suggestedFix: 'The primary endpoint is the change from baseline in [specific measure] at [timepoint], measured using [validated instrument].',
    confidence: 'HIGH',
    status: 'pending',
    feedback: null
  },
  {
    id: 2,
    severity: 'critical',
    section: '4.8 Informed Consent',
    title: 'Missing Study Purpose Statement',
    documentText: 'Participants will be informed about the procedures and requirements.',
    regulatoryText: 'ICH E6(R2) Section 4.8.1 requires: "...a statement that the trial involves research, an explanation of the purposes of the research..."',
    citation: 'ICH E6(R2) Section 4.8.1',
    gap: 'The informed consent section does not explicitly state that the trial involves research or explain the research purpose.',
    suggestedFix: 'This study is a research trial designed to evaluate [specific purpose]. The purpose of this research is to [detailed explanation].',
    confidence: 'HIGH',
    status: 'pending',
    feedback: null
  },
  {
    id: 3,
    severity: 'major',
    section: '5.3 Safety Monitoring',
    title: 'Incomplete Adverse Event Reporting Timeline',
    documentText: 'Adverse events will be reported to the sponsor.',
    regulatoryText: 'ICH E6(R2) Section 4.11.1 requires: "...the investigator should report all serious adverse events immediately..."',
    citation: 'ICH E6(R2) Section 4.11.1',
    gap: 'No specific timeline is provided for adverse event reporting. The word "immediately" or specific timeframes are missing.',
    suggestedFix: 'All serious adverse events will be reported to the sponsor within 24 hours of the investigator becoming aware of the event.',
    confidence: 'HIGH',
    status: 'pending',
    feedback: null
  },
  {
    id: 4,
    severity: 'major',
    section: '6.1 Study Population',
    title: 'Inclusion Criteria Lacks Specificity',
    documentText: 'Adults with the condition will be eligible.',
    regulatoryText: 'ICH E6(R2) Section 6.3 requires clear definition of subject selection criteria.',
    citation: 'ICH E6(R2) Section 6.3',
    gap: 'Age range not specified, diagnostic criteria not detailed, and severity/stage not defined.',
    suggestedFix: 'Adults aged 18-65 years with confirmed diagnosis of [condition] based on [specific criteria], with [severity level] as defined by [scale/measure].',
    confidence: 'MEDIUM',
    status: 'pending',
    feedback: null
  },
  {
    id: 5,
    severity: 'major',
    section: '7.2 Data Management',
    title: 'Missing Data Quality Assurance Procedures',
    documentText: 'Data will be collected and stored electronically.',
    regulatoryText: 'ICH E6(R2) Section 5.5.3 requires: "The sponsor should ensure that the trials are conducted and data are generated, documented, and reported in compliance with the protocol, GCP, and applicable regulatory requirements."',
    citation: 'ICH E6(R2) Section 5.5.3',
    gap: 'No mention of data validation, quality checks, or audit trails.',
    suggestedFix: 'Data quality will be ensured through automated validation checks, regular data reviews, and maintenance of complete audit trails for all data entries and modifications.',
    confidence: 'MEDIUM',
    status: 'pending',
    feedback: null
  }
];

function AnalysisView({ document, onViewChange }) {
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [findings, setFindings] = useState(dummyFindings);
  const [filterSeverity, setFilterSeverity] = useState('all');

  const handleAccept = (id) => {
    setFindings(prev => prev.map(f => 
      f.id === id ? { ...f, status: 'accepted' } : f
    ));
  };

  const handleReject = (id) => {
    setFindings(prev => prev.map(f => 
      f.id === id ? { ...f, status: 'rejected' } : f
    ));
  };

  const handleFeedback = (id, feedbackType) => {
    setFindings(prev => prev.map(f => 
      f.id === id ? { ...f, feedback: feedbackType } : f
    ));
  };

  const [feedbackComments, setFeedbackComments] = useState({});

  const handleFeedback = (id, feedback) => {
    setFindings(prev => prev.map(f => 
      f.id === id ? { ...f, userFeedback: feedback } : f
    ));
  };

  const handleCommentChange = (id, comment) => {
    setFeedbackComments(prev => ({
      ...prev,
      [id]: comment
    }));
  };

  const handleSubmitFeedback = (id) => {
    const comment = feedbackComments[id];
    setFindings(prev => prev.map(f => 
      f.id === id ? { ...f, feedbackComment: comment, feedbackSubmitted: true } : f
    ));
  };

  const filteredFindings = filterSeverity === 'all' 
    ? findings 
    : findings.filter(f => f.severity === filterSeverity);

  const stats = {
    critical: findings.filter(f => f.severity === 'critical').length,
    major: findings.filter(f => f.severity === 'major').length,
    minor: findings.filter(f => f.severity === 'minor').length,
    accepted: findings.filter(f => f.status === 'accepted').length,
    rejected: findings.filter(f => f.status === 'rejected').length
  };

  return (
    <div className="analysis-view">
      <div className="analysis-header">
        <button className="back-btn" onClick={() => onViewChange('dashboard')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back to Dashboard
        </button>
        
        <div className="doc-header-info">
          <div>
            <h2>{document.name}</h2>
            <p>Analyzed on {new Date(document.uploadDate).toLocaleDateString()} • Guidelines: {document.guidelines.join(', ')}</p>
          </div>
          <button className="export-btn">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="7 10 12 15 17 10"/>
              <line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
            Export Report
          </button>
        </div>
      </div>

      <div className="analysis-stats">
        <div className="stat-item">
          <div className="stat-number" style={{color: '#ef4444'}}>{stats.critical}</div>
          <div className="stat-label">Critical</div>
        </div>
        <div className="stat-item">
          <div className="stat-number" style={{color: '#f59e0b'}}>{stats.major}</div>
          <div className="stat-label">Major</div>
        </div>
        <div className="stat-item">
          <div className="stat-number" style={{color: '#3b82f6'}}>{stats.minor}</div>
          <div className="stat-label">Minor</div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <div className="stat-number" style={{color: '#22c55e'}}>{stats.accepted}</div>
          <div className="stat-label">Accepted</div>
        </div>
        <div className="stat-item">
          <div className="stat-number" style={{color: '#6b7280'}}>{stats.rejected}</div>
          <div className="stat-label">Rejected</div>
        </div>
      </div>

      <div className="analysis-content">
        <div className="findings-panel">
          <div className="findings-header">
            <h3>Compliance Findings ({filteredFindings.length})</h3>
            <div className="filter-buttons">
              <button 
                className={filterSeverity === 'all' ? 'active' : ''}
                onClick={() => setFilterSeverity('all')}
              >
                All
              </button>
              <button 
                className={filterSeverity === 'critical' ? 'active' : ''}
                onClick={() => setFilterSeverity('critical')}
              >
                Critical
              </button>
              <button 
                className={filterSeverity === 'major' ? 'active' : ''}
                onClick={() => setFilterSeverity('major')}
              >
                Major
              </button>
              <button 
                className={filterSeverity === 'minor' ? 'active' : ''}
                onClick={() => setFilterSeverity('minor')}
              >
                Minor
              </button>
            </div>
          </div>

          <div className="findings-list">
            {filteredFindings.map(finding => (
              <div 
                key={finding.id}
                className={`finding-card ${selectedFinding?.id === finding.id ? 'selected' : ''} ${finding.status}`}
                onClick={() => setSelectedFinding(finding)}
              >
                <div className="finding-header">
                  <span className={`severity-badge ${finding.severity}`}>
                    {finding.severity.toUpperCase()}
                  </span>
                  {finding.status === 'accepted' && (
                    <span className="status-badge accepted">✓ Accepted</span>
                  )}
                  {finding.status === 'rejected' && (
                    <span className="status-badge rejected">✗ Rejected</span>
                  )}
                </div>
                <h4>{finding.title}</h4>
                <p className="finding-section">{finding.section}</p>
                <div className="finding-confidence">
                  <span className={`confidence-badge ${finding.confidence.toLowerCase()}`}>
                    {finding.confidence} Confidence
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="detail-panel">
          {selectedFinding ? (
            <div className="finding-detail">
              <div className="detail-header">
                <h3>{selectedFinding.title}</h3>
                <span className={`severity-badge ${selectedFinding.severity}`}>
                  {selectedFinding.severity.toUpperCase()}
                </span>
              </div>

              <div className="detail-section">
                <h4>📄 Your Document Text</h4>
                <div className="text-box document-text">
                  <p><strong>Section:</strong> {selectedFinding.section}</p>
                  <p className="text-content">{selectedFinding.documentText}</p>
                </div>
              </div>

              <div className="detail-section">
                <h4>📋 Regulatory Requirement</h4>
                <div className="text-box regulatory-text">
                  <p className="text-content">{selectedFinding.regulatoryText}</p>
                  <p className="citation">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
                    </svg>
                    {selectedFinding.citation}
                  </p>
                </div>
              </div>

              <div className="detail-section">
                <h4>⚠️ Gap Analysis</h4>
                <div className="text-box gap-text">
                  <p>{selectedFinding.gap}</p>
                </div>
              </div>

              <div className="detail-section">
                <h4>✨ Suggested Compliant Text</h4>
                <div className="text-box suggestion-text">
                  <p>{selectedFinding.suggestedFix}</p>
                </div>
                
                <div className="ai-feedback-section">
                  <p className="feedback-label">Was this AI suggestion helpful?</p>
                  <div className="feedback-buttons">
                    <button 
                      className={`feedback-btn ${selectedFinding.feedback === 'helpful' ? 'active' : ''}`}
                      onClick={() => handleFeedback(selectedFinding.id, 'helpful')}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                      </svg>
                      Helpful
                    </button>
                    <button 
                      className={`feedback-btn ${selectedFinding.feedback === 'not-helpful' ? 'active' : ''}`}
                      onClick={() => handleFeedback(selectedFinding.id, 'not-helpful')}
                    >
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                      </svg>
                      Not Helpful
                    </button>
                  </div>
                  {selectedFinding.feedback && (
                    <p className="feedback-thanks">Thank you for your feedback! This helps improve our AI.</p>
                  )}
                </div>
              </div>

              {selectedFinding.status === 'pending' && (
                <div className="action-buttons">
                  <button 
                    className="btn-accept"
                    onClick={() => handleAccept(selectedFinding.id)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Accept Suggestion
                  </button>
                  <button 
                    className="btn-reject"
                    onClick={() => handleReject(selectedFinding.id)}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="18" y1="6" x2="6" y2="18"/>
                      <line x1="6" y1="6" x2="18" y2="18"/>
                    </svg>
                    Reject
                  </button>
                </div>
              )}

              <div className="feedback-section">
                <h4>Was this AI analysis helpful?</h4>
                <div className="feedback-buttons">
                  <button 
                    className={`feedback-btn ${selectedFinding.userFeedback === 'positive' ? 'active positive' : ''}`}
                    onClick={() => handleFeedback(selectedFinding.id, 'positive')}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
                    </svg>
                    Helpful
                  </button>
                  <button 
                    className={`feedback-btn ${selectedFinding.userFeedback === 'negative' ? 'active negative' : ''}`}
                    onClick={() => handleFeedback(selectedFinding.id, 'negative')}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/>
                    </svg>
                    Not Helpful
                  </button>
                </div>
                
                {selectedFinding.userFeedback && !selectedFinding.feedbackSubmitted && (
                  <div className="feedback-comment-section">
                    <label htmlFor={`comment-${selectedFinding.id}`}>
                      Tell us more (optional):
                    </label>
                    <textarea
                      id={`comment-${selectedFinding.id}`}
                      className="feedback-comment-input"
                      placeholder="Share your thoughts on how we can improve this suggestion..."
                      value={feedbackComments[selectedFinding.id] || ''}
                      onChange={(e) => handleCommentChange(selectedFinding.id, e.target.value)}
                      rows="3"
                    />
                    <button 
                      className="submit-feedback-btn"
                      onClick={() => handleSubmitFeedback(selectedFinding.id)}
                    >
                      Submit Feedback
                    </button>
                  </div>
                )}
                
                {selectedFinding.feedbackSubmitted && (
                  <div className="feedback-thanks">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                    Thank you for your feedback! This helps improve our AI.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14 2 14 8 20 8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10 9 9 9 8 9"/>
              </svg>
              <h3>Select a finding to view details</h3>
              <p>Click on any finding from the list to see detailed analysis and suggestions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default AnalysisView;
