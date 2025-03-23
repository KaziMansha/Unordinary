// HomePage.tsx (modified excerpt)
import React, { useEffect, useState } from 'react';
import './HomePage.css';
import { Container, Title, Text, Button, Center } from '@mantine/core';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { auth } from '../firebase-config';
import { useNavigate } from 'react-router-dom';

const HomePage: React.FC = () => {
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

  const handleSignOut = async () => {
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
    <Container size="sm" className="homepage-container">
      <Center>
        <Title className="homepage-title">Welcome to Your Homepage</Title>
      </Center>
      <Center>
        <Text className="homepage-text">Hello, {user.email}</Text>
      </Center>
      <Button className="homepage-button" onClick={handleSignOut}>
        Sign Out
      </Button>
    </Container>
  );
};

export default HomePage;
