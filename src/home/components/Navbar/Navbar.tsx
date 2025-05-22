import React from 'react';
import { Link } from 'react-router-dom';
import classes from './Navbar.module.css';
import Unordinary_Logo from '../../assets/Unordinary_Logo.png';
import { useEffect, useState } from 'react';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { auth } from '../../../firebase-config';

export function NavBar() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user); // `user` is null if logged out
    });

    return () => unsubscribe(); // cleanup on unmount
  }, []);

  const handleSignOut = async () => { // will need to add a sign out button to the dashboard page.
        try {
          await signOut(auth);
        } catch (error: any) {
          console.error('Sign out error', error.message);
        }
      };

  return (
    <nav className={classes.navbar}>
      <div className={classes.logo}>
        <Link to="/">
          <img src={Unordinary_Logo} alt="Unordinary Logo" />
        </Link>
      </div>
      <ul className={classes.navLinks}>
        <li><Link to="/">Home</Link></li>
        {currentUser ? (
          <li><Link to="/dashboard">Dashboard</Link></li>
        ) :
        <li><Link to="/login">Dashboard</Link></li>}
        <li><Link to="/about">About</Link></li>
      </ul>
      <div className={classes.authButtons}> 
          {currentUser ? (
          <button onClick={handleSignOut} className={classes.login}>Sign Out</button> 
        ) 
        : (
          <>
        <Link to="/login"><button className={classes.login}>Login</button></Link>
        <Link to="/signup"><button className={classes.signup}>Sign Up</button></Link>
        </>
        )}
      </div>
    </nav>
  );
}
