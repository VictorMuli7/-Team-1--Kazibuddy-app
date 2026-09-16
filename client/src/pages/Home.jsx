import { useEffect, useRef, useState } from 'react';
import Header from '../components/Header.jsx';
import Footer from '../components/Footer.jsx';
import ServiceModal from '../components/ServiceModal.jsx';
import { services } from '../data/services.js';

const navLinks = [
  { to: '/#about', label: 'About' },
  { to: '/#services', label: 'Services' },
  { to: '/#why', label: 'Why Us' },
  { to: '/#steps', label: 'How to Join' },
  { to: '/reviews', label: 'Reviews' },
];

function AnimatedCounter({ target, duration = 1600 }) {
  const [value, setValue] = useState(0);
  const started = useRef(false);

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const step = target / (duration / 16);
    let start = 0;
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        start = target;
        clearInterval(timer);
      }
      setValue(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration]);

  return <>{value.toLocaleString()}</>;
}

export default function Home() {
  const [activeService, setActiveService] = useState(null);

  return (
    <>
      <Header links={navLinks} />

      <div className="stats-bar">
        <div className="stat-item">
          <span className="stat-number" id="stat-workers"><AnimatedCounter target={1240} /></span>
          <span className="stat-label">Workers Registered</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-number" id="stat-jobs"><AnimatedCounter target={8530} /></span>
          <span className="stat-label">Jobs Completed</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-number">4.8 ⭐</span>
          <span className="stat-label">Average Rating</span>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <span className="stat-number">8</span>
          <span className="stat-label">Service Categories</span>
        </div>
      </div>

      <div className="ad-banner ad-banner-leaderboard">
        <div className="ad-banner-label">Advertisement</div>
        <div className="ad-banner-slot">728 × 90 Ad Space</div>
      </div>

      <section id="about" className="card">
        <h2>About Jua Kali☀️</h2>
        <p>
          We connect skilled artisans with customers looking for quality
          handmade services and products. From plumbing to hair styling, find
          verified professionals near you — fast, affordable, and reliable.
        </p>
      </section>

      <div className="card-container">
        <div id="services" className="card">
          <h3 className="services-heading">Our Services</h3>
          <p className="services-subtext">Click any service to book or learn more</p>
          <div className="services-grid" id="services-grid">
            {services.map((service) => (
              <div
                key={service.title}
                className="service-card"
                role="button"
                tabIndex={0}
                title={`Learn more about ${service.title}`}
                onClick={() => setActiveService(service)}
                onKeyDown={(e) => { if (e.key === 'Enter') setActiveService(service); }}
              >
                <img src={service.image} alt={service.title} />
                <h3>{service.title}</h3>
                <p className="service-card-rating">{service.rating.split(' (')[0]}</p>
                <p className="service-card-price">{service.price}</p>
                <span className="service-card-cta">Book →</span>
              </div>
            ))}
          </div>
        </div>

        <div id="why" className="card">
          <h2>Why Choose Us</h2>
          <div className="why-grid">
            <div className="why-item">✔ Verified professionals</div>
            <div className="why-item">✔ Affordable prices</div>
            <div className="why-item">✔ Reliable service</div>
            <div className="why-item">✔ Quality workmanship</div>
            <div className="why-item">✔ Rated by real customers</div>
            <div className="why-item">✔ Fast response times</div>
          </div>
        </div>

        <div id="steps" className="card">
          <h2>How to Join Jua Kali</h2>
          <ol>
            <li>Create an account</li>
            <li>Set up your profile</li>
            <li>List your services and provide proof</li>
            <li>Start getting customers</li>
          </ol>
        </div>
      </div>

      {activeService && (
        <ServiceModal service={activeService} onClose={() => setActiveService(null)} />
      )}

      <section className="card sponsors-section">
        <h2>Our Sponsors</h2>
        <p>Interested in sponsoring Jua Kali? Get your brand in front of thousands of customers and artisans.</p>
        <div className="sponsors-grid">
          <div className="sponsor-slot">Sponsor Slot 1</div>
          <div className="sponsor-slot">Sponsor Slot 2</div>
          <div className="sponsor-slot">Sponsor Slot 3</div>
          <div className="sponsor-slot">Sponsor Slot 4</div>
        </div>
      </section>

      <div className="ad-banner ad-banner-leaderboard">
        <div className="ad-banner-label">Advertisement</div>
        <div className="ad-banner-slot">728 × 90 Ad Space</div>
      </div>

      <Footer withSocial />
    </>
  );
}
