import React, { useState } from 'react';
import './AuditTrailView.css';

const auditLogs = [
  {
    id: 1,
    timestamp: '2025-01-23 14:35:22',
    user: 'Dr. Priya Sharma',
    action: 'DOCUMENT_UPLOADED',
    document: 'Clinical_Protocol_XYZ_v2.1.pdf',
    details: 'Document uploaded for compliance analysis',
    ipAddress: '192.168.1.45',
    status: 'success'
  },
  {
    id: 2,
    timestamp: '2025-01-23 14:36:15',
    user: 'System',
    action: 'ANALYSIS_STARTED',
    document: 'Clinical_Protocol_XYZ_v2.1.pdf',
    details: 'Automated compliance analysis initiated against ICH E6(R2), CDSCO CT Rules 2019',
    ipAddress: 'N/A',
    status: 'success'
  },
  {
    id: 3,
    timestamp: '2025-01-23 14:38:47',
    user: 'System',
    action: 'ANALYSIS_COMPLETED',
    document: 'Clinical_Protocol_XYZ_v2.1.pdf',
    details: 'Analysis completed. Found 2 critical, 5 major, 8 minor issues',
    ipAddress: 'N/A',
    status: 'success'
  },
  {
    id: 4,
    timestamp: '2025-01-23 14:42:10',
    user: 'Dr. Priya Sharma',
    action: 'FINDING_ACCEPTED',
    document: 'Clinical_Protocol_XYZ_v2.1.pdf',
    details: 'Accepted AI suggestion for Finding #1: Primary Endpoint Not Explicitly Defined',
    ipAddress: '192.168.1.45',
    status: 'success'
  },
  {
    id: 5,
    timestamp: '2025-01-23 14:43:28',
    user: 'Dr. Priya Sharma',
    action: 'FINDING_MODIFIED',
    document: 'Clinical_Protocol_XYZ_v2.1.pdf',
    details: 'Modified AI suggestion for Finding #2: Missing Study Purpose Statement',
    ipAddress: '192.168.1.45',
    status: 'success'
  },
  {
    id: 6,
    timestamp: '2025-01-23 14:45:55',
    user: 'Dr. Priya Sharma',
    action: 'FEEDBACK_PROVIDED',
    document: 'Clinical_Protocol_XYZ_v2.1.pdf',
    details: 'Provided positive feedback (thumbs up) for Finding #3',
    ipAddress: '192.168.1.45',
    status: 'success'
  },
  {
    id: 7,
    timestamp: '2025-01-23 14:48:12',
    user: 'Dr. Priya Sharma',
    action: 'REPORT_EXPORTED',
    document: 'Clinical_Protocol_XYZ_v2.1.pdf',
    details: 'Exported compliance report (PDF format) with 15 findings and audit trail',
    ipAddress: '192.168.1.45',
    status: 'success'
  },
  {
    id: 8,
    timestamp: '2025-01-23 11:22:45',
    user: 'Rajesh Kumar',
    action: 'DOCUMENT_UPLOADED',
    document: 'Informed_Consent_Form_ABC.pdf',
    details: 'Document uploaded for compliance analysis',
    ipAddress: '192.168.1.67',
    status: 'success'
  },
  {
    id: 9,
    timestamp: '2025-01-23 11:23:30',
    user: 'System',
    action: 'ANALYSIS_STARTED',
    document: 'Informed_Consent_Form_ABC.pdf',
    details: 'Automated compliance analysis initiated against ICH E6(R2)',
    ipAddress: 'N/A',
    status: 'success'
  },
  {
    id: 10,
    timestamp: '2025-01-23 11:24:52',
    user: 'System',
    action: 'ANALYSIS_COMPLETED',
    document: 'Informed_Consent_Form_ABC.pdf',
    details: 'Analysis completed. Found 0 critical, 2 major, 3 minor issues',
    ipAddress: 'N/A',
    status: 'success'
  },
  {
    id: 11,
    timestamp: '2025-01-23 09:15:33',
    user: 'Anita Desai',
    action: 'LOGIN',
    document: 'N/A',
    details: 'User logged in successfully',
    ipAddress: '192.168.1.89',
    status: 'success'
  },
  {
    id: 12,
    timestamp: '2025-01-22 16:45:20',
    user: 'Admin',
    action: 'GUIDELINE_UPDATED',
    document: 'N/A',
    details: 'Updated ICH E6(R2) guideline knowledge base with latest amendments',
    ipAddress: '192.168.1.10',
    status: 'success'
  },
  {
    id: 13,
    timestamp: '2025-01-22 14:30:15',
    user: 'Vikram Singh',
    action: 'FINDING_REJECTED',
    document: 'Drug_Label_Draft_v1.0.pdf',
    details: 'Rejected AI suggestion for Finding #4: Inclusion Criteria Lacks Specificity',
    ipAddress: '192.168.1.52',
    status: 'success'
  },
  {
    id: 14,
    timestamp: '2025-01-22 10:12:08',
    user: 'System',
    action: 'BACKUP_COMPLETED',
    document: 'N/A',
    details: 'Automated daily backup of audit logs and user data completed successfully',
    ipAddress: 'N/A',
    status: 'success'
  },
  {
    id: 15,
    timestamp: '2025-01-21 15:55:42',
    user: 'Meera Patel',
    action: 'BATCH_UPLOAD',
    document: 'submission_package.zip',
    details: 'Batch upload initiated: 8 documents for compliance analysis',
    ipAddress: '192.168.1.73',
    status: 'success'
  }
];

