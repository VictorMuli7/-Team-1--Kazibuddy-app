import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';

export default function Header({ links = [] }) {
  const { session, logout } = useAuth();
  const navigate = useNavigate();

  const getDashboard = (role) => {
    if (role === 'admin') return '/dashboard/admin';
    if (role === 'artisan') return '/dashboard/artisan';
    if (role === 'customer') return '/dashboard/customer';
    return '/';
  };

  const handleLogout = async (e) => {
    e.preventDefault();

    await logout();
    navigate('/');
  };

  return (
    <header className="header" id="top">
      <div className="header-logo">
        <Link to="/">
          <h1 className="header-title">Jua Kali☀️</h1>
        </Link>
      </div>

      <nav className="header-container">
        {links.map((link) => (
          <div className="nav-item" key={link.to}>
            <Link to={link.to}>{link.label}</Link>
          </div>
        ))}

        <div className="nav-auth">
          {session ? (
            <>
              <div className="nav-item">
                <Link to={getDashboard(session.role)}>
                  Dashboard
                </Link>
              </div>

              <div className="nav-item">
                <a href="#" onClick={handleLogout}>
                  Logout ({session.fullname.split(' ')[0]})
                </a>
              </div>
            </>
          ) : (
            <>
              <div className="nav-item">
                <Link to="/login">Sign In</Link>
              </div>

              <div className="nav-item">
                <Link to="/signup">Sign Up</Link>
              </div>
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
