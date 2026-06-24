import { useEffect, useMemo, useState } from 'react';
import { Navigate, Route, Routes, useNavigate } from 'react-router-dom';
import NavBar from './components/NavBar.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import Dashboard from './pages/Dashboard.jsx';
import History from './pages/History.jsx';
import InterviewSetup from './pages/InterviewSetup.jsx';
import Login from './pages/Login.jsx';
import PracticeRoom from './pages/PracticeRoom.jsx';
import { apiRequest } from './services/api.js';

export default function App() {
  const navigate = useNavigate();
  const [auth, setAuth] = useState(() => {
    const token = localStorage.getItem('interview-token');
    const user = localStorage.getItem('interview-user');
    return token && user ? { token, user: JSON.parse(user) } : { token: null, user: null };
  });
  const [isBooting, setIsBooting] = useState(Boolean(auth.token));

  useEffect(() => {
    if (!auth.token) {
      setIsBooting(false);
      return;
    }

    apiRequest('/auth/me', { token: auth.token })
      .then(({ user }) => {
        localStorage.setItem('interview-user', JSON.stringify(user));
        setAuth((current) => ({ ...current, user }));
      })
      .catch(() => {
        localStorage.removeItem('interview-token');
        localStorage.removeItem('interview-user');
        setAuth({ token: null, user: null });
      })
      .finally(() => setIsBooting(false));
  }, []);

  const authActions = useMemo(
    () => ({
      async login(path, form) {
        const payload = await apiRequest(path, {
          method: 'POST',
          body: form
        });
        localStorage.setItem('interview-token', payload.token);
        localStorage.setItem('interview-user', JSON.stringify(payload.user));
        setAuth(payload);
        navigate('/');
      },
      logout() {
        localStorage.removeItem('interview-token');
        localStorage.removeItem('interview-user');
        setAuth({ token: null, user: null });
        navigate('/login');
      }
    }),
    [navigate]
  );

  if (isBooting) {
    return <main className="page-shell loading">Preparing your practice room...</main>;
  }

  return (
    <>
      <NavBar user={auth.user} onLogout={authActions.logout} />
      <Routes>
        <Route path="/login" element={auth.token ? <Navigate to="/" /> : <Login mode="login" onSubmit={authActions.login} />} />
        <Route
          path="/register"
          element={auth.token ? <Navigate to="/" /> : <Login mode="register" onSubmit={authActions.login} />}
        />
        <Route
          path="/"
          element={
            <ProtectedRoute token={auth.token}>
              <Dashboard token={auth.token} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/setup"
          element={
            <ProtectedRoute token={auth.token}>
              <InterviewSetup token={auth.token} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/interviews/:id"
          element={
            <ProtectedRoute token={auth.token}>
              <PracticeRoom token={auth.token} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/history"
          element={
            <ProtectedRoute token={auth.token}>
              <History token={auth.token} />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </>
  );
}
