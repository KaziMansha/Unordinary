// /src/components/Authform.tsx
import React, { useState } from 'react';
import SignInForm from './SignInForm';
import SignUpForm from './SignUpForm';
import { Button, Center } from '@mantine/core';
import './AuthForm.css';

const AuthPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);

  return (
    <div>
      {isSignUp ? <SignUpForm /> : <SignInForm />}
      <Center style={{ marginTop: '1rem' }}>
        <Button
          variant="light"
          className="auth-button"
          onClick={() => setIsSignUp(!isSignUp)}
        >
          {isSignUp
            ? 'Already have an account? Sign In'
            : "Don't have an account? Sign Up"}
        </Button>
      </Center>
    </div>
  );
};

export default AuthPage;
