import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api.js';

const seniorityOptions = ['Intern', 'Junior', 'Mid-Level', 'Senior', 'Lead'];
const focusOptions = ['Mixed', 'Behavioral', 'Technical', 'System Design'];

export default function InterviewSetup({ token }) {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    role: 'Full Stack Developer',
    seniority: 'Mid-Level',
    focus: 'Mixed',
    questionCount: 5
  });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateField(event) {
    setForm((current) => ({
      ...current,
      [event.target.name]: event.target.value
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { interview } = await apiRequest('/interviews/start', {
        method: 'POST',
        token,
        body: form
      });
      navigate(`/interviews/${interview._id}`);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="page-shell narrow">
      <section className="card">
        <p className="eyebrow">New round</p>
        <h1>Customize your mock interview</h1>
        <p>Pick the role and focus area. The coach will generate a set of questions tuned to that target.</p>
        <form onSubmit={handleSubmit} className="setup-form">
          <label>
            Target role
            <input name="role" value={form.role} onChange={updateField} required />
          </label>
          <div className="form-grid">
            <label>
              Seniority
              <select name="seniority" value={form.seniority} onChange={updateField}>
                {seniorityOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
            <label>
              Focus
              <select name="focus" value={form.focus} onChange={updateField}>
                {focusOptions.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            </label>
          </div>
          <label>
            Number of questions
            <input
              name="questionCount"
              value={form.questionCount}
              onChange={updateField}
              type="number"
              min="1"
              max="8"
            />
          </label>
          {error && <div className="error-banner">{error}</div>}
          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? 'Generating...' : 'Generate interview'}
          </button>
        </form>
      </section>
    </main>
  );
}
