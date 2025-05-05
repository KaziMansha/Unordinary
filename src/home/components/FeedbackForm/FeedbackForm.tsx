import React, { useState } from 'react';
import './FeedbackForm.css';

const hobbyOptions = ['Reading', 'Chess', 'Painting', 'Hiking', 'Cooking'];

interface HobbyRow {
  hobby: string;
  rating: number;
}

export function FeedbackForm() {
  const [rows, setRows] = useState<HobbyRow[]>([
    { hobby: '', rating: 7 },
  ]);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  /* ---------- helpers ---------- */
  const unusedHobbies = (currentIndex: number) =>
    hobbyOptions.filter(
      (h) => !rows.some((r, i) => r.hobby === h && i !== currentIndex)
    );

  /* ---------- handlers ---------- */
  const updateRow =
    (index: number, field: keyof HobbyRow) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const copy = [...rows];
      copy[index] = {
        ...copy[index],
        [field]:
          field === 'rating' ? Number(e.target.value) : e.target.value,
      };
      // If changing hobby dropdown duplicates another row, clear the duplicate
      if (field === 'hobby') {
        const chosen = e.target.value;
        copy.forEach((r, i) => {
          if (i !== index && r.hobby === chosen) copy[i].hobby = '';
        });
      }
      setRows(copy);
    };

  const addRow = () => setRows([...rows, { hobby: '', rating: 7 }]);

  const removeRow = (idx: number) =>
    setRows(rows.filter((_, i) => i !== idx));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // validation: all hobby dropdowns filled and unique
    if (rows.some((r) => !r.hobby)) {
      setError('Please choose a hobby for every row.');
      return;
    }
    setError('');
    console.log('Submitted ratings:', rows);
    // TODO: POST to server
    setSubmitted(true);
  };

  /* ---------- render ---------- */
  if (submitted)
    return <p className="fb-thanks">Thank you for rating your hobbies!</p>;

  return (
    <div className="fb-wrapper">
      <h2 className="fb-title">Rate your hobbies</h2>

      <form onSubmit={handleSubmit} className="fb-card">
        {rows.map((row, idx) => (
          <div key={idx} className="fb-row">
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

            <label className="fb-label fb-slider">
              Rating&nbsp;<span>{row.rating}</span>
              <input
                type="range"
                min={1}
                max={10}
                value={row.rating}
                onChange={updateRow(idx, 'rating')}
              />
            </label>

            {rows.length > 1 && (
              <button
                type="button"
                onClick={() => removeRow(idx)}
                className="fb-remove"
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
