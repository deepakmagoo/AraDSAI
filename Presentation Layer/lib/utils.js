import { clsx } from 'clsx';

export function cn(...inputs) {
  return clsx(inputs);
}

export function formatDate(date) {
  if (!date) return '—';
  return new Date(date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateTime(date) {
  if (!date) return '—';
  return new Date(date).toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function timeAgo(date) {
  if (!date) return '—';
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return formatDate(date);
}

export function formatFileSize(bytes) {
  if (!bytes) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }
  return `${size.toFixed(1)} ${units[unitIndex]}`;
}

export function getSeverityConfig(severity) {
  const configs = {
    critical: {
      bg: 'bg-red-100',
      text: 'text-red-700',
      border: 'border-red-200',
      dot: 'bg-red-500',
      label: 'Critical',
    },
    major: {
      bg: 'bg-amber-100',
      text: 'text-amber-700',
      border: 'border-amber-200',
      dot: 'bg-amber-500',
      label: 'Major',
    },
    minor: {
      bg: 'bg-blue-100',
      text: 'text-blue-700',
      border: 'border-blue-200',
      dot: 'bg-blue-500',
      label: 'Minor',
    },
  };
  return configs[severity] || configs.minor;
}

export function getStatusConfig(status) {
  const configs = {
    completed: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Completed' },
    processing: { bg: 'bg-amber-100', text: 'text-amber-700', label: 'Processing' },
    uploaded: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Uploaded' },
    failed: { bg: 'bg-red-100', text: 'text-red-700', label: 'Failed' },
    pending: { bg: 'bg-slate-100', text: 'text-slate-600', label: 'Pending' },
    accepted: { bg: 'bg-emerald-100', text: 'text-emerald-700', label: 'Accepted' },
    rejected: { bg: 'bg-slate-100', text: 'text-slate-500', label: 'Rejected' },
  };
  return configs[status] || configs.pending;
}

export function getComplianceColor(score) {
  if (score === null || score === undefined) return 'text-slate-400';
  if (score >= 90) return 'text-emerald-600';
  if (score >= 75) return 'text-amber-600';
  return 'text-red-600';
}

export function getComplianceBarColor(score) {
  if (score >= 90) return 'bg-emerald-500';
  if (score >= 75) return 'bg-amber-500';
  return 'bg-red-500';
}

export function getComplianceBg(score) {
  if (score >= 90) return 'bg-emerald-50 border-emerald-200';
  if (score >= 75) return 'bg-amber-50 border-amber-200';
  return 'bg-red-50 border-red-200';
}

export function truncate(text, length = 120) {
  if (!text) return '';
  return text.length > length ? text.slice(0, length) + '...' : text;
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
}
