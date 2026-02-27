import React from 'react';
import './Dashboard.css';
import DocumentInsights from './DocumentInsights';
import DocumentChatbot from './DocumentChatbot';

const dummyDocuments = [
  {
    id: 1,
    name: 'Clinical_Protocol_XYZ_v2.1.pdf',
    uploadDate: '2025-01-20',
    status: 'completed',
    guidelines: ['ICH E6(R2)', 'CDSCO CT Rules 2019'],
    findings: { critical: 2, major: 5, minor: 8 },
    complianceScore: 78
  },
  {
    id: 2,
    name: 'Informed_Consent_Form_ABC.pdf',
    uploadDate: '2025-01-19',
    status: 'completed',
    guidelines: ['ICH E6(R2)'],
    findings: { critical: 0, major: 2, minor: 3 },
    complianceScore: 92
  },
  {
    id: 3,
    name: 'Drug_Label_Draft_v1.0.pdf',
    uploadDate: '2025-01-18',
    status: 'completed',
    guidelines: ['FDA Labeling Guidance', 'CDSCO Labeling'],
    findings: { critical: 1, major: 3, minor: 5 },
    complianceScore: 85
  }
];

function Dashboard({ onViewChange, selectedDocument }) {
  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div>
          <h2>Document Dashboard</h2>
          <p>Review your compliance analysis history</p>
        </div>
        <button 
          className="btn-primary"
          onClick={() => onViewChange('upload')}
        >
          + Upload New Document
        </button>
      </div>

      {selectedDocument && (
        <div className="document-analysis-section">
          <div className="section-header">
            <h3>📊 Document Analysis: {selectedDocument.name}</h3>
            <button 
              className="btn-secondary"
              onClick={() => onViewChange('analysis', selectedDocument)}
            >
              View Full Compliance Report
            </button>
          </div>
          
          <div className="insights-chatbot-grid">
            <DocumentInsights document={selectedDocument} />
            <DocumentChatbot document={selectedDocument} />
          </div>
        </div>
      )}

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{background: '#dbeafe'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">24</div>
            <div className="stat-label">Documents Analyzed</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{background: '#dcfce7'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">85%</div>
            <div className="stat-label">Avg Compliance Score</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{background: '#fef3c7'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <polyline points="12 6 12 12 16 14"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">60%</div>
            <div className="stat-label">Time Saved</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{background: '#fee2e2'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          </div>
          <div className="stat-content">
            <div className="stat-value">47</div>
            <div className="stat-label">Critical Issues Found</div>
          </div>
        </div>
      </div>

      <div className="documents-section">
        <h3>Recent Documents</h3>
        <div className="documents-table">
          <div className="table-header">
            <div>Document Name</div>
            <div>Upload Date</div>
            <div>Guidelines</div>
            <div>Findings</div>
            <div>Score</div>
            <div>Actions</div>
          </div>
          {dummyDocuments.map(doc => (
            <div key={doc.id} className="table-row">
              <div className="doc-name">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                {doc.name}
              </div>
              <div>{new Date(doc.uploadDate).toLocaleDateString()}</div>
              <div className="guidelines-cell">
                {doc.guidelines.map((g, i) => (
                  <span key={i} className="guideline-tag">{g}</span>
                ))}
              </div>
              <div className="findings-cell">
                <span className="finding-badge critical">{doc.findings.critical} Critical</span>
                <span className="finding-badge major">{doc.findings.major} Major</span>
                <span className="finding-badge minor">{doc.findings.minor} Minor</span>
              </div>
              <div>
                <div className="score-badge" style={{
                  background: doc.complianceScore >= 90 ? '#dcfce7' : 
                             doc.complianceScore >= 75 ? '#fef3c7' : '#fee2e2',
                  color: doc.complianceScore >= 90 ? '#166534' : 
                         doc.complianceScore >= 75 ? '#92400e' : '#991b1b'
                }}>
                  {doc.complianceScore}%
                </div>
              </div>
              <div>
                <button 
                  className="btn-secondary"
                  onClick={() => onViewChange('analysis', doc)}
                >
                  View Report
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
