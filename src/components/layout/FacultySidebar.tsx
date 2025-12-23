import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  BookOpen,
  Calendar,
  CalendarCheck,
  FileText,
  ClipboardCheck,
  GraduationCap,
  TrendingUp,
  Bell,
  User,
  LogOut,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface FacultySidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { title: "Dashboard", href: "/faculty", icon: LayoutDashboard },
  { title: "My Subjects", href: "/faculty/subjects", icon: BookOpen },
  { title: "Timetable", href: "/faculty/timetable", icon: Calendar },
  { title: "Attendance", href: "/faculty/attendance", icon: CalendarCheck },
  { title: "Assignments", href: "/faculty/assignments", icon: FileText },
  { title: "Grading", href: "/faculty/grading", icon: ClipboardCheck },
  { title: "Marks Entry", href: "/faculty/marks-entry", icon: GraduationCap },
  { title: "Analytics", href: "/faculty/analytics", icon: TrendingUp },
  { title: "Notifications", href: "/faculty/notifications", icon: Bell },
  { title: "Profile", href: "/faculty/profile", icon: User },
];

export function FacultySidebar({ isOpen, onClose }: FacultySidebarProps) {
  const location = useLocation();
  const { signOut } = useAuth();

  const isActive = (href: string) => {
    if (href === "/faculty") {
      return location.pathname === "/faculty";
    }
    return location.pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed lg:static inset-y-0 left-0 z-50 w-64 bg-card border-r border-border flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-sm">S</span>
            </div>
            <span className="font-semibold text-foreground">Super App</span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden"
            onClick={onClose}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link
              key={item.href}
              to={item.href}
              onClick={onClose}
              className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.title}
            </Link>
          ))}
        </nav>

        {/* Footer */}
        <div className="p-4 border-t border-border">
          <Button
            variant="ghost"
            className="w-full justify-start text-muted-foreground hover:text-foreground"
            onClick={signOut}
          >
            <LogOut className="h-5 w-5 mr-3" />
            Sign Out
          </Button>
        </div>
      </aside>
    </>
  );
}
