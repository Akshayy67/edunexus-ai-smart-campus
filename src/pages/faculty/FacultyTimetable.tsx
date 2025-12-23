import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, Users } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface TimetableSlot {
  id: string;
  day_of_week: number;
  start_time: string;
  end_time: string;
  slot_type: string | null;
  course: {
    name: string;
    code: string;
  } | null;
  batch: {
    name: string;
  } | null;
  zone: {
    name: string;
    room_number: string | null;
    building: string | null;
  } | null;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function FacultyTimetable() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [timetable, setTimetable] = useState<TimetableSlot[]>([]);
  const [selectedDay, setSelectedDay] = useState<number>(new Date().getDay());

  useEffect(() => {
    if (user) {
      fetchTimetable();
    }
  }, [user]);

  const fetchTimetable = async () => {
    try {
      // Get faculty record
      const { data: facultyData } = await supabase
        .from("faculty")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (!facultyData) {
        setLoading(false);
        return;
      }

      // Get course assignments for this faculty
      const { data: assignments } = await supabase
        .from("course_assignments")
        .select("id, course_id, batch_id")
        .eq("faculty_id", facultyData.id);

      if (!assignments || assignments.length === 0) {
        setLoading(false);
        return;
      }

      const assignmentIds = assignments.map((a) => a.id);

      // Fetch timetable slots for these assignments
      const { data: slots } = await supabase
        .from("timetable_slots")
        .select("id, day_of_week, start_time, end_time, slot_type, course_assignment_id, zone_id")
        .in("course_assignment_id", assignmentIds)
        .order("day_of_week")
        .order("start_time");

      const enrichedSlots: TimetableSlot[] = [];

      for (const slot of slots || []) {
        const assignment = assignments.find((a) => a.id === slot.course_assignment_id);
        
        let course = null;
        let batch = null;
        let zone = null;

        if (assignment?.course_id) {
          const { data: courseData } = await supabase
            .from("courses")
            .select("name, code")
            .eq("id", assignment.course_id)
            .maybeSingle();
          course = courseData;
        }

        if (assignment?.batch_id) {
          const { data: batchData } = await supabase
            .from("batches")
            .select("name")
            .eq("id", assignment.batch_id)
            .maybeSingle();
          batch = batchData;
        }

        if (slot.zone_id) {
          const { data: zoneData } = await supabase
            .from("geo_fence_zones")
            .select("name, room_number, building")
            .eq("id", slot.zone_id)
            .maybeSingle();
          zone = zoneData;
        }

        enrichedSlots.push({ ...slot, course, batch, zone });
      }

      setTimetable(enrichedSlots);
    } catch (error) {
      console.error("Error fetching timetable:", error);
      toast({
        title: "Error",
        description: "Failed to load timetable",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getTodaySlots = () => {
    return timetable.filter((slot) => slot.day_of_week === selectedDay);
  };

  const getSlotColor = (type: string | null) => {
    switch (type) {
      case "lecture":
        return "bg-blue-500/10 border-blue-500/20";
      case "lab":
        return "bg-green-500/10 border-green-500/20";
      case "tutorial":
        return "bg-purple-500/10 border-purple-500/20";
      default:
        return "bg-muted border-border";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Timetable</h1>
        <p className="text-muted-foreground">View your teaching schedule</p>
      </div>

      {/* Day Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {DAYS.slice(1, 7).map((day, index) => (
          <button
            key={day}
            onClick={() => setSelectedDay(index + 1)}
            className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
              selectedDay === index + 1
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            }`}
          >
            {day}
            {new Date().getDay() === index + 1 && (
              <span className="ml-2 text-xs">(Today)</span>
            )}
          </button>
        ))}
      </div>

      {/* Today's Schedule */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            {DAYS[selectedDay]}'s Classes
          </CardTitle>
          <CardDescription>{getTodaySlots().length} classes scheduled</CardDescription>
        </CardHeader>
        <CardContent>
          {getTodaySlots().length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No classes scheduled for this day</p>
            </div>
          ) : (
            <div className="space-y-4">
              {getTodaySlots().map((slot) => (
                <div
                  key={slot.id}
                  className={`p-4 rounded-lg border ${getSlotColor(slot.slot_type)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-foreground">
                          {slot.course?.name || "Unknown Course"}
                        </span>
                        <Badge variant="outline">{slot.course?.code}</Badge>
                        {slot.slot_type && (
                          <Badge variant="secondary" className="capitalize">
                            {slot.slot_type}
                          </Badge>
                        )}
                      </div>
                      {slot.batch && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <Users className="h-4 w-4" />
                          {slot.batch.name}
                        </div>
                      )}
                      {slot.zone && (
                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {slot.zone.room_number && `Room ${slot.zone.room_number}, `}
                          {slot.zone.building || slot.zone.name}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-primary font-medium">
                      <Clock className="h-4 w-4" />
                      {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Weekly Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Summary</CardTitle>
          <CardDescription>Classes by day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-6 gap-4">
            {DAYS.slice(1, 7).map((day, index) => {
              const daySlots = timetable.filter((s) => s.day_of_week === index + 1);
              return (
                <div key={day} className="text-center p-4 rounded-lg bg-muted">
                  <div className="text-sm font-medium text-muted-foreground">{day.slice(0, 3)}</div>
                  <div className="text-2xl font-bold text-foreground mt-1">{daySlots.length}</div>
                  <div className="text-xs text-muted-foreground">classes</div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
