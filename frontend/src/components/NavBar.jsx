import { Link, NavLink } from 'react-router-dom';

export default function NavBar({ user, onLogout }) {
  return (
    <header className="nav-shell">
      <Link to="/" className="brand">
        <span className="brand-mark">AI</span>
        Mock Interview
      </Link>
      {user ? (
        <nav>
          <NavLink to="/">Dashboard</NavLink>
          <NavLink to="/setup">New Interview</NavLink>
          <NavLink to="/history">History</NavLink>
          <button type="button" onClick={onLogout} className="ghost-button">
            Logout
          </button>
        </nav>
      ) : (
        <nav>
          <NavLink to="/login">Login</NavLink>
          <NavLink to="/register" className="nav-cta">
            Register
          </NavLink>
        </nav>
      )}
    </header>
  );
}
