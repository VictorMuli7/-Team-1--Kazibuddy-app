import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { useAuth } from '../lib/AuthContext.jsx';
import { API_URL, apiFetch } from '../lib/api';

const navLinks = [
  { to: '/#services', label: 'Services' },
  { to: '/reviews', label: 'Reviews' },
];

export default function DashboardArtisanClinic() {
  const { session } = useAuth();
  const navigate = useNavigate();

  const today = new Date();
  const minAppointmentDate = [
    today.getFullYear(),
    String(today.getMonth() + 1).padStart(2, '0'),
    String(today.getDate()).padStart(2, '0'),
  ].join('-');

  const [appointments, setAppointments] = useState([]);
  const [department, setDepartment] = useState('');
  const [date, setDate] = useState('');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [recovering, setRecovering] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const loadAppointments = useCallback(async () => {
    try {
      const response = await apiFetch(`${API_URL}/appointments`, {
        credentials: 'include',
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Unable to load your clinic appointments.');
      }

      setAppointments(data.appointments);
    } catch (err) {
      console.error('Appointment loading error:', err);
      setError(err.message || 'Unable to load your clinic appointments.');
    }
  }, []);

  useEffect(() => {
    if (!session) {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      await loadAppointments();
      setLoading(false);
    };

    load();
  }, [session, loadAppointments]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');
    setSubmitting(true);

    try {
      const response = await apiFetch(`${API_URL}/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ department, date }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Unable to book your clinic appointment.');
      }

      setAppointments((current) => [data.appointment, ...current]);
      setDepartment('');
      setDate('');
      setMessage('Your appointment request has been submitted.');
    } catch (err) {
      console.error('Appointment booking error:', err);
      setError(err.message || 'Unable to book your clinic appointment.');
    } finally {
      setSubmitting(false);
    }
  };

  // Lets the artisan clear their injured status and go back to work
  const handleRecovered = async () => {
    setError('');
    setRecovering(true);

    try {
      const response = await apiFetch(`${API_URL}/users/me`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ injured: false }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.error || 'Unable to update your status.');
      }

      navigate('/dashboard/artisan');
    } catch (err) {
      console.error('Recovery update error:', err);
      setError(err.message || 'Unable to update your status.');
      setRecovering(false);
    }
  };

  if (!session) return null;

  if (loading) {
    return (
      <>
        <Header links={navLinks} />
        <div className="dashboard-wrap">
          <p className="dashboard-empty">Loading your clinic dashboard...</p>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header links={navLinks} />

      <div className="dashboard-wrap">
        <div className="dashboard-hero dashboard-hero-artisan">
          <div className="dashboard-hero-text">
            <span className="dashboard-role-tag">Artisan account</span>
            <h2>Clinic dashboard</h2>
            <p>
              Sorry to hear you're injured, {session.fullname.split(' ')[0]}.
              Book a hospital appointment below.
            </p>
          </div>
        </div>

        <p style={{ marginTop: '16px' }}>
          <Link to="/dashboard/artisan">&larr; Back to artisan dashboard</Link>
        </p>

        <section className="dashboard-section">
          <h3>Book a clinic appointment</h3>
          <p className="dashboard-section-subtext">
            Choose a department and date to submit an appointment request.
          </p>

          <form className="dashboard-form" onSubmit={handleSubmit}>
            <div className="dashboard-form-row">
              <div className="form-group">
                <label htmlFor="appointment-department">Department</label>
                <select
                  id="appointment-department"
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                >
                  <option value="" disabled>Select a department</option>
                  <option value="General OPD">General OPD</option>
                  <option value="Dental">Dental</option>
                  <option value="Pediatrics">Pediatrics</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="appointment-date">Appointment date</label>
                <input
                  id="appointment-date"
                  type="date"
                  required
                  min={minAppointmentDate}
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            {error && <p className="form-error" role="alert">{error}</p>}
            {message && <p className="form-success" role="status">{message}</p>}

            <button
              type="submit"
              className="btn-submit"
              disabled={submitting}
              style={{ width: 'auto', padding: '0.7rem 1.6rem' }}
            >
              {submitting ? 'Submitting...' : 'Request appointment'}
            </button>
          </form>
        </section>

        <section className="dashboard-section">
          <h3>My clinic appointments</h3>
          <div className="dashboard-table-wrap">
            {appointments.length === 0 ? (
              <p className="dashboard-empty">You have no clinic appointments yet.</p>
            ) : (
              <table className="dashboard-table">
                <thead>
                  <tr>
                    <th>Department</th>
                    <th>Date</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {appointments.map((appointment) => (
                    <tr key={appointment.id}>
                      <td>{appointment.department}</td>
                      <td>{appointment.date}</td>
                      <td>
                        <span className={`badge badge-${appointment.status}`}>
                          {appointment.status}
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
          <h3>Feeling better?</h3>
          <p className="dashboard-section-subtext">
            Clear your injured status to go back to normal listing mode.
          </p>
          <button
            type="button"
            className="btn-sm btn-outline"
            disabled={recovering}
            onClick={handleRecovered}
          >
            {recovering ? 'Updating...' : "I'm no longer injured"}
          </button>
        </section>
      </div>

      <Footer />
    </>
  );
}
