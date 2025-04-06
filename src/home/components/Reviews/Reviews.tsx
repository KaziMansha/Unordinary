import React from 'react';
import './Reviews.css';

interface ReviewsProps {
  userName: string;
  text: string;
  userSince?: string;
  userImage?: string;
}

export function Reviews({ userName, text, userSince, userImage }: ReviewsProps) {
  return (
    <div className="review-card">
      <div className="review-quote">“{text}”</div>
      
      <div className="review-user">
        <img
          src={userImage || 'https://via.placeholder.com/50'}
          alt="User Avatar"
        />
        <div>
          <p className="review-username">{userName}</p>
          {userSince && (
            <p className="review-userSince">User since {userSince}</p>
          )}
        </div>
      </div>
    </div>
  );
}
