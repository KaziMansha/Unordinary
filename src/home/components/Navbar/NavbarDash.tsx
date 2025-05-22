import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'
import { useNavigate } from 'react-router-dom';
import classes from './Navbar.module.css'
import Unordinary_Logo from '../../assets/Unordinary_Logo.png'
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../../firebase-config';



export function NavBar() {
    const [user, setUser] = useState<any>(null);
      const navigate = useNavigate();
    
      useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
          if (currentUser) {
            setUser(currentUser);
          } else {
            // Redirect unauthenticated users to the sign-in page
            navigate('/');
          }
        });
        return () => unsubscribe();
      }, [navigate]);
    
      // Upsert user data in the database once the user is available
      useEffect(() => {
        if (user) {
          user.getIdToken().then((idToken: string) => {
            fetch('http://localhost:5000/api/users', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${idToken}`,
              },
            })
              .then((res) => res.json())
              .then((data) => {
                console.log('User upserted:', data);
              })
              .catch((error) => console.error('Error upserting user:', error));
          });
        }
      }, [user]);
    
      const handleSignOut = async () => { // will need to add a sign out button to the dashboard page.
        try {
          await signOut(auth);
        } catch (error: any) {
          console.error('Sign out error', error.message);
        }
      };
    
      if (!user) {
        return <div>Loading...</div>;
    }
    return (
        <>
        <nav className = {classes.navbar}>
            <div className = {classes.logo}>
                <img src = {Unordinary_Logo} alt = "Unordinary Logo" />
            </div>
            <ul className = {classes.navLinks}>
                <li>
                    <Link to="/">Home</Link>
                </li>
                <li>
                    <Link to="/feedback">Hobby Feedback Form</Link>
                </li>
                <li>
                    <Link to="/about">About</Link>
                </li>
            </ul>
            <div className = {classes.authButtons}>
                <button className={classes.login} onClick={handleSignOut}>Sign Out</button>
            </div>
        </nav>
        </>
    )
}