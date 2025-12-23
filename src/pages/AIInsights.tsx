import { Brain, Lightbulb, AlertTriangle, TrendingUp, Users, BookOpen, Target, Sparkles } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";

interface AIInsight {
  id: string;
  type: "recommendation" | "alert" | "trend" | "prediction";
  title: string;
  description: string;
  details: string;
  confidence: number;
  impact: "high" | "medium" | "low";
  actionable: boolean;
  category: string;
}

const insights: AIInsight[] = [
  {
    id: "1",
    type: "alert",
    title: "High-Risk Students Identified",
    description: "15 students in CS301 show patterns indicating potential academic struggles",
    details: "Based on attendance patterns, assignment submission rates, and quiz performance, the AI has identified students who may need additional support. Early intervention is recommended.",
    confidence: 94,
    impact: "high",
    actionable: true,
    category: "Student Support",
  },
  {
    id: "2",
    type: "recommendation",
    title: "Optimal Scheduling Suggestion",
    description: "Moving CS401 lectures to 10 AM could improve engagement by 23%",
    details: "Analysis of student engagement metrics across different time slots shows significantly higher participation and quiz scores in mid-morning classes compared to afternoon sessions.",
    confidence: 87,
    impact: "medium",
    actionable: true,
    category: "Scheduling",
  },
  {
    id: "3",
    type: "trend",
    title: "Rising Performance in ML Course",
    description: "Machine Learning course showing 15% improvement in average scores",
    details: "The introduction of interactive lab sessions and real-world projects has correlated with improved student understanding and assessment performance.",
    confidence: 91,
    impact: "high",
    actionable: false,
    category: "Performance",
  },
  {
    id: "4",
    type: "prediction",
    title: "Expected Enrollment Surge",
    description: "Data Science track predicted to see 40% increase next semester",
    details: "Based on course inquiries, prerequisite completions, and industry demand trends, significant enrollment growth is expected for data science related courses.",
    confidence: 82,
    impact: "high",
    actionable: true,
    category: "Planning",
  },
  {
    id: "5",
    type: "recommendation",
    title: "Content Gap Detected",
    description: "Students struggling with recursive algorithms in CS201",
    details: "Analysis of common errors and low-scoring questions reveals a knowledge gap in recursive algorithm implementation. Additional resources or review sessions are recommended.",
    confidence: 89,
    impact: "medium",
    actionable: true,
    category: "Curriculum",
  },
  {
    id: "6",
    type: "alert",
    title: "Attendance Pattern Anomaly",
    description: "Friday afternoon classes showing 18% lower attendance than average",
    details: "Consistent pattern of reduced attendance on Friday afternoons across multiple courses. Consider rescheduling or implementing engagement strategies.",
    confidence: 96,
    impact: "medium",
    actionable: true,
    category: "Attendance",
  },
];

const typeConfig = {
  recommendation: {
    icon: Lightbulb,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
    badge: "Recommendation",
    badgeVariant: "secondary" as const,
  },
  alert: {
    icon: AlertTriangle,
    color: "text-destructive",
    bg: "bg-destructive/10",
    badge: "Alert",
    badgeVariant: "destructive" as const,
  },
  trend: {
    icon: TrendingUp,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
    badge: "Trend",
    badgeVariant: "default" as const,
  },
  prediction: {
    icon: Target,
    color: "text-primary",
    bg: "bg-primary/10",
    badge: "Prediction",
    badgeVariant: "outline" as const,
  },
};

const impactConfig = {
  high: { label: "High Impact", color: "text-destructive" },
  medium: { label: "Medium Impact", color: "text-amber-500" },
  low: { label: "Low Impact", color: "text-muted-foreground" },
};

const AIInsights = () => {
  return (
    <AppLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
          </div>
          <p className="text-muted-foreground">
            Intelligent recommendations powered by EduNexus AI
          </p>
        </div>
        <Button className="gap-2">
          <Sparkles className="h-4 w-4" />
          Generate New Insights
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-destructive/10">
                <AlertTriangle className="h-5 w-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{insights.filter(i => i.type === "alert").length}</p>
                <p className="text-sm text-muted-foreground">Alerts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                <Lightbulb className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{insights.filter(i => i.type === "recommendation").length}</p>
                <p className="text-sm text-muted-foreground">Recommendations</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{insights.filter(i => i.type === "trend").length}</p>
                <p className="text-sm text-muted-foreground">Trends</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Target className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{insights.filter(i => i.type === "prediction").length}</p>
                <p className="text-sm text-muted-foreground">Predictions</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Insights Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {insights.map((insight) => {
          const config = typeConfig[insight.type];
          const impact = impactConfig[insight.impact];
          const Icon = config.icon;

          return (
            <Card key={insight.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start gap-4">
                  <div className={cn("flex h-12 w-12 shrink-0 items-center justify-center rounded-lg", config.bg)}>
                    <Icon className={cn("h-6 w-6", config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <Badge variant={config.badgeVariant} className="text-xs">
                        {config.badge}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {insight.category}
                      </Badge>
                      <span className={cn("text-xs", impact.color)}>{impact.label}</span>
                    </div>
                    <CardTitle className="text-lg leading-tight">{insight.title}</CardTitle>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">{insight.description}</p>
                <p className="text-sm leading-relaxed">{insight.details}</p>
                
                <div className="flex items-center justify-between pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">AI Confidence</span>
                    <Progress value={insight.confidence} className="w-20 h-2" />
                    <span className="text-xs font-medium">{insight.confidence}%</span>
                  </div>
                  {insight.actionable && (
                    <Button size="sm" variant="outline">
                      Take Action
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </AppLayout>
  );
};

export default AIInsights;
