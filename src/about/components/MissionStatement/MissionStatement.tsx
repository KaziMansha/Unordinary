import React from 'react';
import './MissionStatement.css';

const MissionStatement: React.FC = () => {
  return (
    <section className="mission-section">
      <div className="mission-image">
        <img
          src="https://images.pexels.com/photos/3184339/pexels-photo-3184339.jpeg"
          alt="Teamwork and planning"
        />
      </div>
      <div className="mission-content">
        <h2 className="mission-title">Our Mission</h2>
        <p className="mission-text">
          At Unordinary, our mission is to sprinkle a little extra fun into your everyday life.
          We believe that downtime should be anything but dull. Powered by AI, we suggest exciting
          new hobbies and getaways so you can make the most of your free time.
          <br /><br />
          Unordinary: making every day feel a little more extraordinary!
        </p>
      </div>
    </section>
  );
};

export default MissionStatement;
