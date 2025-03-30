// /src/components/SignInForm.tsx
import React from 'react';
import { TextInput, PasswordInput, Button, Paper, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase-config';
import { useNavigate } from 'react-router-dom';
import './AuthForm.css';

const SignInForm: React.FC = () => {
  const navigate = useNavigate();

  const form = useForm({
    initialValues: { email: '', password: '' },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      password: (value) =>
        value.length >= 6 ? null : 'Password must be at least 6 characters',
    },
  });

  const handleEmailAuth = async () => {
    const { email, password } = form.values;
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/home');
    } catch (error: any) {
      console.error('Sign in error:', error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/home');
    } catch (error: any) {
      console.error('Google sign in error:', error.message);
    }
  };

  return (
    <div className="auth-form-wrapper">
      <Paper radius="md" p="xl" withBorder>
        <Title style={{ textAlign: 'center' }} mb="lg">
          Sign In
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
          <div className="auth-form-buttons">
            <Button type="submit" className="auth-button">
              Sign In
            </Button>
            <Button className="auth-button" onClick={handleGoogleSignIn}>
              Sign in with Google
            </Button>
          </div>
        </form>
      </Paper>
    </div>
  );
};

export default SignInForm;
