import React from 'react';
import HeroSection from './components/HeroSection/HeroSection';
import MissionStatement from './components/MissionStatement/MissionStatement';
import ValuesSection from './components/ValuesSection/ValuesSection';
import TeamSection from './components/TeamSection/TeamSection';
import { NavBar } from '../home/components/Navbar/Navbar';
import { Footer } from '../home/components/Footer/Footer';

const About: React.FC = () => {
  return (
    <div className="about-page">
      <NavBar />
      <HeroSection />
      <MissionStatement />
      <ValuesSection />
      <TeamSection />
      <Footer />
    </div>
  );
};

export default About;
