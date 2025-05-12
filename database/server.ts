// server.ts
import express, { Request, Response } from 'express';
import { Pool } from 'pg';
import dotenv from 'dotenv';
import admin from 'firebase-admin';
import fs from 'fs';
import path from 'path';
import cors from 'cors';
import axios from 'axios';



dotenv.config();

// Initialize Firebase Admin with your service account credentials
const serviceAccountPath = path.join(__dirname, 'serviceAccountKey.json');
const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const app = express();
const port = 5000;

// Middleware to parse JSON requests
app.use(express.json());

//app.use(cors());

app.use(cors({
  origin: 'http://localhost:5173', // your frontend URL
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Set up PostgreSQL connection pool
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// API endpoint to upsert user data
app.post('/api/users', async (req: Request, res: Response): Promise<void> => {
  // Expect the Firebase ID token in the Authorization header: "Bearer <token>"
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }
  const idToken = authHeader.split('Bearer ')[1];

  try {
    // Verify the token using Firebase Admin
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;
    const email = decodedToken.email;

    if (!firebaseUid || !email) {
      res.status(400).json({ error: 'Invalid token data' });
      return;
    }

    // Upsert the user record into PostgreSQL using the unique firebase_uid
    const query = `
      INSERT INTO users (firebase_uid, email)
      VALUES ($1, $2)
      ON CONFLICT (firebase_uid)
      DO UPDATE SET email = EXCLUDED.email, updated_at = NOW()
      RETURNING *;
    `;
    const values = [firebaseUid, email];
    const result = await pool.query(query, values);

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Error upserting user:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/*
-----------------------------------------------------------This is the new endpoint that handles with storing the user data for their hobbies. -----------------------------------------------------------
*/

// Endpoint to create a new hobby for the authenticated user
app.post('/api/hobbies', async (req: Request, res: Response): Promise<void> => {
  // Expect the Firebase ID token in the Authorization header: "Bearer <token>"
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }
  const idToken = authHeader.split('Bearer ')[1];

  try {
    // Verify the token using Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;
    if (!firebaseUid) {
      res.status(400).json({ error: 'Invalid token data' });
      return;
    }

    // Retrieve the user record to get the internal user id
    const userResult = await pool.query(
      'SELECT id FROM users WHERE firebase_uid = $1',
      [firebaseUid]
    );
    if (userResult.rowCount === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const userId = userResult.rows[0].id;
    const { hobby_name, skill_level, goal } = req.body;
    if (!hobby_name) {
      res.status(400).json({ error: 'Missing hobby name' });
      return;
    }
    const insertQuery = `
      INSERT INTO hobbies (user_id, hobby, skill_level, goal)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const values = [userId, hobby_name, skill_level, goal];
    const hobbyResult = await pool.query(insertQuery, values);
    res.status(200).json(hobbyResult.rows[0]);
  } catch (error) {
    console.error('Error creating hobby:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/*
-----------------------------------------------------------Handles AI!!! AND generates hobby.-----------------------------------------------------------
*/

interface GroqResponse {
  choices: Array<{
    message: {
      content: string;
    };
  }>;
}

interface GroqSuggestion {
  description: string;
  hobby: string;
  date: string; // YYYY-MM-DD
  start: string;
  end: string;
}

app.post('/api/generate-hobby', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    // Verify user
    const idToken = authHeader.split('Bearer ')[1];
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;

    // Get user ID
    const userResult = await pool.query(
      'SELECT id FROM users WHERE firebase_uid = $1', 
      [firebaseUid]
    );
    if (userResult.rowCount === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const userId = userResult.rows[0].id;

    // Step 1: Find 3 free days in the next 2 weeks
    const eventsResult = await pool.query(
      `SELECT day, month, year FROM events 
       WHERE user_id = $1 
       AND (year, month, day) BETWEEN 
         (EXTRACT(YEAR FROM NOW()), EXTRACT(MONTH FROM NOW()), EXTRACT(DAY FROM NOW())) 
         AND 
         (EXTRACT(YEAR FROM NOW() + INTERVAL '14 days'), EXTRACT(MONTH FROM NOW() + INTERVAL '14 days'), EXTRACT(DAY FROM NOW() + INTERVAL '14 days'))`,
      [userId]
    );

    // Find dates without events
    const busyDates = new Set(
      eventsResult.rows.map(e => 
        `${e.year}-${String(e.month + 1).padStart(2, '0')}-${String(e.day).padStart(2, '0')}`
      )
    );

    const freeDates: string[] = [];
    const today = new Date();
    for (let i = 0; freeDates.length < 3 && i < 14; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      const dateString = date.toISOString().split('T')[0];
      if (!busyDates.has(dateString)) {
        freeDates.push(dateString);
      }
    }

    if (freeDates.length < 3) {
      res.status(400).json({ error: 'Not enough free days found' });
      return;
    }

    // Step 2: Get user hobbies for AI context
    const hobbiesResult = await pool.query(
      'SELECT hobby, skill_level, goal FROM hobbies WHERE user_id = $1',
      [userId]
    );
    const hobbies = hobbiesResult.rows;

    // Step 3: Generate AI suggestions
    const aiResponse = await axios.post<GroqResponse>(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: process.env.GROQ_MODEL,
        messages: [{
          role: "user",
          content: `Suggest 3 different hobby activities for these dates: ${freeDates.join(', ')}.
          User's existing hobbies: ${hobbies.map(h => `${h.hobby} (${h.skill_level}, goal: ${h.goal})`).join(', ')}.
          Make sure the hobby activity suggestions are unique and bite-sized (able to complete in 15-30 minutes).
          Format each suggestion EXACTLY like:
          [date]|[start]|[end]|[Hobby Name]|[1-sentence description connecting to existing hobbies]
          
          Example:
          2023-10-15|3:00 PM|3:15 PM|Urban Sketching|Quick 15-minute sketches of cityscapes to build observation skills from photography
          
          Do NOT combine multiple hobbies into one suggestion.
          Take the user's existing schedule for the day into account. For example, if their calendar events that day include many meetings or indoor events, suggest their hobby suggestion to be related to the outdoors.`
          
        }]
      },
      { headers: { 'Authorization': `Bearer ${process.env.GROQ_API_KEY}` } }
    );

    // Parse AI response
    const suggestions = aiResponse.data.choices[0].message.content
      .split('\n')
      .filter(line => line.trim())
      .slice(0, 3)
      .map(line => {
        const [date, hobby, start, end, description] = line.split('|');
        return { date, hobby, start, end, description };
      });

    res.status(200).json({ suggestions });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});


/*
-----------------------------------------------------------Handles Calendar to DB.-----------------------------------------------------------
*/

// Get all events for authenticated user
app.get('/api/events', async (req: Request, res: Response) => {
  console.log('\n[Server] GET /api/events received');
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }
  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;

    const userResult = await pool.query(
      'SELECT id FROM users WHERE firebase_uid = $1',
      [firebaseUid]
    );
    if (userResult.rowCount === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const userId = userResult.rows[0].id;

    const eventsResult = await pool.query(
      'SELECT * FROM events WHERE user_id = $1',
      [userId]
    );
    res.status(200).json(eventsResult.rows);

    console.log(`[Server] Found ${eventsResult.rowCount} events for user ${userId}`);
     //is this correct? I think it is, but just checking.

  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create new event
app.post('/api/events', async (req: Request, res: Response) => {
  console.log('\n[Server] POST /api/events received with body:', req.body);
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }
  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;

    const userResult = await pool.query(
      'SELECT id FROM users WHERE firebase_uid = $1',
      [firebaseUid]
    );
    if (userResult.rowCount === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const userId = userResult.rows[0].id;

    const { day, month, year, title, time } = req.body;
    if (!day || !month || !year || !title || !time) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const insertQuery = `
      INSERT INTO events (user_id, day, month, year, title, time)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;
    const values = [userId, day, month, year, title, time];
    const result = await pool.query(insertQuery, values);
    res.status(201).json(result.rows[0]);

    console.log(`[Server] Created event for user ${userId}:`, result.rows[0]);// Log the created event for debugging


  } catch (error) {
    console.error('Error creating event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete event
app.delete('/api/events/:id', async (req: Request, res: Response) => {
  console.log(`\n[Server] DELETE /api/events/${req.params.id} received`);
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }
  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;

    const userResult = await pool.query(
      'SELECT id FROM users WHERE firebase_uid = $1',
      [firebaseUid]
    );
    if (userResult.rowCount === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const userId = userResult.rows[0].id;

    const eventId = req.params.id;
    const deleteQuery = `
      DELETE FROM events 
      WHERE id = $1 AND user_id = $2
      RETURNING *;
    `;
    const result = await pool.query(deleteQuery, [eventId, userId]);

    if (result.rowCount === 0) {
      res.status(404).json({ error: 'Event not found or unauthorized' });
      return;
    }

    res.status(200).json({ message: 'Event deleted successfully' });

    console.log(`[Server] Deleted event ${eventId} for user ${userId}`); // IF this is not working, then the event is not being deleted. BOMBOCLAT!
    //res.status(200).json({ message: 'Event deleted successfully' });

  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});