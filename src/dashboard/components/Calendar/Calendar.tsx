import { useState, useEffect } from 'react';
import { auth } from '../../../firebase-config.ts';
import './Calendar.css';

interface CalendarProps {
  refreshTrigger?: number;
}

export function Calendar({ refreshTrigger }: CalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');

  type CalendarEvent = {
    id: number;
    day: number;
    month: number;
    year: number;
    title: string;
    time: string;
    endTime?: string;
    description?: string;
  };

  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [titleInput, setTitleInput] = useState('');
  const [timeInput, setTimeInput] = useState('');
  const [endTimeInput, setEndTimeInput] = useState('');
  const [descriptionInput, setDescriptionInput] = useState('');
  const [activeEvent, setActiveEvent] = useState<CalendarEvent | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) return;

        const response = await fetch('http://localhost:5000/api/events', {
          headers: { 'Authorization': `Bearer ${idToken}` },
        });

        if (!response.ok) throw new Error('Failed to fetch events');
        const data = await response.json();
        setEvents(data);
      } catch (error) {
        console.error('[Calendar] Error fetching events:', error);
      }
    };

    fetchEvents();
  }, [refreshTrigger]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let calendarDays: (Date | null)[] = [];

  if (viewMode === 'month') {
    const firstDay = new Date(year, month, 1).getDay();
    for (let i = 0; i < firstDay; i++) calendarDays.push(null);
    for (let i = 1; i <= daysInMonth; i++) {
      calendarDays.push(new Date(year, month, i));
    }
  } else {
    const currentWeekDay = currentDate.getDay();
    const weekStartDate = new Date(currentDate);
    weekStartDate.setDate(currentDate.getDate() - currentWeekDay);

    for (let i = 0; i < 7; i++) {
      const date = new Date(weekStartDate);
      date.setDate(weekStartDate.getDate() + i);
      calendarDays.push(date);
    }
  }

  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    viewMode === 'month' ? newDate.setMonth(currentDate.getMonth() - 1) : newDate.setDate(currentDate.getDate() - 7);
    setCurrentDate(newDate);
  };

  const goToNext = () => {
    const newDate = new Date(currentDate);
    viewMode === 'month' ? newDate.setMonth(currentDate.getMonth() + 1) : newDate.setDate(currentDate.getDate() + 7);
    setCurrentDate(newDate);
  };

  const handleDayClick = (dateObj: Date) => {
    setSelectedDay(dateObj.getDate());
    setCurrentDate(dateObj);
    setShowForm(true);
  };

  const addEvent = async () => {
    if (selectedDay && titleInput) {
      const newEvent = {
        day: selectedDay,
        month: currentDate.getMonth(),
        year: currentDate.getFullYear(),
        title: titleInput,
        time: timeInput,
        endTime: endTimeInput,
        description: descriptionInput
      };
      try {
        const idToken = await auth.currentUser?.getIdToken();
        if (!idToken) return;

        const response = await fetch('http://localhost:5000/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
          body: JSON.stringify(newEvent),
        });

        if (!response.ok) throw new Error('Failed to save event');
        const savedEvent = await response.json();
        setEvents([...events, savedEvent]);
        setTitleInput('');
        setTimeInput('');
        setEndTimeInput('');
        setDescriptionInput('');
        setShowForm(false);
      } catch (error) {
        console.error('Error adding event:', error);
      }
    }
  };

  const deleteEvent = async (eventId: number) => {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;

      const response = await fetch(`http://localhost:5000/api/events/${eventId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${idToken}` },
      });

      if (!response.ok) throw new Error('Failed to delete event');
      setEvents(events.filter(event => event.id !== eventId));
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  const getEventsForDay = (day: number, monthParam: number, yearParam: number) => {
    return events.filter(
      (event) => event.day === day && event.month === monthParam && event.year === yearParam
    );
  };

  const calculateTop = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const hourHeight = 40;
    return (hours * hourHeight) + (minutes / 60) * hourHeight;
  };

  return (
    <div style={{ position: 'relative' }}>
      <div className="calendar-topbar">
        <div className="nav-controls">
          <button onClick={goToPrevious}>←</button>
          <span className="current-period">
            {viewMode === 'month'
              ? currentDate.toLocaleString('default', { month: 'long', year: 'numeric' })
              : `Week of ${calendarDays[0]?.toLocaleDateString()}`}
          </span>
          <button onClick={goToNext}>→</button>
        </div>
        <div className="view-toggle">
          <button onClick={() => setViewMode(viewMode === 'month' ? 'week' : 'month')}>
            {viewMode === 'month' ? 'Week View' : 'Month View'}
          </button>
        </div>
      </div>

      {viewMode === 'month' && (
        <div className="calendar-grid">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div key={day} className="day-header">{day}</div>
          ))}
          {calendarDays.map((dateObj, index) => (
            <div
              key={index}
              className={`calendar-cell ${dateObj && dateObj.getMonth() !== month ? 'outside-month' : ''}`}
              onClick={() => dateObj && handleDayClick(dateObj)}
            >
              <div>{dateObj ? dateObj.getDate() : ''}</div>
              {dateObj && (
                <div className="event-list">
                  {getEventsForDay(dateObj.getDate(), dateObj.getMonth(), dateObj.getFullYear())
                    .sort((a, b) => a.time.localeCompare(b.time))
                    .map(event => (
                      <div
                        key={event.id}
                        className="event-preview"
                        onClick={(e) => { e.stopPropagation(); setActiveEvent(event); }}
                      >
                        <span>{event.title}</span>
                        <button
                          className="delete-button"
                          onClick={(e) => { e.stopPropagation(); deleteEvent(event.id); }}
                          title="Delete event"
                        >×</button>
                      </div>
                    ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {viewMode === 'week' && (
        <div className="week-container">
          <div className="week-header">
            <div className="time-column-header"></div>
            {calendarDays.map((dateObj, index) => (
              <div key={index} className="week-day-header">
                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][dateObj.getDay()]} {dateObj.getDate()}
              </div>
            ))}
          </div>
          <div className="week-grid">
            <div className="time-column">
              {Array.from({ length: 24 }, (_, i) => (
                <div key={i} className="time-slot">
                  {i === 0 ? '12 AM' : i < 12 ? `${i} AM` : i === 12 ? '12 PM' : `${i - 12} PM`}
                </div>
              ))}
            </div>
            {calendarDays.map((dateObj, index) => (
              <div
                key={index}
                className="week-day-column"
                onClick={() => handleDayClick(dateObj)}
              >
                <div className="day-time-slots">
                  {getEventsForDay(dateObj.getDate(), dateObj.getMonth(), dateObj.getFullYear())
                    .map(event => {
                      const topPosition = calculateTop(event.time);
                      return (
                        <div
                          key={event.id}
                          className="week-event"
                          style={{ top: `${topPosition}px` }}
                          onClick={(e) => { e.stopPropagation(); setActiveEvent(event); }}
                        >
                          {event.title}
                        </div>
                      );
                    })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="popup-overlay" onClick={() => setShowForm(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <h3>Add Event for {selectedDay} {currentDate.toLocaleString('default', { month: 'long' })}</h3>
            <label>Event Title</label>
            <input
              type="text"
              placeholder="Event title"
              value={titleInput}
              onChange={(e) => setTitleInput(e.target.value)}
            />
            <label>Start Time</label>
            <input
              type="time"
              value={timeInput}
              onChange={(e) => setTimeInput(e.target.value)}
            />
            <label>End Time</label>
            <input
              type="time"
              value={endTimeInput}
              onChange={(e) => setEndTimeInput(e.target.value)}
            />
            <label>Description</label>
            <textarea
              placeholder="Event description"
              value={descriptionInput}
              onChange={(e) => setDescriptionInput(e.target.value)}
              style={{ width: '100%', padding: '8px', margin: '5px 0', border: '1px solid #ccc', borderRadius: '4px' }}
            />
            <button onClick={addEvent}>Add Event</button>
            <button onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {activeEvent && (
        <div className="popup-overlay" onClick={() => setActiveEvent(null)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <h3>{activeEvent.title}</h3>
            <p><strong>Start Time:</strong> {activeEvent.time}</p>
            <p><strong>End Time:</strong> {activeEvent.endTime}</p>
            <p><strong>Description:</strong> {activeEvent.description}</p>
            <button onClick={() => setActiveEvent(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
