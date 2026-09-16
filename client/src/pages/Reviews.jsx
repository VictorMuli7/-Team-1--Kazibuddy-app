import { useState, useEffect, useMemo } from 'react';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import { seedReviews, categoryData } from '../data/reviews.js';

const API_URL = 'http://localhost:3000/api';

const navLinks = [
  { to: '/#about', label: 'About' },
  { to: '/#services', label: 'Services' },
  { to: '/#why', label: 'Why Us' },
  { to: '/#steps', label: 'How to Join' },
  { to: '/reviews', label: 'Reviews' },
];

const filterCategories = [
  { value: 'all', label: 'All Services' },
  { value: 'Laundry', label: 'Laundry' },
  { value: 'Cleaning', label: 'Home & Office Cleaning' },
  { value: 'Electrical', label: 'Electrical' },
  { value: 'Gardening', label: 'Gardening' },
  { value: 'Hair Styling', label: 'Hair Styling' },
  { value: 'Barber', label: 'Barber' },
  { value: 'Plumbing', label: 'Plumbing' },
  { value: 'Cooking', label: 'Cooking' },
];

export default function Reviews() {
  const [storedReviews, setStoredReviews] = useState([]);
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStars, setFilterStars] = useState('all');

  const [name, setName] = useState('');
  const [category, setCategory] = useState('');
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);

  // Load reviews from the Express/SQLite backend
  useEffect(() => {
    async function loadReviews() {
      try {
        const response = await fetch(`${API_URL}/reviews`);
        const data = await response.json();

        if (!response.ok || !data.ok) {
          throw new Error(data.error || 'Unable to load reviews.');
        }

        setStoredReviews(data.reviews || []);
      } catch (error) {
        console.error('Reviews loading error:', error);
        setError('Unable to load reviews from the server.');
      } finally {
        setLoading(false);
      }
    }

    loadReviews();
  }, []);

  const allReviews = useMemo(
    () => [...storedReviews, ...seedReviews],
    [storedReviews]
  );

  const filtered = useMemo(() => {
    let list = allReviews;

    if (filterCategory !== 'all') {
      list = list.filter((r) => r.category === filterCategory);
    }

    if (filterStars !== 'all') {
      list = list.filter(
        (r) => Number(r.stars) === parseInt(filterStars, 10)
      );
    }

    return list;
  }, [allReviews, filterCategory, filterStars]);

  const handleSubmit = async () => {
    setError('');
    setSuccess(false);

    if (!name.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (!category) {
      setError('Please select a service.');
      return;
    }

    if (!rating) {
      setError('Please select a star rating.');
      return;
    }

    if (text.trim().length < 10) {
      setError('Please write at least 10 characters in your review.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: name.trim(),
          category,
          stars: rating,
          text: text.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.ok) {
        setError(data.error || 'Unable to submit review.');
        return;
      }

      // Add the newly created review to the displayed list
      setStoredReviews((current) => [data.review, ...current]);

      setName('');
      setCategory('');
      setText('');
      setRating(0);
      setHoverRating(0);
      setSuccess(true);
    } catch (error) {
      console.error('Review submission error:', error);
      setError('Unable to connect to the server. Please try again.');
    }
  };

  return (
    <>
      <Header links={navLinks} />

      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-number">1,240</span>
          <span className="stat-label">Workers Registered</span>
        </div>

        <div className="stat-divider"></div>

        <div className="stat-item">
          <span className="stat-number">8,530</span>
          <span className="stat-label">Jobs Completed</span>
        </div>

        <div className="stat-divider"></div>

        <div className="stat-item">
          <span className="stat-number">4.8 ⭐</span>
          <span className="stat-label">Average Rating</span>
        </div>

        <div className="stat-divider"></div>

        <div className="stat-item">
          <span className="stat-number">2,104</span>
          <span className="stat-label">Total Reviews</span>
        </div>
      </div>

      <div className="ad-banner ad-banner-leaderboard">
        <div className="ad-banner-label">Advertisement</div>
        <div className="ad-banner-slot">728 × 90 Ad Space</div>
      </div>

      <section className="card reviews-hero-card">
        <h2>Reviews &amp; Ratings ⭐</h2>
        <p>Real feedback from real customers across all our service categories.</p>

        <div className="rating-summary">
          <div className="rating-big">4.8</div>
          <div className="rating-stars-big">★★★★★</div>
          <div className="rating-count">Based on 2,104 reviews</div>

          <div className="rating-bars">
            <div className="bar-row">
              <span>5★</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: '78%' }}></div>
              </div>
              <span>78%</span>
            </div>

            <div className="bar-row">
              <span>4★</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: '14%' }}></div>
              </div>
              <span>14%</span>
            </div>

            <div className="bar-row">
              <span>3★</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: '5%' }}></div>
              </div>
              <span>5%</span>
            </div>

            <div className="bar-row">
              <span>2★</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: '2%' }}></div>
              </div>
              <span>2%</span>
            </div>

            <div className="bar-row">
              <span>1★</span>
              <div className="bar-track">
                <div className="bar-fill bar-fill-low" style={{ width: '1%' }}></div>
              </div>
              <span>1%</span>
            </div>
          </div>
        </div>
      </section>

      <div className="card-container">
        <div className="card reviews-controls-card">
          <div className="reviews-controls">
            <div className="filter-group">
              <label htmlFor="filter-category">
                Filter by service:
              </label>

              <select
                id="filter-category"
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
              >
                {filterCategories.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="filter-group">
              <label htmlFor="filter-stars">
                Filter by rating:
              </label>

              <select
                id="filter-stars"
                value={filterStars}
                onChange={(e) => setFilterStars(e.target.value)}
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars</option>
                <option value="4">4 Stars</option>
                <option value="3">3 Stars</option>
                <option value="2">2 Stars</option>
                <option value="1">1 Star</option>
              </select>
            </div>
          </div>
        </div>

        <div className="card" id="reviews-list-card">
          <div id="reviews-list">
            {loading ? (
              <p style={{ textAlign: 'center', color: '#555' }}>
                Loading reviews...
              </p>
            ) : (
              filtered.map((r, i) => (
                <div className="review-card" key={r.id ?? `${r.name}-${r.date}-${i}`}>
                  <div className="review-header">
                    <span className="review-name">{r.name}</span>
                    <span className="review-category">{r.category}</span>
                    <span className="review-stars">
                      {'★'.repeat(Number(r.stars)) +
                        '☆'.repeat(5 - Number(r.stars))}
                    </span>
                    <span className="review-date">{r.date}</span>
                  </div>

                  <p className="review-text">{r.text}</p>
                </div>
              ))
            )}
          </div>

          {!loading && filtered.length === 0 && (
            <p
              id="no-reviews-msg"
              style={{ textAlign: 'center', color: '#555' }}
            >
              No reviews match your filters.
            </p>
          )}
        </div>

        <div className="card review-form-card">
          <h3>Leave a Review</h3>
          <p>Worked with a Jua Kali professional? Share your experience!</p>

          <div className="form-group">
            <label htmlFor="rev-name">Your name</label>

            <input
              type="text"
              id="rev-name"
              placeholder="e.g. Amina W."
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>

          <div className="form-group">
            <label htmlFor="rev-category">Service</label>

            <select
              id="rev-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              <option value="" disabled>
                Select a service
              </option>
              <option>Laundry</option>
              <option>Cleaning</option>
              <option>Electrical</option>
              <option>Gardening</option>
              <option>Hair Styling</option>
              <option>Barber</option>
              <option>Plumbing</option>
              <option>Cooking</option>
            </select>
          </div>

          <div className="form-group">
            <label>Rating</label>

            <div className="star-picker" id="star-picker">
              {[1, 2, 3, 4, 5].map((val) => (
                <span
                  key={val}
                  className={`star ${val <= rating ? 'star-active' : ''
                    } ${val <= hoverRating ? 'star-hover' : ''
                    }`}
                  onClick={() => setRating(val)}
                  onMouseOver={() => setHoverRating(val)}
                  onMouseOut={() => setHoverRating(0)}
                >
                  ★
                </span>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="rev-text">Your review</label>

            <textarea
              id="rev-text"
              rows={4}
              placeholder="Describe your experience..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <p className="form-error" id="rev-error">
            {error}
          </p>

          <button className="btn-submit" onClick={handleSubmit}>
            Submit Review
          </button>

          {success && (
            <p className="form-success" id="rev-success">
              Thank you! Your review has been submitted.
            </p>
          )}
        </div>
      </div>

      <div
        className="card"
        style={{ maxWidth: '900px', margin: '0 auto 20px' }}
      >
        <h3 style={{ textAlign: 'center', marginBottom: '20px' }}>
          Ratings by Service Category
        </h3>

        <div className="category-ratings" id="category-ratings">
          {categoryData.map((c) => (
            <div className="cat-rating-item" key={c.name}>
              <span className="cat-rating-name">{c.name}</span>

              <div className="cat-rating-bar-wrap">
                <div
                  className="cat-rating-bar"
                  style={{ width: `${(c.rating / 5) * 100}%` }}
                ></div>
              </div>

              <span className="cat-rating-val">
                {c.rating} ⭐ ({c.count})
              </span>
            </div>
          ))}
        </div>
      </div>

      <section className="card sponsors-section">
        <h2>Our Sponsors</h2>
        <p>
          Interested in sponsoring Jua Kali? Get your brand in front of
          thousands of customers and artisans.
        </p>

        <div className="sponsors-grid">
          <div className="sponsor-slot">Sponsor Slot 1</div>
          <div className="sponsor-slot">Sponsor Slot 2</div>
          <div className="sponsor-slot">Sponsor Slot 3</div>
          <div className="sponsor-slot">Sponsor Slot 4</div>
        </div>
      </section>

      <Footer withSocial />
    </>
  );
}