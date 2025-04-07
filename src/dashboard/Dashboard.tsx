import React, { useEffect, useState } from 'react';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase-config';
import { useNavigate } from 'react-router-dom';
import { Calendar } from './components/Calendar/Calendar'
import HobbySurvey from './components/HobbySurvey/HobbySurvey';
import HobbySuggestion from './components/HobbySuggestion/HobbySuggestion';
import Sidebar from './components/Sidebar/Sidebar.tsx';

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
            
            <Calendar />
            <HobbySurvey />
            <HobbySuggestion />
        </>
    )
}

export default DashboardPage