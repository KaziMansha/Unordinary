import React, { useEffect, useState } from 'react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase-config';
import { useNavigate } from 'react-router-dom';
import { Calendar } from './components/Calendar/Calendar'
import HobbySuggestion from './components/HobbySuggestion/HobbySuggestion';
import Sidebar from './components/Sidebar/Sidebar.tsx';
import { NavBar } from '../home/components/Navbar/NavbarDash';
import './Dashboard.css'

const DashboardPage: React.FC = () => {
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
      if (!user) {
        return <div>Loading...</div>;
      }
    
    return (
        <>
        <div className='dashboard-wrapper'>
        <NavBar />
        <div className='dashboard-component-wrapper'>
          <Sidebar />
            <div className='dashboard-calendar'>
              <Calendar />
            </div>
        </div>
        </div>
        </>
    )
}

export default DashboardPage