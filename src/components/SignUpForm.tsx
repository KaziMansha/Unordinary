// /src/components/SignUpForm.tsx
import React from 'react';
import { TextInput, PasswordInput, Button, Paper, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase-config';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom'
import './AuthForm.css';

const SignUpForm: React.FC = () => {
  const navigate = useNavigate();

  const form = useForm({
    initialValues: { email: '', password: '', confirmPassword: '' },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) =>
        value.length >= 6 ? null : 'Password must be at least 6 characters',
      confirmPassword: (value, values) =>
        value !== values.password ? 'Passwords do not match' : null,
    },
  });

  const handleEmailAuth = async () => {
    const { email, password } = form.values;
    try {
      // Create the user with Firebase
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      // Retrieve the Firebase ID token
      const idToken = await user.getIdToken();
  
      // Upsert user data and log the response
      const response = await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      });
      const data = await response.json();
      console.log('User upserted:', data);
  
      // Navigate to the hobby survey page
      navigate('/hobbiesurvey');
    } catch (error: any) {
      console.error('Sign up error:', error.message);
    }
  };
  

  const handleGoogleSignIn = async () => {
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const user = userCredential.user;
      const idToken = await user.getIdToken();
      await fetch('http://localhost:5000/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`,
        },
      });
      // For Google sign in, you may also want to send new users to the hobby survey.
      navigate('/hobbiesurvey');
    } catch (error: any) {
      console.error('Google sign in error:', error.message);
    }
  };

  return (
    <div className="auth-form-wrapper">
      <Paper radius="md" p="xl" withBorder>
        <Title style={{ textAlign: 'center' }} mb="lg">
          Sign Up
        </Title>
        <form onSubmit={form.onSubmit(handleEmailAuth)}>
          <TextInput
            className="custom-text-input"
            label="Email"
            placeholder="you@example.com"
            required
            {...form.getInputProps('email')}
          />
          <PasswordInput
            className="custom-text-input"
            label="Password"
            placeholder="Your password"
            required
            mt="md"
            {...form.getInputProps('password')}
          />
          <PasswordInput
            className="custom-text-input"
            label="Confirm Password"
            placeholder="Confirm password"
            required
            mt="md"
            {...form.getInputProps('confirmPassword')}
          />
          <div className="auth-form-buttons">
            <Button type="submit" className="auth-button">
              Sign Up
            </Button>
            <Button className="auth-button" onClick={handleGoogleSignIn}>
              Sign up with Google
            </Button>
          </div>
        </form>
      </Paper>
      <Link to="/login"><button>Already have an account? Sign In!</button></Link>
    </div>
  );
};

export default SignUpForm;
