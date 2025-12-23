import { Brain, Lightbulb, AlertTriangle, TrendingUp, Bell, X, RefreshCw, ChevronRight } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface AIInsight {
  id: string;
  insight_type: string;
  category: string;
  title: string;
  message: string;
  priority: string;
  confidence: number;
  is_actionable: boolean;
  action_url?: string;
  is_read: boolean;
}

interface AIAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  requires_action: boolean;
}

interface RiskScore {
  risk_score: number;
  risk_category: "low" | "moderate" | "high" | "critical";
  attendance_factor: number;
  academic_factor: number;
  engagement_factor: number;
  contributing_factors: string[];
  explanation: string;
  confidence: number;
}

interface AIInsightsPanelProps {
  insights: AIInsight[];
  alerts: AIAlert[];
  riskScore: RiskScore | null;
  loading: boolean;
  onRefresh: () => void;
  onAcknowledgeAlert: (id: string) => void;
  onMarkRead: (id: string) => void;
  userType: "student" | "faculty" | "admin";
}

const insightTypeConfig = {
  alert: { icon: AlertTriangle, color: "text-destructive", bg: "bg-destructive/10" },
  warning: { icon: AlertTriangle, color: "text-amber-500", bg: "bg-amber-500/10" },
  recommendation: { icon: Lightbulb, color: "text-primary", bg: "bg-primary/10" },
  reminder: { icon: Bell, color: "text-blue-500", bg: "bg-blue-500/10" },
  info: { icon: TrendingUp, color: "text-muted-foreground", bg: "bg-muted" },
};

const riskCategoryConfig = {
  low: { color: "text-green-500", bg: "bg-green-500/10", label: "Low Risk" },
  moderate: { color: "text-amber-500", bg: "bg-amber-500/10", label: "Moderate Risk" },
  high: { color: "text-orange-500", bg: "bg-orange-500/10", label: "High Risk" },
  critical: { color: "text-destructive", bg: "bg-destructive/10", label: "Critical Risk" },
};

export function AIInsightsPanel({
  insights,
  alerts,
  riskScore,
  loading,
  onRefresh,
  onAcknowledgeAlert,
  onMarkRead,
  userType,
}: AIInsightsPanelProps) {
  return (
    <div className="space-y-4">
      {/* Risk Score Card (Students Only) */}
      {userType === "student" && riskScore && (
        <Card className={cn("border-l-4", {
          "border-l-green-500": riskScore.risk_category === "low",
          "border-l-amber-500": riskScore.risk_category === "moderate",
          "border-l-orange-500": riskScore.risk_category === "high",
          "border-l-destructive": riskScore.risk_category === "critical",
        })}>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-primary" />
                <CardTitle className="text-base">Academic Health</CardTitle>
              </div>
              <Badge 
                variant="outline" 
                className={cn(
                  riskCategoryConfig[riskScore.risk_category].color,
                  riskCategoryConfig[riskScore.risk_category].bg
                )}
              >
                {riskCategoryConfig[riskScore.risk_category].label}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-sm">
              <div>
                <p className="text-muted-foreground text-xs">Attendance</p>
                <Progress 
                  value={(1 - riskScore.attendance_factor) * 100} 
                  className="h-2 mt-1"
                />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Academic</p>
                <Progress 
                  value={(1 - riskScore.academic_factor) * 100} 
                  className="h-2 mt-1"
                />
              </div>
              <div>
                <p className="text-muted-foreground text-xs">Engagement</p>
                <Progress 
                  value={(1 - riskScore.engagement_factor) * 100} 
                  className="h-2 mt-1"
                />
              </div>
            </div>
            {riskScore.explanation && (
              <p className="text-sm text-muted-foreground">{riskScore.explanation}</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* Alerts Section */}
      {alerts.length > 0 && (
        <Card className="border-destructive/50">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-destructive" />
                <CardTitle className="text-base">Alerts</CardTitle>
              </div>
              <Badge variant="destructive">{alerts.length}</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {alerts.map((alert) => (
              <div 
                key={alert.id}
                className={cn(
                  "p-3 rounded-lg flex items-start justify-between gap-2",
                  alert.severity === "critical" ? "bg-destructive/10" : "bg-amber-500/10"
                )}
              >
                <div className="flex-1">
                  <p className="font-medium text-sm">{alert.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{alert.message}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0"
                  onClick={() => onAcknowledgeAlert(alert.id)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Insights Card */}
      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">AI Insights</CardTitle>
            </div>
            <Button variant="ghost" size="icon" onClick={onRefresh} disabled={loading}>
              <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
            </Button>
          </div>
          <CardDescription>Personalized recommendations powered by AI</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : insights.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <Brain className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No insights available yet</p>
              <Button variant="outline" size="sm" className="mt-2" onClick={onRefresh}>
                Generate Insights
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              {insights.slice(0, 5).map((insight) => {
                const config = insightTypeConfig[insight.insight_type as keyof typeof insightTypeConfig] 
                  || insightTypeConfig.info;
                const Icon = config.icon;

                return (
                  <div
                    key={insight.id}
                    className={cn(
                      "p-3 rounded-lg transition-colors",
                      config.bg,
                      !insight.is_read && "ring-1 ring-primary/20"
                    )}
                    onClick={() => !insight.is_read && onMarkRead(insight.id)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={cn("p-1.5 rounded-full", config.bg)}>
                        <Icon className={cn("h-4 w-4", config.color)} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-sm truncate">{insight.title}</p>
                          {insight.confidence > 0 && (
                            <span className="text-xs text-muted-foreground shrink-0">
                              {Math.round(insight.confidence * 100)}%
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                          {insight.message}
                        </p>
                        {insight.is_actionable && insight.action_url && (
                          <Button 
                            variant="link" 
                            size="sm" 
                            className="h-auto p-0 mt-1 text-xs"
                            asChild
                          >
                            <Link to={insight.action_url}>
                              Take Action <ChevronRight className="h-3 w-3 ml-1" />
                            </Link>
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
