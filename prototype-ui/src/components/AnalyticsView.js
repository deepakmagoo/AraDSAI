import React from 'react';
import './AnalyticsView.css';

function AnalyticsView({ onViewChange }) {
  const adoptionData = {
    totalUsers: 47,
    activeUsers: 38,
    documentsProcessed: 324,
    avgTimeReduction: 58,
    userSatisfaction: 87,
    aiAcceptanceRate: 82
  };

  const weeklyActivity = [
    { week: 'Week 1', documents: 45, users: 28 },
    { week: 'Week 2', documents: 62, users: 32 },
    { week: 'Week 3', documents: 78, users: 35 },
    { week: 'Week 4', documents: 89, users: 38 },
    { week: 'Week 5', documents: 50, users: 36 }
  ];

  const topUsers = [
    { name: 'Dr. Priya Sharma', role: 'Regulatory Affairs Manager', documents: 42, timeSaved: '28 hrs' },
    { name: 'Rajesh Kumar', role: 'QA Lead', documents: 38, timeSaved: '24 hrs' },
    { name: 'Anita Desai', role: 'Clinical Research Coordinator', documents: 31, timeSaved: '19 hrs' },
    { name: 'Vikram Singh', role: 'Regulatory Specialist', documents: 27, timeSaved: '16 hrs' },
    { name: 'Meera Patel', role: 'Documentation Writer', documents: 24, timeSaved: '15 hrs' }
  ];

  const guidelineUsage = [
    { guideline: 'ICH E6(R2) - GCP', count: 156, percentage: 48 },
    { guideline: 'CDSCO CT Rules 2019', count: 98, percentage: 30 },
    { guideline: 'ICH E3 - Clinical Study Reports', count: 45, percentage: 14 },
    { guideline: 'FDA GCP Guidance', count: 25, percentage: 8 }
  ];

  const findingsTrends = [
    { category: 'Informed Consent Issues', count: 89, trend: '+12%' },
    { category: 'Endpoint Definition Gaps', count: 67, trend: '+8%' },
    { category: 'Safety Monitoring', count: 54, trend: '-5%' },
    { category: 'Data Management', count: 43, trend: '-3%' },
    { category: 'Study Population Criteria', count: 38, trend: '+15%' }
  ];

  return (
    <div className="analytics-view">
      <div className="analytics-header">
        <div>
          <h2>Analytics & Adoption Dashboard</h2>
          <p>Track usage, adoption metrics, and system performance</p>
        </div>
        <div className="date-range">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#6b7280" strokeWidth="2">
            <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
            <line x1="16" y1="2" x2="16" y2="6"/>
            <line x1="8" y1="2" x2="8" y2="6"/>
            <line x1="3" y1="10" x2="21" y2="10"/>
          </svg>
          <span>Last 30 Days</span>
        </div>
      </div>

      <div className="adoption-metrics">
        <div className="metric-card">
          <div className="metric-icon" style={{background: '#dbeafe'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" strokeWidth="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
            </svg>
          </div>
          <div className="metric-content">
            <div className="metric-value">{adoptionData.totalUsers}</div>
            <div className="metric-label">Total Users</div>
            <div className="metric-change positive">+12% from last month</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{background: '#dcfce7'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
              <circle cx="12" cy="12" r="10"/>
              <path d="M12 6v6l4 2"/>
            </svg>
          </div>
          <div className="metric-content">
            <div className="metric-value">{adoptionData.activeUsers}</div>
            <div className="metric-label">Active Users (30d)</div>
            <div className="metric-change positive">81% engagement rate</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{background: '#fef3c7'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
            </svg>
          </div>
          <div className="metric-content">
            <div className="metric-value">{adoptionData.documentsProcessed}</div>
            <div className="metric-label">Documents Processed</div>
            <div className="metric-change positive">+28% from last month</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{background: '#e0e7ff'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
            </svg>
          </div>
          <div className="metric-content">
            <div className="metric-value">{adoptionData.avgTimeReduction}%</div>
            <div className="metric-label">Avg Time Reduction</div>
            <div className="metric-change positive">~3.2 hrs saved per doc</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{background: '#fce7f3'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ec4899" strokeWidth="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
            </svg>
          </div>
          <div className="metric-content">
            <div className="metric-value">{adoptionData.userSatisfaction}%</div>
            <div className="metric-label">User Satisfaction</div>
            <div className="metric-change positive">Based on 156 responses</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-icon" style={{background: '#d1fae5'}}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <div className="metric-content">
            <div className="metric-value">{adoptionData.aiAcceptanceRate}%</div>
            <div className="metric-label">AI Suggestion Acceptance</div>
            <div className="metric-change positive">High trust indicator</div>
          </div>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Weekly Activity Trend</h3>
          <div className="chart-container">
            <div className="bar-chart">
              {weeklyActivity.map((week, index) => (
                <div key={index} className="bar-group">
                  <div className="bar-wrapper">
                    <div 
                      className="bar documents" 
                      style={{height: `${(week.documents / 100) * 100}%`}}
                      title={`${week.documents} documents`}
                    >
                      <span className="bar-value">{week.documents}</span>
                    </div>
                  </div>
                  <div className="bar-label">{week.week}</div>
                </div>
              ))}
            </div>
            <div className="chart-legend">
              <div className="legend-item">
                <div className="legend-color" style={{background: '#4f46e5'}}></div>
                <span>Documents Processed</span>
              </div>
            </div>
          </div>
        </div>

        <div className="analytics-card">
          <h3>Top Active Users</h3>
          <div className="users-list">
            {topUsers.map((user, index) => (
              <div key={index} className="user-item">
                <div className="user-rank">#{index + 1}</div>
                <div className="user-info">
                  <div className="user-name">{user.name}</div>
                  <div className="user-role">{user.role}</div>
                </div>
                <div className="user-stats">
                  <div className="stat-item">
                    <span className="stat-value">{user.documents}</span>
                    <span className="stat-label">docs</span>
                  </div>
                  <div className="stat-item">
                    <span className="stat-value">{user.timeSaved}</span>
                    <span className="stat-label">saved</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-card">
          <h3>Guideline Usage Distribution</h3>
          <div className="guideline-list">
            {guidelineUsage.map((item, index) => (
              <div key={index} className="guideline-item">
                <div className="guideline-info">
                  <div className="guideline-name">{item.guideline}</div>
                  <div className="guideline-count">{item.count} checks</div>
                </div>
                <div className="progress-bar-container">
                  <div 
                    className="progress-bar-fill" 
                    style={{width: `${item.percentage}%`}}
                  ></div>
                </div>
                <div className="guideline-percentage">{item.percentage}%</div>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-card">
          <h3>Common Findings Trends</h3>
          <div className="findings-list">
            {findingsTrends.map((item, index) => (
              <div key={index} className="finding-trend-item">
                <div className="finding-info">
                  <div className="finding-category">{item.category}</div>
                  <div className="finding-count">{item.count} occurrences</div>
                </div>
                <div className={`trend-badge ${item.trend.startsWith('+') ? 'up' : 'down'}`}>
                  {item.trend.startsWith('+') ? '↑' : '↓'} {item.trend}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="insights-section">
        <h3>Key Insights & Recommendations</h3>
        <div className="insights-grid">
          <div className="insight-card">
            <div className="insight-icon success">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </div>
            <div className="insight-content">
              <h4>High Adoption Rate</h4>
              <p>81% of registered users are actively using the platform. This indicates strong product-market fit.</p>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon warning">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
            </div>
            <div className="insight-content">
              <h4>Informed Consent Issues Rising</h4>
              <p>15% increase in study population criteria issues. Consider creating targeted training materials.</p>
            </div>
          </div>

          <div className="insight-card">
            <div className="insight-icon info">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
            </div>
            <div className="insight-content">
              <h4>ICH E6 Most Popular</h4>
              <p>48% of all checks use ICH E6(R2). Consider expanding GCP-related knowledge base content.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AnalyticsView;
