import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MantineProvider } from '@mantine/core';
import SignInForm from './components/SignInForm.tsx' //Sign In
import SignUpForm from './components/SignUpForm.tsx'; //Sign Up
import WelcomePage from './home/Home';           // Welcome page
import DashboardPage from './dashboard/Dashboard'; // Dashboard with Calendar and Survey (if desired)
import HobbySurvey from './dashboard/components/HobbySurvey/HobbySurvey.tsx'; // New dedicated survey page
//import HobbySuggestion from './dashboard/components/HobbySuggestion/HobbySuggestion';

function App() {
  return (
    <MantineProvider withGlobalStyles withNormalizeCSS>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<SignInForm />} />
          <Route path='/signup' element={<SignUpForm />} />
          <Route path="/" element={<WelcomePage />} />

          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/hobbiesurvey" element={<HobbySurvey />} />
          
        </Routes>
      </BrowserRouter>
    </MantineProvider>
  );
}

export default App;
