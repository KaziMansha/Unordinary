// src/components/FeedbackForm.tsx
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth } from 'firebase/auth';
import './FeedbackForm.css';

interface HobbyOption {
  id: number;
  hobby: string;
}
interface HobbyRow {
  hobbyId: string;       // string so it works as <select> value
  rating: number;
  frequency: number;
  usefulness: number;
}

export function FeedbackForm() {
  const navigate = useNavigate();
  const [hobbyOptions, setHobbyOptions] = useState<HobbyOption[]>([]);
  const [rows, setRows] = useState<HobbyRow[]>([
    { hobbyId: '', rating: 7, frequency: 5, usefulness: 5 },
  ]);
  const [error, setError] = useState<string>('');

  // fetch the user’s existing hobbies on mount
  useEffect(() => {
  (async () => {
    try {
      const user = getAuth().currentUser;
      if (!user) throw new Error('Not signed in');
      const token = await user.getIdToken();
      const res = await fetch('http://localhost:5000/api/feedback-hobbies', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      
      if (!res.ok) throw new Error('Failed to load');
      const data = await res.json();
      setHobbyOptions(data);
      
    } catch (err) {
      console.error('Failed to load hobbies', err);
      setError('Failed to load hobbies');
    }
  })();
}, []);

  const unusedHobbies = (idx: number) =>
    hobbyOptions.filter(
      h => !rows.some((r, i) => i !== idx && r.hobbyId === String(h.id))
    );

  const updateRow = (idx: number, field: keyof HobbyRow) => 
    (e: React.ChangeEvent<HTMLSelectElement | HTMLInputElement>) => {
      const copy = [...rows];
      copy[idx] = {
        ...copy[idx],
        [field]:
          field === 'hobbyId'
            ? e.target.value
            : Number(e.target.value),
      };
      // clear duplicates
      if (field === 'hobbyId') {
        const chosen = e.target.value;
        copy.forEach((r, i) => {
          if (i !== idx && r.hobbyId === chosen) {
            r.hobbyId = '';
          }
        });
      }
      setRows(copy);
    };

  const addRow = () =>
    setRows([...rows, { hobbyId: '', rating: 7, frequency: 5, usefulness: 5 }]);
  const removeRow = (idx: number) =>
    setRows(rows.filter((_, i) => i !== idx));

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  
  // Validate at least one hobby selected
  const hasEmpty = rows.some(r => !r.hobbyId);
  if (hasEmpty || rows.length === 0) {
    setError('Please select at least one hobby');
    return;
  }

  try {
    const user = getAuth().currentUser!;
    const token = await user.getIdToken();
    const payload = rows.map(r => ({
      hobbyId: Number(r.hobbyId),
      rating: r.rating,
      frequency: r.frequency,
      usefulness: r.usefulness
    }));

    const res = await fetch('http://localhost:5000/api/feedback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error('Submission failed');
    navigate('/dashboard', { replace: true });
    
  } catch (err) {
    console.error(err);
    setError('Submission failed. Please try again.');
  }
};

  return (
    <div className="fb-wrapper">
      <h2 className="fb-title">Rate your hobbies</h2>
      <form onSubmit={handleSubmit} className="fb-card">
        {rows.map((row, idx) => (
          <div key={idx} className="fb-row">
            <label className="fb-label">
              Hobby
              <select
                value={row.hobbyId}
                onChange={updateRow(idx, 'hobbyId')}
              >
                <option value="">— Select —</option>
                {unusedHobbies(idx).map(h => (
                  <option key={h.id} value={h.id}>
                    {h.hobby}
                  </option>
                ))}
              </select>
            </label>

            <label className="fb-label fb-slider">
              Rating <span>{row.rating}</span>
              <input
                type="range"
                min={1}
                max={10}
                value={row.rating}
                onChange={updateRow(idx, 'rating')}
              />
            </label>

            <label className="fb-label fb-slider">
              Frequency <span>{row.frequency}</span>
              <input
                type="range"
                min={1}
                max={10}
                value={row.frequency}
                onChange={updateRow(idx, 'frequency')}
              />
            </label>

            <label className="fb-label fb-slider">
              Usefulness <span>{row.usefulness}</span>
              <input
                type="range"
                min={1}
                max={10}
                value={row.usefulness}
                onChange={updateRow(idx, 'usefulness')}
              />
            </label>

            {rows.length > 1 && (
              <button
                type="button"
                className="fb-remove"
                onClick={() => removeRow(idx)}
              >
                ×
              </button>
            )}
          </div>
        ))}

        <button
          type="button"
          className="fb-add"
          onClick={addRow}
          disabled={rows.length === hobbyOptions.length}
        >
          + Add another hobby
        </button>

        {error && <p className="fb-error">{error}</p>}

        <button type="submit" className="fb-submit">
          Submit feedback
        </button>
      </form>
    </div>
  );
}
