import { Brain, Lightbulb, AlertTriangle, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface Insight {
  id: string;
  type: "recommendation" | "alert" | "trend";
  title: string;
  description: string;
  confidence: number;
}

const insights: Insight[] = [
  {
    id: "1",
    type: "alert",
    title: "Attendance Drop Detected",
    description: "15 students in CS301 show declining attendance patterns. Consider intervention.",
    confidence: 92,
  },
  {
    id: "2",
    type: "recommendation",
    title: "Optimal Class Timing",
    description: "Analytics suggest 10 AM slots have 23% higher engagement than afternoon classes.",
    confidence: 87,
  },
  {
    id: "3",
    type: "trend",
    title: "Performance Improvement",
    description: "Overall GPA trending upward by 0.3 points compared to last semester.",
    confidence: 95,
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
};

export function AIInsightCard() {
  return (
    <Card className="col-span-full lg:col-span-1">
      <CardHeader className="flex flex-row items-center gap-2 pb-4">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
          <Brain className="h-4 w-4 text-primary" />
        </div>
        <div>
          <CardTitle className="text-lg">AI Insights</CardTitle>
          <p className="text-sm text-muted-foreground">Powered by EduNexus AI</p>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.map((insight) => {
          const config = typeConfig[insight.type];
          const Icon = config.icon;

          return (
            <div
              key={insight.id}
              className="flex gap-3 p-3 rounded-lg bg-card border border-border hover:border-primary/50 transition-colors cursor-pointer"
            >
              <div className={cn("flex h-9 w-9 shrink-0 items-center justify-center rounded-lg", config.bg)}>
                <Icon className={cn("h-4 w-4", config.color)} />
              </div>
              <div className="flex-1 space-y-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-medium leading-tight">{insight.title}</p>
                  <Badge variant={config.badgeVariant} className="text-xs shrink-0">
                    {config.badge}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground line-clamp-2">
                  {insight.description}
                </p>
                <div className="flex items-center gap-1 pt-1">
                  <div className="h-1.5 flex-1 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${insight.confidence}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted-foreground">{insight.confidence}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
