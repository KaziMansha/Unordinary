import React, { useState } from 'react';
import {
  TextInput,
  PasswordInput,
  Button,
  Group,
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
      // Redirect on successful authentication
      navigate('/home'); // Adjust the route to your homepage route
    } catch (error: any) {
      console.error('Authentication error', error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      // Redirect on successful authentication
      navigate('/home'); // Adjust the route to your homepage route
    } catch (error: any) {
      console.error('Google sign in error', error.message);
    }
  };

  return (
    <Paper
      radius="md"
      p="xl"
      withBorder
      style={{ maxWidth: 400, margin: '2rem auto' }}
    >
      <Title style={{ textAlign: 'center' }} mb="lg">
        {isSignUp ? 'Sign Up' : 'Sign In'}
      </Title>
      <form onSubmit={form.onSubmit(handleEmailAuth)}>
        <TextInput
          label="Email"
          placeholder="you@example.com"
          required
          {...form.getInputProps('email')}
        />
        <PasswordInput
          label="Password"
          placeholder="Your password"
          required
          mt="md"
          {...form.getInputProps('password')}
        />
        {isSignUp && (
          <PasswordInput
            label="Confirm Password"
            placeholder="Confirm password"
            required
            mt="md"
            {...form.getInputProps('confirmPassword')}
          />
        )}
        <Group style={{ justifyContent: 'space-between' }} mt="md">
          <Button type="submit">
            {isSignUp ? 'Sign Up' : 'Sign In'}
          </Button>
          <Button variant="default" onClick={handleGoogleSignIn}>
            Sign in with Google
          </Button>
        </Group>
      </form>
      <Divider my="lg" label="Or continue with" labelPosition="center" />
      <Center>
        <Button variant="light" onClick={() => setIsSignUp(!isSignUp)}>
          {isSignUp
            ? 'Already have an account? Sign In'
            : "Don't have an account? Sign Up"}
        </Button>
      </Center>
    </Paper>
  );
};

export default AuthForm;
