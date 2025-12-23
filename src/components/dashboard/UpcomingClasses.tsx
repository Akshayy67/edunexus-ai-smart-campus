import { Clock, MapPin, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ClassSession {
  id: string;
  subject: string;
  code: string;
  time: string;
  room: string;
  students: number;
  status: "ongoing" | "upcoming" | "completed";
}

const classes: ClassSession[] = [
  {
    id: "1",
    subject: "Data Structures",
    code: "CS201",
    time: "09:00 - 10:30",
    room: "Room 301",
    students: 45,
    status: "ongoing",
  },
  {
    id: "2",
    subject: "Machine Learning",
    code: "CS401",
    time: "11:00 - 12:30",
    room: "Lab 102",
    students: 38,
    status: "upcoming",
  },
  {
    id: "3",
    subject: "Database Systems",
    code: "CS301",
    time: "14:00 - 15:30",
    room: "Room 205",
    students: 52,
    status: "upcoming",
  },
  {
    id: "4",
    subject: "Software Engineering",
    code: "CS302",
    time: "16:00 - 17:30",
    room: "Room 401",
    students: 48,
    status: "upcoming",
  },
];

const statusConfig = {
  ongoing: {
    label: "Live",
    variant: "destructive" as const,
    className: "animate-pulse",
  },
  upcoming: {
    label: "Upcoming",
    variant: "secondary" as const,
    className: "",
  },
  completed: {
    label: "Completed",
    variant: "outline" as const,
    className: "",
  },
};

export function UpcomingClasses() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Today's Classes</CardTitle>
        <p className="text-sm text-muted-foreground">
          {new Date().toLocaleDateString("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
          })}
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {classes.map((session) => {
          const status = statusConfig[session.status];

          return (
            <div
              key={session.id}
              className="flex items-center gap-4 p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors cursor-pointer"
            >
              <div className="flex flex-col items-center justify-center w-16 shrink-0">
                <span className="text-xs text-muted-foreground">
                  {session.time.split(" - ")[0]}
                </span>
                <div className="h-8 w-px bg-border my-1" />
                <span className="text-xs text-muted-foreground">
                  {session.time.split(" - ")[1]}
                </span>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-medium truncate">{session.subject}</p>
                  <Badge variant={status.variant} className={cn("text-xs", status.className)}>
                    {status.label}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground">{session.code}</p>
                <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {session.room}
                  </span>
                  <span className="flex items-center gap-1">
                    <Users className="h-3 w-3" />
                    {session.students} students
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
