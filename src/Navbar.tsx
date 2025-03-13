import React from "react";
import "./Navbar.css"; // Import CSS file

interface NavLink {
  label: string;
  path: string;
}

interface NavbarProps {
  title?: string;
  links: NavLink[];
}

const Navbar: React.FC<NavbarProps> = ({ title = "Unordinary", links }) => {
  return (
    <nav className="navbar">
      <div className="navbar-container">
        <h1 className="navbar-title">{title}</h1>
        <ul className="navbar-links">
          {links.map((link, index) => (
            <li key={index}>
              <a href={link.path} className="navbar-link">
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default Navbar;
