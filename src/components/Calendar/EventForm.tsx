import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, Clock, Trash2 } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface EventFormProps {
  isOpen?: boolean;
  onClose?: () => void;
  onSave?: (eventData: EventData) => void;
  onDelete?: (eventId: string) => void;
  eventData?: EventData;
  isEditing?: boolean;
}

interface EventData {
  id: string;
  title: string;
  date: Date;
  startTime: string;
  endTime: string;
  description: string;
  recurrence: {
    type: "none" | "daily" | "weekly" | "monthly" | "custom";
    days?: string[];
    interval?: number;
  };
  color: string;
}

const EventForm = ({
  isOpen = true,
  onClose = () => {},
  onSave = () => {},
  onDelete = () => {},
  eventData = {
    id: "",
    title: "",
    date: new Date(),
    startTime: "09:00",
    endTime: "10:00",
    description: "",
    recurrence: { type: "none" },
    color: "blue",
  },
  isEditing = false,
}: EventFormProps) => {
  const [event, setEvent] = useState<EventData>(eventData);
  const [date, setDate] = useState<Date>(eventData.date);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showConflictWarning, setShowConflictWarning] = useState(false);

  const handleInputChange = (field: keyof EventData, value: any) => {
    setEvent((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleRecurrenceChange = (
    type: "none" | "daily" | "weekly" | "monthly" | "custom",
  ) => {
    setEvent((prev) => ({
      ...prev,
      recurrence: {
        type,
        days: type === "weekly" ? [] : undefined,
        interval: type === "custom" ? 1 : undefined,
      },
    }));
  };

  const handleWeekdayToggle = (day: string) => {
    const days = event.recurrence.days || [];
    const updatedDays = days.includes(day)
      ? days.filter((d) => d !== day)
      : [...days, day];

    setEvent((prev) => ({
      ...prev,
      recurrence: { ...prev.recurrence, days: updatedDays },
    }));
  };

  // Validate form before saving
  const validateForm = () => {
    if (!event.title.trim()) {
      return { valid: false, message: "Event title is required" };
    }

    if (!event.date) {
      return { valid: false, message: "Event date is required" };
    }

    if (!event.startTime) {
      return { valid: false, message: "Start time is required" };
    }

    if (!event.endTime) {
      return { valid: false, message: "End time is required" };
    }

    // Check if end time is after start time
    if (event.startTime >= event.endTime) {
      return { valid: false, message: "End time must be after start time" };
    }

    // For weekly recurrence, at least one day must be selected
    if (
      event.recurrence.type === "weekly" &&
      (!event.recurrence.days || event.recurrence.days.length === 0)
    ) {
      return {
        valid: false,
        message: "Please select at least one day for weekly recurrence",
      };
    }

    // For custom recurrence, interval must be positive
    if (
      event.recurrence.type === "custom" &&
      (!event.recurrence.interval || event.recurrence.interval < 1)
    ) {
      return {
        valid: false,
        message: "Custom recurrence interval must be at least 1",
      };
    }

    return { valid: true };
  };

  const handleSave = () => {
    // Validate form
    const validation = validateForm();
    if (!validation.valid) {
      alert(validation.message);
      return;
    }

    // Check for conflicts (this would be replaced with actual conflict detection logic)
    const hasConflict = false;

    if (hasConflict) {
      setShowConflictWarning(true);
      return;
    }

    onSave(event);
    onClose();
  };

  const handleDelete = () => {
    setShowDeleteConfirm(true);
  };

  const confirmDelete = () => {
    onDelete(event.id);
    setShowDeleteConfirm(false);
    onClose();
  };

  const colorOptions = [
    { value: "blue", label: "Blue" },
    { value: "green", label: "Green" },
    { value: "red", label: "Red" },
    { value: "purple", label: "Purple" },
    { value: "yellow", label: "Yellow" },
  ];

  const weekdays = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
    "Sunday",
  ];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[500px] bg-background">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? "Edit Event" : "Add New Event"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Event Title */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                value={event.title}
                onChange={(e) => handleInputChange("title", e.target.value)}
                className="col-span-3"
                placeholder="Event title"
                required
              />
            </div>

            {/* Event Date */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Date</Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {date ? format(date, "PPP") : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={date}
                      onSelect={(date) => {
                        if (date) {
                          setDate(date);
                          handleInputChange("date", date);
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            {/* Event Time */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Time</Label>
              <div className="col-span-3 flex gap-2 items-center">
                <div className="flex items-center">
                  <Clock className="mr-2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="time"
                    value={event.startTime}
                    onChange={(e) =>
                      handleInputChange("startTime", e.target.value)
                    }
                    className="w-24"
                    required
                  />
                </div>
                <span>to</span>
                <Input
                  type="time"
                  value={event.endTime}
                  onChange={(e) => handleInputChange("endTime", e.target.value)}
                  className="w-24"
                  required
                />
              </div>
            </div>

            {/* Event Description */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                value={event.description}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                className="col-span-3"
                placeholder="Event description"
              />
            </div>

            {/* Recurrence Options */}
            <div className="grid grid-cols-4 items-start gap-4">
              <Label className="text-right pt-2">Recurrence</Label>
              <div className="col-span-3">
                <RadioGroup
                  value={event.recurrence.type}
                  onValueChange={(value) =>
                    handleRecurrenceChange(value as any)
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="none" id="r-none" />
                    <Label htmlFor="r-none">None</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="daily" id="r-daily" />
                    <Label htmlFor="r-daily">Daily</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="weekly" id="r-weekly" />
                    <Label htmlFor="r-weekly">Weekly</Label>
                  </div>

                  {event.recurrence.type === "weekly" && (
                    <div className="ml-6 mt-2 flex flex-wrap gap-2">
                      {weekdays.map((day) => (
                        <div key={day} className="flex items-center space-x-2">
                          <Checkbox
                            id={`day-${day}`}
                            checked={(event.recurrence.days || []).includes(
                              day,
                            )}
                            onCheckedChange={() => handleWeekdayToggle(day)}
                          />
                          <Label htmlFor={`day-${day}`}>
                            {day.substring(0, 3)}
                          </Label>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="monthly" id="r-monthly" />
                    <Label htmlFor="r-monthly">Monthly</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="r-custom" />
                    <Label htmlFor="r-custom">Custom</Label>
                  </div>

                  {event.recurrence.type === "custom" && (
                    <div className="ml-6 mt-2 flex items-center gap-2">
                      <Label>Every</Label>
                      <Input
                        type="number"
                        min="1"
                        value={event.recurrence.interval || 1}
                        onChange={(e) =>
                          setEvent((prev) => ({
                            ...prev,
                            recurrence: {
                              ...prev.recurrence,
                              interval: parseInt(e.target.value) || 1,
                            },
                          }))
                        }
                        className="w-16"
                      />
                      <Label>weeks</Label>
                    </div>
                  )}
                </RadioGroup>
              </div>
            </div>

            {/* Event Color */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="color" className="text-right">
                Color
              </Label>
              <Select
                value={event.color}
                onValueChange={(value) => handleInputChange("color", value)}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select a color" />
                </SelectTrigger>
                <SelectContent>
                  {colorOptions.map((color) => (
                    <SelectItem key={color.value} value={color.value}>
                      <div className="flex items-center">
                        <div
                          className="w-4 h-4 rounded-full mr-2"
                          style={{ backgroundColor: color.value }}
                        />
                        {color.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter className="flex justify-between">
            {isEditing && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                type="button"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </Button>
            )}
            <div className="flex gap-2">
              <Button variant="outline" onClick={onClose} type="button">
                Cancel
              </Button>
              <Button onClick={handleSave} type="button">
                Save
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the
              event.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Conflict Warning Dialog */}
      <AlertDialog
        open={showConflictWarning}
        onOpenChange={setShowConflictWarning}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Event Conflict Detected</AlertDialogTitle>
            <AlertDialogDescription>
              This event conflicts with an existing event. Would you like to
              save it anyway?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowConflictWarning(false);
                onSave(event);
                onClose();
              }}
            >
              Save Anyway
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default EventForm;
