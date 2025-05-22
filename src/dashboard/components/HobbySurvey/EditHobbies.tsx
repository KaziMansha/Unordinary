// /src/dashboard/components/Sidebar/EditHobbies.tsx
import React, { useEffect, useState } from 'react';
import { auth } from '../../../firebase-config';
import { useNavigate } from 'react-router-dom';
import './HobbySurvey.css';   // reuse the same CSS

interface Hobby {
  id?: number;
  hobby: string;
  skill_level: string;
  goal: string;
}

const EditHobbies: React.FC = () => {
  const [hobbies, setHobbies] = useState<Hobby[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchHobbies = async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) return;
        const res = await fetch('http://localhost:5000/api/hobbies', {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        const data = await res.json();
        setHobbies(data);
      } catch (err) {
        console.error('Failed to fetch hobbies:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHobbies();
  }, []);

  const handleAdd = () => {
    setHobbies([...hobbies, { hobby: '', skill_level: '', goal: '' }]);
  };

  const handleChange = <K extends keyof Hobby>(
    index: number,
    field: K,
    value: Hobby[K]
  ) => {
    const updated = [...hobbies];
    updated[index][field] = value;
    setHobbies(updated);
  };

  const handleDelete = async (id?: number, index?: number) => {
    if (id) {
      const idToken = await auth.currentUser?.getIdToken();
      await fetch(`http://localhost:5000/api/hobbies/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` },
      });
    }
    setHobbies(hobbies.filter((_, i) => i !== index));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    // check duplicates
    const hasDuplicate = hobbies.some(
      (h, idx, arr) =>
        arr.findIndex(
          x => x.hobby.toLowerCase().trim() === h.hobby.toLowerCase().trim()
        ) !== idx
    );
    if (hasDuplicate) {
      alert('You have duplicate hobbies.');
      return;
    }

    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) return;

    for (const h of hobbies) {
      if (!h.id) {
        await fetch('http://localhost:5000/api/hobbies', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            hobby_name: h.hobby,
            skill_level: h.skill_level,
            goal: h.goal,
          }),
        });
      } else {
        // you could implement an UPDATE endpoint here
      }
    }

    navigate('/Dashboard');
  };

  if (loading) return <p>Loading hobbies...</p>;

  return (
    <div className="survey-container">
      <h2 className="survey-title">Edit Your Hobbies</h2>

      <form onSubmit={handleSave} className="survey-form">
        {hobbies.map((hobby, i) => (
          <div key={i} className="survey-hobby-section">
            <div className="hobby-section-title">
              <span>Hobby {i + 1}</span>
              <button
                type="button"
                className="remove-button"
                onClick={() => handleDelete(hobby.id, i)}
              >
                Remove
              </button>
            </div>

            <label>
              What is a hobby you wish to focus on?
              <input
                type="text"
                value={hobby.hobby}
                onChange={e => handleChange(i, 'hobby', e.target.value)}
                required
              />
            </label>

            <label>
              What is your current skill level?
              <select
                value={hobby.skill_level}
                onChange={e => handleChange(i, 'skill_level', e.target.value)}
                required
              >
                <option value="">Select skill level</option>
                <option value="beginner">Beginner</option>
                <option value="intermediate">Intermediate</option>
                <option value="pro">Pro</option>
              </select>
            </label>

            <label>
              What is your goal with this hobby?
              <select
                value={hobby.goal}
                onChange={e => handleChange(i, 'goal', e.target.value)}
                required
              >
                <option value="">Select goal</option>
                <option value="improve">To improve</option>
                <option value="practice">To practice</option>
                <option value="fun">For fun</option>
              </select>
            </label>
          </div>
        ))}

        <button
          type="button"
          className="add-button"
          onClick={handleAdd}
        >
          Add Hobby
        </button>
        <button type="submit" className="submit-button">
          Save Changes
        </button>
      </form>
    </div>
  );
};

export default EditHobbies;