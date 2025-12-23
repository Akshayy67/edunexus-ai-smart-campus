import { Calendar, Clock, MapPin, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ClassSlot {
  id: string;
  subject: string;
  code: string;
  time: string;
  room: string;
  instructor: string;
  type: "lecture" | "lab" | "tutorial";
}

interface DaySchedule {
  day: string;
  date: string;
  isToday: boolean;
  classes: ClassSlot[];
}

const weekSchedule: DaySchedule[] = [
  {
    day: "Monday",
    date: "Dec 23",
    isToday: true,
    classes: [
      { id: "1", subject: "Data Structures", code: "CS201", time: "09:00 - 10:30", room: "Room 301", instructor: "Dr. Smith", type: "lecture" },
      { id: "2", subject: "Machine Learning", code: "CS401", time: "11:00 - 12:30", room: "Lab 102", instructor: "Dr. Johnson", type: "lab" },
      { id: "3", subject: "Database Systems", code: "CS301", time: "14:00 - 15:30", room: "Room 205", instructor: "Prof. Davis", type: "lecture" },
    ],
  },
  {
    day: "Tuesday",
    date: "Dec 24",
    isToday: false,
    classes: [
      { id: "4", subject: "Software Engineering", code: "CS302", time: "10:00 - 11:30", room: "Room 401", instructor: "Dr. Wilson", type: "lecture" },
      { id: "5", subject: "Data Structures", code: "CS201", time: "14:00 - 15:30", room: "Lab 201", instructor: "Dr. Smith", type: "tutorial" },
    ],
  },
  {
    day: "Wednesday",
    date: "Dec 25",
    isToday: false,
    classes: [
      { id: "6", subject: "Machine Learning", code: "CS401", time: "09:00 - 10:30", room: "Room 301", instructor: "Dr. Johnson", type: "lecture" },
      { id: "7", subject: "Database Systems", code: "CS301", time: "11:00 - 12:30", room: "Lab 102", instructor: "Prof. Davis", type: "lab" },
      { id: "8", subject: "Algorithms", code: "CS303", time: "15:00 - 16:30", room: "Room 102", instructor: "Dr. Brown", type: "lecture" },
    ],
  },
  {
    day: "Thursday",
    date: "Dec 26",
    isToday: false,
    classes: [
      { id: "9", subject: "Software Engineering", code: "CS302", time: "09:00 - 10:30", room: "Lab 301", instructor: "Dr. Wilson", type: "lab" },
      { id: "10", subject: "Data Structures", code: "CS201", time: "14:00 - 15:30", room: "Room 301", instructor: "Dr. Smith", type: "lecture" },
    ],
  },
  {
    day: "Friday",
    date: "Dec 27",
    isToday: false,
    classes: [
      { id: "11", subject: "Machine Learning", code: "CS401", time: "10:00 - 11:30", room: "Room 205", instructor: "Dr. Johnson", type: "tutorial" },
      { id: "12", subject: "Algorithms", code: "CS303", time: "14:00 - 15:30", room: "Room 102", instructor: "Dr. Brown", type: "lecture" },
    ],
  },
];

const typeConfig = {
  lecture: { label: "Lecture", color: "bg-primary/10 text-primary border-primary/20" },
  lab: { label: "Lab", color: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20" },
  tutorial: { label: "Tutorial", color: "bg-amber-500/10 text-amber-600 border-amber-500/20" },
};

const Timetable = () => {
  return (
    <AppLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timetable</h1>
          <p className="text-muted-foreground mt-1">
            Weekly class schedule with real-time updates
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium px-4">Week of Dec 23, 2024</span>
          <Button variant="outline" size="icon">
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 mb-6">
        {Object.entries(typeConfig).map(([key, config]) => (
          <div key={key} className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full", config.color.split(" ")[0])} />
            <span className="text-sm text-muted-foreground">{config.label}</span>
          </div>
        ))}
      </div>

      {/* Week Grid */}
      <div className="grid gap-4 md:grid-cols-5">
        {weekSchedule.map((day) => (
          <Card key={day.day} className={cn(day.isToday && "ring-2 ring-primary")}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">{day.day}</CardTitle>
                  <p className="text-sm text-muted-foreground">{day.date}</p>
                </div>
                {day.isToday && (
                  <Badge variant="default" className="text-xs">
                    Today
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {day.classes.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No classes scheduled
                </p>
              ) : (
                day.classes.map((cls) => {
                  const config = typeConfig[cls.type];
                  return (
                    <div
                      key={cls.id}
                      className={cn(
                        "p-3 rounded-lg border transition-colors hover:shadow-sm cursor-pointer",
                        config.color
                      )}
                    >
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <p className="font-medium text-sm leading-tight">{cls.subject}</p>
                        <Badge variant="outline" className="text-xs shrink-0">
                          {cls.code}
                        </Badge>
                      </div>
                      <div className="space-y-1 text-xs opacity-80">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {cls.time}
                        </div>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3" />
                          {cls.room}
                        </div>
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {cls.instructor}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </AppLayout>
  );
};

export default Timetable;
