import React, { useState } from 'react';
import './HistoryView.css';

const userHistory = [
  {
    id: 1,
    date: '2025-01-23',
    time: '14:42:10',
    document: 'Clinical_Protocol_XYZ_v2.1.pdf',
    action: 'Accepted Suggestion',
    finding: 'Primary Endpoint Not Explicitly Defined',
    section: '4.2 Study Objectives',
    originalText: 'The study will measure efficacy through various clinical assessments.',
    suggestedText: 'The primary endpoint is the change from baseline in [specific measure] at [timepoint], measured using [validated instrument].',
    status: 'Applied',
    guideline: 'ICH E6(R2) Section 6.9.4'
  },
  {
    id: 2,
    date: '2025-01-23',
    time: '14:43:28',
    document: 'Clinical_Protocol_XYZ_v2.1.pdf',
    action: 'Modified Suggestion',
    finding: 'Missing Study Purpose Statement',
    section: '4.8 Informed Consent',
    originalText: 'Participants will be informed about the procedures and requirements.',
    suggestedText: 'This study is a research trial designed to evaluate the efficacy and safety of XYZ compound. The purpose of this research is to determine optimal dosing and assess long-term outcomes.',
    modifiedText: 'This clinical trial is designed to evaluate the efficacy and safety of XYZ compound in patients with moderate disease. The research aims to determine optimal dosing regimens.',
    status: 'Applied',
    guideline: 'ICH E6(R2) Section 4.8.1'
  },
  {
    id: 3,
    date: '2025-01-23',
    time: '14:45:55',
    document: 'Clinical_Protocol_XYZ_v2.1.pdf',
    action: 'Provided Feedback',
    finding: 'Incomplete Adverse Event Reporting Timeline',
    section: '5.3 Safety Monitoring',
    feedbackType: 'Helpful',
    status: 'Feedback Recorded',
    guideline: 'ICH E6(R2) Section 4.11.1'
  },
  {
    id: 4,
    date: '2025-01-23',
    time: '14:48:12',
    document: 'Clinical_Protocol_XYZ_v2.1.pdf',
    action: 'Exported Report',
    reportType: 'PDF',
    findingsCount: 15,
    status: 'Completed',
    guideline: 'Multiple Guidelines'
  },
  {
    id: 5,
    date: '2025-01-22',
    time: '16:20:45',
    document: 'Informed_Consent_Form_v3.pdf',
    action: 'Accepted Suggestion',
    finding: 'Missing Voluntary Participation Statement',
    section: '2.1 Consent Elements',
    originalText: 'You are being asked to participate in this study.',
    suggestedText: 'Your participation in this study is completely voluntary. You may choose not to participate or withdraw at any time without penalty or loss of benefits.',
    status: 'Applied',
    guideline: 'ICH E6(R2) Section 4.8.1'
  },
  {
    id: 6,
    date: '2025-01-22',
    time: '11:35:22',
    document: 'Safety_Monitoring_Plan_v1.pdf',
    action: 'Rejected Suggestion',
    finding: 'Data Monitoring Committee Structure',
    section: '3.4 DMC Composition',
    reason: 'Company-specific DMC structure already approved by ethics committee',
    status: 'Rejected',
    guideline: 'ICH E6(R2) Section 5.5'
  },
  {
    id: 7,
    date: '2025-01-21',
    time: '15:10:33',
    document: 'Statistical_Analysis_Plan_v2.pdf',
    action: 'Accepted Suggestion',
    finding: 'Missing Interim Analysis Criteria',
    section: '6.2 Interim Analysis',
    originalText: 'Interim analysis will be conducted as needed.',
    suggestedText: 'Interim analysis will be conducted after 50% of subjects complete the primary endpoint assessment, using O\'Brien-Fleming alpha spending function with overall type I error maintained at 0.05.',
    status: 'Applied',
    guideline: 'ICH E9 Section 4.5'
  },
  {
    id: 8,
    date: '2025-01-21',
    time: '10:45:18',
    document: 'Investigator_Brochure_v4.pdf',
    action: 'Modified Suggestion',
    finding: 'Incomplete Pharmacokinetic Data',
    section: '5.3 Clinical Pharmacology',
    originalText: 'The compound is metabolized in the liver.',
    suggestedText: 'The compound undergoes extensive hepatic metabolism via CYP3A4 pathway, with a mean elimination half-life of 12-16 hours and linear pharmacokinetics in the dose range of 10-100mg.',
    modifiedText: 'The compound undergoes hepatic metabolism primarily via CYP3A4, with a mean elimination half-life of 14 hours in healthy volunteers.',
    status: 'Applied',
    guideline: 'ICH E3 Section 11.4'
  },
  {
    id: 9,
    date: '2025-01-20',
    time: '14:22:50',
    document: 'Clinical_Protocol_ABC_v1.pdf',
    action: 'Provided Feedback',
    finding: 'Endpoint Definition Clarity',
    section: '4.1 Primary Endpoint',
    feedbackType: 'Not Helpful',
    feedbackComment: 'Suggestion was too generic for our specific therapeutic area',
    status: 'Feedback Recorded',
    guideline: 'ICH E6(R2) Section 6.9.4'
  },
  {
    id: 10,
    date: '2025-01-20',
    time: '09:15:40',
    document: 'Clinical_Protocol_ABC_v1.pdf',
    action: 'Accepted Suggestion',
    finding: 'Missing Inclusion/Exclusion Criteria Details',
    section: '6.1 Subject Selection',
    originalText: 'Adults with the condition will be eligible.',
    suggestedText: 'Adults aged 18-65 years with confirmed diagnosis of [condition] based on [diagnostic criteria], disease duration ≥6 months, and baseline severity score ≥15 on [validated scale] will be eligible.',
    status: 'Applied',
    guideline: 'ICH E6(R2) Section 6.3'
  }
];

