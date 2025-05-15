import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './FeedbackForm.css';

const hobbyOptions = ['Reading', 'Chess', 'Painting'];

interface HobbyRow {
  hobby: string;
  rating: number;
  frequency: number;
  usefulness: number;   // ← new field
}

export function FeedbackForm() {
  const navigate = useNavigate();

  const [rows, setRows] = useState<HobbyRow[]>([
    { hobby: '', rating: 7, frequency: 5, usefulness: 5 },
  ]);
  const [error, setError] = useState('');

  const unusedHobbies = (idx: number) =>
    hobbyOptions.filter(
      (h) => !rows.some((r, i) => r.hobby === h && i !== idx)
    );

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
      if (field === 'hobby') {
        const chosen = e.target.value;
        copy.forEach((r, i) => {
          if (i !== idx && r.hobby === chosen) r.hobby = '';
        });
      }
      setRows(copy);
    };

  const addRow = () =>
    setRows([...rows, { hobby: '', rating: 7, frequency: 5, usefulness: 5 }]);
  const removeRow = (idx: number) =>
    setRows(rows.filter((_, i) => i !== idx));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (rows.some((r) => !r.hobby)) {
      setError('Please choose a hobby for every row.');
      return;
    }
    setError('');
    console.log('Submitted rows:', rows);
    // TODO: POST to server
    navigate('/Dashboard', { replace: true });
  };

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

            {/* Rating slider */}
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

            {/* Frequency slider */}
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

            {/* Usefulness slider */}
            <label className="fb-label fb-slider">
              How likely does this hobby help achieve your goals? 
              <span>{row.usefulness}</span>
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
