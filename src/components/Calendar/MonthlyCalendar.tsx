import React, { useState, useEffect } from "react";
import {
  format,
  addMonths,
  subMonths,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import DayCell from "./DayCell";
import EventForm from "./EventForm";
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface Event {
  id: string;
  title: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  description?: string;
  color?: string;
  recurrence?: {
    type: "none" | "daily" | "weekly" | "monthly" | "custom";
    days?: string[];
    interval?: number;
    endDate?: Date;
  };
}

interface MonthlyCalendarProps {
  events?: Event[];
  onAddEvent?: (date: Date) => void;
  onEditEvent?: (event: Event) => void;
  onDragEvent?: (eventId: string, date: Date) => void;
}

const MonthlyCalendar = ({
  events = [],
  onAddEvent,
  onEditEvent,
  onDragEvent,
}: MonthlyCalendarProps = {}) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [localEvents, setLocalEvents] = useState<Event[]>([]);
  const eventsToUse = events.length > 0 ? events : localEvents;
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isEventFormOpen, setIsEventFormOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Generate days for the current month view
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Navigation handlers
  const handlePreviousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const handleNextMonth = () => setCurrentDate(addMonths(currentDate, 1));
  const handleToday = () => setCurrentDate(new Date());

  // Event handlers
  const handleDayClick = (date: Date) => {
    if (onAddEvent) {
      onAddEvent(date);
    } else {
      setSelectedDate(date);
      setSelectedEvent(null);
      setIsEditMode(false);
      setIsEventFormOpen(true);
    }
  };

  const handleEventClick = (eventId: string) => {
    const event = eventsToUse.find((e) => e.id === eventId);
    if (!event) return;

    if (onEditEvent) {
      onEditEvent(event);
    } else {
      setSelectedEvent(event);
      setSelectedDate(event.date);
      setIsEditMode(true);
      setIsEventFormOpen(true);
    }
  };

  const handleAddEvent = (eventData: any) => {
    if (isEditMode && selectedEvent) {
      // Update existing event
      setLocalEvents(
        localEvents.map((e) => (e.id === selectedEvent.id ? eventData : e)),
      );
    } else {
      // Add new event
      const newEvent = {
        ...eventData,
        id: eventData.id || Date.now().toString(),
      };
      setLocalEvents([...localEvents, newEvent]);
    }
    setIsEventFormOpen(false);
  };

  const handleDeleteEvent = (eventId: string) => {
    setLocalEvents(localEvents.filter((event) => event.id !== eventId));
    setIsEventFormOpen(false);
  };

  // Filter events for a specific day
  const getEventsForDay = (day: Date) => {
    return eventsToUse.filter((event) => {
      // Check for single events
      if (!event.recurrence || event.recurrence.type === "none") {
        return isSameDay(event.date, day);
      }

      // Handle recurring events
      const eventDate = new Date(event.date);
      switch (event.recurrence.type) {
        case "daily":
          return true; // Shows on every day after the start date
        case "weekly":
          // Check if the day of week matches any in the days array
          if (event.recurrence.days && event.recurrence.days.length > 0) {
            const dayName = format(day, "EEEE"); // Get day name (Monday, Tuesday, etc.)
            return event.recurrence.days.includes(dayName);
          }
          return isSameDay(event.date, day);
        case "monthly":
          return day.getDate() === eventDate.getDate();
        case "custom":
          if (event.recurrence.interval && event.recurrence.interval > 0) {
            // For custom recurrence, check if the difference in weeks matches the interval
            const diffInDays = Math.round(
              (day.getTime() - eventDate.getTime()) / (1000 * 60 * 60 * 24),
            );
            const diffInWeeks = Math.floor(diffInDays / 7);
            return diffInWeeks % event.recurrence.interval === 0;
          }
          return false;
        default:
          return isSameDay(event.date, day);
      }
    });
  };

  // Initialize local events if no events are provided
  useEffect(() => {
    if (events.length === 0) {
      // Only use local storage if no events are provided from props
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
          setLocalEvents(eventsWithDates);
        } catch (error) {
          console.error("Error parsing saved events:", error);
        }
      }
    }
  }, [events.length]);

  return (
    <Card className="bg-white p-6 rounded-lg shadow-lg w-full h-full">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center space-x-2">
          <h2 className="text-2xl font-bold">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" size="icon" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button onClick={() => handleDayClick(new Date())}>
            <Plus className="h-4 w-4 mr-2" />
            Add Event
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
          <div key={day} className="text-center font-medium py-2">
            {day}
          </div>
        ))}

        {daysInMonth.map((day) => {
          const dayEvents = getEventsForDay(day);
          return (
            <DayCell
              key={day.toString()}
              date={day}
              events={dayEvents}
              isCurrentMonth={isSameMonth(day, currentDate)}
              isToday={isToday(day)}
              onAddEvent={() => handleDayClick(day)}
              onEventClick={handleEventClick}
              onDrop={(e, date, eventId) => {
                if (onDragEvent) {
                  onDragEvent(eventId, date);
                } else {
                  // Handle drag internally
                  const event = eventsToUse.find((e) => e.id === eventId);
                  if (event) {
                    const updatedEvent = { ...event, date };
                    handleAddEvent(updatedEvent);
                  }
                }
              }}
            />
          );
        })}
      </div>

      <Dialog open={isEventFormOpen} onOpenChange={setIsEventFormOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <EventForm
            isOpen={isEventFormOpen}
            onClose={() => setIsEventFormOpen(false)}
            onSave={handleAddEvent}
            onDelete={handleDeleteEvent}
            eventData={
              selectedEvent
                ? {
                    id: selectedEvent.id,
                    title: selectedEvent.title,
                    date: selectedEvent.date,
                    startTime: selectedEvent.startTime || "09:00",
                    endTime: selectedEvent.endTime || "10:00",
                    description: selectedEvent.description || "",
                    recurrence: selectedEvent.recurrence || { type: "none" },
                    color: selectedEvent.color || "blue",
                  }
                : undefined
            }
            isEditing={isEditMode}
          />
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default MonthlyCalendar;
