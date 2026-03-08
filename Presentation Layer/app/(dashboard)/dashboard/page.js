'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  FileText, TrendingUp, AlertTriangle, Clock,
  Upload, ChevronRight, RefreshCw, ExternalLink,
  CheckCircle2, XCircle, Loader2, Plus, Sparkles,
  BarChart2, Shield,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { documentsAPI, analyticsAPI } from '@/services/api';
import {
  formatDate, getStatusConfig, getComplianceColor,
  getComplianceBarColor, getGreeting, timeAgo,
} from '@/lib/utils';
import { DUMMY_DOCUMENTS, DUMMY_ANALYTICS } from '@/lib/dummyData';

function StatCard({ icon: Icon, label, value, sub, color, trend, loading }) {
  const colorMap = {
    blue:   { bg: 'from-blue-500 to-blue-600',     light: 'bg-blue-50',   icon: 'text-blue-600',   ring: 'ring-blue-100'   },
    green:  { bg: 'from-emerald-500 to-teal-600',  light: 'bg-emerald-50', icon: 'text-emerald-600', ring: 'ring-emerald-100' },
    amber:  { bg: 'from-amber-500 to-orange-500',  light: 'bg-amber-50',  icon: 'text-amber-600',  ring: 'ring-amber-100'  },
    red:    { bg: 'from-red-500 to-rose-600',      light: 'bg-red-50',    icon: 'text-red-600',    ring: 'ring-red-100'    },
    purple: { bg: 'from-purple-500 to-violet-600', light: 'bg-purple-50', icon: 'text-purple-600', ring: 'ring-purple-100' },
  };
  const c = colorMap[color] || colorMap.blue;
  return (
    <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:shadow-md transition-all">
      <div className="flex items-start justify-between mb-4">
        <div className={`p-2.5 rounded-xl ${c.light} ring-1 ${c.ring}`}>
          <Icon size={20} className={c.icon} />
        </div>
        {trend != null && (
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            trend > 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
          }`}>
            {trend > 0 ? '+' : ''}{trend}%
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-slate-900">
        {loading ? <span className="inline-block w-12 h-7 bg-slate-100 rounded-lg animate-pulse" /> : value}
      </p>
      <p className="text-sm font-medium text-slate-500 mt-0.5">{label}</p>
      {sub && <p className="text-xs text-slate-400 mt-1">{sub}</p>}
    </div>
  );
}

function StatusBadge({ status }) {
  const cfg = getStatusConfig(status);
  const dotColors = { completed: 'bg-emerald-500', processing: 'bg-amber-500', uploaded: 'bg-blue-500', failed: 'bg-red-500' };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${cfg.bg} ${cfg.text}`}>
      {status === 'processing'
        ? <Loader2 size={10} className="animate-spin" />
        : <span className={`w-1.5 h-1.5 rounded-full ${dotColors[status] || 'bg-slate-400'}`} />}
      {cfg.label}
    </span>
  );
}

