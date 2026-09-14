
import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext.jsx';

const API_URL = 'http://localhost:3000/api';

export default function ServiceModal({ service, onClose }) {
  const { session } = useAuth();
  const navigate = useNavigate();

  const today = new Date().toISOString().slice(0, 10);
  const [date, setDate] = useState(today);
  const [msg, setMsg] = useState('');
  const [msgColor, setMsgColor] = useState('#b00020');
  const [booked, setBooked] = useState(false);
  const [booking, setBooking] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', onKeyDown);

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [onClose]);

  if (!service) return null;

  const isCustomer = session && session.role === 'customer';
  const isOtherRole = session && session.role !== 'customer';

  let buttonLabel = 'Sign Up to Book';

  if (isCustomer) {
    buttonLabel = booking ? 'Booking...' : 'Confirm Booking';
  } else if (isOtherRole) {
    buttonLabel = 'Book Now';
  }

  const handleBook = async () => {
    if (!session) {
      navigate('/signup');
      return;
    }

    if (session.role !== 'customer') {
      setMsgColor('#b00020');
      setMsg('Sign in with a customer account to book a service.');
      return;
    }

    if (!date) {
      setMsgColor('#b00020');
      setMsg('Please choose a preferred date.');
      return;
    }

    setBooking(true);
    setMsg('');

    try {
      const response = await fetch(`${API_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          serviceTitle: service.title,
          price: service.price.replace(/^From\s*/i, ''),
          date,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setMsgColor('#b00020');
        setMsg(data.error || 'Unable to create booking.');
        setBooking(false);
        return;
      }

      setMsgColor('#1a6e3c');
      setMsg(
        `Booked! ${data.booking.artisanName} will confirm shortly. Redirecting to your dashboard...`
      );

      setBooked(true);

      setTimeout(() => {
        navigate('/dashboard/customer');
      }, 900);
    } catch (error) {
      console.error('Booking error:', error);

      setMsgColor('#b00020');
      setMsg('Unable to connect to the server. Please try again.');
      setBooking(false);
    }
  };

  const otherRoleNote = isOtherRole
    ? 'Sign in with a customer account to book a service.'
    : '';

  return (
    <div
      className="modal-overlay"
      id="modal-overlay"
      onClick={(e) => {
        if (e.target.id === 'modal-overlay') onClose();
      }}
    >
      <div className="modal" id="service-modal">
        <button
          className="modal-close"
          id="modal-close"
          aria-label="Close"
          onClick={onClose}
        >
          &times;
        </button>

        <div className="modal-img-wrap">
          <img
            id="modal-img"
            src={service.image}
            alt={service.title}
          />
        </div>

        <h2 id="modal-title">{service.title}</h2>

        <p id="modal-desc" className="modal-desc">
          {service.desc}
        </p>

        <div className="modal-meta">
          <span id="modal-rating" className="modal-rating">
            {service.rating}
          </span>

          <span id="modal-price" className="modal-price">
            {service.price}
          </span>

          <span id="modal-workers" className="modal-workers">
            {service.workers}
          </span>
        </div>

        {isCustomer && (
          <div className="form-group" id="modal-date-group">
            <label htmlFor="modal-date">Preferred date</label>

            <input
              type="date"
              id="modal-date"
              name="modal-date"
              min={today}
              value={date}
              onChange={(e) => setDate(e.target.value)}
              disabled={booking}
            />
          </div>
        )}

        <p
          className="form-error"
          id="modal-msg"
          role="status"
          style={{ color: msgColor }}
        >
          {msg || otherRoleNote}
        </p>

        <div className="modal-actions">
          <button
            type="button"
            id="modal-book-btn"
            className="btn-modal btn-book"
            onClick={handleBook}
            disabled={booked || booking}
          >
            {buttonLabel}
          </button>

          <Link
            to="/reviews"
            className="btn-modal btn-reviews"
          >
            See Reviews
          </Link>
        </div>
      </div>
    </div>
  );
}

