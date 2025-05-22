// /src/dashboard/components/Sidebar/Sidebar.tsx
import React, { useEffect, useState } from 'react';
import { onAuthStateChanged, getAuth } from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
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

  const [usedSuggestions, setUsedSuggestions] = useState<Suggestion[]>([]);

  const [showSuggestionsPopup, setShowSuggestionsPopup] = useState(false);

  /* listen for auth changes */
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

      setUsedSuggestions([]);

      const freshSuggestions = res.data.suggestions;

      if (freshSuggestions.length > 0) {
        setShowSuggestionsPopup(true);
      } else {
        setError('No valid suggestions found - try again!');
      }

      setSuggestions(freshSuggestions);
      setUsedSuggestions(freshSuggestions);
    } catch (err) {
      console.error(err);
      setError('Failed to generate suggestions');
    } finally {
      setLoading(false);
    }
  };


    /* add suggestion to calendar */
    const addToCalendar = async (suggestion: Suggestion) => {
    try {
      const currentUser = getAuth().currentUser;
      if (!currentUser) throw new Error('Not signed in');
      
      const token = await currentUser.getIdToken();
      const dateParts = suggestion.date.split('-');

      // Only create the calendar event
      await axios.post(
        'http://localhost:5000/api/events',
        {
          day: parseInt(dateParts[2]),
          month: parseInt(dateParts[1]) - 1,
          year: parseInt(dateParts[0]),
          title: suggestion.hobby,
          time: suggestion.startTime,
          endTime: suggestion.endTime,
          description: suggestion.description
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

    onEventAdded();
    setUsedSuggestions([]);
    setSuggestions((prev) => prev.filter((x) => x !== suggestion));
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
          onClick={() => navigate('/edithobbies')}
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
      {showSuggestionsPopup && (
        <div className="popup-overlay" onClick={() => setShowSuggestionsPopup(false)}>
          <div className="popup-content" onClick={e => e.stopPropagation()}>
            <button className="popup-close" onClick={() => setShowSuggestionsPopup(false)}>
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
                <p>{suggestion.description}</p>
                <button onClick={() => addToCalendar(suggestion)}>
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
