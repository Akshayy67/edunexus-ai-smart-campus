import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

interface AIInsight {
  id: string;
  insight_type: string;
  category: string;
  title: string;
  message: string;
  priority: string;
  confidence: number;
  is_actionable: boolean;
  action_url?: string | null;
  data?: unknown;
  created_at: string;
  is_read: boolean;
}

interface AIAlert {
  id: string;
  alert_type: string;
  severity: string;
  title: string;
  message: string;
  requires_action: boolean;
  is_acknowledged: boolean;
  created_at: string;
  data?: unknown;
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

export function useAIInsights(userType: "student" | "faculty" | "admin") {
  const { user } = useAuth();
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [alerts, setAlerts] = useState<AIAlert[]>([]);
  const [riskScore, setRiskScore] = useState<RiskScore | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInsights = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // Get user's entity ID based on type
      let entityId: string | null = null;

      if (userType === "student") {
        const { data: student } = await supabase
          .from("students")
          .select("id")
          .eq("user_id", user.id)
          .single();
        entityId = student?.id || null;
      } else if (userType === "faculty") {
        const { data: faculty } = await supabase
          .from("faculty")
          .select("id")
          .eq("user_id", user.id)
          .single();
        entityId = faculty?.id || null;
      }

      if (!entityId && userType !== "admin") {
        setLoading(false);
        return;
      }

      // Fetch insights
      const { data: insightsData, error: insightsError } = await supabase
        .from("ai_insights")
        .select("*")
        .eq("user_id", entityId || user.id)
        .eq("user_type", userType)
        .order("created_at", { ascending: false })
        .limit(10);

      if (insightsError) throw insightsError;
      setInsights(insightsData || []);

      // Fetch alerts
      const { data: alertsData, error: alertsError } = await supabase
        .from("ai_alerts")
        .select("*")
        .eq("recipient_id", entityId || user.id)
        .eq("recipient_type", userType)
        .eq("is_acknowledged", false)
        .order("created_at", { ascending: false })
        .limit(5);

      if (alertsError) throw alertsError;
      setAlerts(alertsData || []);

      // Fetch risk score for students
      if (userType === "student" && entityId) {
        const { data: riskData } = await supabase
          .from("ai_risk_scores")
          .select("*")
          .eq("student_id", entityId)
          .order("calculated_at", { ascending: false })
          .limit(1)
          .single();

        if (riskData) {
          setRiskScore({
            risk_score: riskData.risk_score,
            risk_category: riskData.risk_category as RiskScore["risk_category"],
            attendance_factor: riskData.attendance_factor || 0,
            academic_factor: riskData.academic_factor || 0,
            engagement_factor: riskData.engagement_factor || 0,
            contributing_factors: (riskData.contributing_factors as string[]) || [],
            explanation: riskData.explanation || "",
            confidence: riskData.confidence || 0,
          });
        }
      }
    } catch (err) {
      console.error("Error fetching AI insights:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch insights");
    } finally {
      setLoading(false);
    }
  }, [user, userType]);

  const generateInsights = useCallback(async () => {
    if (!user) return;

    try {
      let entityId: string | null = null;

      if (userType === "student") {
        const { data: student } = await supabase
          .from("students")
          .select("id")
          .eq("user_id", user.id)
          .single();
        entityId = student?.id || null;
      } else if (userType === "faculty") {
        const { data: faculty } = await supabase
          .from("faculty")
          .select("id")
          .eq("user_id", user.id)
          .single();
        entityId = faculty?.id || null;
      }

      if (!entityId && userType !== "admin") {
        toast.error("User profile not found");
        return;
      }

      toast.info("Generating AI insights...");

      const action = userType === "student" 
        ? "generate_student_insights"
        : userType === "faculty"
        ? "generate_faculty_insights"
        : "generate_admin_insights";

      const { data, error } = await supabase.functions.invoke("ai-insights-generator", {
        body: { action, user_id: entityId, user_type: userType },
      });

      if (error) throw error;

      toast.success(`Generated ${data.insights?.length || 0} new insights`);
      await fetchInsights();
    } catch (err) {
      console.error("Error generating insights:", err);
      toast.error("Failed to generate insights");
    }
  }, [user, userType, fetchInsights]);

  const acknowledgeAlert = useCallback(async (alertId: string) => {
    try {
      const { error } = await supabase
        .from("ai_alerts")
        .update({ is_acknowledged: true, acknowledged_at: new Date().toISOString() })
        .eq("id", alertId);

      if (error) throw error;

      setAlerts((prev) => prev.filter((a) => a.id !== alertId));
      toast.success("Alert acknowledged");
    } catch (err) {
      console.error("Error acknowledging alert:", err);
      toast.error("Failed to acknowledge alert");
    }
  }, []);

  const markInsightRead = useCallback(async (insightId: string) => {
    try {
      const { error } = await supabase
        .from("ai_insights")
        .update({ is_read: true })
        .eq("id", insightId);

      if (error) throw error;

      setInsights((prev) =>
        prev.map((i) => (i.id === insightId ? { ...i, is_read: true } : i))
      );
    } catch (err) {
      console.error("Error marking insight as read:", err);
    }
  }, []);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  return {
    insights,
    alerts,
    riskScore,
    loading,
    error,
    fetchInsights,
    generateInsights,
    acknowledgeAlert,
    markInsightRead,
  };
}
