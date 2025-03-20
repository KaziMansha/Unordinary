// /src/components/SignUpForm.tsx
import React from 'react';
import { TextInput, PasswordInput, Button, Paper, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { createUserWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase-config';
import { useNavigate } from 'react-router-dom';
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
      await createUserWithEmailAndPassword(auth, email, password);
      navigate('/home');
    } catch (error: any) {
      console.error('Sign up error:', error.message);
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
    </div>
  );
};

export default SignUpForm;
