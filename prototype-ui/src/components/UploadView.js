import React, { useState } from 'react';
import './UploadView.css';

function UploadView({ onViewChange, onDocumentSelect }) {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedGuidelines, setSelectedGuidelines] = useState(['ICH-E6']);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const guidelines = [
    { id: 'ICH-E6', name: 'ICH E6(R2) - Good Clinical Practice' },
    { id: 'ICH-E3', name: 'ICH E3 - Clinical Study Reports' },
    { id: 'CDSCO-CT', name: 'CDSCO Clinical Trials Rules 2019' },
    { id: 'FDA-GCP', name: 'FDA GCP Guidance' },
    { id: 'FDA-LABEL', name: 'FDA Labeling Guidance' }
  ];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const toggleGuideline = (id) => {
    setSelectedGuidelines(prev => 
      prev.includes(id) 
        ? prev.filter(g => g !== id)
        : [...prev, id]
    );
  };

  const handleAnalyze = () => {
    setProcessing(true);
    setProgress(0);

    // Simulate processing
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            const dummyDoc = {
              id: Date.now(),
              name: selectedFile.name,
              uploadDate: new Date().toISOString().split('T')[0],
              status: 'completed',
              guidelines: selectedGuidelines.map(id => 
                guidelines.find(g => g.id === id).name
              ),
              findings: { critical: 2, major: 5, minor: 8 },
              complianceScore: 78
            };
            // Set the document for insights and chatbot
            if (onDocumentSelect) {
              onDocumentSelect(dummyDoc);
            }
            // Navigate to dashboard to show insights
            onViewChange('dashboard', dummyDoc);
          }, 500);
          return 100;
        }
        return prev + 10;
      });
    }, 300);
  };

  return (
    <div className="upload-view">
      <div className="upload-header">
        <button className="back-btn" onClick={() => onViewChange('dashboard')}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="15 18 9 12 15 6"/>
          </svg>
          Back to Dashboard
        </button>
        <h2>Upload Document for Compliance Analysis</h2>
        <p>Upload your regulatory document and select applicable guidelines</p>
      </div>

      <div className="upload-container">
        <div className="upload-section">
          <h3>1. Upload Document</h3>
          
          {!selectedFile ? (
            <div 
              className={`upload-dropzone ${dragActive ? 'active' : ''}`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                <polyline points="17 8 12 3 7 8"/>
                <line x1="12" y1="3" x2="12" y2="15"/>
              </svg>
              <h4>Drag and drop your document here</h4>
              <p>or</p>
              <label className="file-input-label">
                Browse Files
                <input 
                  type="file" 
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileSelect}
                  style={{display: 'none'}}
                />
              </label>
              <p className="file-hint">Supported formats: PDF, DOC, DOCX (Max 50MB)</p>
            </div>
          ) : (
            <div className="file-selected">
              <div className="file-info">
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#4f46e5" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
                <div>
                  <h4>{selectedFile.name}</h4>
                  <p>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                </div>
              </div>
              <button 
                className="remove-file-btn"
                onClick={() => setSelectedFile(null)}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>
          )}
        </div>

        <div className="guidelines-section">
          <h3>2. Select Regulatory Guidelines</h3>
          <p className="section-description">Choose which standards to check your document against</p>
          
          <div className="guidelines-grid">
            {guidelines.map(guideline => (
              <div 
                key={guideline.id}
                className={`guideline-card ${selectedGuidelines.includes(guideline.id) ? 'selected' : ''}`}
                onClick={() => toggleGuideline(guideline.id)}
              >
                <div className="guideline-checkbox">
                  {selectedGuidelines.includes(guideline.id) && (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                      <polyline points="20 6 9 17 4 12"/>
                    </svg>
                  )}
                </div>
                <div className="guideline-info">
                  <h4>{guideline.name}</h4>
                </div>
              </div>
            ))}
          </div>
        </div>

        {!processing ? (
          <button 
            className="analyze-btn"
            disabled={!selectedFile || selectedGuidelines.length === 0}
            onClick={handleAnalyze}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
            Start Compliance Analysis
          </button>
        ) : (
          <div className="processing-section">
            <div className="processing-header">
              <div className="spinner"></div>
              <div>
                <h4>Analyzing Document...</h4>
                <p>This may take a few moments</p>
              </div>
            </div>
            <div className="progress-bar">
              <div className="progress-fill" style={{width: `${progress}%`}}></div>
            </div>
            <div className="progress-steps">
              <div className={`step ${progress >= 20 ? 'completed' : ''}`}>
                <div className="step-icon">✓</div>
                <span>Extracting text</span>
              </div>
              <div className={`step ${progress >= 40 ? 'completed' : ''}`}>
                <div className="step-icon">✓</div>
                <span>Identifying sections</span>
              </div>
              <div className={`step ${progress >= 60 ? 'completed' : ''}`}>
                <div className="step-icon">✓</div>
                <span>Matching guidelines</span>
              </div>
              <div className={`step ${progress >= 80 ? 'completed' : ''}`}>
                <div className="step-icon">✓</div>
                <span>Generating findings</span>
              </div>
              <div className={`step ${progress >= 100 ? 'completed' : ''}`}>
                <div className="step-icon">✓</div>
                <span>Creating report</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default UploadView;
