import { useState } from 'react';
import { Link } from 'react-router-dom';

export default function Login({ mode, onSubmit }) {
  const isRegister = mode === 'register';
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: ''
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
      await onSubmit(isRegister ? '/auth/register' : '/auth/login', form);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="auth-layout">
      <section className="hero-panel">
        <p className="eyebrow">Practice with signal</p>
        <h1>Turn interview nerves into reps, feedback, and momentum.</h1>
        <p>
          Generate targeted questions, answer them like a real interview, and get coaching notes you can use immediately.
        </p>
      </section>
      <section className="card auth-card">
        <h2>{isRegister ? 'Create account' : 'Welcome back'}</h2>
        <p>{isRegister ? 'Start your first interview set in under a minute.' : 'Jump back into your practice dashboard.'}</p>
        <form onSubmit={handleSubmit}>
          {isRegister && (
            <label>
              Name
              <input name="name" value={form.name} onChange={updateField} placeholder="Ada Lovelace" required />
            </label>
          )}
          <label>
            Email
            <input name="email" value={form.email} onChange={updateField} placeholder="you@example.com" type="email" required />
          </label>
          <label>
            Password
            <input
              name="password"
              value={form.password}
              onChange={updateField}
              placeholder="At least 8 characters"
              type="password"
              minLength={8}
              required
            />
          </label>
          {error && <div className="error-banner">{error}</div>}
          <button type="submit" className="primary-button" disabled={isSubmitting}>
            {isSubmitting ? 'Working...' : isRegister ? 'Create account' : 'Login'}
          </button>
        </form>
        <p className="switch-copy">
          {isRegister ? 'Already practicing?' : 'New here?'}{' '}
          <Link to={isRegister ? '/login' : '/register'}>{isRegister ? 'Login' : 'Create an account'}</Link>
        </p>
      </section>
    </main>
  );
}