function GuidelinePill({ tag }) {
  const colors = {
    'ICH-E6':       'bg-indigo-50 text-indigo-700',
    'ICH-E3':       'bg-violet-50 text-violet-700',
    'CDSCO-CT':     'bg-blue-50 text-blue-700',
    'FDA-GCP':      'bg-cyan-50 text-cyan-700',
    'FDA-LABEL':    'bg-teal-50 text-teal-700',
    'RAG-Analysis': 'bg-amber-50 text-amber-700',
  };
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-md ${colors[tag] || 'bg-slate-50 text-slate-600'}`}>
      {tag}
    </span>
  );
}

export default function DashboardPage() {
  const { user }    = useAuth();
  const router      = useRouter();
  const isDemo      = user?.isDemo !== false; // default demo if not set
  const [documents, setDocuments] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (isDemo) {
      setDocuments(DUMMY_DOCUMENTS);
      setAnalytics(DUMMY_ANALYTICS);
      setLoading(false);
      return;
    }

    async function fetchData() {
      setLoading(true);
      try {
        const [docsRes, analyticsRes] = await Promise.allSettled([
          documentsAPI.list(),
          analyticsAPI.getDashboard(),
        ]);
        setDocuments(
          docsRes.status === 'fulfilled' ? (docsRes.value.data || []) : DUMMY_DOCUMENTS
        );
        setAnalytics(
          analyticsRes.status === 'fulfilled' ? (analyticsRes.value.data || DUMMY_ANALYTICS) : DUMMY_ANALYTICS
        );
      } catch {
        setDocuments(DUMMY_DOCUMENTS);
        setAnalytics(DUMMY_ANALYTICS);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [isDemo, refreshKey]);

  const stats = analytics || DUMMY_ANALYTICS;
  const statusCounts = documents.reduce((acc, d) => {
    acc[d.status] = (acc[d.status] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            {getGreeting()}, {user?.name?.split(' ')[0] || 'there'} 👋
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            {isDemo
              ? 'Demo workspace — data is for illustration purposes only.'
              : "Here's what's happening with your regulatory documents today."}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!isDemo && (
            <button onClick={() => setRefreshKey(k => k + 1)}
              className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
              <RefreshCw size={15} />
            </button>
          )}
          <Link href="/upload"
            className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-md shadow-indigo-200 transition-all">
            <Plus size={16} /> New Analysis
          </Link>
        </div>
      </div>

      {/* Demo banner */}
      {isDemo && (
        <div className="flex items-center gap-3 bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl px-4 py-3">
          <Sparkles size={16} className="text-amber-500 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">Demo Mode</span> — You&apos;re viewing sample data.{' '}
            <span className="text-amber-600">Log in as Admin to see live data from the database.</span>
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard icon={FileText}     label="Documents Analyzed"  value={loading ? '—' : documents.length || stats.total_documents}   sub="Total in workspace"          color="blue"   trend={12}  loading={loading} />
        <StatCard icon={TrendingUp}   label="Avg Compliance Score" value={loading ? '—' : `${stats.avg_compliance_score}%`}            sub="Across completed docs"       color="green"  trend={3}   loading={loading} />
        <StatCard icon={AlertTriangle} label="Critical Issues"     value={loading ? '—' : stats.critical_issues_found}                 sub="Requiring immediate action"  color="red"    trend={-8}  loading={loading} />
        <StatCard icon={Clock}        label="Hours Saved"          value={loading ? '—' : `${Math.round((documents.length || stats.total_documents) * 5.6)}h`} sub="Estimated reduction" color="purple" loading={loading} />
      </div>

      {/* Documents table */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div>
            <h2 className="text-base font-semibold text-slate-900">Recent Documents</h2>
            <p className="text-xs text-slate-400 mt-0.5">{documents.length} document{documents.length !== 1 ? 's' : ''} in workspace</p>
          </div>
          <Link href="/history"
            className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1">
            View all <ChevronRight size={13} />
          </Link>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Loading documents…</p>
          </div>
        ) : documents.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-4">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center">
              <FileText size={24} className="text-slate-300" />
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-slate-700">No documents yet</p>
              <p className="text-xs text-slate-400 mt-1">Upload your first document to get started</p>
            </div>
            <Link href="/upload"
              className="flex items-center gap-2 text-sm text-indigo-600 font-medium hover:text-indigo-700">
              <Upload size={14} /> Upload Document
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50/60">
                  {['Document', 'Uploaded', 'Score', 'Guidelines', 'Status', ''].map((h) => (
                    <th key={h} className="text-left text-xs font-semibold text-slate-400 uppercase tracking-wide px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {documents.map((doc) => (
                  <tr key={doc.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gradient-to-br from-indigo-50 to-violet-50 rounded-lg flex items-center justify-center flex-shrink-0 ring-1 ring-indigo-100">
                          <FileText size={14} className="text-indigo-600" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-slate-900 truncate max-w-[200px]">
                            {doc.name || doc.original_filename}
                          </p>
                          <p className="text-xs text-slate-400">{doc.page_count ? `${doc.page_count} pages` : 'PDF'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <p className="text-sm text-slate-600">{formatDate(doc.created_at || doc.upload_date)}</p>
                      <p className="text-xs text-slate-400">{timeAgo(doc.created_at || doc.upload_date)}</p>
                    </td>
                    <td className="px-4 py-4">
                      {doc.compliance_score != null ? (
                        <div className="flex items-center gap-2">
                          <div className="flex-1 min-w-[60px]">
                            <span className={`text-sm font-bold ${getComplianceColor(doc.compliance_score)}`}>
                              {doc.compliance_score}%
                            </span>
                            <div className="h-1.5 bg-slate-100 rounded-full w-16 mt-1">
                              <div className={`h-full rounded-full ${getComplianceBarColor(doc.compliance_score)}`}
                                style={{ width: `${doc.compliance_score}%` }} />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex flex-wrap gap-1">
                        {(doc.guidelines || []).map((g) => <GuidelinePill key={g} tag={g} />)}
                      </div>
                    </td>
                    <td className="px-4 py-4"><StatusBadge status={doc.status} /></td>
                    <td className="px-4 py-4">
                      {doc.status === 'completed' && (
                        <button onClick={() => router.push(`/analysis/${doc.id}`)}
                          className="opacity-0 group-hover:opacity-100 flex items-center gap-1 text-xs text-indigo-600 font-medium hover:text-indigo-700 transition-opacity">
                          View <ExternalLink size={11} />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bottom row */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Status breakdown */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-emerald-50 rounded-lg flex items-center justify-center">
              <BarChart2 size={15} className="text-emerald-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Document Status Breakdown</h3>
          </div>
          <div className="space-y-4">
            {[
              { label: 'Completed', key: 'completed', color: 'bg-emerald-500', text: 'text-emerald-600' },
              { label: 'Processing', key: 'processing', color: 'bg-amber-500',  text: 'text-amber-600'  },
              { label: 'Uploaded',   key: 'uploaded',   color: 'bg-blue-500',   text: 'text-blue-600'   },
              { label: 'Failed',     key: 'failed',     color: 'bg-red-400',    text: 'text-red-600'    },
            ].map(({ label, key, color, text }) => {
              const count = statusCounts[key] || 0;
              const total = documents.length || 1;
              const pct   = Math.round((count / total) * 100);
              return (
                <div key={key}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-medium text-slate-600">{label}</span>
                    <span className={`text-xs font-bold ${text}`}>{count} ({pct}%)</span>
                  </div>
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${color} transition-all duration-700`}
                      style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick actions */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
          <div className="flex items-center gap-2 mb-5">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
              <Sparkles size={15} className="text-indigo-600" />
            </div>
            <h3 className="text-sm font-semibold text-slate-900">Quick Actions</h3>
          </div>
          <div className="space-y-1.5">
            {[
              { icon: Upload,       label: 'Upload New Document',  sub: 'Analyze for regulatory compliance', href: '/upload',         color: 'bg-indigo-50 text-indigo-600' },
              { icon: FileText,     label: 'View All Findings',    sub: 'Review pending decisions',          href: `/analysis/${isDemo ? 'doc-001' : (documents[0]?.id || 'doc-001')}`, color: 'bg-amber-50 text-amber-600' },
              { icon: Shield,       label: 'Browse Audit Trail',   sub: 'Immutable compliance log',         href: '/audit',          color: 'bg-emerald-50 text-emerald-600' },
              { icon: Clock,        label: 'My Action History',    sub: 'View past decisions',               href: '/history',        color: 'bg-purple-50 text-purple-600' },
            ].map(({ icon: Icon, label, sub, href, color }) => (
              <Link key={href} href={href}
                className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors group">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${color} flex-shrink-0`}>
                  <Icon size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900">{label}</p>
                  <p className="text-xs text-slate-400">{sub}</p>
                </div>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-slate-500 transition-colors" />
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
