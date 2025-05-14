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

// Time conversion utilities
const convertToMinutes = (time: string): number => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const minutesToTime = (totalMinutes: number): string => {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

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
      ON CONFLICT (user_id, hobby) DO NOTHING
      RETURNING *;
    `;

    const values = [userId, hobby_name, skill_level, goal];
    const hobbyResult = await pool.query(insertQuery, values);

     if (hobbyResult.rowCount === 0) {
      res.status(200).json({ message: 'Hobby already exists' });
    }

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
  date: string;
  startTime: string;
  endTime: string;
  hobby: string;
  description: string;
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

    // 3. Fetch events in the next 2 weeks
    const eventsQ = await pool.query(`
      SELECT 
        id, 
        day, 
        month, 
        year, 
        time, 
        end_time as "endTime",
        title
      FROM events 
      WHERE user_id = $1 
        AND MAKE_DATE(year, month + 1, day) 
          BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '14 days'
      ORDER BY year, month, day, time
    `, [userId]);

    // 4. Find free time slots
    const freeSlots: { date: string; start: string; end: string }[] = [];
    const today = new Date();
    const twoWeeksLater = new Date(today);
    twoWeeksLater.setDate(today.getDate() + 14);
    const eventsByDate: { [key: string]: any[] } = {};

    const dateArray: Date[] = [];
    for (let d = new Date(today); d <= twoWeeksLater; d.setDate(d.getDate() + 1)) {
      dateArray.push(new Date(d));
    }

    dateArray.forEach(currentDate => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth(); // 0-based
      const day = currentDate.getDate();
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      
      // Get events for this date
      const daysEvents = eventsQ.rows.filter(event => 
        event.year === year && 
        event.month === month && 
        event.day === day
      ).sort((a, b) => convertToMinutes(a.time) - convertToMinutes(b.time));

      // If no events, add full day slot
      if (daysEvents.length === 0) {
        freeSlots.push({
          date: dateStr,
          start: '08:00',
          end: '17:00'
        });
        return;
      }

      // Existing slot detection logic...
      // [Keep the existing code for checking before first event, between events, and after last event]
    });

    // Group events by date
    eventsQ.rows.forEach(event => {
      const date = `${event.year}-${String(event.month + 1).padStart(2, '0')}-${String(event.day).padStart(2, '0')}`;
      if (!eventsByDate[date]) eventsByDate[date] = [];
      eventsByDate[date].push({
        ...event,
        endTime: event.endTime || event.time // Handle events without end time
      });
    });

    // Find slots for each day
    Object.entries(eventsByDate).forEach(([date, events]) => {
      const sortedEvents = events.sort((a, b) => convertToMinutes(a.time) - convertToMinutes(b.time));
      
      // Check before first event (8:00 AM to first event)
      const firstEventStart = convertToMinutes(sortedEvents[0].time);
      if (firstEventStart > 480) { // 8:00 AM = 480 minutes
        freeSlots.push({
          date,
          start: '08:00',
          end: minutesToTime(firstEventStart)
        });
      }

      // Check between events
      for (let i = 0; i < sortedEvents.length - 1; i++) {
        const currentEnd = convertToMinutes(sortedEvents[i].endTime);
        const nextStart = convertToMinutes(sortedEvents[i + 1].time);
        
        if (nextStart - currentEnd >= 15) { // Minimum 15 minute gap
          freeSlots.push({
            date,
            start: minutesToTime(currentEnd),
            end: minutesToTime(nextStart)
          });
        }
      }

      // Check after last event (last event end to 17:00)
      const lastEvent = sortedEvents[sortedEvents.length - 1];
      const lastEventEnd = convertToMinutes(lastEvent.endTime);
      if (lastEventEnd < 1020) { // 17:00 = 1020 minutes
        freeSlots.push({
          date,
          start: minutesToTime(lastEventEnd),
          end: '17:00'
        });
      }
    });

    // 5. Fetch existing hobbies for context
    const hobbiesQ = await pool.query(
      'SELECT hobby, skill_level, goal FROM hobbies WHERE user_id = $1',
      [userId]
    );
    const existing = hobbiesQ.rows
      .map(h => `${h.hobby} (${h.skill_level}, goal: ${h.goal})`)
      .join('; ');

    // 6. Generate AI suggestions with actual time slots
    const aiResponse = await axios.post<GroqResponse>(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: process.env.GROQ_MODEL,
        temperature: 0.7,
        messages: [{
          role: 'user',
          content: `
          AVAILABLE TIME SLOTS (must use exactly these between ${today.toISOString().split('T')[0]} and ${twoWeeksLater.toISOString().split('T')[0]}):
          ${freeSlots.map(slot => `${slot.date} ${slot.start}-${slot.end}`).join('\n')}

          EXISTING HOBBIES:
          ${existing || 'None'}

          STRICT REQUIREMENTS:
          1. Choose 3 different time slots from the AVAILABLE list
          2. Activities must fit EXACTLY within the time windows
          3. Format MUST BE:
          YYYY-MM-DD|HH:MM|HH:MM|Hobby Name|1-sentence description
          4. Times must be in 24h format (e.g., 14:30 not 2:30 PM)

          EXAMPLE:
          2024-03-15|14:00|14:15|Meditation|Practice mindful breathing for 15 minutes
          `
        }]
      },
      { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } }
    );

    // 7. Parse AI response
    const suggestions: GroqSuggestion[] = aiResponse.data.choices[0].message.content
    .split('\n')
    .filter(line => {
      const parts = line.split('|');
      return parts.length === 5 && 
            parts.every(p => p.trim().length > 0) &&
            /^\d{4}-\d{2}-\d{2}$/.test(parts[0].trim()) &&
            /^\d{2}:\d{2}$/.test(parts[1].trim()) &&
            /^\d{2}:\d{2}$/.test(parts[2].trim());
    })
    .slice(0, 3)
    .map(line => {
      const [date, startTime, endTime, hobby, description] = line.split('|').map(p => p.trim());
      return { 
        date,
        startTime,
        endTime,
        hobby,
        description
      };
    });

    if (suggestions.length === 0) {
      console.error('AI returned invalid suggestions:', aiResponse.data.choices[0].message.content);
      res.status(200).json({ suggestions: [] });
      return;
    }

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
    'SELECT id, day, month, year, title, time, end_time as "endTime", description FROM events WHERE user_id = $1',
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

    const { day, month, year, title, time, endTime, description } = req.body;
    if (!day || !month || !year || !title || !time) {
      res.status(400).json({ error: 'Missing required fields' });
      return;
    }

    const insertQuery = `
    INSERT INTO events (user_id, day, month, year, title, time, end_time, description)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    RETURNING *;
    `;

    const values = [userId, day, month, year, title, time, endTime || null, description || null];
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