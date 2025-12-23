import { 
  Plus, 
  UserPlus, 
  Calendar, 
  FileText, 
  MapPin,
  Download
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const actions = [
  {
    label: "Add Student",
    icon: UserPlus,
    description: "Enroll new student",
  },
  {
    label: "Create Class",
    icon: Calendar,
    description: "Schedule a class",
  },
  {
    label: "New Assessment",
    icon: FileText,
    description: "Create assignment",
  },
  {
    label: "Mark Attendance",
    icon: MapPin,
    description: "Manual check-in",
  },
  {
    label: "Export Report",
    icon: Download,
    description: "Download reports",
  },
  {
    label: "Add Course",
    icon: Plus,
    description: "Create new course",
  },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Quick Actions</CardTitle>
        <p className="text-sm text-muted-foreground">Frequently used operations</p>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {actions.map((action) => {
            const Icon = action.icon;

            return (
              <Button
                key={action.label}
                variant="outline"
                className="h-auto flex-col gap-2 p-4 hover:bg-primary/5 hover:border-primary/50"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-5 w-5 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">{action.label}</p>
                  <p className="text-xs text-muted-foreground">{action.description}</p>
                </div>
              </Button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
