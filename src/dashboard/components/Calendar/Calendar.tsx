import { useState, useEffect } from 'react';
import { auth } from '../../../firebase-config.ts';
import './Calendar.css';
import { formatTime } from '../../../utils/timeUtils.ts';

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
  const [editMode, setEditMode] = useState(false);

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
    setEditMode(false);
    setTitleInput('');
    setTimeInput('');
    setEndTimeInput('');
    setDescriptionInput('');
  };

  const addEvent = async () => {
  if (selectedDay && titleInput) {
    try {
      const idToken = await auth.currentUser?.getIdToken();
      if (!idToken) return;

      const response = await fetch('http://localhost:5000/api/events', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${idToken}` 
        },
        body: JSON.stringify({
          day: selectedDay,
          month: currentDate.getMonth(),
          year: currentDate.getFullYear(),
          title: titleInput,
          time: timeInput,
          endTime: endTimeInput,
          description: descriptionInput
        }),
      });

      if (!response.ok) throw new Error('Failed to save event');
      
      const savedEvent = await response.json();
      
      // Update state with complete event data from server
      setEvents(prev => [...prev, {
        ...savedEvent,
        endTime: savedEvent.end_time, // Map to correct field name
      }]);

      // Reset form
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

  const updateEvent = async () => {
  if (!activeEvent) return;

  const updatedEvent = {
    ...activeEvent,
    title: titleInput,
    time: timeInput,
    endTime: endTimeInput,
    description: descriptionInput,
    day: selectedDay ?? activeEvent.day,
    month: currentDate.getMonth(),
    year: currentDate.getFullYear(),
  };

  try {
    const idToken = await auth.currentUser?.getIdToken();
    if (!idToken) return;

    const response = await fetch(`http://localhost:5000/api/events/${activeEvent.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${idToken}` },
      body: JSON.stringify(updatedEvent),
    });

    if (!response.ok) throw new Error('Failed to update event');
    const updatedFromServer = await response.json();

    const normalized = {
      ...updatedFromServer,
      endTime: updatedFromServer.end_time,
    };

    setEvents(events.map(e => (e.id === activeEvent.id ? normalized : e)));

    setShowForm(false);
    setActiveEvent(null);
  } catch (error) {
    console.error('Error updating event:', error);
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

  const handleEditEvent = (event: CalendarEvent) => {
    setActiveEvent(event);
    setTitleInput(event.title);
    setTimeInput(event.time);
    setEndTimeInput(event.endTime || '');
    setDescriptionInput(event.description || '');
    setSelectedDay(event.day);
    setCurrentDate(new Date(event.year, event.month, event.day));
    setEditMode(true);
    setShowForm(true);
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

  const calculateHeight = (startTime: string, endTime?: string) => {
    if (!endTime) return 40;
    const [startHour, startMinute] = startTime.split(':').map(Number);
    const [endHour, endMinute] = endTime.split(':').map(Number);
    const startTotalMinutes = startHour * 60 + startMinute;
    const endTotalMinutes = endHour * 60 + endMinute;
    const durationMinutes = Math.max(endTotalMinutes - startTotalMinutes, 30);
    const heightPerMinute = 40 / 60;
    return durationMinutes * heightPerMinute;
  };

  const groupOverlappingEvents = (events: CalendarEvent[]) => {
    const sortedEvents = events.sort((a, b) => a.time.localeCompare(b.time));
    const groups: CalendarEvent[][] = [];
    sortedEvents.forEach(event => {
      let placed = false;
      for (const group of groups) {
        const lastEvent = group[group.length - 1];
        if (lastEvent.endTime && event.time >= lastEvent.endTime) {
          group.push(event);
          placed = true;
          break;
        }
      }
      if (!placed) groups.push([event]);
    });
    return groups;
  };
  
  const getDateInputValue = (year: number, month: number, day: number): string => {
    const localDate = new Date(year, month, day);
    const tzOffset = localDate.getTimezoneOffset() * 60000;
    return new Date(localDate.getTime() - tzOffset).toISOString().split('T')[0];
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
                        <span>
                          {formatTime(event.time)} - {event.endTime && formatTime(event.endTime)}: {event.title}
                        </span>
                        <button 
                          className="delete-button"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteEvent(event.id);
                          }}
                        >
                          ×
                        </button>
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
                  {groupOverlappingEvents(getEventsForDay(dateObj.getDate(), dateObj.getMonth(), dateObj.getFullYear())).map((group, groupIndex, groupArray) =>
                    group.map((event) => {
                      const topPosition = calculateTop(event.time);
                      const eventHeight = calculateHeight(event.time, event.endTime);
                      const widthPercent = 100 / groupArray.length;
                      const leftPercent = groupIndex * widthPercent;

                      return (
                        <div
                          key={event.id}
                          className="week-event"
                          style={{
                            top:      `${topPosition}px`,
                            height:   `${calculateHeight(event.time, event.endTime)}px`,    
                            width:    `calc(${widthPercent}% - 10px)`,                       
                            left:     `calc(${leftPercent}% + 5px)`
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveEvent(event);
                          }}
                        >
                          <div className="event-content">
                            <strong>
                              {formatTime(event.time)}
                              {event.endTime && ` – ${formatTime(event.endTime)}`}
                            </strong>
                            <p>{event.title}</p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {showForm && (
        <div className="popup-overlay" onClick={() => setShowForm(false)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <h3>{editMode ? 'Edit Event' : 'Add Event'} for {selectedDay} {currentDate.toLocaleString('default', { month: 'long' })}</h3>

              {editMode && (
                <>
                  <label>Date</label>
                  <input
                    type="date"
                    value={getDateInputValue(currentDate.getFullYear(), currentDate.getMonth(), selectedDay || 1)}
                    onChange={(e) => {
                      const selected = new Date(e.target.value);
                      setSelectedDay(selected.getDate());
                      setCurrentDate(selected);
                    }}
                  />
                </>
              )}

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
            />
            <button onClick={editMode ? updateEvent : addEvent}>{editMode ? 'Update Event' : 'Add Event'}</button>
            <button onClick={() => setShowForm(false)}>Cancel</button>
          </div>
        </div>
      )}

      {activeEvent && !editMode && (
        <div className="popup-overlay" onClick={() => setActiveEvent(null)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <h3>{activeEvent.title}</h3>
            <p><strong>Time:</strong> {formatTime(activeEvent.time)} - {activeEvent.endTime && formatTime(activeEvent.endTime)}</p>
            {activeEvent.description && (
              <div className="event-description">
                <strong>Description:</strong>
                <p>{activeEvent.description}</p>
              </div>
            )}
            <button onClick={() => handleEditEvent(activeEvent)}>Edit</button>
            <button onClick={() => setActiveEvent(null)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

