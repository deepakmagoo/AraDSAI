'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  ArrowLeft,
  ChevronRight,
  AlertTriangle,
  AlertCircle,
  Info,
  CheckCircle2,
  XCircle,
  ThumbsUp,
  ThumbsDown,
  Download,
  FileText,
  Loader2,
  MessageSquare,
  BookOpen,
  Sparkles,
} from 'lucide-react';
import { complianceAPI, reportsAPI } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { getSeverityConfig, getStatusConfig, formatDate } from '@/lib/utils';
import { DUMMY_FINDINGS, DUMMY_STATS, DUMMY_DOCUMENTS } from '@/lib/dummyData';
import toast from 'react-hot-toast';

// ── Risk level config for RAG results ──────────────────────────────────────
function getRiskConfig(riskLevel) {
  const configs = {
    High: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertTriangle },
    Medium: { bg: 'bg-amber-100', text: 'text-amber-700', icon: AlertCircle },
    Low: { bg: 'bg-emerald-100', text: 'text-emerald-700', icon: CheckCircle2 },
    ParsingError: { bg: 'bg-slate-100', text: 'text-slate-600', icon: Info },
    Unknown: { bg: 'bg-slate-100', text: 'text-slate-600', icon: Info },
  };
  return configs[riskLevel] || configs.Unknown;
}

function RiskBadge({ riskLevel }) {
  const cfg = getRiskConfig(riskLevel);
  const Icon = cfg.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}
    >
      <Icon size={11} strokeWidth={2.5} />
      {riskLevel} Risk
    </span>
  );
}

// ── Legacy severity badge (used for old documents) ──────────────────────────
const SEVERITY_ICONS = { critical: AlertTriangle, major: AlertCircle, minor: Info };

