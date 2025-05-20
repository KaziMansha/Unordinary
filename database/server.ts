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

const isValidDate = (dateStr: string) => /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
const isValidTime = (timeStr: string) => /^\d{1,2}:\d{2}$/.test(timeStr);

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

    // 4. Format calendar data for AI analysis
    const calendarData = eventsQ.rows.map(event => ({
      date: `${event.year}-${String(event.month + 1).padStart(2,'0')}-${String(event.day).padStart(2,'0')}`,
      start: event.time,
      end: event.endTime || event.time,
      title: event.title.replace(/"/g, '\\"')
    }));

    // 4. Find free time slots
    let freeSlots: { date: string; start: string; end: string }[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const twoWeeksLater = new Date(today);
    twoWeeksLater.setDate(today.getDate() + 14);
    
    const eventsByDate: { [key: string]: any[] } = {};

    const dateArray: Date[] = [];
    const currentDate = new Date(today);
    while (currentDate <= twoWeeksLater) {
      dateArray.push(new Date(currentDate));
      currentDate.setDate(currentDate.getDate() + 1);
    }

    dateArray.forEach(currentDate => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const day = currentDate.getDate();
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (currentDate < today || currentDate > twoWeeksLater) return;

    const existingSlots = freeSlots.filter(slot => slot.date === dateStr);
    freeSlots = freeSlots.filter(slot => slot.date !== dateStr);
      
      // Get events for this date
    const daysEvents = eventsQ.rows.filter(event => 
      event.year === year && 
      event.month === month && 
      event.day === day
    ).sort((a, b) => convertToMinutes(a.time) - convertToMinutes(b.time));

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
    const existingHobbies = hobbiesQ.rows;


    // 6. Generate AI suggestions with actual time slots
    const aiResponse = await axios.post<GroqResponse>(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: process.env.GROQ_MODEL,
        temperature: 0.9,
        messages: [{
          role: "system",
          content: `
          Analyze this calendar data... 
          ${JSON.stringify(calendarData).replace(/"/g, '\\"')} // Escape quotes
          Existing hobbies: 
          ${existingHobbies.map(h => `${h.hobby} (${h.skill_level}, goal: ${h.goal})`).join('\n')}

          STRICT REQUIREMENTS:
          1. Provide EXACTLY 3 suggestions
          2.All suggestions MUST be between ${today.toISOString().split('T')[0]} and ${twoWeeksLater.toISOString().split('T')[0]}
          3. Find 3 different 15-30 minute time slots between existing events
          4. Suggest unique, specific hobby activities that fit in those gaps
          5. Never suggest times outside 8AM-9PM
          6. Take the user's existing schedule for the day into account. For example, if their calendar events that day include many meetings or indoor events, suggest their hobby suggestion to be related to the outdoors.
          7. Format response exactly as:
          YYYY-MM-DD|HH:MM|HH:MM|Hobby Name|1-sentence description

          Example:
          2024-03-15|14:00|14:15|Drawing|Quick 15-minute sketches of cityscapes to build observation skills from photography

          Example for empty calendar:
          2024-03-15|09:00|09:20|Morning Yoga|Quick flow to energize your day
          2024-03-16|14:00|14:15|Sketching|Practice shading techniques
          2024-03-17|18:30|18:45|Language Lesson|Review Spanish vocabulary
          `
        }]
      },
      { headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` } }
    );

    // 7. Parse AI response
    const suggestions = aiResponse.data.choices[0].message.content
      .split('\n')
      .filter(line => {
        const parts = line.split('|');
        if (parts.length !== 5) return false;
        
        const suggestionDate = new Date(parts[0] + 'T00:00:00Z');  // Parse as UTC
        return (
          isValidDate(parts[0]) &&
          isValidTime(parts[1]) &&
          isValidTime(parts[2]) &&
          suggestionDate >= today &&
          suggestionDate <= twoWeeksLater
        );
      })
      .map(line => {  
        const [date, start, end, hobby, desc] = line.split('|');
        // Add padding to single-digit hours
        const padTime = (t: string) => t.split(':').map(v => v.padStart(2, '0')).join(':');
        return { 
          date, 
          startTime: padTime(start), 
          endTime: padTime(end), 
          hobby, 
          description: desc 
        };
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

// FEEDBACK
// Get feedback-eligible hobbies
app.get('/api/feedback-hobbies', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    const userRes = await pool.query(
      'SELECT id FROM users WHERE firebase_uid = $1',
      [decoded.uid]
    );
    
    if (userRes.rowCount === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const hobbies = await pool.query(`
      SELECT h.id, h.hobby 
      FROM hobbies h
      WHERE h.user_id = $1
      AND NOT EXISTS (
        SELECT 1 FROM hobby_feedback f 
        WHERE f.hobby_id = h.id AND f.user_id = $1
      )
    `, [userRes.rows[0].id]);

    res.json(hobbies.rows);
  } catch (err) {
    console.error('Error fetching feedback hobbies:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Submit feedback
app.post('/api/feedback', async (req: Request, res: Response) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    const token = authHeader.split('Bearer ')[1];
    const decoded = await admin.auth().verifyIdToken(token);
    const userRes = await pool.query(
      'SELECT id FROM users WHERE firebase_uid = $1',
      [decoded.uid]
    );

    if (userRes.rowCount === 0) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const userId = userRes.rows[0].id;
    const feedbackData = req.body;

    // Validate input
    if (!Array.isArray(feedbackData)) {
      res.status(400).json({ error: 'Invalid feedback format' });
      return;
    }

    // Insert feedback
    const values = feedbackData.map(f => [
      userId,
      f.hobbyId,
      f.rating,
      f.frequency,
      f.usefulness
    ]);

    const query = `
      INSERT INTO hobby_feedback 
        (user_id, hobby_id, rating, frequency, usefulness)
      SELECT * FROM UNNEST(
        $1::integer[],
        $2::integer[],
        $3::integer[],
        $4::integer[],
        $5::integer[]
      )
      RETURNING id;
    `;

    const result = await pool.query(query, [
      values.map(v => v[0]),
      values.map(v => v[1]),
      values.map(v => v[2]),
      values.map(v => v[3]),
      values.map(v => v[4])
    ]);

    res.status(201).json({ success: true, count: result.rowCount });
  } catch (err) {
    console.error('Error submitting feedback:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});