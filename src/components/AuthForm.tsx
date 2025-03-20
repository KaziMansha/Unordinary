import React, { useState } from 'react';
import './AuthForm.css';
import {
  TextInput,
  PasswordInput,
  Button,
  Paper,
  Title,
  Divider,
  Center,
} from '@mantine/core';
import { useForm } from '@mantine/form';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { auth, googleProvider } from '../firebase-config';
import { useNavigate } from 'react-router-dom';

const AuthForm: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const navigate = useNavigate();

  const form = useForm({
    initialValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) =>
        value.length >= 6 ? null : 'Password must be at least 6 characters',
      confirmPassword: (value, values) =>
        isSignUp && value !== values.password ? 'Passwords do not match' : null,
    },
  });

  const handleEmailAuth = async () => {
    const { email, password } = form.values;
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      navigate('/home');
    } catch (error: any) {
      console.error('Authentication error', error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/home');
    } catch (error: any) {
      console.error('Google sign in error', error.message);
    }
  };

  return (
    <div className="auth-form-wrapper">
      <Paper radius="md" p="xl" withBorder>
        <Title style={{ textAlign: 'center' }} mb="lg">
          {isSignUp ? 'Sign Up' : 'Sign In'}
        </Title>

        <form onSubmit={form.onSubmit(handleEmailAuth)}>
          {/* 
            Add a custom class to style the text inputs via CSS.
            This class will target Mantine's label and input elements.
          */}
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
          {isSignUp && (
            <PasswordInput
              className="custom-text-input"
              label="Confirm Password"
              placeholder="Confirm password"
              required
              mt="md"
              {...form.getInputProps('confirmPassword')}
            />
          )}

          <div className="auth-form-buttons">
            <Button type="submit" className="auth-button">
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>
            <Button className="auth-button" onClick={handleGoogleSignIn}>
              Sign in with Google
            </Button>
          </div>
        </form>

        <div className="auth-divider">
          <Divider my="lg" label="Or continue with" labelPosition="center" />
        </div>

        <Center>
          <Button
            className="auth-button"
            variant="light"
            onClick={() => setIsSignUp(!isSignUp)}
          >
            {isSignUp
              ? 'Already have an account? Sign In'
              : "Don't have an account? Sign Up"}
          </Button>
        </Center>
      </Paper>
    </div>
  );
};

export default AuthForm;
