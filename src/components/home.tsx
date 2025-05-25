import React, { useState, useEffect } from "react";
import MonthlyCalendar from "./Calendar/MonthlyCalendar";
import EventForm from "./Calendar/EventForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface Event {
  id: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  description?: string;
  color?: string;
  recurrence?: {
    type: "none" | "daily" | "weekly" | "monthly" | "custom";
    days?: string[];
    interval?: number;
    endDate?: Date;
  };
}

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);

  // Load events from localStorage on component mount
  useEffect(() => {
    const savedEvents = localStorage.getItem("calendarEvents");
    if (savedEvents) {
      try {
        const parsedEvents = JSON.parse(savedEvents);
        // Convert string dates back to Date objects
        const eventsWithDates = parsedEvents.map((event: any) => ({
          ...event,
          date: new Date(event.date),
          recurrence: event.recurrence
            ? {
                ...event.recurrence,
                endDate: event.recurrence.endDate
                  ? new Date(event.recurrence.endDate)
                  : undefined,
              }
            : { type: "none" },
        }));
        setEvents(eventsWithDates);
      } catch (error) {
        console.error("Error parsing saved events:", error);
        // Initialize with default events if there's an error
        setEvents([
          {
            id: "1",
            title: "Team Meeting",
            date: new Date(new Date().setHours(10, 0, 0, 0)),
            startTime: "10:00",
            endTime: "11:30",
            description: "Weekly team sync",
            color: "green",
            recurrence: {
              type: "weekly",
              days: ["Monday"],
            },
          },
          {
            id: "2",
            title: "Dentist Appointment",
            date: new Date(new Date().setDate(new Date().getDate() + 2)),
            startTime: "14:00",
            endTime: "15:00",
            description: "Regular checkup",
            color: "blue",
            recurrence: {
              type: "none",
            },
          },
        ]);
      }
    } else {
      // Initialize with default events if no saved events
      setEvents([
        {
          id: "1",
          title: "Team Meeting",
          date: new Date(new Date().setHours(10, 0, 0, 0)),
          startTime: "10:00",
          endTime: "11:30",
          description: "Weekly team sync",
          color: "green",
          recurrence: {
            type: "weekly",
            days: ["Monday"],
          },
        },
        {
          id: "2",
          title: "Dentist Appointment",
          date: new Date(new Date().setDate(new Date().getDate() + 2)),
          startTime: "14:00",
          endTime: "15:00",
          description: "Regular checkup",
          color: "blue",
          recurrence: {
            type: "none",
          },
        },
      ]);
    }
  }, []);

  // Save events to localStorage when they change
  useEffect(() => {
    localStorage.setItem("calendarEvents", JSON.stringify(events));
  }, [events]);

  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [isNewEvent, setIsNewEvent] = useState(true);

  const handleAddEvent = (date?: Date) => {
    setIsNewEvent(true);
    setSelectedEvent({
      id: "",
      title: "",
      date: date || new Date(),
      startTime: "09:00",
      endTime: "10:00",
      description: "",
      color: "green",
      recurrence: { type: "none" },
    });
    setIsEventFormOpen(true);
  };

  const handleEditEvent = (event: Event) => {
    setIsNewEvent(false);
    setSelectedEvent(event);
    setIsEventFormOpen(true);
  };

  const handleSaveEvent = (eventData: any) => {
    // Check for conflicts
    const hasConflict = checkForEventConflicts(eventData);

    if (hasConflict) {
      if (
        !confirm(
          "This event conflicts with an existing event. Do you want to save it anyway?",
        )
      ) {
        return; // User canceled
      }
    }

    if (isNewEvent) {
      // Generate a unique ID for new events
      const newEvent = { ...eventData, id: Date.now().toString() };
      setEvents([...events, newEvent]);
    } else {
      // Update existing event
      setEvents(events.map((e) => (e.id === eventData.id ? eventData : e)));
    }
    setIsEventFormOpen(false);
  };

  // Check if an event conflicts with existing events
  const checkForEventConflicts = (eventData: any): boolean => {
    // Get all events on the same date except the current one
    const eventsOnSameDate = events.filter((e) => {
      // Skip the event being checked if it's an edit
      if (!isNewEvent && e.id === eventData.id) return false;

      // Check if the event is on the same date
      const eventDate = new Date(e.date);
      const newEventDate = new Date(eventData.date);
      return (
        eventDate.getFullYear() === newEventDate.getFullYear() &&
        eventDate.getMonth() === newEventDate.getMonth() &&
        eventDate.getDate() === newEventDate.getDate()
      );
    });

    // Check for time conflicts
    return eventsOnSameDate.some((e) => {
      // Convert times to minutes for easier comparison
      const eventStart = timeToMinutes(eventData.startTime);
      const eventEnd = timeToMinutes(eventData.endTime);
      const existingStart = timeToMinutes(e.startTime);
      const existingEnd = timeToMinutes(e.endTime);

      // Check if the events overlap
      return eventStart < existingEnd && eventEnd > existingStart;
    });
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents(events.filter((e) => e.id !== eventId));
    setIsEventFormOpen(false);
  };

  const handleDragEvent = (eventId: string, newDate: Date) => {
    // Find the event being dragged
    const draggedEvent = events.find((event) => event.id === eventId);
    if (!draggedEvent) return;

    // Check for conflicts
    const hasConflict = checkForConflicts(draggedEvent, newDate);

    if (hasConflict) {
      // Show conflict warning
      if (
        confirm(
          "This event conflicts with an existing event. Do you want to move it anyway?",
        )
      ) {
        // User confirmed, proceed with the move
        updateEventDate(eventId, newDate);
      }
    } else {
      // No conflict, proceed with the move
      updateEventDate(eventId, newDate);
    }
  };

  const updateEventDate = (eventId: string, newDate: Date) => {
    setEvents(
      events.map((event) => {
        if (event.id === eventId) {
          // Calculate the difference in days
          const diffTime = newDate.getTime() - event.date.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

          // Create new date by adding the difference
          const newEventDate = new Date(event.date);
          newEventDate.setDate(newEventDate.getDate() + diffDays);

          return {
            ...event,
            date: newEventDate,
          };
        }
        return event;
      }),
    );
  };

  // Check if an event conflicts with existing events on the target date
  const checkForConflicts = (event: Event, targetDate: Date): boolean => {
    // Get all events on the target date
    const eventsOnTargetDate = events.filter((e) => {
      // Skip the event being checked
      if (e.id === event.id) return false;

      // Check if the event is on the target date
      const eventDate = new Date(e.date);
      return (
        eventDate.getFullYear() === targetDate.getFullYear() &&
        eventDate.getMonth() === targetDate.getMonth() &&
        eventDate.getDate() === targetDate.getDate()
      );
    });

    // Check for time conflicts
    return eventsOnTargetDate.some((e) => {
      // Convert times to minutes for easier comparison
      const eventStart = timeToMinutes(event.startTime);
      const eventEnd = timeToMinutes(event.endTime);
      const existingStart = timeToMinutes(e.startTime);
      const existingEnd = timeToMinutes(e.endTime);

      // Check if the events overlap
      return eventStart < existingEnd && eventEnd > existingStart;
    });
  };

  // Helper function to convert time string (HH:MM) to minutes
  const timeToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(":").map(Number);
    return hours * 60 + minutes;
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <header className="mb-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-foreground">Event Calendar</h1>
          <Button
            onClick={() => handleAddEvent()}
            className="flex items-center gap-2"
          >
            <Plus size={16} />
            Add Event
          </Button>
        </div>
      </header>

      <main>
        <MonthlyCalendar
          events={events}
          onAddEvent={handleAddEvent}
          onEditEvent={handleEditEvent}
          onDragEvent={handleDragEvent}
        />
      </main>

      <Dialog open={isEventFormOpen} onOpenChange={setIsEventFormOpen}>
        <DialogContent className="sm:max-w-[550px]">
          {selectedEvent && (
            <EventForm
              isOpen={isEventFormOpen}
              onClose={() => setIsEventFormOpen(false)}
              onSave={handleSaveEvent}
              onDelete={handleDeleteEvent}
              eventData={{
                id: selectedEvent.id,
                title: selectedEvent.title,
                date: selectedEvent.date,
                startTime: selectedEvent.startTime,
                endTime: selectedEvent.endTime,
                description: selectedEvent.description || "",
                recurrence: selectedEvent.recurrence || { type: "none" },
                color: selectedEvent.color || "blue",
              }}
              isEditing={!isNewEvent}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
