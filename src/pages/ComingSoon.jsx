import React from 'react';
import useSEO from '../hooks/useSEO';
import './ComingSoon.css';

const ComingSoon = () => {
  useSEO({
    title: 'Coming Soon | Roomhy',
    description: 'We are polishing final details to bring you a new era of co-living.',
    canonical: 'https://roomhy.com/coming-soon',
    robots: 'noindex, follow'
  });

  return (
    <div className="coming-soon-container">
      <div className="coming-soon-background"></div>
      <div className="coming-soon-overlay"></div>
      
      <div className="coming-soon-content animate-fade-in">
        <div className="logo-container">
          <span className="logo-accent">Room</span>
          <span className="logo-main">hy</span>
        </div>
        
        <h1 className="coming-soon-title">
          A New Era of <span className="text-gradient">Co-Living</span> is Coming
        </h1>
        
        <p className="coming-soon-subtitle">
          We are polishing the final details to bring you the easiest, most premium way to find and book student housing, hosteling, and premium PGs.
        </p>

        <div className="features-highlight">
          <div className="feature-pill">✨ Premium Spaces</div>
          <div className="feature-pill">⚡ Direct Booking</div>
          <div className="feature-pill">🛡️ Verified Hosts</div>
        </div>



        {/* Social Links */}
        <div className="social-links">
          <a href="#" className="social-link" aria-label="Facebook">
            <span className="social-icon">fb</span>
          </a>
          <a href="#" className="social-link" aria-label="Instagram">
            <span className="social-icon">ig</span>
          </a>
          <a href="#" className="social-link" aria-label="Twitter">
            <span className="social-icon">tw</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default ComingSoon;
