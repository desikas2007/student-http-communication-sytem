import { useEffect, useMemo, useState } from 'react';

/**
 * Client side HTTP monitor store.
 *
 * The Axios interceptors in services/api.js push one entry per completed
 * request/response exchange, and every subscribed component re-renders.
 * This is what powers the "Live session" tab of the HTTP Monitor page.
 */

const MAX_ENTRIES = 250;

let entries = [];
const listeners = new Set();

const notify = () => {
  listeners.forEach((listener) => listener(entries));
};

/** Adds a completed exchange to the live monitor store. */
export const logHttpEntry = (entry) => {
  const record = {
    id: entry.id || `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    ...entry,
  };
  entries = [record, ...entries].slice(0, MAX_ENTRIES);
  notify();
  return record;
};

/** Clears the live session (server side logs are unaffected). */
export const clearHttpEntries = () => {
  entries = [];
  notify();
};

export const getHttpEntries = () => entries;

/** Derived counters for the live session. */
export const computeStats = (list) => {
  const total = list.length;
  const get = list.filter((entry) => entry.method === 'GET').length;
  const post = list.filter((entry) => entry.method === 'POST').length;
  const other = total - get - post;
  const successful = list.filter((entry) => entry.status >= 200 && entry.status < 300).length;
  const failed = list.filter((entry) => entry.status >= 400 || entry.status === 0).length;
  const durations = list.map((entry) => Number(entry.duration) || 0);
  const average = total ? Math.round(durations.reduce((sum, value) => sum + value, 0) / total) : 0;

  const statusCodes = list.reduce((acc, entry) => {
    const key = String(entry.status || 0);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    total,
    get,
    post,
    other,
    successful,
    failed,
    averageResponseTime: average,
    statusCodes: Object.entries(statusCodes)
      .map(([statusCode, count]) => ({ statusCode: Number(statusCode), count }))
      .sort((a, b) => a.statusCode - b.statusCode),
  };
};

/** Subscribes a component to the live monitor store. */
export const useHttpMonitor = () => {
  const [snapshot, setSnapshot] = useState(entries);

  useEffect(() => {
    const listener = (next) => setSnapshot(next);
    listeners.add(listener);
    // Sync in case entries changed between render and subscription.
    setSnapshot(entries);
    return () => listeners.delete(listener);
  }, []);

  const stats = useMemo(() => computeStats(snapshot), [snapshot]);

  return {
    entries: snapshot,
    stats,
    clear: clearHttpEntries,
  };
};

export default useHttpMonitor;
