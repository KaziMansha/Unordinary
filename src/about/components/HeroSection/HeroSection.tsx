import React from 'react';
import './HeroSection.css';
import UnordinaryMission from '../../../assets/Unordinary_Mission.png'

const HeroSection: React.FC = () => {
  return (
    <section className="hero-section">
      <div className="hero-content">
        <h1 className="hero-title">Unordinary: Break the Routine</h1>
        <p className="hero-subtitle">
          Unordinary is an AI-driven calendar that turns your downtime into exciting new adventures.
          Say goodbye to boring weekends – our smart suggestions will help you explore new hobbies
          and activities tailored just for you!
        </p>
      </div>
      <div className="hero-image">
        <img
          src={UnordinaryMission}
          alt="AI-driven calendar planning"
        />
      </div>
    </section>
  );
};

export default HeroSection;
