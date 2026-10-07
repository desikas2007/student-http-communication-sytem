/** Date/time formatting helpers shared by the whole UI. */

const dateFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
});

const timeFormatter = new Intl.DateTimeFormat('en-IN', {
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

const dateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
});

const parse = (value) => (value instanceof Date ? value : new Date(value));

/** 15 Oct 2026 */
export const formatDate = (value) => {
  const date = parse(value);
  return Number.isNaN(date.getTime()) ? '-' : dateFormatter.format(date);
};

/** 10:30 AM */
export const formatTime = (value) => {
  const date = parse(value);
  return Number.isNaN(date.getTime()) ? '-' : timeFormatter.format(date);
};

/** 15 Oct 2026, 10:30 AM */
export const formatDateTime = (value) => {
  const date = parse(value);
  return Number.isNaN(date.getTime()) ? '-' : dateTimeFormatter.format(date);
};

/** 10:30:12 - used by the HTTP request table. */
export const formatClock = (value) => {
  const date = parse(value);
  if (Number.isNaN(date.getTime())) return '--:--:--';
  return date.toLocaleTimeString('en-GB', { hour12: false });
};

/** 124 ms / 1.4 s */
export const formatDuration = (ms) => {
  const value = Number(ms) || 0;
  if (value < 1000) return `${Math.round(value)} ms`;
  return `${(value / 1000).toFixed(2)} s`;
};

/** "3 minutes ago" style label. */
export const timeAgo = (value) => {
  const date = parse(value);
  if (Number.isNaN(date.getTime())) return '-';
  const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
  if (seconds < 10) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return formatDate(date);
};

/** Days until (positive) or since (negative) a date. */
export const daysUntil = (value) => {
  const date = parse(value);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const target = new Date(date);
  target.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86400000);
};

/** Human label for a countdown, e.g. "in 5 days" / "2 days ago". */
export const relativeDaysLabel = (value) => {
  const days = daysUntil(value);
  if (days === null) return '';
  if (days === 0) return 'Today';
  if (days === 1) return 'Tomorrow';
  if (days > 0) return `In ${days} days`;
  return `${Math.abs(days)} days ago`;
};

/** Good morning / afternoon / evening. */
export const greeting = (date = new Date()) => {
  const hour = date.getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 17) return 'Good afternoon';
  return 'Good evening';
};

/** First name used in the welcome banner. */
export const firstName = (fullName = '') => String(fullName).trim().split(/\s+/)[0] || 'Student';
