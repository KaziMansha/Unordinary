import express from 'express';
import cors from 'cors';
import axios from 'axios';
import qs from 'querystring';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = 5000;

app.use(express.json());
app.use(cors({ origin: 'http://localhost:5173', credentials: true })); // Allow frontend access

let userTokens = {}; // Temporary store (use a database in production)

// OAuth callback route
app.get('/oauthcallback', async (req, res) => {
  const code = req.query.code;

  try {
    const response = await axios.post(
      'https://oauth2.googleapis.com/token',
      qs.stringify({
        code,
        client_id: process.env.VITE_GOOGLE_CLIENT_ID,
        client_secret: process.env.VITE_GOOGLE_CLIENT_SECRET,
        redirect_uri: process.env.VITE_GOOGLE_REDIRECT_URI,
        grant_type: 'authorization_code',
      }),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const { access_token, refresh_token } = response.data;

    // Store access token (temporary, use a DB in production)
    userTokens['user'] = access_token;

    // Redirect user to the homepage with access token
    res.redirect(`http://localhost:5173?access_token=${access_token}`);
  } catch (error) {
    console.error('Error exchanging authorization code:', error);
    res.status(500).send('Authentication error');
  }
});

// Fetch calendar events
app.get('/api/events', async (req, res) => {
  const accessToken = userTokens['user'];

  if (!accessToken) {
    return res.status(401).send('User not authenticated');
  }

  try {
    const response = await axios.get('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    res.json(response.data.items);
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).send('Error fetching events');
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
