import React, { useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../firebase-config';
import './Sidebar.css';

interface Hobby {
  id: number;
  hobby: string;
  skill_level?: string;
  goal?: string;
}

const Sidebar: React.FC = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [hobbies, setHobbies] = useState<Hobby[]>([]);

  // 1) Dummy data array
  const dummyHobbies: Hobby[] = [
    { id: 1, hobby: 'Reading', skill_level: 'Intermediate', goal: 'Read 10 books' },
    { id: 2, hobby: 'Chess', skill_level: '', goal: 'Join local tournament' },
    { id: 3, hobby: 'Painting', skill_level: 'Advanced', goal: 'Sell an artwork' },
  ];

  // 2) Flag to toggle dummy data vs actual API
  const useDummyData = true; // Set to false when ready to connect to your real endpoint

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (useDummyData) {
      setHobbies(dummyHobbies);
    } else if (user) {
      user.getIdToken().then((idToken: string) => {
        fetch('http://localhost:5000/api/hobbies', {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        })
          .then((res) => res.json())
          .then((data: Hobby[]) => {
            setHobbies(data);
          })
          .catch((error) => {
            console.error('Error fetching hobbies:', error);
          });
      });
    }
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        setProfileImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarClick = () => {
    document.getElementById('profile-upload')?.click();
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <img
          src={
            profileImage ||
            'https://static-00.iconduck.com/assets.00/profile-default-icon-2048x2045-u3j7s5nj.png'
          }
          alt="User Avatar"
          className="sidebar-avatar"
          onClick={handleAvatarClick}
        />
        <p className="sidebar-username">{user?.email || 'Guest'}</p>
        <input
          id="profile-upload"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          style={{ display: 'none' }}
        />
      </div>

      <div className="sidebar-center">
      {hobbies.map((hobby, index) => (
    <div key={hobby.id} className="hobby-item">
      <p>Hobby #{index + 1}: {hobby.hobby || 'N/A'}</p>
      <p>Skill: {hobby.skill_level || 'N/A'}</p>
      <p>Goal: {hobby.goal || 'N/A'}</p>
    </div>
  ))}
</div>


      <div className="sidebar-suggestions">
        <button className="suggestions-button">Suggestions</button>
      </div>
    </aside>
  );
};

export default Sidebar;
