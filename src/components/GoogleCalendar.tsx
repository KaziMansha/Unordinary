import React, { useEffect, useState } from 'react';
import axios from 'axios';

const GoogleCalendar = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [freeSlots, setFreeSlots] = useState<any[]>([]);
  const accessToken = localStorage.getItem('access_token');

  useEffect(() => {
    if (!accessToken) {
      console.error('No access token found');
      return;
    }

    const fetchEvents = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/events', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });

        setEvents(response.data.events);
        setFreeSlots(response.data.freeSlots);
      } catch (error) {
        console.error('Error fetching events:', error);
      }
    };

    fetchEvents();
  }, [accessToken]);

  return (
    <div>
      <h2>Your Google Calendar Events</h2>
      <ul>
        {events.length > 0 ? (
          events.map((event) => (
            <li key={event.id}>
              {event.summary} - {new Date(event.start).toLocaleString()}
            </li>
          ))
        ) : (
          <p>No events found.</p>
        )}
      </ul>

      <h2>Available Free Time Slots</h2>
      <ul>
        {freeSlots.length > 0 ? (
          freeSlots.map((slot, index) => (
            <li key={index}>
              Free from {new Date(slot.start).toLocaleTimeString()} to {new Date(slot.end).toLocaleTimeString()} ({slot.duration} min)
            </li>
          ))
        ) : (
          <p>No free slots available.</p>
        )}
      </ul>
    </div>
  );
};

export default GoogleCalendar;
