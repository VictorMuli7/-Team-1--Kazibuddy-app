
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { useAuth } from '../lib/AuthContext.jsx';

const API_URL = 'http://localhost:3000/api';

const navLinks = [
  { to: '/#services', label: 'Browse Services' },
  { to: '/reviews', label: 'Reviews' },
];

const popularServices = [
  'Laundry',
  'Home & Office Cleaning',
  'Electrical',
  'Gardening',
  'Hair Styling',
  'Barber',
  'Plumbing',
  'Cooking',
];

export default function DashboardCustomer() {
  const { session } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }

    const loadBookings = async () => {
      try {
        const response = await fetch(`${API_URL}/bookings`, {
          credentials: 'include',
        });

        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data.error || 'Unable to load bookings.');
        }

        const sortedBookings = [...data.bookings].sort((a, b) =>
          a.date < b.date ? 1 : -1
        );

        setBookings(sortedBookings);
      } catch (err) {
        console.error('Booking loading error:', err);
        setError(err.message || 'Unable to load your bookings.');
      } finally {
        setLoading(false);
      }
    };

    loadBookings();
  }, [session]);

  const upcoming = bookings.filter(
    (b) => b.status === 'upcoming'
  ).length;

  const pending = bookings.filter(
    (b) => b.status === 'pending'
  ).length;

  const completed = bookings.filter(
    (b) => b.status === 'completed'
  );

  const totalSpent = completed.reduce((sum, b) => {
    const n = parseInt(
      String(b.price).replace(/[^0-9]/g, ''),
      10
    );

    return sum + (isNaN(n) ? 0 : n);
  }, 0);

  if (!session) return null;

  return (
    <>
      <Header links={navLinks} />

      <div className="dashboard-wrap">
        <div className="dashboard-hero dashboard-hero-customer">
          <div className="dashboard-hero-text">
            <span className="dashboard-role-tag">
              Customer account
            </span>

            <h2 id="welcome-heading">
              Welcome back, {session.fullname.split(' ')[0]}
            </h2>

            <p>
              Find trusted artisans and keep track of every job
              you've booked.
            </p>
          </div>

          <Link
            to="/#services"
            className="btn-modal btn-book"
          >
            Book a new service
          </Link>
        </div>

        <div className="dashboard-stats-grid">
          <div className="dashboard-stat-card">
            <div
              className="dashboard-stat-value"
              id="stat-upcoming"
            >
              {upcoming}
            </div>

            <div className="dashboard-stat-label">
              Upcoming bookings
            </div>
          </div>

          <div className="dashboard-stat-card">
            <div
              className="dashboard-stat-value"
              id="stat-pending"
            >
              {pending}
            </div>

            <div className="dashboard-stat-label">
              Awaiting confirmation
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
              Completed jobs
            </div>
          </div>

          <div className="dashboard-stat-card">
            <div
              className="dashboard-stat-value"
              id="stat-spent"
            >
              KES {totalSpent.toLocaleString()}
            </div>

            <div className="dashboard-stat-label">
              Total spent
            </div>
          </div>
        </div>

        <section className="dashboard-section">
          <div className="dashboard-section-head">
            <div>
              <h3>My Bookings</h3>

              <p className="dashboard-section-subtext">
                Every service you've requested, past and upcoming.
              </p>
            </div>
          </div>

          <div className="dashboard-table-wrap">
            {loading ? (
              <p className="dashboard-empty">
                Loading your bookings...
              </p>
            ) : error ? (
              <p
                className="dashboard-empty"
                style={{ color: '#b00020' }}
              >
                {error}
              </p>
            ) : bookings.length === 0 ? (
              <p
                className="dashboard-empty"
                id="bookings-empty"
              >
                You haven't booked a service yet — browse our
                services to get started.
              </p>
            ) : (
              <table
                className="dashboard-table"
                id="bookings-table"
              >
                <thead>
                  <tr>
                    <th>Service</th>
                    <th>Artisan</th>
                    <th>Date</th>
                    <th>Price</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody id="bookings-body">
                  {bookings.map((b) => (
                    <tr key={b.id}>
                      <td>{b.service}</td>
                      <td>{b.artisanName}</td>
                      <td>{b.date}</td>
                      <td>{b.price}</td>
                      <td>
                        <span
                          className={`badge badge-${b.status}`}
                        >
                          {b.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>

        <section className="dashboard-section">
          <h3>Popular services near you</h3>

          <p className="dashboard-section-subtext">
            Quick links back to categories other customers love.
          </p>

          <div className="chip-row">
            {popularServices.map((s) => (
              <span className="chip" key={s}>
                {s}
              </span>
            ))}
          </div>
        </section>
      </div>

      <Footer />
    </>
  );
}

