// Calendar.tsx
import { useState, useEffect } from 'react';
import { auth } from '../../../firebase-config.ts'; // Adjust path as needed
import './Calendar.css';

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  type CalendarEvent = {
    id: number;
    day: number;
    month: number;
    year: number;
    title: string;
    time: string;
  };

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [timeInput, setTimeInput] = useState('');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        console.log('[Calendar] Attempting to fetch events...');
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) return;
    
        const response = await fetch('http://localhost:5000/api/events', {
          headers: {
            'Authorization': `Bearer ${idToken}`,
          },
        });
        
        if (!response.ok) throw new Error('Failed to fetch events');
        
        const data = await response.json();
        console.log('[Calendar] Successfully fetched events:', data);
        setEvents(data);
      } catch (error) {
        console.error('[Calendar] Error fetching events:', error);
      }
    };

    fetchEvents();
  }, []);


  const year = currentDate.getFullYear();
  const month = currentDate.getMonth(); // 0-indexed

  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const calendarDays = [];
  for (let i = 0; i < firstDay; i++) {
    calendarDays.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    calendarDays.push(i);
  }

  const goToPreviousMonth = () => {
    const prevMonth = new Date(year, month - 1);
    setCurrentDate(prevMonth);
  };

  const goToNextMonth = () => {
    const nextMonth = new Date(year, month + 1);
    setCurrentDate(nextMonth);
  };

  const handleDayClick = (day: number) => {
    setSelectedDay(day);
    setShowForm(true);
  };

   // Update addEvent to be async
   const addEvent = async () => {
    if (selectedDay && titleInput) {
      console.log('[Calendar] Attempting to add event:', { //testing to see if the bloody event is being added(ts pmo)
        day: selectedDay, 
        month, 
        year, 
        title: titleInput, 
        time: timeInput 
      });
      const newEvent = {
        day: selectedDay,
        month,
        year,
        title: titleInput,
        time: timeInput,
      };

      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) {
          console.error('No user logged in');
          return;
        }

        const response = await fetch('http://localhost:5000/api/events', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${idToken}`,
          },
          body: JSON.stringify(newEvent),
        });

        if (!response.ok) throw new Error('Failed to save event');
        
        const savedEvent = await response.json();
        console.log('[Calendar] Event successfully saved to backend:', savedEvent); //is da even being saveD?
        setEvents([...events, savedEvent]);
        
        // Reset form
        console.log('[Calendar] Clearing form inputs');
        setTitleInput('');
        setTimeInput('');
        setShowForm(false);
      } catch (error) {
        console.error('Error adding event:', error);
      }
    }
  };

  // Update deleteEvent to use event ID
  const deleteEvent = async (eventId: number) => {
    console.log('[Calendar] Attempting to delete event ID:', eventId); //checking event itd 
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) {
        console.error('No user logged in');
        return;
      }

      const response = await fetch(`http://localhost:5000/api/events/${eventId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${idToken}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete event');
      
      console.log('[Calendar] Event successfully deleted from backend'); //checking if event is deleted
      setEvents(events.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const getEventsForDay = (day: number) => {
    return events.filter(
      (event) => event.day === day && event.month === month && event.year === year
    );
  };

  return (
    // Set the container's position to relative so the absolute positioned child is in context
    <div style={{ position: 'relative' }}>
      <div>
        <button onClick={goToPreviousMonth}>Previous</button>
        <span>
          {currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })}
        </span>
        <button onClick={goToNextMonth}>Next</button>
      </div>

      <div className="calendar-grid">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
          <div key={day} className="day-header">
            {day}
          </div>
        ))}

        {calendarDays.map((day, index) => (
          <div
            key={index}
            className="calendar-cell"
            onClick={() => day && handleDayClick(day)}
          >
            <div>{day}</div>
            {day && (
              <div className="event-list">
                {getEventsForDay(day)
                  .sort((a, b) => a.time.localeCompare(b.time))
                  .map((event, i) => {
                    const formattedTime = new Date(`1970-01-01T${event.time}`).toLocaleTimeString(
                      [], { 
                        hour: 'numeric',
                        minute: '2-digit' 
                      }
                    );
                    return (
                      <div key={i} className="event-preview">
                        <div className="event-wrapper">
                          <div className="event-content">
                            <div><strong>{event.title}</strong></div>
                            <div>{formattedTime}</div>
                          </div>
                          <button
                            className="delete-button"
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteEvent(event.id);
                            }}
                            title="Delete event"
                          >
                            ×
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        ))}
      </div>

      {showForm && (
        <div className="event-form">
          <h3>
            Add Event for {selectedDay}{' '}
            {currentDate.toLocaleString('default', { month: 'long' })}
          </h3>
          <input
            type="text"
            placeholder="Event title"
            value={titleInput}
            onChange={(e) => setTitleInput(e.target.value)}
          />
          <input
            type="time"
            value={timeInput}
            onChange={(e) => setTimeInput(e.target.value)}
          />
          <button onClick={addEvent}>Add Event</button>
          <button onClick={() => setShowForm(false)}>Cancel</button>
        </div>
      )}
    </div>
  );
}
