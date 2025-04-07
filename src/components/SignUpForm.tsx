// /src/components/SignUpForm.tsx
import React from 'react';
import { TextInput, PasswordInput, Button, Paper, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase-config';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom'
import leftImage from '../assets/Login_Image.png'
import './SignUpForm.css'
import './Authform.css'

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
    <div className="auth-page-container">
    <div className="auth-visual-container">
      <div className="image-placeholder">
        <img src={ leftImage }/>
      </div>
    </div>

    <div className="auth-form-container">
      <Paper radius="md" className="auth-form-paper">
        <Title className="auth-title">Welcome to Unordinary</Title>
        
        <form onSubmit={form.onSubmit(handleEmailAuth)}>
          <TextInput
            className="auth-input"
            label="Email"
            placeholder="you@example.com"
            required
            {...form.getInputProps('email')}
          />

          <PasswordInput
            className="auth-input"
            label="Password"
            placeholder="Your password"
            required
            {...form.getInputProps('password')}
          />

          <PasswordInput
            className="auth-input"
            label="Confirm Password"
            placeholder="Confirm password"
            required
            mt="md"
            {...form.getInputProps('confirmPassword')}
          />

          <Button type="submit" className="signin-button">
            Sign In
          </Button>

          <Button className="google-signin-button" onClick={handleGoogleSignIn}>
            Sign in with Google
          </Button>
        </form>

        <div className="signup-redirect">
          <span>Already have an account?</span> <Link to="/login">Sign In!</Link>
        </div>
      </Paper>
    </div>
  </div>
  );
};

export default SignUpForm;
