import React from 'react';
import classes from './Footer.module.css';
import Unordinary_Logo from '../../assets/Unordinary_Logo.png'

export function Footer() {
  return (
    <footer className={classes.footer}>
      <div className={classes.container}>
        <div className={classes.logo}>
          <img src={Unordinary_Logo} alt="Logo" />
        </div>
        <div className={classes.links}>
          <a href="https://www.linkedin.com/in/adrian-mysliwiec/" target="_blank" rel="noopener noreferrer">Adrian M.</a>
          <a href="https://www.linkedin.com/in/anika-sujana/" target="_blank" rel="noopener noreferrer">Anika S.</a>
          <a href="https://www.linkedin.com/in/hanzdg/" target="_blank" rel="noopener noreferrer">Hanz D. G.</a>
          <a href="https://www.linkedin.com/in/kazimansha/" target="_blank" rel="noopener noreferrer">Kazi M.</a>
        </div>
        <p className={classes.copyright}>
          © {new Date().getFullYear()} Unordinary. All rights reserved.
        </p>
      </div>
    </footer>
  );
};
