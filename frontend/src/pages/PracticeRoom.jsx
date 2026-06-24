import { useEffect, useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ScoreBadge from '../components/ScoreBadge.jsx';
import { apiRequest } from '../services/api.js';

export default function PracticeRoom({ token }) {
  const { id } = useParams();
  const [interview, setInterview] = useState(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;
    apiRequest(`/interviews/${id}`, { token })
      .then(({ interview }) => {
        if (!isMounted) return;
        setInterview(interview);
        const firstOpenIndex = interview.questions.findIndex((q) => !q.answer);
        setActiveIndex(firstOpenIndex >= 0 ? firstOpenIndex : 0);
      })
      .catch((requestError) => {
        if (isMounted) setError(requestError.message);
      });

    return () => { isMounted = false; };
  }, [id, token]);

  const activeQuestion = interview?.questions?.[activeIndex];

  const progress = useMemo(() => {
    if (!interview?.questions?.length) return 0;
    const answered = interview.questions.filter((q) => q.answer).length;
    return Math.round((answered / interview.questions.length) * 100);
  }, [interview]);

  // Sync state cleanly when changing components or loaded entries
  useEffect(() => {
    setAnswer(activeQuestion?.answer || '');
  }, [activeIndex, activeQuestion?.answer, activeQuestion?._id]);

  const isDraftDirty = useMemo(() => {
    const savedAnswer = activeQuestion?.answer || '';
    return answer.trim() !== savedAnswer.trim();
  }, [answer, activeQuestion?.answer]);

  const handleQuestionChange = (index) => {
    if (index === activeIndex) return;
    if (isDraftDirty) {
      const confirmLeave = window.confirm("You have unsaved changes in this workspace text area. Leave anyway?");
      if (!confirmLeave) return;
    }
    setActiveIndex(index);
    setError('');
  };

  async function submitAnswer(event) {
    event.preventDefault();
    if (!activeQuestion) return;
    
    setError('');
    setIsSubmitting(true);

    try {
      const payload = await apiRequest(`/interviews/${id}/answers`, {
        method: 'POST',
        token,
        body: {
          questionId: activeQuestion._id,
          answer: answer.trim()
        }
      });
      setInterview(payload.interview);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (error && !interview) {
    return (
      <main className="page-shell">
        <div className="error-banner card structural-error">
          <h3>Failed to load practice room</h3>
          <p>{error}</p>
          <Link to="/" className="secondary-button">Return to Dashboard</Link>
        </div>
      </main>
    );
  }

  if (!interview) {
    return (
      <main className="page-shell loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your session configurations...</p>
      </main>
    );
  }

  return (
    <main className="page-shell">
      <section className="room-header">
        <div>
          <p className="eyebrow">{interview.seniority} · {interview.focus}</p>
          <h1>{interview.role}</h1>
          <div className="progress-track-wrapper">
            <div className="progress-track" aria-label={`${progress}% complete`}>
              <span style={{ width: `${progress}%` }} />
            </div>
            <span className="progress-text">{progress}% complete</span>
          </div>
        </div>
        <ScoreBadge score={interview.overallScore} label="Overall" />
      </section>

      <section className="practice-layout">
        <aside className="question-list card">
          <h2>Questions</h2>
          <div className="button-group-scrollable">
            {interview.questions.map((question, index) => (
              <button
                type="button"
                key={question._id || index}
                className={`${index === activeIndex ? 'active' : ''} ${question.answer ? 'is-answered' : ''}`}
                onClick={() => handleQuestionChange(index)}
              >
                <span>{index + 1}</span>
                <strong className="competency-title">{question.competency || 'Competency'}</strong>
                {question.answer && <em>Answered</em>}
              </button>
            ))}
          </div>
          <Link to="/setup" className="secondary-button full-width margin-top-auto">
            New Round
          </Link>
        </aside>

        <section className="card question-card">
          {activeQuestion ? (
            <>
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Question {activeIndex + 1} of {interview.questions.length}</p>
                  <h2>{activeQuestion.prompt}</h2>
                </div>
                {activeQuestion.feedback?.score > 0 && (
                  <ScoreBadge score={activeQuestion.feedback.score} />
                )}
              </div>

              {activeQuestion.idealSignals?.length > 0 && (
                <div className="signal-list-container">
                  <span className="signals-label">Look-for tags:</span>
                  <div className="signal-list">
                    {activeQuestion.idealSignals.map((signal, idx) => (
                      <span key={`${signal}-${idx}`} className="signal-pill">{signal}</span>
                    ))}
                  </div>
                </div>
              )}

              <form onSubmit={submitAnswer} className="answer-form">
                <textarea
                  value={answer}
                  onChange={(event) => setAnswer(event.target.value)}
                  rows={10}
                  placeholder="Use structure (STAR method), give specifics, and land the outcome cleanly..."
                  required
                  disabled={isSubmitting}
                />
                
                {error && <div className="error-banner mini-error">{error}</div>}
                
                <div className="form-actions">
                  <button type="submit" className="primary-button" disabled={isSubmitting}>
                    {isSubmitting ? 'Evaluating answer with AI...' : activeQuestion.answer ? 'Update response' : 'Submit for feedback'}
                  </button>
                  {isDraftDirty && <span className="draft-indicator">Unsaved changes detected</span>}
                </div>
              </form>

              {activeQuestion.feedback?.summary && (
                <div className="feedback-panel entry-animation">
                  <h3>Coach feedback</h3>
                  <p className="feedback-summary">{activeQuestion.feedback.summary}</p>
                  <div className="feedback-grid">
                    <div className="feedback-col strengths">
                      <h4>Strengths</h4>
                      <ul>
                        {activeQuestion.feedback.strengths?.map((item, idx) => (
                          <li key={`strength-${idx}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                    <div className="feedback-col improvements">
                      <h4>Improve next</h4>
                      <ul>
                        {activeQuestion.feedback.improvements?.map((item, idx) => (
                          <li key={`improvement-${idx}`}>{item}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="empty-state">No question selected</div>
          )}
        </section>
      </section>
    </main>
  );
}