import React, { useEffect, useState } from 'react';
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
        // If the user is not authenticated, redirect to the sign-in page
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      // onAuthStateChanged will handle redirecting after sign out
    } catch (error: any) {
      console.error('Sign out error', error.message);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <Container size="sm" style={{ marginTop: '3rem' }}>
      <Center>
        <Title style={{ textAlign: 'center' }} mb="md">
          Welcome to Your Homepage
        </Title>
      </Center>
      <Center>
        <Text style={{ textAlign: 'center' }} mb="xl">
          Hello, {user.email}
        </Text>
      </Center>
      <Button fullWidth mt="xl" onClick={handleSignOut}>
        Sign Out
      </Button>
    </Container>
  );
};

export default HomePage;
