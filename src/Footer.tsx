import React, { useEffect, useState } from "react";
import "./Footer.css";

const Footer: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <footer className="footer">
      <div className="footer-container">
        <p className="footer-text">
         {currentTime.toLocaleTimeString()} Unordinary.
        </p>
        <ul className="footer-links">
          <li><a href="/privacy" className="footer-link">Who Are We</a></li>
          <li><a href="/terms" className="footer-link">Terms of Service</a></li>
          <li><a href="/contact" className="footer-link">Contact</a></li>
        </ul>
      </div>
    </footer>
  );
};

export default Footer;
