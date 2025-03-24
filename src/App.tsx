import { useState, useEffect } from 'react';
import reactLogo from './assets/react.svg';
import viteLogo from '/vite.svg';
import './App.css';
import '@mantine/core/styles.css';
import { MantineProvider } from '@mantine/core';
import SurveyForm from './components/SurveyForm';
import GoogleCalendar from './components/GoogleCalendar';

function App() {
  const [accessToken, setAccessToken] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('access_token');

    if (token) {
      localStorage.setItem('access_token', token);
      setAccessToken(token);
      window.history.replaceState({}, document.title, '/'); // Remove token from URL
    } else {
      const storedToken = localStorage.getItem('access_token');
      setAccessToken(storedToken);
    }
  }, []);

  const handleLogin = () => {
    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${import.meta.env.VITE_GOOGLE_CLIENT_ID}&redirect_uri=${import.meta.env.VITE_GOOGLE_REDIRECT_URI}&response_type=code&scope=https://www.googleapis.com/auth/calendar.readonly&access_type=offline`;
    window.location.href = googleAuthUrl;
  };

  return (
    <MantineProvider>
      <div>
        <a href="https://vite.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>Vite + React</h1>
      <div className="card">
        <p>Edit <code>src/App.tsx</code> and save to test HMR</p>
      </div>
      <p className="read-the-docs">
        Click on the Vite and React logos to learn more
      </p>

      <div>
        <SurveyForm />
      </div>

      <div>
        <h1>Google Calendar Integration</h1>
        {accessToken ? (
          <GoogleCalendar />
        ) : (
          <button onClick={handleLogin}>Login with Google</button>
        )}
      </div>
    </MantineProvider>
  );
}

export default App;
