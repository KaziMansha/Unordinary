import React from 'react';
import './ValueCard.css';

interface ValueCardProps {
  imageSrc: string;
  title: string;
  description: string;
}

const ValueCard: React.FC<ValueCardProps> = ({ imageSrc, title, description }) => {
  return (
    <div className="value-card">
      <img src={imageSrc} alt={title} className="value-icon" />
      <h3 className="value-title">{title}</h3>
      <p className="value-description">{description}</p>
    </div>
  );
};

export default ValueCard;
