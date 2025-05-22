import React, { useEffect, useState } from 'react';
import { auth } from '../../../firebase-config';
import { useNavigate } from 'react-router-dom';

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
          headers: { Authorization: `Bearer ${idToken}` }
        });

        const data = await res.json();
        setHobbies(data);
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch hobbies:', err);
      }
    };

    fetchHobbies();
  }, []);

  const handleAdd = () => {
    setHobbies([...hobbies, { hobby: '', skill_level: '', goal: '' }]);
  };

  const handleChange = <K extends keyof Hobby>(index: number, field: K, value: Hobby[K]) => {
    const updated = [...hobbies];
    updated[index][field] = value;
    setHobbies(updated);
  };

  const handleDelete = async (id?: number, index?: number) => {
    if (id) {
      const idToken = await auth.currentUser?.getIdToken();
      await fetch(`http://localhost:5000/api/hobbies/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${idToken}` }
      });
    }
    const updated = [...hobbies];
    updated.splice(index!, 1);
    setHobbies(updated);
  };

  const handleSave = async () => {
  const hasDuplicate = hobbies.some(
    (h, idx, arr) =>
      arr.findIndex(x => x.hobby.toLowerCase().trim() === h.hobby.toLowerCase().trim()) !== idx
  );
  if (hasDuplicate) {
    alert('You have duplicate hobbies.');
    return;
  }

  const idToken = await auth.currentUser?.getIdToken();
  for (const h of hobbies) {
    if (!h.id) {
      await fetch('http://localhost:5000/api/hobbies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`
        },
        body: JSON.stringify({
          hobby_name: h.hobby,
          skill_level: h.skill_level,
          goal: h.goal
        })
      });
    }
  }
  navigate('/Dashboard');
};


  if (loading) return <p>Loading hobbies...</p>;

  return (
    <div className="survey-container">
      <h2>Edit Your Hobbies</h2>
      {hobbies.map((hobby, i) => (
        <div key={i} className="survey-hobby-section">
          <label>
            Hobby:
            <input
              type="text"
              value={hobby.hobby}
              onChange={(e) => handleChange(i, 'hobby', e.target.value)}
            />
          </label>
          <label>
            Skill Level:
            <select
              value={hobby.skill_level}
              onChange={(e) => handleChange(i, 'skill_level', e.target.value)}
            >
              <option value="">Select</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="pro">Pro</option>
            </select>
          </label>
          <label>
            Goal:
            <select
              value={hobby.goal}
              onChange={(e) => handleChange(i, 'goal', e.target.value)}
            >
              <option value="">Select</option>
              <option value="improve">To improve</option>
              <option value="practice">To practice</option>
              <option value="fun">For fun</option>
            </select>
          </label>
          <button onClick={() => handleDelete(hobby.id, i)}>Delete</button>
        </div>
      ))}
      <button onClick={handleAdd}>Add Hobby</button>
      <button onClick={handleSave}>Save Changes</button>
    </div>
  );
};

export default EditHobbies;
