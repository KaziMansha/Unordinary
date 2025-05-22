import React from 'react';
import './CalendarCard.css';

interface CalendarCardProps {
  title: string;
  description: string;
  imageUrl?: string;
}

export function CalendarCard({ title, description, imageUrl }: CalendarCardProps) {
  return (
    <div className="calendar-card">
      <div className="calendar-image">
        {imageUrl ? (
          <img src={imageUrl} alt={title} />
        ) : (
          <div className="calendar-placeholder" />
        )}
      </div>
      <h3 className="calendar-title">{title}</h3>
      <p style={{ whiteSpace: 'pre-line' }} className="calendar-description">{description}</p>
    </div>
  );
}