function SeverityBadge({ severity }) {
  const cfg = getSeverityConfig(severity);
  const Icon = SEVERITY_ICONS[severity] || Info;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cfg.bg} ${cfg.text}`}
    >
      <Icon size={11} strokeWidth={2.5} />
      {cfg.label}
    </span>
  );
}

function StatusBadge({ status }) {
  const cfg = getStatusConfig(status);
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}
    >
      {cfg.label}
    </span>
  );
}

// ── Main page ───────────────────────────────────────────────────────────────
export default function AnalysisPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const isDemo = user?.isDemo !== false;

  const [findings, setFindings] = useState([]);
  const [stats, setStats] = useState(null);
  const [document, setDocument] = useState(null);
  const [selectedFinding, setSelectedFinding] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isRagResult, setIsRagResult] = useState(false);

  // Filters
  const [riskFilter, setRiskFilter] = useState('all');       // RAG mode
  const [severityFilter, setSeverityFilter] = useState('all'); // legacy mode
  const [statusFilter, setStatusFilter] = useState('all');

  // Interaction state
  const [findingStatuses, setFindingStatuses] = useState({});
  const [feedback, setFeedback] = useState({});
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function fetchData() {
      // ── RAG result from sessionStorage ──
      if (id === 'result') {
        const stored = sessionStorage.getItem('ragAnalysisResult');
        if (stored) {
          try {
            const data = JSON.parse(stored);
            const mapped = (data.sections || []).map((sec, idx) => ({
              id: `sec-${idx}`,
              title: sec.title,
              section: sec.title,
              riskLevel: sec.riskLevel || 'Unknown',
              missingRequirements: sec.missingRequirements || [],
              finalSuggestedAnswer: sec.finalSuggestedAnswer || '',
              citations: sec.citations || [],
              status: 'pending',
            }));

            setFindings(mapped);
            setFindingStatuses(
              Object.fromEntries(mapped.map((f) => [f.id, 'pending']))
            );
            setDocument({ name: data.name, uploadDate: data.uploadDate });
            setStats({
              high: mapped.filter((f) => f.riskLevel === 'High').length,
              medium: mapped.filter((f) => f.riskLevel === 'Medium').length,
              low: mapped.filter((f) => f.riskLevel === 'Low').length,
              total: mapped.length,
            });
            setIsRagResult(true);
            setLoading(false);
            return;
          } catch {
            // fall through to legacy fetch
          }
        }
      }

      // ── Demo mode: use dummy data immediately ──
      if (isDemo) {
        setFindings(DUMMY_FINDINGS);
        setFindingStatuses(Object.fromEntries(DUMMY_FINDINGS.map((f) => [f.id, f.status])));
        setStats(DUMMY_STATS);
        const doc = DUMMY_DOCUMENTS.find((d) => d.id === id) || DUMMY_DOCUMENTS[0];
        setDocument(doc);
        setLoading(false);
        return;
      }

      // ── Admin: fetch from real API / dummy fallback ──
      try {
        const [findingsRes, statsRes] = await Promise.allSettled([
          complianceAPI.getFindings(id),
          complianceAPI.getStats(id),
        ]);
        const findingsData =
          findingsRes.status === 'fulfilled' ? findingsRes.value.data : DUMMY_FINDINGS;
        const statsData =
          statsRes.status === 'fulfilled' ? statsRes.value.data : DUMMY_STATS;

        const fd = Array.isArray(findingsData) ? findingsData : DUMMY_FINDINGS;
        setFindings(fd);
        setFindingStatuses(Object.fromEntries(fd.map((f) => [f.id, f.status])));
        setStats(statsData || DUMMY_STATS);
      } catch {
        setFindings(DUMMY_FINDINGS);
        setFindingStatuses(
          Object.fromEntries(DUMMY_FINDINGS.map((f) => [f.id, f.status]))
        );
        setStats(DUMMY_STATS);
      }

      const doc = DUMMY_DOCUMENTS.find((d) => d.id === id) || DUMMY_DOCUMENTS[0];
      setDocument(doc);
      setLoading(false);
    }

    fetchData();
  }, [id, isDemo]);

  // ── Filtered findings ───────────────────────────────────────────────────
  const filteredFindings = findings.filter((f) => {
    const status = findingStatuses[f.id] ?? f.status;
    if (statusFilter !== 'all' && status !== statusFilter) return false;
    if (isRagResult) {
      if (riskFilter !== 'all' && f.riskLevel !== riskFilter) return false;
    } else {
      if (severityFilter !== 'all' && f.severity !== severityFilter) return false;
    }
    return true;
  });

  // ── Actions ─────────────────────────────────────────────────────────────
  const handleAction = async (findingId, action) => {
    setSubmitting(true);
    if (!isRagResult) {
      try {
        await complianceAPI.updateFindingStatus(findingId, action);
      } catch {
        // demo fallback
      }
    }
    setFindingStatuses((prev) => ({ ...prev, [findingId]: action }));
    if (selectedFinding?.id === findingId) {
      setSelectedFinding((prev) => ({ ...prev, status: action }));
    }
    toast.success(`Finding ${action}`);
    setSubmitting(false);
  };

  const handleFeedback = async (type) => {
    if (!selectedFinding) return;
    setFeedback((prev) => ({ ...prev, [selectedFinding.id]: type }));
    if (!isRagResult) {
      try {
        await complianceAPI.submitFeedback(selectedFinding.id, type, comment);
      } catch {
        // demo fallback
      }
    }
    toast.success('Feedback submitted');
    setComment('');
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      await reportsAPI.export(id, 'pdf');
      toast.success('Report export queued — check your email');
    } catch {
      toast.success('Report export queued (demo mode)');
    }
    setExporting(false);
  };

  // ── Derive selected finding status ──────────────────────────────────────
  const selectedStatus = selectedFinding
    ? (findingStatuses[selectedFinding.id] ?? selectedFinding.status ?? 'pending')
    : null;

  return (
    <div className="flex flex-col h-full">
      {/* ── Top bar ── */}
      <div className="bg-white border-b border-slate-100 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2 text-sm text-slate-400 mb-1">
              <button
                onClick={() => router.push('/dashboard')}
                className="hover:text-slate-600 flex items-center gap-1 transition-colors"
              >
                <ArrowLeft size={13} /> Dashboard
              </button>
              <ChevronRight size={12} />
              <span className="text-slate-700 font-medium truncate max-w-xs">
                {document?.name || 'Document Analysis'}
              </span>
            </div>
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-slate-900">
                {document?.name || 'Analysis View'}
              </h1>
              {isRagResult && document?.uploadDate && (
                <span className="text-xs text-slate-400">
                  {formatDate(document.uploadDate)}
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isDemo && (
              <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full font-medium">
                <Sparkles size={11} /> Demo data
              </span>
            )}
            <button
              onClick={handleExport}
              disabled={exporting}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 px-4 py-2 rounded-xl transition-colors disabled:opacity-60"
            >
              {exporting ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              Export Report
            </button>
          </div>
        </div>

        {/* Stats bar */}
        {!loading && stats && (
          <div className="flex items-center gap-6 mt-4 pt-4 border-t border-slate-50">
            {isRagResult ? (
              <>
                {[
                  { label: 'High Risk', value: stats.high, color: 'text-red-600 bg-red-50' },
                  { label: 'Medium Risk', value: stats.medium, color: 'text-amber-600 bg-amber-50' },
                  { label: 'Low Risk', value: stats.low, color: 'text-emerald-600 bg-emerald-50' },
                  { label: 'Total', value: stats.total, color: 'text-slate-600 bg-slate-100' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${color}`}>
                      {value}
                    </span>
                    <span className="text-xs text-slate-500">{label}</span>
                  </div>
                ))}
              </>
            ) : (
              <>
                {[
                  { label: 'Critical', value: stats.critical, color: 'text-red-600 bg-red-50' },
                  { label: 'Major', value: stats.major, color: 'text-amber-600 bg-amber-50' },
                  { label: 'Minor', value: stats.minor, color: 'text-blue-600 bg-blue-50' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center gap-1.5">
                    <span className={`text-sm font-bold px-2.5 py-0.5 rounded-full ${color}`}>
                      {value}
                    </span>
                    <span className="text-xs text-slate-500">{label}</span>
                  </div>
                ))}
                <div className="w-px h-5 bg-slate-200" />
                {[
                  { label: 'Accepted', value: stats.accepted, color: 'text-emerald-600' },
                  { label: 'Rejected', value: stats.rejected, color: 'text-slate-500' },
                  { label: 'Pending', value: stats.pending, color: 'text-indigo-600' },
                ].map(({ label, value, color }) => (
                  <div key={label} className="flex items-center gap-1">
                    <span className={`text-sm font-bold ${color}`}>{value}</span>
                    <span className="text-xs text-slate-400">{label}</span>
                  </div>
                ))}
              </>
            )}
          </div>
        )}
      </div>

      {/* ── Main content ── */}
      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Loading analysis…</p>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex overflow-hidden">
          {/* ── Left panel — sections / findings list ── */}
          <div className="w-96 flex-shrink-0 border-r border-slate-100 bg-slate-50/50 flex flex-col overflow-hidden">
            {/* Filters */}
            <div className="p-3 border-b border-slate-100 bg-white space-y-2">
              <div className="flex gap-2">
                {isRagResult ? (
                  <select
                    value={riskFilter}
                    onChange={(e) => setRiskFilter(e.target.value)}
                    className="flex-1 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                  >
                    <option value="all">All Risk Levels</option>
                    <option value="High">High Risk</option>
                    <option value="Medium">Medium Risk</option>
                    <option value="Low">Low Risk</option>
                  </select>
                ) : (
                  <select
                    value={severityFilter}
                    onChange={(e) => setSeverityFilter(e.target.value)}
                    className="flex-1 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                  >
                    <option value="all">All Severities</option>
                    <option value="critical">Critical</option>
                    <option value="major">Major</option>
                    <option value="minor">Minor</option>
                  </select>
                )}
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="flex-1 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-300"
                >
                  <option value="all">All Statuses</option>
                  <option value="pending">Pending</option>
                  <option value="accepted">Accepted</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
              <p className="text-xs text-slate-400 px-1">
                {filteredFindings.length} section{filteredFindings.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1.5">
              {filteredFindings.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-sm text-slate-400">No sections match filters</p>
                </div>
              ) : (
                filteredFindings.map((finding) => {
                  const isSelected = selectedFinding?.id === finding.id;
                  const status = findingStatuses[finding.id] ?? finding.status;
                  return (
                    <button
                      key={finding.id}
                      onClick={() => { setSelectedFinding(finding); setComment(''); }}
                      className={`w-full text-left p-3.5 rounded-xl border transition-all ${
                        isSelected
                          ? 'border-indigo-200 bg-indigo-50 shadow-sm'
                          : 'border-slate-100 bg-white hover:border-slate-200 hover:shadow-sm'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        {isRagResult ? (
                          <RiskBadge riskLevel={finding.riskLevel} />
                        ) : (
                          <SeverityBadge severity={finding.severity} />
                        )}
                        <StatusBadge status={status} />
                      </div>
                      <p className="text-xs font-semibold text-slate-900 leading-tight mb-1">
                        {finding.title}
                      </p>
                      {isRagResult && finding.missingRequirements.length > 0 && (
                        <p className="text-xs text-slate-400">
                          {finding.missingRequirements.length} missing requirement
                          {finding.missingRequirements.length !== 1 ? 's' : ''}
                        </p>
                      )}
                      {!isRagResult && (
                        <p className="text-xs text-slate-400 truncate">{finding.section}</p>
                      )}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Right panel — detail ── */}
          <div className="flex-1 overflow-y-auto bg-white">
            {!selectedFinding ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-4">
                  <FileText size={28} className="text-slate-300" />
                </div>
                <p className="text-sm font-medium text-slate-600">Select a section to review</p>
                <p className="text-xs text-slate-400 mt-1">
                  Click any section on the left to see the full analysis and take action
                </p>
              </div>
            ) : (
              <div className="p-6 space-y-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      {isRagResult ? (
                        <RiskBadge riskLevel={selectedFinding.riskLevel} />
                      ) : (
                        <>
                          <SeverityBadge severity={selectedFinding.severity} />
                          <StatusBadge status={selectedStatus} />
                        </>
                      )}
                      {isRagResult && <StatusBadge status={selectedStatus} />}
                    </div>
                    <h2 className="text-lg font-bold text-slate-900 leading-tight">
                      {selectedFinding.title}
                    </h2>
                    {!isRagResult && (
                      <p className="text-sm text-slate-400 mt-1">{selectedFinding.section}</p>
                    )}
                  </div>
                </div>

                {/* ── RAG result detail ── */}
                {isRagResult && (
                  <>
                    {/* Missing requirements */}
                    {selectedFinding.missingRequirements.length > 0 && (
                      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                        <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                          <AlertTriangle size={12} /> Missing Requirements
                        </p>
                        <ul className="space-y-1.5 pl-4 list-disc">
                          {selectedFinding.missingRequirements.map((req, i) => (
                            <li key={i} className="text-sm text-red-900 leading-relaxed">
                              {req}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Suggested answer */}
                    {selectedFinding.finalSuggestedAnswer && (
                      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                        <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                          <CheckCircle2 size={12} /> Suggested Answer
                        </p>
                        <p className="text-sm text-emerald-900 leading-relaxed">
                          {selectedFinding.finalSuggestedAnswer}
                        </p>
                      </div>
                    )}

                    {/* Knowledge base citations */}
                    {selectedFinding.citations?.length > 0 && (
                      <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
                        <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                          <BookOpen size={12} /> Knowledge Base References
                        </p>
                        <div className="space-y-3">
                          {selectedFinding.citations.flatMap((cit, ci) =>
                            (cit.retrievedReferences || []).map((ref, ri) => (
                              <div
                                key={`${ci}-${ri}`}
                                className="bg-white border border-indigo-100 rounded-lg p-3 border-l-4 border-l-indigo-400"
                              >
                                {ref.content?.text && (
                                  <p className="text-xs text-slate-700 leading-relaxed mb-1">
                                    {ref.content.text}
                                  </p>
                                )}
                                {ref.location?.s3Location?.uri && (
                                  <p className="text-xs text-indigo-500 font-medium">
                                    {ref.location.s3Location.uri.split('/').pop()}
                                  </p>
                                )}
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* ── Legacy result detail ── */}
                {!isRagResult && (
                  <>
                    <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <FileText size={12} /> Document Text
                      </p>
                      <p className="text-sm text-amber-900 leading-relaxed">
                        {selectedFinding.document_text}
                      </p>
                    </div>

                    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
                      <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <AlertCircle size={12} /> Regulatory Requirement
                      </p>
                      <p className="text-sm text-blue-900 leading-relaxed">
                        {selectedFinding.regulatory_text}
                      </p>
                      <p className="text-xs text-blue-500 mt-2 font-medium">
                        Citation: {selectedFinding.citation}
                      </p>
                    </div>

                    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                      <p className="text-xs font-semibold text-red-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <AlertTriangle size={12} /> Gap Analysis
                      </p>
                      <p className="text-sm text-red-900 leading-relaxed">
                        {selectedFinding.gap_analysis}
                      </p>
                    </div>

                    <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
                      <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                        <CheckCircle2 size={12} /> Suggested Fix
                      </p>
                      <p className="text-sm text-emerald-900 leading-relaxed">
                        {selectedFinding.suggested_fix}
                      </p>
                    </div>
                  </>
                )}

                {/* ── Accept / Reject ── */}
                {selectedStatus === 'pending' && (
                  <div className="flex items-center gap-3 pt-2">
                    <button
                      onClick={() => handleAction(selectedFinding.id, 'accepted')}
                      disabled={submitting}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl shadow-sm transition-colors disabled:opacity-60"
                    >
                      {submitting ? (
                        <Loader2 size={14} className="animate-spin" />
                      ) : (
                        <CheckCircle2 size={15} />
                      )}
                      Accept
                    </button>
                    <button
                      onClick={() => handleAction(selectedFinding.id, 'rejected')}
                      disabled={submitting}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-semibold rounded-xl transition-colors disabled:opacity-60"
                    >
                      <XCircle size={15} /> Reject
                    </button>
                  </div>
                )}

                {selectedStatus !== 'pending' && (
                  <div
                    className={`flex items-center gap-2 px-4 py-3 rounded-xl ${
                      selectedStatus === 'accepted'
                        ? 'bg-emerald-50 border border-emerald-200'
                        : 'bg-slate-50 border border-slate-200'
                    }`}
                  >
                    {selectedStatus === 'accepted' ? (
                      <CheckCircle2 size={15} className="text-emerald-600" />
                    ) : (
                      <XCircle size={15} className="text-slate-500" />
                    )}
                    <span
                      className={`text-sm font-medium ${
                        selectedStatus === 'accepted' ? 'text-emerald-700' : 'text-slate-600'
                      }`}
                    >
                      {selectedStatus === 'accepted' ? 'Accepted' : 'Rejected'}
                    </span>
                    <button
                      onClick={() => handleAction(selectedFinding.id, 'pending')}
                      className="ml-auto text-xs text-slate-400 hover:text-slate-600"
                    >
                      Undo
                    </button>
                  </div>
                )}

                {/* ── Feedback ── */}
                <div className="border border-slate-100 rounded-xl p-4">
                  <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                    <MessageSquare size={12} /> AI Feedback
                  </p>
                  <div className="flex items-center gap-2 mb-3">
                    <p className="text-xs text-slate-500">Was this analysis helpful?</p>
                    <button
                      onClick={() => handleFeedback('positive')}
                      className={`p-1.5 rounded-lg transition-colors ${
                        feedback[selectedFinding.id] === 'positive'
                          ? 'bg-emerald-100 text-emerald-600'
                          : 'hover:bg-slate-100 text-slate-400'
                      }`}
                    >
                      <ThumbsUp size={14} />
                    </button>
                    <button
                      onClick={() => handleFeedback('negative')}
                      className={`p-1.5 rounded-lg transition-colors ${
                        feedback[selectedFinding.id] === 'negative'
                          ? 'bg-red-100 text-red-600'
                          : 'hover:bg-slate-100 text-slate-400'
                      }`}
                    >
                      <ThumbsDown size={14} />
                    </button>
                  </div>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Optional: Add a comment to help improve the AI…"
                    rows={2}
                    className="w-full text-xs border border-slate-200 rounded-lg px-3 py-2 text-slate-700 placeholder:text-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-300 resize-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
