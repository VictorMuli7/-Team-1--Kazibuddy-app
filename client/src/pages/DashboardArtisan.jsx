import { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { useAuth } from '../lib/AuthContext.jsx';

const API_URL = 'http://localhost:3000/api';

const navLinks = [
  { to: '/#services', label: 'Services' },
  { to: '/reviews', label: 'Reviews' },
];

export default function DashboardArtisan() {
  const { session } = useAuth();

  const [jobs, setJobs] = useState([]);
  const [user, setUser] = useState(null);

  const [rate, setRate] = useState('');
  const [bio, setBio] = useState('');

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const [error, setError] = useState('');
  const [listingMsg, setListingMsg] = useState('');

  // Load artisan's bookings from the backend
  const loadJobs = useCallback(async () => {
    if (!session) return;

    try {
      const response = await fetch(`${API_URL}/bookings`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Unable to load job requests.');
      }

      const sortedJobs = [...data.bookings].sort((a, b) =>
        a.date < b.date ? 1 : -1
      );

      setJobs(sortedJobs);
    } catch (err) {
      console.error('Job loading error:', err);
      setError(err.message || 'Unable to load job requests.');
    }
  }, [session]);

  // Load artisan's profile from the backend
  const loadUser = useCallback(async () => {
    if (!session) return;

    try {
      const response = await fetch(`${API_URL}/users/me`, {
        credentials: 'include',
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Unable to load your profile.');
      }

      setUser(data.user);
      setRate(data.user?.rate || '');
      setBio(data.user?.bio || '');
    } catch (err) {
      console.error('Profile loading error:', err);
      setError(err.message || 'Unable to load your profile.');
    }
  }, [session]);

  // Load everything when the artisan session is available
  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }

    const loadDashboard = async () => {
      setLoading(true);
      setError('');

      await Promise.all([
        loadJobs(),
        loadUser(),
      ]);

      setLoading(false);
    };

    loadDashboard();
  }, [session, loadJobs, loadUser]);

  // Accept, decline or complete a booking
  const handleJobAction = async (id, action) => {
    const statusMap = {
      accept: 'upcoming',
      decline: 'declined',
      complete: 'completed',
    };

    const status = statusMap[action];

    if (!status) return;

    setActionLoading(true);
    setError('');

    try {
      const response = await fetch(`${API_URL}/bookings/${id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({ status }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Unable to update booking.');
      }

      // Reload bookings so the dashboard reflects the database
      await loadJobs();
    } catch (err) {
      console.error('Booking action error:', err);
      setError(err.message || 'Unable to update booking.');
    } finally {
      setActionLoading(false);
    }
  };

  // Save artisan listing to the backend
  const handleListingSubmit = async (e) => {
    e.preventDefault();

    setListingMsg('');
    setError('');

    try {
      const response = await fetch(`${API_URL}/users/me`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          rate: rate.trim(),
          bio: bio.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Unable to save listing.');
      }

      setUser(data.user);
      setRate(data.user?.rate || '');
      setBio(data.user?.bio || '');

      setListingMsg('Listing saved.');

      setTimeout(() => {
        setListingMsg('');
      }, 2500);
    } catch (err) {
      console.error('Listing update error:', err);
      setError(err.message || 'Unable to save listing.');
    }
  };

  if (!session) return null;

  if (loading) {
    return (
      <>
        <Header links={navLinks} />
        <div className="dashboard-wrap">
          <p className="dashboard-empty">Loading your artisan dashboard...</p>
        </div>
        <Footer />
      </>
    );
  }

  if (!user) {
    return (
      <>
        <Header links={navLinks} />
        <div className="dashboard-wrap">
          <p className="dashboard-empty">
            Unable to load your artisan profile.
          </p>
        </div>
        <Footer />
      </>
    );
  }

  const pending = jobs.filter((j) => j.status === 'pending').length;

  const upcoming = jobs.filter(
    (j) => j.status === 'upcoming'
  ).length;

  const completed = jobs.filter(
    (j) => j.status === 'completed'
  );

  const earnings = completed.reduce((sum, j) => {
    const n = parseInt(
      String(j.price).replace(/[^0-9]/g, ''),
      10
    );

    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  return (
    <>
      <Header links={navLinks} />

      <div className="dashboard-wrap">

        <div className="dashboard-hero dashboard-hero-artisan">
          <div className="dashboard-hero-text">
            <span className="dashboard-role-tag">
              Artisan account
            </span>

            <h2 id="welcome-heading">
              Welcome back, {session.fullname.split(' ')[0]}
            </h2>

            <p id="welcome-skill">
              Your listing: {user.skill || 'No skill set'}
            </p>

            <div className="dashboard-status-pill">
              <span
                className={`badge ${user.verified
                  ? 'badge-verified'
                  : 'badge-unverified'
                  }`}
                id="verification-badge"
              >
                {user.verified
                  ? 'Verified artisan'
                  : 'Pending verification'}
              </span>
            </div>
          </div>
        </div>

        {!user.verified && (
          <p
            className="dashboard-empty"
            id="pending-verification-note"
            style={{
              textAlign: 'left',
              background: '#fff3cd',
              color: '#7a5b00',
              padding: '12px 16px',
              borderRadius: '10px',
              fontStyle: 'normal',
              marginTop: '16px',
            }}
          >
            Your account is pending verification by our admin team.
            You can still set up your listing, but you won't appear
            in search results until you're verified.
          </p>
        )}

        {error && (
          <p
            className="form-error"
            role="alert"
            style={{
              color: '#b00020',
              marginTop: '16px',
            }}
          >
            {error}
          </p>
        )}

        <div className="dashboard-stats-grid">

          <div className="dashboard-stat-card">
            <div
              className="dashboard-stat-value"
              id="stat-pending"
            >
              {pending}
            </div>

            <div className="dashboard-stat-label">
              New requests
            </div>
          </div>

          <div className="dashboard-stat-card">
            <div
              className="dashboard-stat-value"
              id="stat-upcoming"
            >
              {upcoming}
            </div>

            <div className="dashboard-stat-label">
              Accepted / upcoming
            </div>
          </div>

          <div className="dashboard-stat-card">
            <div
              className="dashboard-stat-value"
              id="stat-completed"
            >
              {completed.length}
            </div>

            <div className="dashboard-stat-label">
              Jobs completed
            </div>
          </div>

          <div className="dashboard-stat-card">
            <div
              className="dashboard-stat-value"
              id="stat-earnings"
            >
              KES {earnings.toLocaleString()}
            </div>

            <div className="dashboard-stat-label">
              Total earnings
            </div>
          </div>

        </div>

        <section className="dashboard-section">

          <div className="dashboard-section-head">
            <div>
              <h3>Job Requests</h3>

              <p className="dashboard-section-subtext">
                Respond to customers who have booked your services.
              </p>
            </div>
          </div>

          <div className="dashboard-table-wrap">

            {jobs.length === 0 ? (
              <p
                className="dashboard-empty"
                id="jobs-empty"
              >
                No job requests yet. Once customers book your
                services, they'll show up here.
              </p>
            ) : (
              <table
                className="dashboard-table"
                id="jobs-table"
              >
                <thead>
                  <tr>
                    <th>Customer</th>
                    <th>Service</th>
                    <th>Date</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>

                <tbody id="jobs-body">
                  {jobs.map((job) => (
                    <tr key={job.id}>

                      <td>{job.customerName}</td>

                      <td>{job.service}</td>

                      <td>{job.date}</td>

                      <td>{job.price}</td>

                      <td>
                        <span
                          className={`badge badge-${job.status}`}
                        >
                          {job.status}
                        </span>
                      </td>

                      <td>
                        <div className="dashboard-actions-cell">

                          {job.status === 'pending' && (
                            <>
                              <button
                                className="btn-sm btn-accept"
                                disabled={actionLoading}
                                onClick={() =>
                                  handleJobAction(
                                    job.id,
                                    'accept'
                                  )
                                }
                              >
                                Accept
                              </button>

                              <button
                                className="btn-sm btn-decline"
                                disabled={actionLoading}
                                onClick={() =>
                                  handleJobAction(
                                    job.id,
                                    'decline'
                                  )
                                }
                              >
                                Decline
                              </button>
                            </>
                          )}

                          {job.status === 'upcoming' && (
                            <button
                              className="btn-sm btn-complete"
                              disabled={actionLoading}
                              onClick={() =>
                                handleJobAction(
                                  job.id,
                                  'complete'
                                )
                              }
                            >
                              Mark complete
                            </button>
                          )}

                          {job.status !== 'pending' &&
                            job.status !== 'upcoming' &&
                            '—'}

                        </div>
                      </td>

                    </tr>
                  ))}
                </tbody>
              </table>
            )}

          </div>
        </section>

        <section className="dashboard-section">

          <h3>My Listing</h3>

          <p className="dashboard-section-subtext">
            This is what customers see when they view your profile.
          </p>

          <form
            className="dashboard-form"
            id="listing-form"
            onSubmit={handleListingSubmit}
          >

            <div className="dashboard-form-row">

              <div className="form-group">

                <label htmlFor="listing-skill">
                  Skill / service
                </label>

                <input
                  type="text"
                  id="listing-skill"
                  name="skill"
                  disabled
                  value={user.skill || ''}
                  readOnly
                />

              </div>

              <div className="form-group">

                <label htmlFor="listing-rate">
                  Rate
                </label>

                <input
                  type="text"
                  id="listing-rate"
                  name="rate"
                  placeholder="e.g. From KES 500/style"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                />

              </div>

            </div>

            <div className="form-group">

              <label htmlFor="listing-bio">
                Bio / description
              </label>

              <textarea
                id="listing-bio"
                name="bio"
                rows={3}
                placeholder="Tell customers about your experience..."
                value={bio}
                onChange={(e) => setBio(e.target.value)}
              />

            </div>

            <p
              className="form-error"
              id="listing-msg"
              role="status"
              style={{ color: '#1a6e3c' }}
            >
              {listingMsg}
            </p>

            <button
              type="submit"
              className="btn-submit"
              style={{
                width: 'auto',
                padding: '0.7rem 1.6rem',
              }}
            >
              Save listing
            </button>

          </form>

        </section>

      </div>

      <Footer />
    </>
  );
}