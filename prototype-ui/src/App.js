import React, { useState } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import UploadView from './components/UploadView';
import AnalysisView from './components/AnalysisView';
import AnalyticsView from './components/AnalyticsView';
import AuditTrailView from './components/AuditTrailView';
import HistoryView from './components/HistoryView';

function App() {
  const [currentView, setCurrentView] = useState('dashboard'); // dashboard, upload, analysis, analytics, audit, history
  const [selectedDocument, setSelectedDocument] = useState(null);

  const handleViewChange = (view, document = null) => {
    setCurrentView(view);
    if (document) {
      setSelectedDocument(document);
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
              <rect width="32" height="32" rx="8" fill="#4F46E5"/>
              <path d="M16 8L22 12V20L16 24L10 20V12L16 8Z" stroke="white" strokeWidth="2" fill="none"/>
              <circle cx="16" cy="16" r="3" fill="white"/>
            </svg>
            <h1>Regulatory Compliance Co-Pilot</h1>
          </div>
          <nav className="nav-menu">
            <button 
              className={currentView === 'dashboard' ? 'active' : ''}
              onClick={() => handleViewChange('dashboard')}
            >
              Dashboard
            </button>
            <button 
              className={currentView === 'upload' ? 'active' : ''}
              onClick={() => handleViewChange('upload')}
            >
              Upload Document
            </button>
            <button 
              className={currentView === 'analytics' ? 'active' : ''}
              onClick={() => handleViewChange('analytics')}
            >
              Analytics
            </button>
            <button 
              className={currentView === 'audit' ? 'active' : ''}
              onClick={() => handleViewChange('audit')}
            >
              Audit Trail
            </button>
            <button 
              className={currentView === 'history' ? 'active' : ''}
              onClick={() => handleViewChange('history')}
            >
              My History
            </button>
          </nav>
        </div>
      </header>

      <main className="app-main">
        {currentView === 'dashboard' && (
          <Dashboard onViewChange={handleViewChange} selectedDocument={selectedDocument} />
        )}
        {currentView === 'upload' && (
          <UploadView onViewChange={handleViewChange} onDocumentSelect={setSelectedDocument} />
        )}
        {currentView === 'analysis' && selectedDocument && (
          <AnalysisView document={selectedDocument} onViewChange={handleViewChange} />
        )}
        {currentView === 'analytics' && (
          <AnalyticsView onViewChange={handleViewChange} />
        )}
        {currentView === 'audit' && (
          <AuditTrailView onViewChange={handleViewChange} />
        )}
        {currentView === 'history' && (
          <HistoryView onViewChange={handleViewChange} />
        )}
      </main>
    </div>
  );
}

export default App;
