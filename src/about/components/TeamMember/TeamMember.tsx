import React from 'react';
import './TeamMember.css';

interface TeamMemberProps {
  name: string;
  role: string;
  bio: string;
  imageSrc: string;
}

const TeamMember: React.FC<TeamMemberProps> = ({ name, role, bio, imageSrc }) => {
  return (
    <div className="team-member">
      <img src={imageSrc} alt={name} className="member-photo" />
      <h3 className="member-name">{name}</h3>
      <p className="member-role">{role}</p>
      <p className="member-bio">{bio}</p>
    </div>
  );
};

export default TeamMember;
