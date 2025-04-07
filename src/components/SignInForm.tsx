// /src/components/SignInForm.tsx
import React from 'react';
import { TextInput, PasswordInput, Button, Paper, Title } from '@mantine/core';
import { useForm } from '@mantine/form';
import { signInWithEmailAndPassword, signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../firebase-config';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom'
import leftImage from '../assets/SignUp_Image.png'
import './SignInForm.css'
import './Authform.css'

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
      navigate('/Dashboard');
    } catch (error: any) {
      console.error('Sign in error:', error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      navigate('/Dashboard');
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
          <Title className="auth-title">Welcome Back to Unordinary</Title>
          
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

            <Button type="submit" className="signin-button">
              Sign In
            </Button>

            <Button className="google-signin-button" onClick={handleGoogleSignIn}>
              Sign in with Google
            </Button>
          </form>

          <div className="signup-redirect">
            <span>New to Unordinary?</span> <Link to="/signup">Create Account</Link>
          </div>
        </Paper>
      </div>
    </div>
  );
};

export default SignInForm;
