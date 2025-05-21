import React from 'react';
import classes from './Footer.module.css';
import Unordinary_Logo from '../../assets/Unordinary_Logo.png';

export function Footer() {
  return (
    <footer className={classes.footer}>
      <div className={classes.container}>
        <div className={classes.left}>
          <img src={Unordinary_Logo} alt="Unordinary Logo" className={classes.logo} />
        </div>

        <div className={classes.center}>
          <div className={classes.links}>
            <a href="https://www.linkedin.com/in/adrian-mysliwiec/" target="_blank" rel="noopener noreferrer">Adrian M.</a>
            <a href="https://www.linkedin.com/in/anika-sujana/" target="_blank" rel="noopener noreferrer">Anika S.</a>
            <a href="https://www.linkedin.com/in/hanzdg/" target="_blank" rel="noopener noreferrer">Hanz D. G.</a>
            <a href="https://www.linkedin.com/in/kazimansha/" target="_blank" rel="noopener noreferrer">Kazi M.</a>
          </div>
        </div>

        <div className={classes.right}>
          <p className={classes.copyright}>
            © {new Date().getFullYear()} <span className={classes.brand}>Unordinary</span>. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
