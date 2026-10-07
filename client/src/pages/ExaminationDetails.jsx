import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, CalendarDays, Inbox, Filter, Clock, MapPin, BookOpen } from 'lucide-react';
import ErrorMessage, { EmptyState } from '../components/ErrorMessage';
import LoadingSpinner, { SkeletonRows } from '../components/LoadingSpinner';
import { fetchExaminations } from '../services/examService';
import { errorMessage } from '../services/api';
import { formatDate, relativeDaysLabel, daysUntil } from '../utils/formatDate';

/** Examination catalogue - performs GET /api/exams when the page mounts. */
const ExaminationDetails = () => {
  const [examinations, setExaminations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState('');
  const [examType, setExamType] = useState('All');
  const [date, setDate] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchExaminations();
      setExaminations(data.examinations || []);
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const examTypes = useMemo(() => {
    const types = new Set(examinations.map((exam) => exam.examType));
    return ['All', ...Array.from(types)];
  }, [examinations]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return examinations.filter((exam) => {
      const matchesSearch =
        !term ||
        exam.subject.toLowerCase().includes(term) ||
        exam.subjectCode.toLowerCase().includes(term) ||
        exam.room.toLowerCase().includes(term);
      const matchesType = examType === 'All' || exam.examType === examType;
      const matchesDate = !date || new Date(exam.date).toISOString().slice(0, 10) === date;
      return matchesSearch && matchesType && matchesDate;
    });
  }, [examinations, search, examType, date]);

  const clearFilters = () => {
    setSearch('');
    setExamType('All');
    setDate('');
  };

  if (loading) {
    return (
      <div className="page">
        <div className="page__header">
          <div>
            <h2 className="page__title">Examinations</h2>
            <p className="page__subtitle">GET /api/exams</p>
          </div>
        </div>
        <SkeletonRows rows={6} height={56} />
        <LoadingSpinner label="Fetching examinations from the server" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="page">
        <ErrorMessage
          title="Could not load examinations"
          message={errorMessage(error)}
          status={error.status}
          errorCode={error.errorCode}
          onRetry={load}
        />
      </div>
    );
  }

  return (
    <div className="page">
      <div className="page__header">
        <div>
          <h2 className="page__title">Examinations</h2>
          <p className="page__subtitle">
            Retrieved from the college server with a single <code>GET /api/exams</code> request ·{' '}
            {examinations.length} records
          </p>
        </div>
      </div>

      {/* ---------- Filters ---------- */}
      <section className="card card--flush">
        <div className="filters">
          <div className="field field--search">
            <label className="sr-only" htmlFor="exam-search">
              Search examinations
            </label>
            <Search size={15} className="filters__icon" />
            <input
              id="exam-search"
              className="input input--search"
              placeholder="Search by subject, code or room…"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>

          <div className="field">
            <label className="sr-only" htmlFor="exam-type">
              Exam type
            </label>
            <select
              id="exam-type"
              className="input input--select"
              value={examType}
              onChange={(event) => setExamType(event.target.value)}
            >
              {examTypes.map((type) => (
                <option key={type} value={type}>
                  {type === 'All' ? 'All exam types' : type}
                </option>
              ))}
            </select>
          </div>

          <div className="field">
            <label className="sr-only" htmlFor="exam-date">
              Date
            </label>
            <input
              id="exam-date"
              type="date"
              className="input input--select"
              value={date}
              onChange={(event) => setDate(event.target.value)}
            />
          </div>

          <button type="button" className="btn btn--ghost" onClick={clearFilters}>
            <Filter size={14} /> Reset
          </button>
        </div>
      </section>

      {/* ---------- Results ---------- */}
      {filtered.length === 0 ? (
        <section className="card">
          <EmptyState
            icon={Inbox}
            title="No examinations found"
            message={
              examinations.length
                ? 'No records match your search and filters. Try resetting them.'
                : 'The server returned an empty examination list.'
            }
            action={
              <button type="button" className="btn btn--secondary" onClick={clearFilters}>
                Clear filters
              </button>
            }
          />
        </section>
      ) : (
        <>
          {/* Desktop table */}
          <section className="card table-card">
            <div className="table-wrap">
              <table className="data-table data-table--exams">
                <thead>
                  <tr>
                    <th scope="col">Subject</th>
                    <th scope="col">Code</th>
                    <th scope="col">Type</th>
                    <th scope="col">Date</th>
                    <th scope="col">Time</th>
                    <th scope="col">Room</th>
                    <th scope="col">Semester</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((exam) => (
                    <tr key={exam._id}>
                      <td>
                        <span className="cell-strong">{exam.subject}</span>
                        <span className="cell-sub">{exam.department} · Year {exam.year}</span>
                      </td>
                      <td className="mono">{exam.subjectCode}</td>
                      <td>
                        <span className="pill pill--primary">{exam.examType}</span>
                      </td>
                      <td>
                        {formatDate(exam.date)}
                        <span className={`cell-sub ${daysUntil(exam.date) >= 0 ? 'cell-sub--info' : ''}`}>
                          {relativeDaysLabel(exam.date)}
                        </span>
                      </td>
                      <td className="mono">
                        {exam.startTime} - {exam.endTime}
                      </td>
                      <td>{exam.room}</td>
                      <td>Sem {exam.semester}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          {/* Mobile cards */}
          <div className="exam-cards">
            {filtered.map((exam) => (
              <article className="exam-card" key={exam._id}>
                <header className="exam-card__head">
                  <span className="pill pill--primary">{exam.examType}</span>
                  <span className="pill">{relativeDaysLabel(exam.date)}</span>
                </header>
                <h3 className="exam-card__subject">{exam.subject}</h3>
                <p className="exam-card__code">{exam.subjectCode}</p>
                <ul className="exam-card__meta">
                  <li>
                    <CalendarDays size={14} /> {formatDate(exam.date)}
                  </li>
                  <li>
                    <Clock size={14} /> {exam.startTime} - {exam.endTime}
                  </li>
                  <li>
                    <MapPin size={14} /> {exam.room}
                  </li>
                  <li>
                    <BookOpen size={14} /> Semester {exam.semester} · Year {exam.year}
                  </li>
                </ul>
                {exam.instructions ? (
                  <p className="exam-card__note">{exam.instructions}</p>
                ) : null}
              </article>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default ExaminationDetails;
