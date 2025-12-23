import { 
  CheckCircle2, 
  Upload, 
  UserPlus, 
  AlertCircle,
  FileText,
  Clock
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface Activity {
  id: string;
  type: "submission" | "attendance" | "enrollment" | "alert" | "grade";
  title: string;
  description: string;
  time: string;
}

const activities: Activity[] = [
  {
    id: "1",
    type: "submission",
    title: "Assignment Submitted",
    description: "John Doe submitted ML Project Phase 2",
    time: "2 min ago",
  },
  {
    id: "2",
    type: "attendance",
    title: "Geo-fence Check-in",
    description: "45 students checked in for CS201",
    time: "15 min ago",
  },
  {
    id: "3",
    type: "alert",
    title: "Low Attendance Alert",
    description: "CS301 attendance dropped below 75%",
    time: "1 hour ago",
  },
  {
    id: "4",
    type: "grade",
    title: "Grades Published",
    description: "Midterm results for Database Systems",
    time: "2 hours ago",
  },
  {
    id: "5",
    type: "enrollment",
    title: "New Enrollment",
    description: "5 students enrolled in AI Fundamentals",
    time: "3 hours ago",
  },
];

const typeConfig = {
  submission: {
    icon: Upload,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  attendance: {
    icon: CheckCircle2,
    color: "text-primary",
    bg: "bg-primary/10",
  },
  enrollment: {
    icon: UserPlus,
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  alert: {
    icon: AlertCircle,
    color: "text-destructive",
    bg: "bg-destructive/10",
  },
  grade: {
    icon: FileText,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
};

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Recent Activity</CardTitle>
        <p className="text-sm text-muted-foreground">Latest updates across the system</p>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Timeline line */}
          <div className="absolute left-4 top-0 bottom-0 w-px bg-border" />

          <div className="space-y-4">
            {activities.map((activity, index) => {
              const config = typeConfig[activity.type];
              const Icon = config.icon;

              return (
                <div key={activity.id} className="relative flex gap-4 pl-10">
                  {/* Timeline dot */}
                  <div
                    className={cn(
                      "absolute left-0 flex h-8 w-8 items-center justify-center rounded-full",
                      config.bg
                    )}
                  >
                    <Icon className={cn("h-4 w-4", config.color)} />
                  </div>

                  <div className="flex-1 pt-1">
                    <p className="text-sm font-medium">{activity.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {activity.description}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {activity.time}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
