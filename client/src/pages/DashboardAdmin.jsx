import { useState, useEffect, useCallback } from 'react';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { useAuth } from '../lib/AuthContext.jsx';

const API_URL = 'http://localhost:3000/api';

const navLinks = [
  { to: '/#services', label: 'Services' },
  { to: '/reviews', label: 'Reviews' },
];

export default function DashboardAdmin() {
  const { session } = useAuth();

  const [users, setUsers] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [roleFilter, setRoleFilter] = useState('all');

  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    if (!session) return;

    try {
      setError('');

      const [usersResponse, bookingsResponse] = await Promise.all([
        fetch(`${API_URL}/users`, {
          credentials: 'include',
        }),
        fetch(`${API_URL}/bookings`, {
          credentials: 'include',
        }),
      ]);

      const usersData = await usersResponse.json();
      const bookingsData = await bookingsResponse.json();

      if (!usersResponse.ok || !usersData.ok) {
        throw new Error(
          usersData.error || 'Unable to load users.'
        );
      }

      if (!bookingsResponse.ok || !bookingsData.ok) {
        throw new Error(
          bookingsData.error || 'Unable to load bookings.'
        );
      }

      setUsers(usersData.users);

      const sortedBookings = [...bookingsData.bookings].sort(
        (a, b) => (a.date < b.date ? 1 : -1)
      );

      setBookings(sortedBookings);
    } catch (err) {
      console.error('Admin dashboard loading error:', err);
      setError(
        err.message || 'Unable to load admin dashboard data.'
      );
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!session) return null;

  if (loading) {
    return (
      <>
        <Header links={navLinks} />

        <div className="dashboard-wrap">
          <p className="dashboard-empty">
            Loading admin dashboard...
          </p>
        </div>

        <Footer />
      </>
    );
  }

  const filteredUsers =
    roleFilter === 'all'
      ? users
      : users.filter((u) => u.role === roleFilter);

  const pendingVerification = users.filter(
    (u) => u.role === 'artisan' && !u.verified
  ).length;

  const suspended = users.filter(
    (u) => u.status === 'suspended'
  ).length;

  const handleUserAction = async (id, action) => {
    const statusMap = {
      suspend: 'suspended',
      activate: 'active',
    };

    const target = users.find((u) => u.id === id);

    if (!target) return;

    let body = {};

    if (action === 'verify') {
      body = { verified: true };
    }

    if (action === 'suspend') {
      body = { status: statusMap.suspend };
    }

    if (action === 'activate') {
      body = { status: statusMap.activate };
    }

    setActionLoading(true);
    setError('');

    try {
      const response = await fetch(
        `${API_URL}/users/${id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(body),
        }
      );

      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(
          data.error || 'Unable to update user.'
        );
      }

      await loadData();
    } catch (err) {
      console.error('User action error:', err);

      setError(
        err.message || 'Unable to update user.'
      );
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <>
      <Header links={navLinks} />

      <div className="dashboard-wrap">

        <div className="dashboard-hero dashboard-hero-admin">
          <div className="dashboard-hero-text">

            <span className="dashboard-role-tag">
              Admin account
            </span>

            <h2 id="welcome-heading">
              Welcome back, {session.fullname.split(' ')[0]}
            </h2>

            <p>
              Platform-wide view of users, artisan verification
              and bookings.
            </p>

          </div>
        </div>

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
              id="stat-total-users"
            >
              {users.length}
            </div>

            <div className="dashboard-stat-label">
              Total users
            </div>
          </div>

          <div className="dashboard-stat-card">
            <div
              className="dashboard-stat-value"
              id="stat-pending-verification"
            >
              {pendingVerification}
            </div>

            <div className="dashboard-stat-label">
              Artisans pending verification
            </div>
          </div>

          <div className="dashboard-stat-card">
            <div
              className="dashboard-stat-value"
              id="stat-total-bookings"
            >
              {bookings.length}
            </div>

            <div className="dashboard-stat-label">
              Total bookings
            </div>
          </div>

          <div className="dashboard-stat-card">
            <div
              className="dashboard-stat-value"
              id="stat-suspended"
            >
              {suspended}
            </div>

            <div className="dashboard-stat-label">
              Suspended accounts
            </div>
          </div>

        </div>

        <section className="dashboard-section">

          <div className="dashboard-section-head">
            <div>

              <h3>User Management</h3>

              <p className="dashboard-section-subtext">
                Verify artisans, suspend or reactivate accounts.
              </p>

            </div>
          </div>

          <div className="dashboard-filter-row">

            <div className="filter-group">

              <label
                htmlFor="role-filter"
                style={{ color: '#384959' }}
              >
                Filter by role
              </label>

              <select
                id="role-filter"
                value={roleFilter}
                onChange={(e) =>
                  setRoleFilter(e.target.value)
                }
              >
                <option value="all">All roles</option>
                <option value="artisan">Artisans</option>
                <option value="customer">Customers</option>
                <option value="admin">Admins</option>
              </select>

            </div>

          </div>

          <div className="dashboard-table-wrap">

            <table
              className="dashboard-table"
              id="users-table"
            >

              <thead>
                <tr>
                  <th>Name</th>
                  <th>Role</th>
                  <th>Skill</th>
                  <th>Joined</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>

              <tbody id="users-body">

                {filteredUsers.map((u) => (
                  <tr key={u.id}>

                    <td>
                      {u.fullname}
                      <br />

                      <span
                        style={{
                          color: '#888',
                          fontSize: '0.78rem',
                        }}
                      >
                        {u.email}
                      </span>
                    </td>

                    <td
                      style={{
                        textTransform: 'capitalize',
                      }}
                    >
                      {u.role}
                    </td>

                    <td>
                      {u.skill || '—'}
                    </td>

                    <td>
                      {u.joined}
                    </td>

                    <td>

                      <span
                        className={`badge badge-${u.status}`}
                      >
                        {u.status}
                      </span>

                      {u.role === 'artisan' && (
                        <>
                          {' '}

                          <span
                            className={`badge badge-${u.verified
                                ? 'verified'
                                : 'unverified'
                              }`}
                          >
                            {u.verified
                              ? 'verified'
                              : 'unverified'}
                          </span>
                        </>
                      )}

                    </td>

                    <td>

                      <div className="dashboard-actions-cell">

                        {u.role === 'artisan' &&
                          !u.verified &&
                          u.status !== 'suspended' && (
                            <button
                              className="btn-sm btn-verify"
                              disabled={actionLoading}
                              onClick={() =>
                                handleUserAction(
                                  u.id,
                                  'verify'
                                )
                              }
                            >
                              Verify
                            </button>
                          )}

                        {u.status === 'suspended' ? (
                          <button
                            className="btn-sm btn-activate"
                            disabled={actionLoading}
                            onClick={() =>
                              handleUserAction(
                                u.id,
                                'activate'
                              )
                            }
                          >
                            Reactivate
                          </button>
                        ) : (
                          u.role !== 'admin' && (
                            <button
                              className="btn-sm btn-suspend"
                              disabled={actionLoading}
                              onClick={() =>
                                handleUserAction(
                                  u.id,
                                  'suspend'
                                )
                              }
                            >
                              Suspend
                            </button>
                          )
                        )}

                        {!(
                          u.role === 'artisan' &&
                          !u.verified &&
                          u.status !== 'suspended'
                        ) &&
                          u.status !== 'suspended' &&
                          u.role === 'admin' &&
                          '—'}

                      </div>

                    </td>

                  </tr>
                ))}

              </tbody>

            </table>

          </div>

        </section>

        <section className="dashboard-section">

          <h3>Recent Bookings</h3>

          <p className="dashboard-section-subtext">
            Latest activity across the whole platform.
          </p>

          <div className="dashboard-table-wrap">

            <table
              className="dashboard-table"
              id="bookings-table"
            >

              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Artisan</th>
                  <th>Service</th>
                  <th>Date</th>
                  <th>Price</th>
                  <th>Status</th>
                </tr>
              </thead>

              <tbody id="bookings-body">

                {bookings.map((b) => (
                  <tr key={b.id}>

                    <td>{b.customerName}</td>

                    <td>{b.artisanName}</td>

                    <td>{b.service}</td>

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

          </div>

        </section>

      </div>

      <Footer />
    </>
  );
}