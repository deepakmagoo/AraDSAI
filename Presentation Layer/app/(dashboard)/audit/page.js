'use client';

import { useState, useEffect } from 'react';
import {
  ShieldCheck, Upload, BarChart2, CheckCircle2, XCircle,
  Download, LogIn, Search, Globe, Clock, ChevronDown,
  ChevronUp, Lock, Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { auditAPI } from '@/services/api';
import { formatDateTime, timeAgo } from '@/lib/utils';
import { DUMMY_AUDIT_LOGS } from '@/lib/dummyData';

const ACTION_CONFIG = {
  document_upload:  { icon: Upload,       bg: 'bg-blue-500',    ring: 'ring-blue-100',    badge: 'bg-blue-100 text-blue-700',      label: 'Document Uploaded'  },
  analysis_started: { icon: BarChart2,    bg: 'bg-amber-500',   ring: 'ring-amber-100',   badge: 'bg-amber-100 text-amber-700',    label: 'Analysis Started'   },
  finding_accepted: { icon: CheckCircle2, bg: 'bg-emerald-500', ring: 'ring-emerald-100', badge: 'bg-emerald-100 text-emerald-700', label: 'Finding Accepted'   },
  finding_rejected: { icon: XCircle,      bg: 'bg-slate-500',   ring: 'ring-slate-100',   badge: 'bg-slate-100 text-slate-600',    label: 'Finding Rejected'   },
  report_exported:  { icon: Download,     bg: 'bg-purple-500',  ring: 'ring-purple-100',  badge: 'bg-purple-100 text-purple-700',  label: 'Report Exported'    },
  user_login:       { icon: LogIn,        bg: 'bg-indigo-500',  ring: 'ring-indigo-100',  badge: 'bg-indigo-100 text-indigo-700',  label: 'User Login'         },
};

function AuditEntry({ log }) {
  const [expanded, setExpanded] = useState(false);
  const cfg  = ACTION_CONFIG[log.action] || ACTION_CONFIG.user_login;
  const Icon = cfg.icon;

  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center flex-shrink-0">
        <div className={`w-9 h-9 rounded-full ${cfg.bg} ring-4 ${cfg.ring} flex items-center justify-center flex-shrink-0 z-10`}>
          <Icon size={14} className="text-white" />
        </div>
        <div className="flex-1 w-0.5 bg-slate-100 mt-1" />
      </div>
      <div className="flex-1 pb-6 min-w-0">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
          <div className="px-4 py-3">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                  <span className="flex items-center gap-1 text-xs text-slate-400">
                    <Clock size={10} /> {timeAgo(log.timestamp)}
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-900">{log.user}</p>
                {log.details?.document && (
                  <p className="text-xs text-slate-500 truncate mt-0.5">{log.details.document}</p>
                )}
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${log.status === 'success' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {log.status}
                </span>
                <button onClick={() => setExpanded(!expanded)}
                  className="p-1 text-slate-400 hover:text-slate-600 transition-colors">
                  {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>
            </div>
            <div className="flex items-center gap-4 mt-2 flex-wrap">
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <Globe size={11} /> {log.ip_address}
              </span>
              <span className="flex items-center gap-1.5 text-xs text-slate-400">
                <Clock size={11} /> {formatDateTime(log.timestamp)}
              </span>
            </div>
          </div>
          {expanded && log.details && (
            <div className="border-t border-slate-50 px-4 py-3 bg-gradient-to-br from-slate-50/80 to-white">
              <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wide">Event Details</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(log.details).map(([key, value]) => (
                  <div key={key}>
                    <p className="text-xs text-slate-400 capitalize">{key.replace(/_/g, ' ')}</p>
                    <p className="text-xs font-medium text-slate-700">
                      {Array.isArray(value) ? value.join(', ') : String(value)}
                    </p>
                  </div>
                ))}
              </div>
              <p className="text-xs text-slate-300 mt-2 font-mono">ID: {log.id}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AuditPage() {
  const { user } = useAuth();
  const isDemo   = user?.isDemo !== false;

  const [logs,         setLogs]         = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [search,       setSearch]       = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  useEffect(() => {
    if (isDemo) {
      setLogs(DUMMY_AUDIT_LOGS);
      setLoading(false);
      return;
    }
    async function fetchAudit() {
      try {
        const res  = await auditAPI.getTrail();
        const data = res.data?.logs || res.data;
        setLogs(Array.isArray(data) ? data : DUMMY_AUDIT_LOGS);
      } catch {
        setLogs(DUMMY_AUDIT_LOGS);
      } finally {
        setLoading(false);
      }
    }
    fetchAudit();
  }, [isDemo]);

  const filtered = logs.filter((log) => {
    if (actionFilter !== 'all' && log.action !== actionFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!log.user?.toLowerCase().includes(q) &&
          !log.details?.document?.toLowerCase().includes(q) &&
          !log.action?.toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const uniqueUsers  = [...new Set(logs.map((l) => l.user))].length;
  const successRate  = logs.length > 0
    ? Math.round((logs.filter((l) => l.status === 'success').length / logs.length) * 100)
    : 100;

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Audit Trail</h1>
          <p className="text-sm text-slate-500 mt-1">
            Immutable log of all system actions for compliance and regulatory purposes.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDemo && (
            <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full font-medium">
              <Sparkles size={11} /> Demo data
            </span>
          )}
          <div className="flex items-center gap-1.5 text-xs text-emerald-600 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full font-medium">
            <Lock size={11} /> Tamper-proof · 7-year retention
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Events',     value: logs.length,                                          color: 'text-slate-700',  bg: 'bg-slate-50 border-slate-200'   },
          { label: 'Unique Users',     value: uniqueUsers,                                          color: 'text-indigo-700', bg: 'bg-indigo-50 border-indigo-200' },
          { label: 'Document Events',  value: logs.filter((l) => l.resource_type === 'document').length, color: 'text-blue-700',   bg: 'bg-blue-50 border-blue-200'   },
          { label: 'Success Rate',     value: `${successRate}%`,                                    color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className={`${bg} rounded-2xl p-4 border-2`}>
            <p className={`text-2xl font-bold ${color}`}>{loading ? '—' : value}</p>
            <p className={`text-xs font-medium mt-0.5 ${color} opacity-70`}>{label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input type="text" placeholder="Search by user, document, or action…" value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-white shadow-sm" />
        </div>
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
          className="text-sm border border-slate-200 rounded-xl px-4 py-2.5 bg-white text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-300 shadow-sm">
          <option value="all">All Actions</option>
          <option value="document_upload">Document Uploads</option>
          <option value="analysis_started">Analysis Started</option>
          <option value="finding_accepted">Findings Accepted</option>
          <option value="finding_rejected">Findings Rejected</option>
          <option value="report_exported">Reports Exported</option>
          <option value="user_login">User Logins</option>
        </select>
      </div>

      {/* Timeline */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <div className="w-8 h-8 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
          <p className="text-sm text-slate-400">Loading audit trail…</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 gap-3">
          <ShieldCheck size={28} className="text-slate-200" />
          <p className="text-sm text-slate-400">No events match your filters</p>
        </div>
      ) : (
        <div className="space-y-0">
          {filtered.map((log) => <AuditEntry key={log.id} log={log} />)}
          <div className="flex items-center gap-3 pl-4 pt-2">
            <div className="w-9 flex justify-center"><div className="w-2.5 h-2.5 rounded-full bg-slate-200" /></div>
            <p className="text-xs text-slate-300 font-medium">End of audit trail</p>
          </div>
        </div>
      )}
    </div>
  );
}
