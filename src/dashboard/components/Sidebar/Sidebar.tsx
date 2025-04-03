import React, { useState } from 'react';
import './Sidebar.css';

const Sidebar: React.FC = () => {
  const [profileImage, setProfileImage] = useState<string | null>(null);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const result = event.target?.result;
      if (typeof result === 'string') {
        setProfileImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-top">
        <img
          src={profileImage || 'https://via.placeholder.com/80'}
          alt="User Avatar"
          className="sidebar-avatar"
        />
        <p className="sidebar-username">John Doe</p>
        <div className="sidebar-upload">
          <label htmlFor="profile-upload" className="upload-label">
            Upload Profile Image
          </label>
          <input
            id="profile-upload"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: 'none' }}
          />
        </div>
      </div>
      <div className="sidebar-center">
        <details>
          <summary>Hobby 1</summary>
          <p>hobby stuff</p>
        </details>
        <details>
          <summary>Hobby 2</summary>
          <p>hobby stuff</p>
        </details>
        <details>
          <summary>Hobby 3</summary>
          <p>hobby stuff</p>
        </details>
      </div>
      <div className="sidebar-suggestions">
        <button className="suggestions-button">Suggestions</button>
      </div>
    </aside>
  );
};

export default Sidebar;
