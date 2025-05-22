import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HobbySurvey.css";
import { auth } from '../../../firebase-config';


interface Hobby {
  hobby: string;
  skillLevel: string;
  goal: string;
}

const HobbySurvey: React.FC = () => {
  const navigate = useNavigate();
  const [submitted, setSubmitted] = useState(false);
  const [hobbies, setHobbies] = useState<Hobby[]>([{ hobby: "", skillLevel: "", goal: "" }]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
     const hasDuplicate = hobbies.some(
      (h, idx, arr) =>
        arr.findIndex(x => x.hobby.toLowerCase().trim() === h.hobby.toLowerCase().trim()) !== idx
    );
    if (hasDuplicate) {
      alert('You have duplicate hobbies.');
      return;
    }
    try {
      const user = auth.currentUser;
      if (!user) throw new Error("User not authenticated");
      // Get Firebase ID token
      const idToken = await user.getIdToken();
  
      // Send each hobby individually with authorization
      for (const hobby of hobbies) {
        const response = await fetch("http://localhost:5000/api/hobbies", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${idToken}`
          },
          body: JSON.stringify({
            hobby_name: hobby.hobby,
            skill_level: hobby.skillLevel,
            goal: hobby.goal
          }),
        });
  
        if (!response.ok) throw new Error("Failed to submit hobbies");
      }
  
      setSubmitted(true);
      navigate("/Dashboard");
    } catch (error) {
      console.error("Error submitting hobbies:", error);
      alert("There was an error submitting your hobbies. Please try again.");
    }
  };
  
  const handleChange = (index: number, field: keyof Hobby, value: string) => {
    const updatedHobbies = [...hobbies];
    updatedHobbies[index][field] = value;  // TypeScript will now recognize this as safe
    setHobbies(updatedHobbies);
  };

  const addHobby = () => {
    setHobbies([...hobbies, { hobby: "", skillLevel: "", goal: "" }]);
  };

  const removeHobby = (index: number) => {
    const updatedHobbies = hobbies.filter((_, i) => i !== index);
    setHobbies(updatedHobbies);
  };

  return (
    <div className="survey-container">
      <h2 className="survey-title">Hobby Survey</h2>

      {!submitted ? (
        <form onSubmit={handleSubmit} className="survey-form">
          {hobbies.map((hobby, index) => (
            <div key={index} className="survey-hobby-section">
              <div className="hobby-section-title">
                <span>Hobby {index + 1}</span>
                {hobbies.length > 1 && (
                  <button type="button" className="remove-button" onClick={() => removeHobby(index)}>
                    Remove
                  </button>
                )}
              </div>

              <label>
                What is a hobby you wish to focus on?
                <input
                  type="text"
                  placeholder="Enter hobby"
                  value={hobby.hobby}
                  onChange={(e) => handleChange(index, "hobby", e.target.value)}
                  required
                />
              </label>

              <label>
                What is your current skill level?
                <select
                  value={hobby.skillLevel}
                  onChange={(e) => handleChange(index, "skillLevel", e.target.value)}
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
                  onChange={(e) => handleChange(index, "goal", e.target.value)}
                  required
                >
                  <option value="">Select goal</option>
                  <option value="improve">To improve in skill level</option>
                  <option value="practice">To simply practice</option>
                  <option value="fun">To have fun</option>
                </select>
              </label>
            </div>
          ))}

          <button type="button" className="add-button" onClick={addHobby}>
            Add Hobby
          </button>
          <button type="submit" className="submit-button">
            Submit Survey
          </button>
        </form>
      ) : (
        <h3 className="thank-you-message">Thank you for your response!</h3>
      )}
    </div>
  );
};

export default HobbySurvey;
