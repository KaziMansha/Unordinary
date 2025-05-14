import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { auth } from '../../../firebase-config';
import './Sidebar.css';
import axios from 'axios';
import { formatTime } from '../../../utils/timeUtils.ts';

interface Hobby {
  id: number;
  hobby: string;
  skill_level?: string;
  goal?: string;
}

interface Suggestion {
  date: string;
  hobby: string;
  description: string;
  startTime: string;
  endTime: string;
}

const Sidebar: React.FC<{ onEventAdded: () => void }> = ({ onEventAdded }) => {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [user, setUser] = useState<any>(null);
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Dummy hobby data
  const dummyHobbies: Hobby[] = [
    { id: 1, hobby: 'Reading', skill_level: 'Intermediate', goal: 'To have fun' },
    { id: 2, hobby: 'Chess', skill_level: 'Beginner', goal: 'To improve in skill' },
    { id: 3, hobby: 'Painting', skill_level: 'Advanced', goal: 'Practice' },
  ];
  const useDummyData = true;

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
          headers: { Authorization: `Bearer ${idToken}` },
        })
          .then((res) => res.json())
          .then((data: Hobby[]) => setHobbies(data))
          .catch(console.error);
      });
    }
  }, [user]);

  const generateSuggestions = async () => {
    setLoading(true);
    setError('');
    try {
      const currentUser = getAuth().currentUser;
      if (!currentUser) throw new Error('Not signed in');
      
      const token = await currentUser.getIdToken();
      const response = await axios.post<{ suggestions: Suggestion[] }>(
        'http://localhost:5000/api/generate-hobby',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.suggestions.length === 0) {
        setError('No valid suggestions found - try again!');
        return;
      }
      
      setSuggestions(response.data.suggestions);
    } catch (err) {
      console.error(err);
      setError('Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  };

  const addToCalendar = async (suggestion: Suggestion) => {
    try {
      const currentUser = getAuth().currentUser;
      if (!currentUser) throw new Error('Not signed in');
      
      const token = await currentUser.getIdToken();
      const dateParts = suggestion.date.split('-');

      await axios.post(
        'http://localhost:5000/api/events',
        {
          day: parseInt(dateParts[2]),
          month: parseInt(dateParts[1]) - 1, // Convert to 0-based month
          year: parseInt(dateParts[0]),
          title: suggestion.hobby,
          time: suggestion.startTime,
          endTime: suggestion.endTime,
          description: suggestion.description
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await axios.post(
        'http://localhost:5000/api/hobbies',
        {
          hobby_name: suggestion.hobby,
          skill_level: 'beginner',
          goal: suggestion.description
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      onEventAdded();
      setSuggestions(prev => prev.filter(s => s.date !== suggestion.date));
    } catch (err) {
      console.error(err);
      setError('Failed to add event');
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') setProfileImage(result);
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
          src={profileImage || 'https://static-00.iconduck.com/assets.00/profile-default-icon-2048x2045-u3j7s5nj.png'}
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
            <p>Hobby #{index + 1}: {hobby.hobby}</p>
            <p>Skill: {hobby.skill_level || 'N/A'}</p>
            <p>Goal: {hobby.goal || 'N/A'}</p>
          </div>
        ))}
      </div>

      <div className="sidebar-suggestions">
        <button
          className="suggestions-button"
          onClick={generateSuggestions}
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Get Smart Suggestions'}
        </button>
      </div>

      {/* Suggestions Popup */}
      {suggestions.length > 0 && (
        <div className="popup-overlay" onClick={() => setSuggestions([])}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="popup-close" onClick={() => setSuggestions([])}>
              &times;
            </button>
            <h3 style={{ marginBottom: '1rem' }}>Suggested Activities</h3>
            {suggestions.map((suggestion, index) => (
              <div key={index} style={{ marginBottom: '1rem', padding: '0.5rem', borderBottom: '1px solid #eee' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <strong>{suggestion.hobby}</strong>
                  <div style={{ textAlign: 'right' }}>
                    <div>{suggestion.date}</div>
                    <div>{formatTime(suggestion.startTime)} - {formatTime(suggestion.endTime)}</div>
                  </div>
                </div>
                <p style={{ marginBottom: '0.5rem' }}>{suggestion.description}</p>
                <button
                  onClick={() => addToCalendar(suggestion)}
                  style={{
                    width: '100%',
                    padding: '0.25rem',
                    background: '#7c5dfa',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  Add to Calendar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && (
        <div className="popup-overlay" onClick={() => setError('')}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <button className="popup-close" onClick={() => setError('')}>
              &times;
            </button>
            <p style={{ color: 'red' }}>{error}</p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;