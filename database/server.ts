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

/* ──────────────────────────────────────────────
   POST  /api/hobbies  → store a new hobby
────────────────────────────────────────────── */
app.post('/api/hobbies', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }
  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;
    if (!firebaseUid) {
      res.status(400).json({ error: 'Invalid token' });
      return;
    }
    /* map firebaseUid → users.id */
    const userRes = await pool.query(
      'SELECT id FROM users WHERE firebase_uid = $1',
      [firebaseUid]
    );
    if (userRes.rowCount === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const userId = userRes.rows[0].id;

    const { hobby_name, skill_level, goal } = req.body;
    if (!hobby_name) {
      res.status(400).json({ error: 'Missing hobby name' });
      return;
    }

    const insertQuery = `
      INSERT INTO hobbies (user_id, hobby, skill_level, goal)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id, hobby) DO NOTHING
      RETURNING *;
    `;

    const values = [userId, hobby_name, skill_level, goal];
    const hobbyResult = await pool.query(insertQuery, values);

    if (hobbyResult.rowCount === 0) {
      res.status(200).json({ message: 'Hobby already exists' });
      return;
    }

    res.status(200).json(hobbyResult.rows[0]);
  } catch (error) {
    console.error('Error creating hobby:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/* ──────────────────────────────────────────────
   GET  /api/hobbies  → return all hobbies for user
────────────────────────────────────────────── */
app.get('/api/hobbies', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }
  const idToken = authHeader.split('Bearer ')[1];

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;
    if (!firebaseUid) { 
      res.status(400).json({ error: 'Invalid token' });
      return;
    }

    /* map firebaseUid → users.id */
    const userRes = await pool.query(
      'SELECT id FROM users WHERE firebase_uid = $1',
      [firebaseUid]
    );
    if (userRes.rowCount === 0) {
      res.status(404).json({ error: 'User not found' });
    return;
    }
    const userId = userRes.rows[0].id;

    /* fetch hobbies */
    const hobbyRes = await pool.query(
      'SELECT id, hobby, skill_level, goal FROM hobbies WHERE user_id = $1',
      [userId]
    );

    res.json(hobbyRes.rows);              // [] if none
  } catch (err) {
    console.error('Error fetching hobbies:', err);
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
}

app.post('/api/generate-hobby', async (req: Request, res: Response): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    // 1. Verify user
    const idToken = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decoded.uid;

    // 2. Look up internal user ID
    const userQ = await pool.query(
      'SELECT id FROM users WHERE firebase_uid = $1',
      [firebaseUid]
    );
    if (userQ.rowCount === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const userId = userQ.rows[0].id;

    // 3. Fetch all events in the next 2 weeks
    const eventsQ = await pool.query(
      `SELECT day, month, year, title, time
       FROM events
       WHERE user_id = $1
         AND (year, month, day) BETWEEN
           (EXTRACT(YEAR FROM NOW()), EXTRACT(MONTH FROM NOW()), EXTRACT(DAY FROM NOW()))
           AND
           (EXTRACT(YEAR FROM NOW() + INTERVAL '14 days'),
            EXTRACT(MONTH FROM NOW() + INTERVAL '14 days'),
            EXTRACT(DAY FROM NOW() + INTERVAL '14 days'))`,
      [userId]
    );

    // 4. Organize events by date string
    const eventsByDate: Record<string, string[]> = {};
    eventsQ.rows.forEach(e => {
      const date = `${e.year}-${String(e.month + 1).padStart(2, '0')}-${String(e.day).padStart(2, '0')}`;
      const desc = `${e.time} – ${e.title}`;
      if (!eventsByDate[date]) eventsByDate[date] = [];
      eventsByDate[date].push(desc);
    });

    // 5. Build a human-readable calendar block
    const today = new Date();
    const calendarLines: string[] = [];
    for (let i = 0; i <= 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);
      const ds = d.toISOString().split('T')[0];
      const evs = eventsByDate[ds];
      calendarLines.push(
        evs
          ? `${ds}: ${evs.join(', ')}`
          : `${ds}: (no events)`
      );
    }

    // 6. Fetch existing hobbies for context
    const hobbiesQ = await pool.query(
      'SELECT hobby, skill_level, goal FROM hobbies WHERE user_id = $1',
      [userId]
    );
    const existing = hobbiesQ.rows
      .map(h => `${h.hobby} (${h.skill_level}, goal: ${h.goal})`)
      .join('; ');

    // 7. Prompt the AI with the full calendar
    const aiResponse = await axios.post<GroqResponse>(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: process.env.GROQ_MODEL,
        messages: [{
          role: 'user',
          content: `
          Here is your calendar for the next two weeks:
          ${calendarLines.join('\n')}

          Here are your existing hobbies (name, level, goal):
          ${existing || 'None'}

          From the free slots in your calendar, pick three days, choose a time, and recommend **hobby activities based off of your activities** (i.e., ones already in your existing list).

          Take the user's existing schedule for the day into account. For example, if their calendar events that day include many meetings or indoor events, suggest their hobby suggestion to be related to the outdoors.

          Make sure the hobby activity description are unique and bite-sized (able to complete in 15-30 minutes).
          Take your existing schedule for the day into account. For example, if your calendar events that day include many meetings or indoor events, have hobby suggestion to be related to the outdoors.

          **Reply EXACTLY** (no extra text) in this format:
          YYYY-MM-DD|Hobby Name|1-sentence description
          `
        }]
      },
      { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } }
    );

    // 8. Parse the AI’s lines into suggestions
    const suggestions: GroqSuggestion[] = aiResponse.data.choices[0].message.content
      .split('\n')
      .filter(line => line.trim())
      .slice(0, 3)
      .map(line => {
        const [date, hobby, description] = line.split('|');
        return { date, hobby, description };
      });

    res.status(200).json({ suggestions });

  } catch (error) {
    console.error('Error generating AI-driven suggestions:', error);
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