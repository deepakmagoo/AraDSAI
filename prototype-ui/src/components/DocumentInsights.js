import React, { useState } from 'react';
import './DocumentInsights.css';

// Dummy data for word cloud
const wordCloudData = [
  { text: 'Clinical Trial', size: 48, frequency: 45 },
  { text: 'Informed Consent', size: 42, frequency: 38 },
  { text: 'Safety Monitoring', size: 38, frequency: 32 },
  { text: 'Adverse Events', size: 36, frequency: 28 },
  { text: 'Protocol', size: 34, frequency: 25 },
  { text: 'Endpoints', size: 32, frequency: 22 },
  { text: 'ICH Guidelines', size: 30, frequency: 20 },
  { text: 'Regulatory', size: 28, frequency: 18 },
  { text: 'Compliance', size: 26, frequency: 16 },
  { text: 'Documentation', size: 24, frequency: 14 },
  { text: 'Study Design', size: 22, frequency: 12 },
  { text: 'Data Management', size: 20, frequency: 10 },
  { text: 'Quality Assurance', size: 18, frequency: 8 },
  { text: 'Ethics Committee', size: 16, frequency: 6 },
  { text: 'Investigator', size: 14, frequency: 5 }
];

// Dummy data for knowledge graph
const knowledgeGraphData = {
  nodes: [
    { id: 1, label: 'Clinical Protocol', type: 'document', x: 400, y: 300 },
    { id: 2, label: 'ICH E6(R2)', type: 'guideline', x: 200, y: 150 },
    { id: 3, label: 'Informed Consent', type: 'section', x: 300, y: 450 },
    { id: 4, label: 'Safety Monitoring', type: 'section', x: 600, y: 200 },
    { id: 5, label: 'Study Endpoints', type: 'section', x: 500, y: 450 },
    { id: 6, label: 'CDSCO Rules', type: 'guideline', x: 600, y: 400 },
    { id: 7, label: 'Adverse Events', type: 'concept', x: 700, y: 300 }
  ],
  edges: [
    { from: 1, to: 2, label: 'complies with' },
    { from: 1, to: 3, label: 'contains' },
    { from: 1, to: 4, label: 'contains' },
    { from: 1, to: 5, label: 'contains' },
    { from: 4, to: 7, label: 'monitors' },
    { from: 4, to: 6, label: 'references' },
    { from: 3, to: 2, label: 'follows' }
  ]
};

function DocumentInsights({ document }) {
  const [activeTab, setActiveTab] = useState('wordcloud');

  return (
    <div className="document-insights">
      <div className="insights-header">
        <h3>Document Insights</h3>
        <div className="insights-tabs">
          <button 
            className={activeTab === 'wordcloud' ? 'active' : ''}
            onClick={() => setActiveTab('wordcloud')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
            </svg>
            Word Cloud
          </button>
          <button 
            className={activeTab === 'knowledge' ? 'active' : ''}
            onClick={() => setActiveTab('knowledge')}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="3"/>
              <circle cx="12" cy="5" r="2"/>
              <circle cx="19" cy="12" r="2"/>
              <circle cx="12" cy="19" r="2"/>
              <circle cx="5" cy="12" r="2"/>
              <line x1="12" y1="8" x2="12" y2="9"/>
              <line x1="15" y1="12" x2="17" y2="12"/>
              <line x1="12" y1="15" x2="12" y2="17"/>
              <line x1="7" y1="12" x2="9" y2="12"/>
            </svg>
            Knowledge Graph
          </button>
        </div>
      </div>

      <div className="insights-content">
        {activeTab === 'wordcloud' && (
          <div className="wordcloud-container">
            <div className="wordcloud-info">
              <p>Most frequent terms extracted from your document</p>
            </div>
            <div className="wordcloud">
              {wordCloudData.map((word, index) => (
                <span
                  key={index}
                  className="word-item"
                  style={{
                    fontSize: `${word.size}px`,
                    color: `hsl(${(index * 30) % 360}, 70%, 50%)`,
                    opacity: 0.7 + (word.frequency / 100)
                  }}
                  title={`Frequency: ${word.frequency}`}
                >
                  {word.text}
                </span>
              ))}
            </div>
            <div className="wordcloud-legend">
              <span>Size indicates frequency of occurrence in document</span>
            </div>
          </div>
        )}

        {activeTab === 'knowledge' && (
          <div className="knowledge-graph-container">
            <div className="knowledge-info">
              <p>Relationship map of key concepts and regulatory references</p>
            </div>
            <svg className="knowledge-graph" viewBox="0 0 800 600">
              {/* Draw edges first */}
              {knowledgeGraphData.edges.map((edge, index) => {
                const fromNode = knowledgeGraphData.nodes.find(n => n.id === edge.from);
                const toNode = knowledgeGraphData.nodes.find(n => n.id === edge.to);
                return (
                  <g key={`edge-${index}`}>
                    <line
                      x1={fromNode.x}
                      y1={fromNode.y}
                      x2={toNode.x}
                      y2={toNode.y}
                      stroke="#cbd5e1"
                      strokeWidth="2"
                      markerEnd="url(#arrowhead)"
                    />
                    <text
                      x={(fromNode.x + toNode.x) / 2}
                      y={(fromNode.y + toNode.y) / 2}
                      fill="#64748b"
                      fontSize="11"
                      textAnchor="middle"
                    >
                      {edge.label}
                    </text>
                  </g>
                );
              })}
              
              {/* Arrow marker definition */}
              <defs>
                <marker
                  id="arrowhead"
                  markerWidth="10"
                  markerHeight="10"
                  refX="9"
                  refY="3"
                  orient="auto"
                >
                  <polygon points="0 0, 10 3, 0 6" fill="#cbd5e1" />
                </marker>
              </defs>

              {/* Draw nodes */}
              {knowledgeGraphData.nodes.map((node) => {
                const colors = {
                  document: '#4f46e5',
                  guideline: '#22c55e',
                  section: '#3b82f6',
                  concept: '#f59e0b'
                };
                return (
                  <g key={node.id}>
                    <circle
                      cx={node.x}
                      cy={node.y}
                      r="40"
                      fill={colors[node.type]}
                      opacity="0.9"
                    />
                    <text
                      x={node.x}
                      y={node.y + 5}
                      fill="white"
                      fontSize="12"
                      fontWeight="600"
                      textAnchor="middle"
                    >
                      {node.label.split(' ').map((word, i) => (
                        <tspan key={i} x={node.x} dy={i === 0 ? 0 : 14}>
                          {word}
                        </tspan>
                      ))}
                    </text>
                  </g>
                );
              })}
            </svg>
            <div className="knowledge-legend">
              <div className="legend-item">
                <span className="legend-color" style={{background: '#4f46e5'}}></span>
                Document
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{background: '#22c55e'}}></span>
                Guideline
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{background: '#3b82f6'}}></span>
                Section
              </div>
              <div className="legend-item">
                <span className="legend-color" style={{background: '#f59e0b'}}></span>
                Concept
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default DocumentInsights;
