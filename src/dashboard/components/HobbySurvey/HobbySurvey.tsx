import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HobbySurvey.css";

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
    e.preventDefault(); // Prevent form from refreshing the page
    
    // Basic validation: Check if all hobbies have valid values
    if (hobbies.some(hobby => !hobby.hobby || !hobby.skillLevel || !hobby.goal)) {
      alert("Please fill out all fields before submitting.");
      return;
    }
  
    // You can send data to your backend (Example: using fetch)
    try {
      // Replace with your actual API endpoint and logic
      const response = await fetch("http://localhost:5000/api/hobbies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(hobbies),
      });
  
      if (!response.ok) {
        throw new Error("Failed to submit hobbies.");
      }
  
      const data = await response.json();
      console.log("Hobbies submitted successfully:", data);
  
      // After a successful submission, set the form state to submitted
      setSubmitted(true);
  
      // Redirect to another page after successful form submission (Example: Dashboard)
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
