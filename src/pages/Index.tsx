import { Users, BookOpen, ClipboardCheck, MapPin } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AIInsightCard } from "@/components/dashboard/AIInsightCard";
import { AttendanceChart } from "@/components/dashboard/AttendanceChart";
import { UpcomingClasses } from "@/components/dashboard/UpcomingClasses";
import { RecentActivity } from "@/components/dashboard/RecentActivity";
import { QuickActions } from "@/components/dashboard/QuickActions";

const Index = () => {
  return (
    <AppLayout>
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Welcome back! Here's an overview of your institution.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <StatsCard
          title="Total Students"
          value="2,847"
          change={12}
          changeLabel="vs last month"
          icon={Users}
        />
        <StatsCard
          title="Active Courses"
          value="156"
          change={5}
          changeLabel="new this semester"
          icon={BookOpen}
        />
        <StatsCard
          title="Today's Attendance"
          value="89%"
          change={3}
          changeLabel="vs yesterday"
          icon={MapPin}
        />
        <StatsCard
          title="Pending Assessments"
          value="23"
          change={-8}
          changeLabel="to be graded"
          icon={ClipboardCheck}
        />
      </div>

      {/* Main Grid */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        {/* Attendance Chart - spans 2 cols */}
        <AttendanceChart />
        
        {/* AI Insights */}
        <AIInsightCard />
      </div>

      {/* Secondary Grid */}
      <div className="grid gap-6 lg:grid-cols-3 mb-8">
        {/* Today's Classes */}
        <UpcomingClasses />

        {/* Recent Activity */}
        <RecentActivity />

        {/* Quick Actions */}
        <QuickActions />
      </div>
    </AppLayout>
  );
};

export default Index;
