import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { useAuth } from '../lib/AuthContext.jsx';

const navLinks = [
  { to: '/#about', label: 'About Jua Kali' },
  { to: '/#services', label: 'Our Services' },
  { to: '/#why', label: 'Why choose Jua Kali' },
  { to: '/#steps', label: 'How to join Jua Kali' },
  { to: '/reviews', label: 'Reviews' },
];

const skillOptions = [
  'Laundry',
  'Home and Office Cleaning',
  'Electrical',
  'Gardening',
  'Hair Styling',
  'Barber',
  'Plumbing',
  'Cooking',
];

const API_URL = 'http://localhost:3000/api';

export default function Signup() {
  const [role, setRole] = useState('');
  const [fullname, setFullname] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [skill, setSkill] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();
  const { refreshSession } = useAuth();

  const isArtisan = role === 'artisan';

  const getDashboard = (userRole) => {
    if (userRole === 'customer') {
      return '/dashboard/customer';
    }

    if (userRole === 'artisan') {
      return '/dashboard/artisan';
    }

    if (userRole === 'admin') {
      return '/dashboard/admin';
    }

    return '/';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError('');
    setSuccess(false);

    const phoneValid = /^[0-9+ ]{7,15}$/.test(phone);

    if (
      !role ||
      fullname.trim().length < 2 ||
      !email ||
      !phoneValid ||
      password.length < 6 ||
      confirmPassword.length < 6 ||
      (isArtisan && !skill)
    ) {
      setError('Please fill in all required fields correctly.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`${API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          role,
          fullname: fullname.trim(),
          email: email.trim(),
          phone: phone.trim(),
          password,
          skill: isArtisan ? skill : null,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.error || 'Unable to create your account.');
        return;
      }

      // The backend automatically creates a session after registration.
      await refreshSession();

      setSuccess(true);

      const message =
        role === 'artisan'
          ? `Welcome to Jua Kali, ${fullname.trim()}! Your artisan account has been created and is pending verification.`
          : `Welcome to Jua Kali, ${fullname.trim()}! Your account has been created.`;

      setError(message);

      setTimeout(() => {
        navigate(getDashboard(data.user.role));
      }, 900);

    } catch (error) {
      console.error('Registration error:', error);
      setError('Unable to connect to the server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header links={navLinks} />

      <section className="card signup-card" id="signup">
        <h2>Create your Jua Kali account</h2>
        <p>Tell us who you are so we can set up the right account for you.</p>

        <form id="signup-form" noValidate onSubmit={handleSubmit}>

          <div className="form-group">
            <label htmlFor="role">I am a</label>

            <select
              id="role"
              name="role"
              required
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="" disabled>
                Select account type
              </option>

              <option value="customer">
                Customer looking for services
              </option>

              <option value="artisan">
                Artisan offering services
              </option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="fullname">Full name</label>

            <input
              type="text"
              id="fullname"
              name="fullname"
              required
              minLength={2}
              value={fullname}
              onChange={(e) => setFullname(e.target.value)}
            />
          </div>

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
            <label htmlFor="phone">Phone number</label>

            <input
              type="tel"
              id="phone"
              name="phone"
              required
              pattern="^[0-9+ ]{7,15}$"
              placeholder="e.g. +254 700 000 000"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </div>

          {isArtisan && (
            <div className="form-group" id="skill-group">
              <label htmlFor="skill">
                Skill / service you offer
              </label>

              <select
                id="skill"
                name="skill"
                required
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
              >
                <option value="" disabled>
                  Select a skill
                </option>

                {skillOptions.map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>
            </div>
          )}

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

          <div className="form-group">
            <label htmlFor="confirm-password">
              Confirm password
            </label>

            <input
              type="password"
              id="confirm-password"
              name="confirm-password"
              required
              minLength={6}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
          </div>

          <p
            className="form-error"
            id="form-error"
            role="alert"
            style={{
              color: success ? '#1a6e3c' : '#b00020'
            }}
          >
            {error}
          </p>

          <button
            type="submit"
            className="btn-submit"
            disabled={loading}
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>

        </form>

        <p className="auth-switch">
          Already have an account?{' '}
          <Link to="/login">Sign in</Link>
        </p>
      </section>

      <Footer />
    </>
  );
}