function AuditTrailView() {
  const [filterAction, setFilterAction] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const actionTypes = [
    { value: 'all', label: 'All Actions' },
    { value: 'DOCUMENT_UPLOADED', label: 'Document Uploads' },
    { value: 'ANALYSIS_COMPLETED', label: 'Analysis Completed' },
    { value: 'FINDING_ACCEPTED', label: 'Findings Accepted' },
    { value: 'FINDING_REJECTED', label: 'Findings Rejected' },
    { value: 'REPORT_EXPORTED', label: 'Reports Exported' },
    { value: 'LOGIN', label: 'User Logins' }
  ];

  const filteredLogs = auditLogs.filter(log => {
    const matchesAction = filterAction === 'all' || log.action === filterAction;
    const matchesSearch = searchTerm === '' || 
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.document.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.details.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesAction && matchesSearch;
  });

  const getActionIcon = (action) => {
    switch(action) {
      case 'DOCUMENT_UPLOADED':
      case 'BATCH_UPLOAD':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="17 8 12 3 7 8"/>
            <line x1="12" y1="3" x2="12" y2="15"/>
          </svg>
        );
      case 'ANALYSIS_STARTED':
      case 'ANALYSIS_COMPLETED':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
          </svg>
        );
      case 'FINDING_ACCEPTED':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        );
      case 'FINDING_REJECTED':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <line x1="18" y1="6" x2="6" y2="18"/>
            <line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        );
      case 'REPORT_EXPORTED':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
            <polyline points="14 2 14 8 20 8"/>
          </svg>
        );
      case 'LOGIN':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
            <polyline points="10 17 15 12 10 7"/>
            <line x1="15" y1="12" x2="3" y2="12"/>
          </svg>
        );
      default:
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        );
    }
  };

  const getActionColor = (action) => {
    switch(action) {
      case 'FINDING_ACCEPTED':
      case 'ANALYSIS_COMPLETED':
      case 'BACKUP_COMPLETED':
        return '#22c55e';
      case 'FINDING_REJECTED':
        return '#ef4444';
      case 'DOCUMENT_UPLOADED':
      case 'BATCH_UPLOAD':
        return '#3b82f6';
      case 'ANALYSIS_STARTED':
        return '#f59e0b';
      case 'REPORT_EXPORTED':
        return '#8b5cf6';
      case 'LOGIN':
        return '#6b7280';
      default:
        return '#6b7280';
    }
  };

  return (
    <div className="audit-trail-view">
      <div className="audit-header">
        <div>
          <h2>Audit Trail</h2>
          <p>Complete history of all system activities and user actions</p>
        </div>
        <button className="export-audit-btn">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Export Audit Log
        </button>
      </div>

      <div className="audit-filters">
        <div className="search-box">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input 
            type="text" 
            placeholder="Search by user, document, or details..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <select 
          className="action-filter"
          value={filterAction}
          onChange={(e) => setFilterAction(e.target.value)}
        >
          {actionTypes.map(type => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
      </div>

      <div className="audit-stats">
        <div className="stat-box">
          <div className="stat-number">{auditLogs.length}</div>
          <div className="stat-label">Total Events</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{new Set(auditLogs.map(l => l.user)).size}</div>
          <div className="stat-label">Unique Users</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">{auditLogs.filter(l => l.action.includes('DOCUMENT')).length}</div>
          <div className="stat-label">Document Actions</div>
        </div>
        <div className="stat-box">
          <div className="stat-number">100%</div>
          <div className="stat-label">Success Rate</div>
        </div>
      </div>

      <div className="audit-timeline">
        <div className="timeline-header">
          <h3>Activity Timeline ({filteredLogs.length} events)</h3>
        </div>

        <div className="timeline-list">
          {filteredLogs.map((log, index) => (
            <div key={log.id} className="timeline-item">
              <div className="timeline-marker" style={{background: getActionColor(log.action)}}>
                {getActionIcon(log.action)}
              </div>
              <div className="timeline-content">
                <div className="timeline-header-row">
                  <div className="timeline-action">
                    <span className="action-badge" style={{background: `${getActionColor(log.action)}20`, color: getActionColor(log.action)}}>
                      {log.action.replace(/_/g, ' ')}
                    </span>
                    <span className="timeline-user">{log.user}</span>
                  </div>
                  <div className="timeline-timestamp">{log.timestamp}</div>
                </div>
                <div className="timeline-details">
                  {log.document !== 'N/A' && (
                    <div className="timeline-document">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                      </svg>
                      {log.document}
                    </div>
                  )}
                  <p className="timeline-description">{log.details}</p>
                  <div className="timeline-meta">
                    <span className="meta-item">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <line x1="2" y1="12" x2="22" y2="12"/>
                        <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
                      </svg>
                      IP: {log.ipAddress}
                    </span>
                    <span className={`status-badge ${log.status}`}>
                      {log.status === 'success' ? '✓' : '✗'} {log.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="audit-info">
        <div className="info-icon">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        </div>
        <div className="info-content">
          <h4>Audit Trail Information</h4>
          <p>All activities are logged with timestamps, user information, and IP addresses for complete traceability. Logs are immutable and retained for 7 years to meet regulatory compliance requirements. Audit logs can be exported for regulatory submissions and external audits.</p>
        </div>
      </div>
    </div>
  );
}

export default AuditTrailView;
