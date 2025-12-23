import { useState, useEffect } from "react";
import { AlertTriangle, TrendingDown, Brain, X, ChevronRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { Link } from "react-router-dom";

interface AtRiskStudent {
  student_id: string;
  student_name: string;
  roll_number: string;
  risk_score: number;
  risk_category: "low" | "moderate" | "high" | "critical";
  attendance_rate?: number;
  contributing_factors: string[];
}

interface AtRiskStudentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sessionId?: string;
  courseId?: string;
  title?: string;
}

export function AtRiskStudentsDialog({
  open,
  onOpenChange,
  sessionId,
  courseId,
  title = "At-Risk Students Identified",
}: AtRiskStudentsDialogProps) {
  const [atRiskStudents, setAtRiskStudents] = useState<AtRiskStudent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchAtRiskStudents();
    }
  }, [open, sessionId, courseId]);

  async function fetchAtRiskStudents() {
    try {
      setLoading(true);

      // Get students from the session or course
      let studentIds: string[] = [];

      if (sessionId) {
        const { data: attendance } = await supabase
          .from("attendance_records")
          .select("student_id")
          .eq("session_id", sessionId);
        studentIds = attendance?.map((a) => a.student_id) || [];
      }

      if (studentIds.length === 0) {
        setAtRiskStudents([]);
        setLoading(false);
        return;
      }

      // Get risk scores for these students
      const { data: riskScores } = await supabase
        .from("ai_risk_scores")
        .select("*")
        .in("student_id", studentIds)
        .in("risk_category", ["high", "critical"])
        .order("risk_score", { ascending: false });

      if (!riskScores?.length) {
        setAtRiskStudents([]);
        setLoading(false);
        return;
      }

      // Get student details
      const atRiskIds = riskScores.map((r) => r.student_id);
      const { data: students } = await supabase
        .from("students")
        .select("id, first_name, last_name, roll_number")
        .in("id", atRiskIds);

      const studentMap = new Map(students?.map((s) => [s.id, s]));

      // Get attendance rates
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const attendanceRates: Record<string, number> = {};

      for (const studentId of atRiskIds) {
        const { data: records } = await supabase
          .from("attendance_records")
          .select("status")
          .eq("student_id", studentId)
          .gte("created_at", thirtyDaysAgo);

        if (records?.length) {
          const present = records.filter((r) => r.status === "present").length;
          attendanceRates[studentId] = present / records.length;
        }
      }

      const enriched: AtRiskStudent[] = riskScores.map((risk) => {
        const student = studentMap.get(risk.student_id);
        return {
          student_id: risk.student_id,
          student_name: student ? `${student.first_name} ${student.last_name}` : "Unknown",
          roll_number: student?.roll_number || "",
          risk_score: risk.risk_score,
          risk_category: risk.risk_category as AtRiskStudent["risk_category"],
          attendance_rate: attendanceRates[risk.student_id],
          contributing_factors: (risk.contributing_factors as string[]) || [],
        };
      });

      setAtRiskStudents(enriched);
    } catch (error) {
      console.error("Error fetching at-risk students:", error);
    } finally {
      setLoading(false);
    }
  }

  const riskCategoryConfig = {
    low: { color: "text-green-500", bg: "bg-green-500/10", label: "Low" },
    moderate: { color: "text-amber-500", bg: "bg-amber-500/10", label: "Moderate" },
    high: { color: "text-orange-500", bg: "bg-orange-500/10", label: "High" },
    critical: { color: "text-destructive", bg: "bg-destructive/10", label: "Critical" },
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {title}
          </DialogTitle>
          <DialogDescription>
            These students in your class need attention based on AI risk analysis
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
              ))}
            </div>
          ) : atRiskStudents.length === 0 ? (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <p className="text-muted-foreground">No at-risk students identified in this class!</p>
              <p className="text-sm text-muted-foreground mt-1">All students are performing well.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {atRiskStudents.map((student) => {
                const config = riskCategoryConfig[student.risk_category];
                return (
                  <div
                    key={student.student_id}
                    className={cn(
                      "p-4 rounded-lg border",
                      student.risk_category === "critical"
                        ? "border-destructive/50 bg-destructive/5"
                        : "border-border bg-muted/30"
                    )}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div>
                        <p className="font-medium">{student.student_name}</p>
                        <p className="text-sm text-muted-foreground">{student.roll_number}</p>
                      </div>
                      <Badge className={cn(config.color, config.bg, "border-0")}>
                        {config.label} Risk
                      </Badge>
                    </div>

                    <div className="grid grid-cols-2 gap-4 mt-3">
                      <div>
                        <p className="text-xs text-muted-foreground mb-1">Risk Score</p>
                        <div className="flex items-center gap-2">
                          <Progress
                            value={student.risk_score * 100}
                            className="h-2 flex-1"
                          />
                          <span className="text-sm font-medium">
                            {Math.round(student.risk_score * 100)}%
                          </span>
                        </div>
                      </div>
                      {student.attendance_rate !== undefined && (
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Attendance</p>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={student.attendance_rate * 100}
                              className="h-2 flex-1"
                            />
                            <span className="text-sm font-medium">
                              {Math.round(student.attendance_rate * 100)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {student.contributing_factors.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs text-muted-foreground mb-1">Key Factors:</p>
                        <div className="flex flex-wrap gap-1">
                          {student.contributing_factors.slice(0, 3).map((factor, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              <TrendingDown className="h-3 w-3 mr-1" />
                              {factor}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex justify-between pt-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            <X className="h-4 w-4 mr-2" />
            Close
          </Button>
          <Button asChild>
            <Link to="/faculty/analytics">
              View Full Analytics
              <ChevronRight className="h-4 w-4 ml-2" />
            </Link>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
