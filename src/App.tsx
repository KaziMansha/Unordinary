import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import AuthPage from './components/AuthForm';  // This file toggles between SignInForm and SignUpForm
import WelcomePage from './home/Home';           // This is your welcome page (Hero, Navbar, Footer)
import HomePage from './components/HomePage.tsx';               // This is the authenticated user's dashboard
import DashboardPage from './dashboard/Dashboard';

function App() {
  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<WelcomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  );
}

export default App;
