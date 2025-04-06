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

if (!process.env.GROQ_API_KEY || !process.env.GROQ_MODEL) {
  console.error("Missing GROQ_API_KEY or GROQ_MODEL in .env");
  process.exit(1);
}

app.post('/api/generate-hobby', async (req: Request, res: Response): Promise<void> => {
  // Step 1: Verify the Firebase token from the Authorization header
  console.log('Received headers:', req.headers);
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized: No token provided' });
    return;
  }
  const idToken = authHeader.split('Bearer ')[1];

  

  try {
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    const firebaseUid = decodedToken.uid;
    if (!firebaseUid) {
      res.status(400).json({ error: 'Invalid token data' });
      return;
    }

    // Step 2: Lookup the user record to obtain internal user ID
    const userResult = await pool.query('SELECT id FROM users WHERE firebase_uid = $1', [firebaseUid]);
    if (userResult.rowCount === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    const userId = userResult.rows[0].id;

    // Step 3: Query the hobbies table for that user
    const hobbyResult = await pool.query(
      'SELECT hobby, skill_level, goal FROM hobbies WHERE user_id = $1',
      [userId]
    );
    const userHobbies = hobbyResult.rows; // This should be an array of objects

    // Check if the user has any hobbies
    if (userHobbies.length === 0) {
      res.status(400).json({ error: 'No hobbies found for this user' });
      return;
    }


    const existingHobbies = userHobbies.map(h => `"${h.hobby}"`).join(', ');
    
    // Step 4: Call your AI suggestion service with the user's hobbies.
    // Replace this with your actual call to your AI/Groq API.
    // For demonstration, we'll assume you call an external AI service.
    const aiResponse = await axios.post<GroqResponse>(
      'https://api.groq.com/openai/v1/chat/completions', // Example Groq endpoint
      {
        model: process.env.GROQ_MODEL,
        messages: [{
          role: "user",
          content: `Suggest a NEW hobby that can be done in 15-30 minutes daily, 
                considering the user's existing hobbies: ${existingHobbies}.
                Briefly mention how it relates to their current interests.
                Format: "[Hobby Name] - [1-sentence description]. [Connection to existing hobbies]"
                Example: 
                "Quick Sketching - 10-minute gesture drawings of people in cafes. 
                Builds observation skills from your portrait photography hobby."`
        }]
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    const suggestion = aiResponse.data.choices[0].message.content;

    res.status(200).json({ suggestion });
  } catch (error) {
    console.error('Error generating hobby suggestion:', error);
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
    res.status(200).json(eventsResult.rows); //is this correct? I think it is, but just checking.

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
    res.status(201).json(result.rows[0]);

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
    res.status(200).json({ message: 'Event deleted successfully' });

  } catch (error) {
    console.error('Error deleting event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});