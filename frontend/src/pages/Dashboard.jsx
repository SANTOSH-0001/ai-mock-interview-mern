import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import ScoreBadge from '../components/ScoreBadge.jsx';
import { apiRequest } from '../services/api.js';

export default function Dashboard({ token }) {
  const [interviews, setInterviews] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    apiRequest('/interviews', { token })
      .then(({ interviews }) => {
        if (isMounted) setInterviews(interviews || []);
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError.message);
      })
      .finally(() => {
        if (isMounted) setIsLoading(false);
      });

    return () => { isMounted = false; };
  }, [token]);

  const stats = useMemo(() => {
    const completed = interviews.filter((i) => i.status === 'completed');
    const average =
      completed.length > 0
        ? Math.round(completed.reduce((sum, i) => sum + (i.overallScore || 0), 0) / completed.length)
        : 0;

    return {
      total: interviews.length,
      completed: completed.length,
      average
    };
  }, [interviews]);

  const latest = interviews[0];

  return (
    <main className="page-shell">
      <section className="dashboard-hero">
        <div>
          <p className="eyebrow">Interview Gym</p>
          <h1>Practice deliberately. Improve visibly.</h1>
          <p>Spin up tailored mock rounds, collect tactical feedback, and track core readiness over time.</p>
        </div>
        <Link to="/setup" className="primary-button action-cta">
          Start mock interview
        </Link>
      </section>

      {error && (
        <div className="error-banner global-dashboard-error" role="alert">
          <strong>System Notification:</strong> {error}
        </div>
      )}

      <section className="stats-grid">
        <div className="stat-card">
          <span>Total sessions</span>
          <strong>{stats.total}</strong>
        </div>
        <div className="stat-card">
          <span>Completed</span>
          <strong>{stats.completed}</strong>
        </div>
        <div className="stat-card score-stat">
          <span>Average score</span>
          <strong className="score-accent">{stats.average}%</strong>
        </div>
      </section>

      <section className="content-grid">
        <div className="card latest-session-card">
          <div className="section-heading">
            <h2>Latest session</h2>
            {interviews.length > 1 && <Link to="/history" className="text-link">View all history</Link>}
          </div>
          
          {isLoading ? (
            <div className="skeleton-placeholder-row">
              <p>Fetching active sessions...</p>
            </div>
          ) : latest ? (
            <article className="interview-row featured">
              <div className="row-metadata">
                <h3>{latest.role}</h3>
                <p>
                  {latest.seniority} · {latest.focus} · {latest.questions?.length || 0} Questions
                </p>
              </div>
              <div className="row-actions">
                <ScoreBadge score={latest.overallScore} />
                <Link to={`/interviews/${latest._id}`} className="secondary-button action-btn">
                  Continue practice
                </Link>
              </div>
            </article>
          ) : (
            !error && (
              <div className="empty-state">
                <h3>No sessions yet</h3>
                <p>Your first custom mock interview session is one click away. Step into the arena.</p>
                <Link to="/setup" className="secondary-button">
                  Create custom session
                </Link>
              </div>
            )
          )}
        </div>

        <div className="card coaching-card">
          <h2>Coaching loop</h2>
          <ul className="styled-timeline-list">
            <li>
              <div className="step-num">1</div>
              <p><strong>Generate:</strong> Get context-aware tailored technical queries.</p>
            </li>
            <li>
              <div className="step-num">2</div>
              <p><strong>Execute:</strong> Formulate answers using target metrics.</p>
            </li>
            <li>
              <div className="step-num">3</div>
              <p><strong>Evaluate:</strong> Read detailed score improvements and diagnostics.</p>
            </li>
            <li>
              <div className="step-num">4</div>
              <p><strong>Iterate:</strong> Rerun performance segments until completely fluent.</p>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}