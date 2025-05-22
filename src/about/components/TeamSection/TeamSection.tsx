import React from 'react';
import TeamMember from '../TeamMember/TeamMember';
import './TeamSection.css';
import Ank from '../../../assets/ank.jpg'
import Hanz from '../../../assets/Hanz.jpg'
import Kazi from '../../../assets/Kazi.jpg'
import Adrian from '../../../assets/Adrian.jpg'

const teamMembers = [
  {
    name: 'Anika Sujana',
    role: 'Backend Developer',
    bio: "SWE at Microsoft, lover of thai food, wanting to make people's lives easier one git commit at a time!",
    imageSrc: Ank
  },
  {
    name: 'Hanz De Guzman',
    role: 'Backend Developer',
    bio: "Hello I'm Hanz! I am the Backend developer and aspiring entrepreneur. I am passionate about building products that solve real-world problems.",
    imageSrc: Hanz
  },
  {
    name: 'Kazi Mansha',
    role: 'Frontend Developer',
    bio: 'Hello everyone! I am a undergraduate senior at Hunter College where I major in Computer Science and minor in Music. I enjoy playing video games and sports.',
    imageSrc: Kazi
  },
  {
    name: 'Adrian Mysliwiec',
    role: 'Frontend Developer',
    bio: 'Double major in computer science and economics with a minor in sociology. Hoping to make a product that changes the world!.',
    imageSrc: Adrian
  }
];

const TeamSection: React.FC = () => {
  return (
    <section className="team-section">
      <h2 className="team-title">Meet the Team</h2>
      <div className="team-members">
        {teamMembers.map((member) => (
          <TeamMember
            key={member.name}
            name={member.name}
            role={member.role}
            bio={member.bio}
            imageSrc={member.imageSrc}
          />
        ))}
      </div>
    </section>
  );
};

export default TeamSection;
