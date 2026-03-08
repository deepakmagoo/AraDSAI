'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  History, CheckCircle2, XCircle, Upload, BarChart2,
  Download, Search, FileText, Calendar, ChevronRight, Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { historyAPI } from '@/services/api';
import { timeAgo, formatDateTime } from '@/lib/utils';
import { DUMMY_HISTORY } from '@/lib/dummyData';

const ACTION_CONFIG = {
  accepted: { icon: CheckCircle2, bg: 'bg-emerald-50', iconColor: 'text-emerald-600', badge: 'bg-emerald-100 text-emerald-700', label: 'Accepted'  },
  rejected: { icon: XCircle,      bg: 'bg-slate-50',   iconColor: 'text-slate-500',   badge: 'bg-slate-100 text-slate-600',   label: 'Rejected'  },
  uploaded: { icon: Upload,       bg: 'bg-blue-50',    iconColor: 'text-blue-600',    badge: 'bg-blue-100 text-blue-700',    label: 'Uploaded'  },
  analyzed: { icon: BarChart2,    bg: 'bg-indigo-50',  iconColor: 'text-indigo-600',  badge: 'bg-indigo-100 text-indigo-700', label: 'Analyzed'  },
  exported: { icon: Download,     bg: 'bg-purple-50',  iconColor: 'text-purple-600',  badge: 'bg-purple-100 text-purple-700', label: 'Exported'  },
  login:    { icon: FileText,     bg: 'bg-slate-50',   iconColor: 'text-slate-500',   badge: 'bg-slate-100 text-slate-600',   label: 'Login'     },
};

export default function HistoryPage() {
  const router   = useRouter();
  const { user } = useAuth();
  const isDemo   = user?.isDemo !== false;

  const [items,   setItems]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState('all');
  const [search,  setSearch]  = useState('');

  useEffect(() => {
    if (isDemo) {
      setItems(DUMMY_HISTORY);
      setLoading(false);
      return;
    }
    async function fetchHistory() {
      try {
        const res  = await historyAPI.get();
        const data = res.data;
        setItems(Array.isArray(data) ? data : DUMMY_HISTORY);
      } catch {
        setItems(DUMMY_HISTORY);
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, [isDemo]);

  const filtered = items.filter((item) => {
    if (filter !== 'all' && item.action !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      if (!item.document_name?.toLowerCase().includes(q) && !item.finding_title?.toLowerCase().includes(q))
        return false;
    }
    return true;
  });

  const counts = items.reduce((acc, item) => {
    acc[item.action] = (acc[item.action] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My History</h1>
          <p className="text-sm text-slate-500 mt-1">A log of all your actions and decisions.</p>
        </div>
        {isDemo && (
          <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full font-medium">
            <Sparkles size={11} /> Demo data
          </span>
        )}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { key: 'all',      label: 'Total Actions', count: items.length,          color: 'bg-slate-50 border-slate-200',     text: 'text-slate-700'   },
          { key: 'accepted', label: 'Accepted',       count: counts.accepted || 0, color: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700' },
          { key: 'rejected', label: 'Rejected',       count: counts.rejected || 0, color: 'bg-slate-50 border-slate-200',     text: 'text-slate-600'   },
          { key: 'uploaded', label: 'Uploaded',       count: counts.uploaded || 0, color: 'bg-blue-50 border-blue-200',       text: 'text-blue-700'    },
        ].map(({ key, label, count, color, text }) => (
          <button key={key} onClick={() => setFilter(key)}
            className={`p-4 rounded-2xl border-2 text-left transition-all ${filter === key ? 'shadow-sm scale-[1.02]' : 'hover:shadow-sm'} ${color}`}>
            <p className={`text-2xl font-bold ${text}`}>{loading ? '—' : count}</p>
            <p className={`text-xs font-medium mt-0.5 ${text} opacity-70`}>{label}</p>
          </button>
        ))}
      </div>

      {/* Filters + list */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input type="text" placeholder="Search documents or findings…" value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-slate-50" />
          </div>
          <select value={filter} onChange={(e) => setFilter(e.target.value)}
            className="text-sm border border-slate-200 rounded-xl px-3 py-2 bg-slate-50 text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-300">
            <option value="all">All Actions</option>
            <option value="accepted">Accepted</option>
            <option value="rejected">Rejected</option>
            <option value="uploaded">Uploaded</option>
            <option value="analyzed">Analyzed</option>
            <option value="exported">Exported</option>
          </select>
        </div>

        {loading ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <div className="w-8 h-8 border-[3px] border-indigo-100 border-t-indigo-600 rounded-full animate-spin" />
            <p className="text-sm text-slate-400">Loading history…</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 flex flex-col items-center gap-3">
            <History size={28} className="text-slate-200" />
            <p className="text-sm text-slate-400">No history found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-50">
            {filtered.map((item) => {
              const cfg  = ACTION_CONFIG[item.action] || ACTION_CONFIG.uploaded;
              const Icon = cfg.icon;
              return (
                <div key={item.id}
                  className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50/50 transition-colors">
                  <div className={`mt-0.5 w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.bg}`}>
                    <Icon size={16} className={cfg.iconColor} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.badge}`}>{cfg.label}</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Calendar size={11} /> {timeAgo(item.timestamp)}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-900 truncate">{item.document_name}</p>
                    {item.finding_title && (
                      <p className="text-xs text-slate-500 mt-0.5 truncate">
                        Finding: {item.finding_title}
                        {item.section && <span className="text-slate-300"> · {item.section}</span>}
                      </p>
                    )}
                    <p className="text-xs text-slate-300 mt-0.5">{formatDateTime(item.timestamp)}</p>
                  </div>
                  {(item.action === 'accepted' || item.action === 'rejected') && item.document_id && (
                    <button
                      onClick={() => router.push(`/analysis/${item.document_id}`)}
                      className="flex-shrink-0 flex items-center gap-1 text-xs text-indigo-500 hover:text-indigo-600 font-medium mt-1">
                      View <ChevronRight size={12} />
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
