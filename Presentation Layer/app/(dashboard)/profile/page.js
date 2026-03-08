'use client';

import { useState, useEffect } from 'react';
import {
  User,
  Building2,
  Mail,
  Shield,
  Calendar,
  Edit3,
  Save,
  X,
  FileText,
  CheckCircle2,
  Clock,
  Award,
  LogOut,
  ChevronRight,
  Loader2,
  BadgeCheck,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { usersAPI, documentsAPI } from '@/services/api';
import { formatDate, getComplianceColor, getStatusConfig, timeAgo } from '@/lib/utils';
import { DUMMY_DOCUMENTS } from '@/lib/dummyData';
import Link from 'next/link';
import toast from 'react-hot-toast';

function StatCard({ icon: Icon, label, value, color }) {
  const colors = {
    blue: 'bg-blue-50 text-blue-600',
    green: 'bg-emerald-50 text-emerald-600',
    purple: 'bg-purple-50 text-purple-600',
    amber: 'bg-amber-50 text-amber-600',
  };
  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex flex-col items-center text-center gap-2">
      <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${colors[color]}`}>
        <Icon size={20} />
      </div>
      <p className="text-2xl font-bold text-slate-900">{value}</p>
      <p className="text-xs text-slate-400 leading-tight">{label}</p>
    </div>
  );
}

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-center gap-3 py-3 border-b border-slate-50 last:border-0">
      <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center flex-shrink-0">
        <Icon size={14} className="text-slate-400" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-400">{label}</p>
        <p className="text-sm font-medium text-slate-800 truncate">{value || '—'}</p>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const isDemo = user?.isDemo !== false;

  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentDocs, setRecentDocs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: '', organization: '', role: '', bio: '' });

  useEffect(() => {
    async function fetchAll() {
      // ── Demo mode: instant dummy profile ──
      if (isDemo) {
        const p = {
          id: user?.id || 'demo-user-1',
          email: user?.email || 'demo@compliance.ai',
          full_name: user?.name || 'Demo User',
          organization: user?.organization || 'Demo Organization',
          role: user?.role || 'Compliance Analyst',
          bio: 'Pharmaceutical compliance professional exploring AI-powered regulatory review.',
          created_at: '2024-01-15T10:00:00Z',
        };
        setProfile(p);
        setForm({ full_name: p.full_name, organization: p.organization, role: p.role, bio: p.bio });
        setStats({ documents_analyzed: 24, findings_reviewed: 142, hours_saved: 134, avg_compliance_score: 82 });
        setRecentDocs(DUMMY_DOCUMENTS.slice(0, 4));
        setLoading(false);
        return;
      }

      // ── Admin: real API with fallback ──
      const [profileRes, statsRes, docsRes] = await Promise.allSettled([
        usersAPI.getMe(),
        usersAPI.getMyStats(),
        documentsAPI.list(),
      ]);

      const p =
        profileRes.status === 'fulfilled'
          ? profileRes.value.data
          : {
              id: user?.id,
              email: user?.email,
              full_name: user?.name,
              organization: user?.organization,
              role: user?.role,
              bio: null,
              created_at: user?.joined || new Date().toISOString(),
            };
      setProfile(p);
      setForm({
        full_name: p.full_name || '',
        organization: p.organization || '',
        role: p.role || '',
        bio: p.bio || '',
      });

      const s =
        statsRes.status === 'fulfilled'
          ? statsRes.value.data
          : { documents_analyzed: 24, findings_reviewed: 142, hours_saved: 134, avg_compliance_score: 82 };
      setStats(s);

      const docs =
        docsRes.status === 'fulfilled'
          ? docsRes.value.data
          : DUMMY_DOCUMENTS;
      setRecentDocs(Array.isArray(docs) ? docs.slice(0, 4) : DUMMY_DOCUMENTS.slice(0, 4));

      setLoading(false);
    }
    fetchAll();
  }, [user, isDemo]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await usersAPI.updateMe(form);
      setProfile(res.data);
      toast.success('Profile updated');
    } catch {
      // Demo: just update local state
      setProfile((prev) => ({ ...prev, ...form }));
      toast.success('Profile updated');
    } finally {
      setSaving(false);
      setEditing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={24} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  const initials = (profile?.full_name || user?.name || 'U')
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
          <p className="text-sm text-slate-500 mt-1">Manage your account and view your activity.</p>
        </div>
        {isDemo && (
          <span className="flex items-center gap-1.5 text-xs text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-full font-medium">
            <Sparkles size={11} /> Demo data
          </span>
        )}
      </div>

      {/* ── Profile card ───────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Banner */}
        <div className="h-20 bg-gradient-to-r from-indigo-600 via-indigo-500 to-violet-500" />
        <div className="px-6 pb-6">
          <div className="flex items-end justify-between -mt-10 mb-5">
            <div className="w-20 h-20 rounded-2xl bg-indigo-600 border-4 border-white flex items-center justify-center shadow-lg flex-shrink-0">
              <span className="text-white text-xl font-bold">{initials}</span>
            </div>
            <div className="flex gap-2 mb-1">
              {editing ? (
                <>
                  <button
                    onClick={() => { setEditing(false); }}
                    className="flex items-center gap-1.5 text-sm font-medium px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                  >
                    <X size={14} /> Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-1.5 text-sm font-semibold px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors disabled:opacity-60 shadow-sm"
                  >
                    {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Save
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setEditing(true)}
                  className="flex items-center gap-1.5 text-sm font-medium px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl transition-colors"
                >
                  <Edit3 size={14} /> Edit Profile
                </button>
              )}
            </div>
          </div>

          {!editing ? (
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-xl font-bold text-slate-900">{profile?.full_name}</h2>
                <span className="flex items-center gap-1 text-xs text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full font-medium">
                  <BadgeCheck size={11} /> Verified
                </span>
              </div>
              <p className="text-sm text-indigo-600 font-medium mt-0.5">{profile?.role}</p>
              <p className="text-sm text-slate-500">{profile?.organization}</p>
              {profile?.bio && (
                <p className="text-sm text-slate-500 mt-2 leading-relaxed">{profile.bio}</p>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Full Name</label>
                <input
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Organization</label>
                <input
                  value={form.organization}
                  onChange={(e) => setForm({ ...form, organization: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Role / Title</label>
                <input
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-slate-50 focus:bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-500 mb-1">Bio</label>
                <input
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Brief description…"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-1 focus:ring-indigo-300 bg-slate-50 focus:bg-white"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Stats ─────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={FileText} label="Documents Analyzed" value={stats?.documents_analyzed ?? 24} color="blue" />
        <StatCard icon={CheckCircle2} label="Findings Reviewed" value={stats?.findings_reviewed ?? 142} color="green" />
        <StatCard icon={Clock} label="Hours Saved" value={`${stats?.hours_saved ?? 134}h`} color="purple" />
        <StatCard icon={Award} label="Avg Compliance" value={`${stats?.avg_compliance_score ?? 82}%`} color="amber" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* ── Account info ──────────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">Account Information</h3>
          <p className="text-xs text-slate-400 mb-3">Your account details on record</p>
          <InfoRow icon={Mail} label="Email Address" value={profile?.email} />
          <InfoRow icon={Building2} label="Organization" value={profile?.organization} />
          <InfoRow icon={Shield} label="Role" value={profile?.role} />
          <InfoRow
            icon={Calendar}
            label="Member Since"
            value={formatDate(profile?.created_at)}
          />
        </div>

        {/* ── Recent documents ──────────────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Recent Documents</h3>
              <p className="text-xs text-slate-400">Your latest uploads</p>
            </div>
            <Link
              href="/history"
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              All <ChevronRight size={12} />
            </Link>
          </div>
          <div className="space-y-2">
            {recentDocs.map((doc) => {
              const sc = getStatusConfig(doc.status);
              return (
                <div
                  key={doc.id}
                  className="flex items-center gap-3 py-2 border-b border-slate-50 last:border-0"
                >
                  <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <FileText size={14} className="text-indigo-500" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-slate-800 truncate">
                      {doc.name || doc.original_filename}
                    </p>
                    <p className="text-[10px] text-slate-400">{timeAgo(doc.created_at)}</p>
                  </div>
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${sc.bg} ${sc.text}`}>
                    {sc.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* ── Sign out ──────────────────────────────────────────────────────────── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-900 mb-1">Session</h3>
        <p className="text-xs text-slate-400 mb-4">
          Signed in as <span className="font-medium text-slate-600">{profile?.email}</span>
        </p>
        <button
          onClick={logout}
          className="flex items-center gap-2 px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-xl transition-colors"
        >
          <LogOut size={14} />
          Sign Out
        </button>
      </div>
    </div>
  );
}
