import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import ScoreBadge from '../components/ScoreBadge.jsx';
import { apiRequest } from '../services/api.js';

export default function History({ token }) {
  const [interviews, setInterviews] = useState([]);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiRequest('/interviews', { token })
      .then(({ interviews }) => setInterviews(interviews))
      .catch((requestError) => setError(requestError.message))
      .finally(() => setIsLoading(false));
  }, [token]);

  return (
    <main className="page-shell">
      <section className="section-heading page-heading">
        <div>
          <p className="eyebrow">Your reps</p>
          <h1>Interview history</h1>
        </div>
        <Link to="/setup" className="primary-button">
          New interview
        </Link>
      </section>

      {error && <div className="error-banner">{error}</div>}

      <section className="card list-card">
        {isLoading ? (
          <p>Loading history...</p>
        ) : interviews.length ? (
          interviews.map((interview) => (
            <article className="interview-row" key={interview._id}>
              <div>
                <h3>{interview.role}</h3>
                <p>
                  {interview.seniority} · {interview.focus} · {interview.status}
                </p>
              </div>
              <ScoreBadge score={interview.overallScore} />
              <Link to={`/interviews/${interview._id}`} className="secondary-button">
                Open
              </Link>
            </article>
          ))
        ) : (
          <div className="empty-state">
            <h3>No history yet</h3>
            <p>Create a session and your practice trail will appear here.</p>
          </div>
        )}
      </section>
    </main>
  );
}
