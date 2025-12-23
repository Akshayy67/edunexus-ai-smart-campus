import { useLocation, Link } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  GraduationCap,
  UserCog,
  Building2,
  BookOpen,
  Layers,
  Calendar,
  UserPlus,
  MapPin,
  Settings2,
  TrendingUp,
  FileText,
  Settings,
  LogOut,
  X,
  DoorOpen,
  Brain,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const navItems = [
  { title: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { title: "Students", href: "/admin/users/students", icon: GraduationCap },
  { title: "Faculty", href: "/admin/users/faculty", icon: UserCog },
  { title: "Departments", href: "/admin/departments", icon: Building2 },
  { title: "Programs", href: "/admin/programs", icon: BookOpen },
  { title: "Subjects", href: "/admin/subjects", icon: Layers },
  { title: "Sections", href: "/admin/sections", icon: Users },
  { title: "Rooms", href: "/admin/rooms", icon: DoorOpen },
  { title: "Timetable Grid", href: "/admin/timetable-grid", icon: Calendar },
  { title: "Faculty Assignment", href: "/admin/assign-faculty", icon: UserPlus },
  { title: "Geo Zones", href: "/admin/geo-zones", icon: MapPin },
  { title: "Attendance Rules", href: "/admin/attendance-rules", icon: Settings2 },
  { title: "Analytics", href: "/admin/analytics", icon: TrendingUp },
  { title: "AI Analytics", href: "/admin/ai-analytics", icon: Brain },
  { title: "Audit Logs", href: "/admin/audit-logs", icon: FileText },
  { title: "Settings", href: "/admin/settings", icon: Settings },
];

export function AdminSidebar({ isOpen, onClose }: AdminSidebarProps) {
  const location = useLocation();
  const { signOut } = useAuth();

  const isActive = (href: string) => {
    if (href === "/admin") {
      return location.pathname === "/admin";
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
