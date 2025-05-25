import React from "react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Event {
  id: string;
  title: string;
  date: Date;
  color?: string;
}

interface DayCellProps {
  date: Date;
  isCurrentMonth?: boolean;
  isToday?: boolean;
  events?: Event[];
  onAddEvent?: (date: Date) => void;
  onEventClick?: (eventId: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, date: Date, eventId: string) => void;
}

const DayCell = ({
  date = new Date(),
  isCurrentMonth = true,
  isToday = false,
  events = [],
  onAddEvent,
  onEventClick,
  onDragOver,
  onDrop,
}: DayCellProps) => {
  const dayNumber = format(date, "d");

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (onDragOver) onDragOver(e);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const eventId = e.dataTransfer.getData("text/plain");
    if (eventId && onDrop) onDrop(e, date, eventId);
  };

  const handleCellClick = () => {
    if (onAddEvent) onAddEvent(date);
  };

  return (
    <div
      className={cn(
        "h-full min-h-[120px] p-1 border border-border bg-background",
        "transition-colors duration-200 hover:bg-accent/20 cursor-pointer",
        !isCurrentMonth && "opacity-40",
        isToday && "ring-2 ring-primary ring-inset",
      )}
      onClick={() => onAddEvent && onAddEvent(date)}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <div className="flex justify-between items-center mb-1">
        <span
          className={cn(
            "text-sm font-medium",
            isToday &&
              "bg-primary text-primary-foreground rounded-full w-6 h-6 flex items-center justify-center",
          )}
        >
          {dayNumber}
        </span>
      </div>

      <div className="space-y-1 overflow-y-auto max-h-[80px]">
        {events.map((event) => (
          <div
            key={event.id}
            className={cn(
              "text-xs p-1 rounded truncate",
              event.color === "blue" &&
                "bg-blue-100 border-l-2 border-blue-500",
              event.color === "green" &&
                "bg-green-100 border-l-2 border-green-500",
              event.color === "red" && "bg-red-100 border-l-2 border-red-500",
              event.color === "purple" &&
                "bg-purple-100 border-l-2 border-purple-500",
              event.color === "yellow" &&
                "bg-yellow-100 border-l-2 border-yellow-500",
              !event.color && "bg-blue-100 border-l-2 border-blue-500",
            )}
            onClick={(e) => {
              e.stopPropagation();
              if (onEventClick) onEventClick(event.id);
            }}
            draggable
            data-event-id={event.id}
            onDragStart={(e) => {
              e.dataTransfer.setData("text/plain", event.id);
              e.dataTransfer.effectAllowed = "move";
            }}
          >
            {event.title}
          </div>
        ))}

        {events.length > 3 && (
          <div className="text-xs text-muted-foreground">
            +{events.length - 3} more
          </div>
        )}
      </div>
    </div>
  );
};

export default DayCell;
