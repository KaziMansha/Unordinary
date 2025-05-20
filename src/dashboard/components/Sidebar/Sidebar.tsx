// /src/dashboard/components/Sidebar/Sidebar.tsx
import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { auth } from '../../../firebase-config';
import './Sidebar.css';
import axios from 'axios';

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
}

interface SidebarProps {
  onEventAdded: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onEventAdded }) => {
  const navigate = useNavigate();

  /* user & avatar */
  const [user, setUser] = useState<any>(null);
  const [profileImage, setProfileImage] = useState<string | null>(null);

  /* hobbies */
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [hobbyLoading, setHobbyLoading] = useState(false);

  /* show/collapse extra hobbies */
  const [showAll, setShowAll] = useState(false);

  /* smart suggestions */
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);

  /* errors */
  const [error, setError] = useState('');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, u => setUser(u));
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchHobbies = async () => {
      if (!user) return;
      setHobbyLoading(true);
      try {
        const token = await user.getIdToken();
        const res = await axios.get<Hobby[]>('http://localhost:5000/api/hobbies', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHobbies(res.data);
      } catch (err) {
        console.error(err);
        setError('Failed to load hobbies');
      } finally {
        setHobbyLoading(false);
      }
    };
    fetchHobbies();
  }, [user]);

  const generateSuggestions = async () => {
    setLoading(true);
    setError('');
    try {
      const current = getAuth().currentUser;
      if (!current) throw new Error('Not signed in');
      const token = await current.getIdToken();
      const res = await axios.post<{ suggestions: Suggestion[] }>(
        'http://localhost:5000/api/generate-hobby',
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuggestions(res.data.suggestions);
    } catch (err) {
      console.error(err);
      setError('Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  };

  const addToCalendar = async (s: Suggestion) => {
    try {
      const current = getAuth().currentUser;
      if (!current) throw new Error('Not signed in');
      const token = await current.getIdToken();
      const [year, month, day] = s.date.split('-').map(Number);
      await axios.post(
        'http://localhost:5000/api/events',
        { day, month: month - 1, year, title: s.hobby, time: '18:00', description: s.description },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      onEventAdded();
      setSuggestions(prev => prev.filter(x => x !== s));
    } catch (err) {
      console.error(err);
      setError('Failed to add event');
    }
  };

  const pickFile = () => document.getElementById('profile-upload')?.click();
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = ev => {
      if (typeof ev.target?.result === 'string') {
        setProfileImage(ev.target.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Determine which hobbies to show
  const visibleHobbies = showAll ? hobbies : hobbies.slice(0, 3);
  const extraCount = hobbies.length - 3;

  return (
    <aside className="sidebar">
      {/* Top: Avatar & Email */}
      <div className="sidebar-top">
        <img
          src={
            profileImage ||
            'https://static-00.iconduck.com/assets.00/profile-default-icon-2048x2045-u3j7s5nj.png'
          }
          alt="avatar"
          className="sidebar-avatar"
          onClick={pickFile}
        />
        <p className="sidebar-username">{user?.email || 'Guest'}</p>
        <input
          id="profile-upload"
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          hidden
        />
      </div>

      {/* Hobbies List */}
      <div className="sidebar-center">
        {hobbyLoading ? (
          <p>Loading hobbies…</p>
        ) : hobbies.length === 0 ? (
          <p>No hobbies yet</p>
        ) : (
          <>
            {visibleHobbies.map((h, i) => (
              <div key={h.id} className="hobby-item">
                <p>Hobby #{i + 1}: {h.hobby}</p>
                <p>Skill: {h.skill_level || 'N/A'}</p>
                <p>Goal: {h.goal || 'N/A'}</p>
              </div>
            ))}

            {extraCount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'center', margin: '0.5rem 0' }}>
                <button
                  className="suggestions-button"
                  onClick={() => setShowAll(prev => !prev)}
                >
                  {showAll
                    ? 'Show less ▲'
                    : `View ${extraCount} more ▼`}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Hobby Button */}
      <div className="sidebar-suggestions">
        <button
          className="suggestions-button"
          onClick={() => navigate('/hobbiesurvey')}
        >
          Edit Hobby
        </button>
      </div>

      {/* Smart Suggestions Button */}
      <div className="sidebar-suggestions">
        <button
          className="suggestions-button"
          onClick={generateSuggestions}
          disabled={loading}
        >
          {loading ? 'Loading…' : 'Get Smart Suggestions'}
        </button>
      </div>

      {/* Suggestions Popup */}
      {suggestions.length > 0 && (
        <div className="popup-overlay" onClick={() => setSuggestions([])}>
          <div className="popup-content" onClick={e => e.stopPropagation()}>
            <button className="popup-close" onClick={() => setSuggestions([])}>
              &times;
            </button>
            <h3>Suggested Activities</h3>
            {suggestions.map((s, idx) => (
              <div key={idx} className="suggestion-block">
                <div className="suggestion-head">
                  <strong>{s.hobby}</strong>
                  <span>{s.date}</span>
                </div>
                <p>{s.description}</p>
                <button onClick={() => addToCalendar(s)}>
                  Add to Calendar
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Error Popup */}
      {error && (
        <div className="popup-overlay" onClick={() => setError('')}>
          <div className="popup-content" onClick={e => e.stopPropagation()}>
            <button className="popup-close" onClick={() => setError('')}>
              &times;
            </button>
            <p style={{ color: 'crimson' }}>{error}</p>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;
