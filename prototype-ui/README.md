# Regulatory Compliance Co-Pilot - Prototype UI

This is a React-based prototype UI for the Regulatory Compliance Co-Pilot hackathon submission. It demonstrates the key features and user flows with dummy data.

## Features Demonstrated

### 1. Dashboard View
- Overview statistics (documents analyzed, compliance score, time saved, issues found)
- Recent documents table with compliance scores
- Quick access to document analysis

### 2. Upload View
- Drag-and-drop file upload interface
- Guideline selection (ICH E6, CDSCO, FDA, etc.)
- Processing animation with progress steps
- Simulated document analysis workflow

### 3. Analysis View
- Compliance findings organized by severity (Critical, Major, Minor)
- Detailed finding cards with:
  - Document text excerpt
  - Regulatory requirement citation
  - Gap analysis
  - AI-suggested compliant text
  - Confidence scoring
- Accept/Reject actions for findings
- **NEW: Thumbs up/down feedback buttons** for AI responses
- Export report functionality

### 4. Analytics & Adoption View
- User adoption metrics (total users, active users, adoption rate)
- Weekly activity trends with bar charts
- User satisfaction tracking (helpful vs not helpful feedback)
- AI acceptance rate visualization
- Top users by activity leaderboard
- Guideline usage distribution

### 5. Audit Trail View
- Complete chronological log of all system actions
- Searchable and filterable audit entries
- Action types: uploads, analysis, acceptances, rejections, exports
- User attribution for every action
- Document and finding linkage
- Regulatory guideline citations
- Exportable audit logs for compliance

### 6. My History View
- Personal change tracking for individual users
- Before/after text comparisons
- Modification notes for edited suggestions
- Rejection reasons tracking
- Impact assessment (high/medium/low)
- Statistics: total changes, accepted, modified, rejected
- Filterable by action type

## Installation & Running

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Steps

1. Navigate to the prototype-ui directory:
```bash
cd prototype-ui
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm start
```

4. Open your browser to `http://localhost:3000`

The app will automatically reload if you make changes to the code.

## Taking Screenshots for Hackathon Submission

### Recommended Screenshots:

1. **Dashboard View** - Shows overview and document list
   - Navigate to: `http://localhost:3000`
   - Capture: Full page

2. **Upload Interface** - Shows file upload and guideline selection
   - Click "Upload Document" button
   - Capture: Upload dropzone and guideline selection

3. **Processing Animation** - Shows AI analysis in progress
   - Upload a file and select guidelines
   - Click "Start Compliance Analysis"
   - Capture: Progress bar and processing steps

4. **Analysis Dashboard** - Shows findings overview
   - Wait for processing to complete (auto-redirects)
   - Capture: Statistics and findings list

5. **Finding Detail View** - Shows detailed compliance analysis
   - Click on any finding in the list
   - Capture: Side-by-side comparison with regulatory text

6. **Evidence & Citation** - Shows explainability
   - Scroll to show regulatory requirement section
   - Capture: Citation and suggested fix

7. **AI Feedback Buttons** - Shows user feedback mechanism
   - Scroll to bottom of finding detail
   - Capture: Thumbs up/down buttons and feedback confirmation

8. **Analytics Dashboard** - Shows adoption metrics
   - Click "Analytics" in navigation
   - Capture: User adoption stats, activity trends, satisfaction metrics

9. **Audit Trail** - Shows compliance tracking
   - Click "Audit Trail" in navigation
   - Capture: Timeline of actions with user attribution

10. **My History** - Shows personal change tracking
    - Click "My History" in navigation
    - Select a change to view details
    - Capture: Before/after comparison with modification notes

## Dummy Data

The prototype includes realistic dummy data:

- **3 sample documents** with different compliance scores
- **5 detailed findings** covering critical, major, and minor issues
- **Regulatory citations** from ICH E6(R2) and CDSCO guidelines
- **AI-generated suggestions** for compliant text
- **10 audit log entries** showing various user actions
- **7 personal history items** with before/after comparisons
- **Analytics data**: 47 users, 324 documents, 156 hours saved
- **User satisfaction metrics**: 287 helpful, 37 not helpful (89% acceptance rate)
- **Top 5 users** leaderboard with activity stats
- **Guideline usage distribution** across 4 major standards

## Customization

To modify dummy data for your demo:

- **Documents**: Edit `dummyDocuments` array in `src/components/Dashboard.js`
- **Findings**: Edit `dummyFindings` array in `src/components/AnalysisView.js`
- **Guidelines**: Edit `guidelines` array in `src/components/UploadView.js`
- **Audit Logs**: Edit `auditLogs` array in `src/components/AuditTrailView.js`
- **User History**: Edit `userHistory` array in `src/components/HistoryView.js`
- **Analytics Data**: Edit data objects in `src/components/AnalyticsView.js`

## Technology Stack

- **React 18** - UI framework
- **CSS3** - Styling with animations
- **SVG Icons** - Inline vector graphics
- **No external dependencies** - Pure React implementation

## Browser Compatibility

Tested on:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Notes for Judges

This is a **prototype UI only** - no backend integration. All data is hardcoded to demonstrate:

1. User experience and workflow
2. UI/UX design principles
3. Feature completeness
4. Explainability and transparency (citations, confidence scores)
5. Professional polish suitable for production
6. **User feedback mechanisms** (thumbs up/down for AI responses)
7. **Adoption tracking** (analytics, user satisfaction, activity trends)
8. **Audit trail** (complete action history with user attribution)
9. **Personal accountability** (individual change tracking with before/after)

The actual implementation would connect to AWS services (Bedrock, Textract, Aurora) as described in the design.md document.

## File Structure

```
prototype-ui/
├── public/
│   └── index.html
├── src/
│   ├── components/
│   │   ├── Dashboard.js
│   │   ├── Dashboard.css
│   │   ├── UploadView.js
│   │   ├── UploadView.css
│   │   ├── AnalysisView.js
│   │   ├── AnalysisView.css
│   │   ├── AnalyticsView.js
│   │   ├── AnalyticsView.css
│   │   ├── AuditTrailView.js
│   │   ├── AuditTrailView.css
│   │   ├── HistoryView.js
│   │   └── HistoryView.css
│   ├── App.js
│   ├── App.css
│   ├── index.js
│   └── index.css
├── package.json
└── README.md
```

## License

This prototype is created for hackathon submission purposes.
