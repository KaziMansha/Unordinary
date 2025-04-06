// Calendar.tsx
import { useState } from 'react';
import './Calendar.css';
//import HobbySuggestion from 'C:/Users/Hanz/Documents/GitHub/Unordinary/src/dashboard/components/HobbySuggestion/HobbySuggestion.tsx'; // adjust the path if needed

export function Calendar() {
  const [currentDate, setCurrentDate] = useState(new Date());

  type CalendarEvent = {
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

  const addEvent = () => {
    if (selectedDay && titleInput) {
      const newEvent: CalendarEvent = {
        day: selectedDay,
        month,
        year,
        title: titleInput,
        time: timeInput,
      };
      setEvents([...events, newEvent]);
      setTitleInput('');
      setTimeInput('');
      setShowForm(false);
    }
  };

  const deleteEvent = (day: number, time: string, title: string) => {
    const filtered = events.filter(
      (event) =>
        !(
          event.day === day &&
          event.time === time &&
          event.title === title &&
          event.month === month &&
          event.year === year
        )
    );
    setEvents(filtered);
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
                              deleteEvent(day, event.time, event.title);
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
