import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FeedbackForm.css';

const hobbyOptions = ['Reading', 'Chess', 'Painting'];

interface HobbyRow {
  hobby: string;
  rating: number;     // satisfaction / skill
  frequency: number;  // how often 1‑10
}

export function FeedbackForm() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<HobbyRow[]>([
    { hobby: '', rating: 7, frequency: 5 },
  ]);
  const [error, setError] = useState('');

  /* helpers */
  const unusedHobbies = (idx: number) =>
    hobbyOptions.filter(
      (h) => !rows.some((r, i) => r.hobby === h && i !== idx)
    );

  /* update handler (rating or frequency or hobby) */
  const updateRow =
    (idx: number, field: keyof HobbyRow) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const copy = [...rows];
      copy[idx] = {
        ...copy[idx],
        [field]:
          field === 'hobby'
            ? e.target.value
            : Number(e.target.value),
      };
      // remove duplicates
      if (field === 'hobby') {
        const chosen = e.target.value;
        copy.forEach((r, i) => {
          if (i !== idx && r.hobby === chosen) copy[i].hobby = '';
        });
      }
      setRows(copy);
    };

  const addRow = () =>
    setRows([...rows, { hobby: '', rating: 7, frequency: 5 }]);
  const removeRow = (idx: number) =>
    setRows(rows.filter((_, i) => i !== idx));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rows.some((r) => !r.hobby)) {
      setError('Please choose a hobby for every row.');
      return;
    }
    setError('');
    console.log('Submitted ratings:', rows); // includes frequency

    // TODO: POST rows to server …

    navigate('/Dashboard', { replace: true });
  };

  /* render */
  return (
    <div className="fb-wrapper">
      <h2 className="fb-title">Rate your hobbies</h2>

      <form onSubmit={handleSubmit} className="fb-card">
        {rows.map((row, idx) => (
          <div key={idx} className="fb-row">
            {/* Hobby dropdown */}
            <label className="fb-label">
              Hobby
              <select
                value={row.hobby}
                onChange={updateRow(idx, 'hobby')}
              >
                <option value="">— Select —</option>
                {unusedHobbies(idx).map((h) => (
                  <option key={h} value={h}>
                    {h}
                  </option>
                ))}
              </select>
            </label>

            {/* Enjoyment / rating slider */}
            <label className="fb-label fb-slider">
              Rating <span>{row.rating}</span>
              <input
                type="range"
                min={1}
                max={10}
                value={row.rating}
                onChange={updateRow(idx, 'rating')}
              />
            </label>

            {/* Frequency slider */}
            <label className="fb-label fb-slider">
              How likely are you to do this hobby again? <span>{row.frequency}</span>
              <input
                type="range"
                min={1}
                max={10}
                value={row.frequency}
                onChange={updateRow(idx, 'frequency')}
              />
            </label>

            {/* remove row */}
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

        {/* add hobby row */}
        <button
          type="button"
          className="fb-add"
          onClick={addRow}
          disabled={rows.length === hobbyOptions.length}
        >
          + Add another hobby
        </button>

        {error && <p className="fb-error">{error}</p>}

        <button type="submit" className="fb-submit">
          Submit feedback
        </button>
      </form>
    </div>
  );
}