function HistoryView() {
  const [filterAction, setFilterAction] = useState('all');
  const [selectedItem, setSelectedItem] = useState(null);

  const actionTypes = [
    { value: 'all', label: 'All Actions' },
    { value: 'Accepted Suggestion', label: 'Accepted Suggestions' },
    { value: 'Modified Suggestion', label: 'Modified Suggestions' },
    { value: 'Rejected Suggestion', label: 'Rejected Suggestions' },
    { value: 'Provided Feedback', label: 'Feedback Provided' },
    { value: 'Exported Report', label: 'Reports Exported' }
  ];

  const filteredHistory = filterAction === 'all' 
    ? userHistory 
    : userHistory.filter(item => item.action === filterAction);

  const stats = {
    totalActions: userHistory.length,
    accepted: userHistory.filter(h => h.action === 'Accepted Suggestion').length,
    modified: userHistory.filter(h => h.action === 'Modified Suggestion').length,
    rejected: userHistory.filter(h => h.action === 'Rejected Suggestion').length,
    feedback: userHistory.filter(h => h.action === 'Provided Feedback').length
  };

  const getActionIcon = (action) => {
    switch(action) {
      case 'Accepted Suggestion':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        );
      case 'Modified Suggestion':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
          </svg>
        );
      case 'Rejected Suggestion':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        );
      case 'Provided Feedback':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
          </svg>
        );
      case 'Exported Report':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
        );
      default:
        return null;
    }
  };

  const getActionColor = (action) => {
    switch(action) {
      case 'Accepted Suggestion':
        return '#22c55e';
      case 'Modified Suggestion':
        return '#3b82f6';
      case 'Rejected Suggestion':
        return '#ef4444';
      case 'Provided Feedback':
        return '#f59e0b';
      case 'Exported Report':
        return '#8b5cf6';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="history-view">
      <div className="history-header">
        <div>
          <h2>My History</h2>
          <p>Track all your document reviews and actions</p>
        </div>
      </div>

      <div className="history-stats">
        <div className="history-stat-card">
          <div className="stat-icon" style={{background: '#dbeafe'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{stats.totalActions}</div>
            <div className="stat-label">Total Actions</div>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="stat-icon" style={{background: '#dcfce7'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{stats.accepted}</div>
            <div className="stat-label">Accepted</div>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="stat-icon" style={{background: '#dbeafe'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{stats.modified}</div>
            <div className="stat-label">Modified</div>
          </div>
        </div>

        <div className="history-stat-card">
          <div className="stat-icon" style={{background: '#fee2e2'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </div>
          <div>
            <div className="stat-value">{stats.rejected}</div>
            <div className="stat-label">Rejected</div>
          </div>
        </div>
      </div>

      <div className="history-filter">
        <select 
          className="action-filter"
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
        >
          {actionTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
        <span className="filter-count">{filteredHistory.length} items</span>
      </div>

      <div className="history-content">
        <div className="history-list">
          {filteredHistory.map(item => (
            <div 
              key={item.id} 
              className={`history-item ${selectedItem?.id === item.id ? 'selected' : ''}`}
              onClick={() => setSelectedItem(item)}
            >
              <div className="history-item-header">
                <div className="history-action-badge" style={{background: `${getActionColor(item.action)}20`, color: getActionColor(item.action)}}>
                  {getActionIcon(item.action)}
                  <span>{item.action}</span>
                </div>
                <div className="history-datetime">
                  {item.date} {item.time}
                </div>
              </div>
              <div className="history-item-content">
                <div className="history-document">{item.document}</div>
                {item.finding && <div className="history-finding">{item.finding}</div>}
                {item.section && <div className="history-section">Section: {item.section}</div>}
              </div>
            </div>
          ))}
        </div>

        <div className="history-detail">
          {selectedItem ? (
            <div className="detail-content">
              <h3>Action Details</h3>
              
              <div className="detail-row">
                <span className="detail-label">Document:</span>
                <span className="detail-value">{selectedItem.document}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Date & Time:</span>
                <span className="detail-value">{selectedItem.date} at {selectedItem.time}</span>
              </div>

              <div className="detail-row">
                <span className="detail-label">Action:</span>
                <span className="detail-value">{selectedItem.action}</span>
              </div>

              {selectedItem.finding && (
                <div className="detail-row">
                  <span className="detail-label">Finding:</span>
                  <span className="detail-value">{selectedItem.finding}</span>
                </div>
              )}

              {selectedItem.section && (
                <div className="detail-row">
                  <span className="detail-label">Section:</span>
                  <span className="detail-value">{selectedItem.section}</span>
                </div>
              )}

              {selectedItem.guideline && (
                <div className="detail-row">
                  <span className="detail-label">Guideline:</span>
                  <span className="detail-value">{selectedItem.guideline}</span>
                </div>
              )}

              {selectedItem.originalText && (
                <div className="detail-section">
                  <h4>Original Text</h4>
                  <div className="text-box original">{selectedItem.originalText}</div>
                </div>
              )}

              {selectedItem.suggestedText && (
                <div className="detail-section">
                  <h4>AI Suggested Text</h4>
                  <div className="text-box suggested">{selectedItem.suggestedText}</div>
                </div>
              )}

              {selectedItem.modifiedText && (
                <div className="detail-section">
                  <h4>Your Modified Text</h4>
                  <div className="text-box modified">{selectedItem.modifiedText}</div>
                </div>
              )}

              {selectedItem.reason && (
                <div className="detail-section">
                  <h4>Rejection Reason</h4>
                  <div className="text-box reason">{selectedItem.reason}</div>
                </div>
              )}

              {selectedItem.feedbackType && (
                <div className="detail-section">
                  <h4>Feedback</h4>
                  <div className="feedback-display">
                    <span className={`feedback-badge ${selectedItem.feedbackType.toLowerCase().replace(' ', '-')}`}>
                      {selectedItem.feedbackType}
                    </span>
                    {selectedItem.feedbackComment && (
                      <p className="feedback-comment">{selectedItem.feedbackComment}</p>
                    )}
                  </div>
                </div>
              )}

              {selectedItem.reportType && (
                <div className="detail-section">
                  <h4>Report Details</h4>
                  <div className="report-info">
                    <div>Format: {selectedItem.reportType}</div>
                    <div>Findings Included: {selectedItem.findingsCount}</div>
                  </div>
                </div>
              )}

              <div className="detail-status">
                <span className={`status-indicator ${selectedItem.status.toLowerCase().replace(' ', '-')}`}>
                  {selectedItem.status}
                </span>
              </div>
            </div>
          ) : (
            <div className="no-selection">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#d1d5db" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <polyline points="12 6 12 12 16 14"/>
              </svg>
              <h3>Select an item to view details</h3>
              <p>Click on any history item to see complete information</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default HistoryView;
