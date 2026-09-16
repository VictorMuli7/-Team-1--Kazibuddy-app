import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { useAuth } from '../lib/AuthContext.jsx';

const navLinks = [
  { to: '/#about', label: 'About' },
  { to: '/#services', label: 'Services' },
  { to: '/#why', label: 'Why Us' },
  { to: '/reviews', label: 'Reviews' },
];

const API_URL = 'http://localhost:3000/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [errorColor, setErrorColor] = useState('#b00020');
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { refreshSession } = useAuth();

  const getDashboard = (role) => {
    if (role === 'customer') {
      return '/dashboard/customer';
    }

    if (role === 'artisan') {
      return '/dashboard/artisan';
    }

    if (role === 'admin') {
      return '/dashboard/admin';
    }

    return '/';
  };

  const attemptLogin = async (loginEmail, loginPassword) => {
    setError('');
    setErrorColor('#b00020');
    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: loginEmail,
          password: loginPassword,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.error || 'Invalid email or password.');
        return;
      }

      // Get the newly-created server session
      await refreshSession();

      setErrorColor('#1a6e3c');
      setError(`Welcome back! Redirecting...`);

      setTimeout(() => {
        navigate(getDashboard(data.user.role));
      }, 500);

    } catch (error) {
      console.error('Login error:', error);
      setError('Unable to connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!email || !password || password.length < 6) {
      setErrorColor('#b00020');
      setError('Please enter a valid email and password.');
      return;
    }

    attemptLogin(email.trim(), password);
  };

  return (
    <>
      <Header links={navLinks} />

      <section className="card signup-card" id="login">
        <h2>Sign in to Jua Kali</h2>
        <p>Welcome back. Enter your details to access your dashboard.</p>

        <form id="login-form" noValidate onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email address</label>

            <input
              type="email"
              id="email"
              name="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>

            <input
              type="password"
              id="password"
              name="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <p
            className="form-error"
            id="form-error"
            role="alert"
            style={{ color: errorColor }}
          >
            {error}
          </p>

          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="auth-switch">
          Don't have an account? <Link to="/signup">Create one</Link>
        </p>
      </section>

      <Footer />
    </>
  );
}