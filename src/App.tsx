import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import AuthPage from './components/AuthForm';  // Auth forms
import WelcomePage from './home/Home';           // Welcome page
import HomePage from './components/HomePage.tsx';  // Authenticated user's homepage
import DashboardPage from './dashboard/Dashboard'; // Dashboard with Calendar and Survey (if desired)
import HobbySurvey from './dashboard/components/HobbySurvey/HobbySurvey.tsx'; // New dedicated survey page
import HobbySuggestion from './dashboard/components/HobbySuggestion/HobbySuggestion';

function App() {
  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/" element={<WelcomePage />} />
          <Route path="/home" element={<HomePage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/hobbiesurvey" element={<HobbySurvey />} />
          <Route path="/hobbysuggestion" element={<HobbySuggestion />} />
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  );
}

export default App;
