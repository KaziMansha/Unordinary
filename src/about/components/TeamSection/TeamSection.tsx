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
    role: 'Student #1',
    bio: 'Enter short bio',
    imageSrc: Ank
  },
  {
    name: 'Hanz De Guzman',
    role: 'Student #2',
    bio: 'Enter short bio',
    imageSrc: Hanz
  },
  {
    name: 'Kazi Mansha',
    role: 'Student #3',
    bio: 'Enter short bio',
    imageSrc: Kazi
  },
  {
    name: 'Adrian Mysliweic',
    role: 'Student #4',
    bio: 'Enter short bio',
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
