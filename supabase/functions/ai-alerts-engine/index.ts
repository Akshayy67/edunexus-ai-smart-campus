import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Rule-based alert thresholds
const THRESHOLDS = {
  ATTENDANCE_WARNING: 0.75,
  ATTENDANCE_CRITICAL: 0.60,
  CONSECUTIVE_ABSENCES_WARNING: 3,
  CONSECUTIVE_ABSENCES_CRITICAL: 5,
  GPA_WARNING: 5.0,
  GPA_CRITICAL: 3.5,
  ASSIGNMENT_DEADLINE_REMINDER_DAYS: 3,
  ASSIGNMENT_DEADLINE_URGENT_DAYS: 1,
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, student_id, batch_id } = await req.json();
    console.log(`AI Alerts Engine: action=${action}`);

    if (action === "check_student_alerts") {
      if (!student_id) throw new Error("student_id is required");
      const alerts = await checkStudentAlerts(supabase, student_id);
      return new Response(JSON.stringify({ success: true, alerts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "run_daily_checks") {
      const results = await runDailyAlertChecks(supabase);
      return new Response(JSON.stringify({ success: true, ...results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_user_alerts") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader) throw new Error("Authorization required");

      const { data: { user } } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      if (!user) throw new Error("Invalid user");

      // Determine user type and get their alerts
      const { data: student } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user.id)
        .single();

      const { data: faculty } = await supabase
        .from("faculty")
        .select("id")
        .eq("user_id", user.id)
        .single();

      let alerts = [];
      if (student) {
        const { data } = await supabase
          .from("ai_alerts")
          .select("*")
          .eq("recipient_type", "student")
          .eq("recipient_id", student.id)
          .eq("is_acknowledged", false)
          .order("created_at", { ascending: false });
        alerts = data || [];
      } else if (faculty) {
        const { data } = await supabase
          .from("ai_alerts")
          .select("*")
          .eq("recipient_type", "faculty")
          .eq("recipient_id", faculty.id)
          .eq("is_acknowledged", false)
          .order("created_at", { ascending: false });
        alerts = data || [];
      }

      return new Response(JSON.stringify({ success: true, alerts }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "acknowledge_alert") {
      const { alert_id } = await req.json();
      if (!alert_id) throw new Error("alert_id is required");

      await supabase
        .from("ai_alerts")
        .update({ 
          is_acknowledged: true, 
          acknowledged_at: new Date().toISOString() 
        })
        .eq("id", alert_id);

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    console.error("AI Alerts Engine Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function checkStudentAlerts(supabase: any, studentId: string) {
  const alerts: any[] = [];
  const now = new Date();

  // Get student data
  const { data: student } = await supabase
    .from("students")
    .select("id, first_name, last_name")
    .eq("id", studentId)
    .single();

  if (!student) return alerts;

  // Check attendance
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const { data: attendanceRecords } = await supabase
    .from("attendance_records")
    .select("status, created_at")
    .eq("student_id", studentId)
    .gte("created_at", thirtyDaysAgo.toISOString())
    .order("created_at", { ascending: false });

  if (attendanceRecords?.length) {
    const presentCount = attendanceRecords.filter((r: any) => r.status === "present").length;
    const attendanceRate = presentCount / attendanceRecords.length;

    // Check consecutive absences
    let consecutiveAbsences = 0;
    for (const record of attendanceRecords) {
      if (record.status === "absent") consecutiveAbsences++;
      else break;
    }

    if (attendanceRate < THRESHOLDS.ATTENDANCE_CRITICAL) {
      alerts.push(await createAlert(supabase, {
        recipient_type: "student",
        recipient_id: studentId,
        alert_type: "attendance_critical",
        severity: "critical",
        title: "Critical Attendance Warning",
        message: `Your attendance has dropped to ${Math.round(attendanceRate * 100)}%. You may face academic consequences if this continues.`,
        requires_action: true,
        data: { attendance_rate: attendanceRate, threshold: THRESHOLDS.ATTENDANCE_CRITICAL },
      }));
    } else if (attendanceRate < THRESHOLDS.ATTENDANCE_WARNING) {
      alerts.push(await createAlert(supabase, {
        recipient_type: "student",
        recipient_id: studentId,
        alert_type: "attendance_warning",
        severity: "warning",
        title: "Attendance Below Threshold",
        message: `Your attendance is at ${Math.round(attendanceRate * 100)}%. Try to attend more classes.`,
        requires_action: false,
        data: { attendance_rate: attendanceRate, threshold: THRESHOLDS.ATTENDANCE_WARNING },
      }));
    }

    if (consecutiveAbsences >= THRESHOLDS.CONSECUTIVE_ABSENCES_CRITICAL) {
      alerts.push(await createAlert(supabase, {
        recipient_type: "student",
        recipient_id: studentId,
        alert_type: "consecutive_absences",
        severity: "critical",
        title: "Extended Absence Detected",
        message: `You have been absent for ${consecutiveAbsences} consecutive classes. Please contact your faculty or advisor.`,
        requires_action: true,
        data: { consecutive_absences: consecutiveAbsences },
      }));
    } else if (consecutiveAbsences >= THRESHOLDS.CONSECUTIVE_ABSENCES_WARNING) {
      alerts.push(await createAlert(supabase, {
        recipient_type: "student",
        recipient_id: studentId,
        alert_type: "consecutive_absences",
        severity: "warning",
        title: "Multiple Absences",
        message: `You have ${consecutiveAbsences} consecutive absences. Try to attend your next class.`,
        requires_action: false,
        data: { consecutive_absences: consecutiveAbsences },
      }));
    }
  }

  // Check upcoming deadlines
  const threeDaysFromNow = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  const { data: upcomingAssessments } = await supabase
    .from("assessments")
    .select("id, title, due_date, total_marks")
    .eq("status", "published")
    .gte("due_date", now.toISOString())
    .lte("due_date", threeDaysFromNow.toISOString());

  // Check which assessments don't have submissions
  for (const assessment of upcomingAssessments || []) {
    const { data: submission } = await supabase
      .from("assessment_submissions")
      .select("id")
      .eq("assessment_id", assessment.id)
      .eq("student_id", studentId)
      .single();

    if (!submission) {
      const daysUntilDue = Math.ceil((new Date(assessment.due_date).getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
      
      alerts.push(await createAlert(supabase, {
        recipient_type: "student",
        recipient_id: studentId,
        alert_type: "deadline_reminder",
        severity: daysUntilDue <= 1 ? "warning" : "info",
        title: daysUntilDue <= 1 ? "Urgent: Assignment Due Tomorrow" : "Assignment Due Soon",
        message: `"${assessment.title}" is due in ${daysUntilDue} day(s). Don't forget to submit!`,
        requires_action: true,
        related_entity_type: "assessment",
        related_entity_id: assessment.id,
        data: { assessment, days_remaining: daysUntilDue },
      }));
    }
  }

  // Check risk score
  const { data: riskScore } = await supabase
    .from("ai_risk_scores")
    .select("*")
    .eq("student_id", studentId)
    .order("calculated_at", { ascending: false })
    .limit(1)
    .single();

  if (riskScore && (riskScore.risk_category === "high" || riskScore.risk_category === "critical")) {
    alerts.push(await createAlert(supabase, {
      recipient_type: "student",
      recipient_id: studentId,
      alert_type: "risk_alert",
      severity: riskScore.risk_category === "critical" ? "critical" : "warning",
      title: `Academic Risk: ${riskScore.risk_category.charAt(0).toUpperCase() + riskScore.risk_category.slice(1)}`,
      message: riskScore.explanation || "Your academic performance indicates you may need additional support.",
      requires_action: true,
      data: { risk_score: riskScore.risk_score, factors: riskScore.contributing_factors },
    }));
  }

  return alerts;
}

async function runDailyAlertChecks(supabase: any) {
  console.log("Running daily alert checks...");
  
  // Get all active students
  const { data: students } = await supabase
    .from("students")
    .select("id")
    .eq("status", "active");

  let studentAlertsGenerated = 0;
  let facultyAlertsGenerated = 0;

  // Check each student
  for (const student of students || []) {
    const alerts = await checkStudentAlerts(supabase, student.id);
    studentAlertsGenerated += alerts.length;
  }

  // Generate faculty alerts for at-risk students
  const { data: faculty } = await supabase
    .from("faculty")
    .select("id")
    .eq("status", "active");

  for (const member of faculty || []) {
    // Get students in faculty's courses who are at risk
    const { data: atRiskStudents } = await supabase
      .from("ai_risk_scores")
      .select("student_id, risk_score, risk_category")
      .in("risk_category", ["high", "critical"]);

    if (atRiskStudents?.length > 5) {
      await createAlert(supabase, {
        recipient_type: "faculty",
        recipient_id: member.id,
        alert_type: "students_at_risk",
        severity: "warning",
        title: "Multiple Students at Risk",
        message: `${atRiskStudents.length} students in your classes are at high or critical risk. Consider intervention.`,
        requires_action: true,
        data: { at_risk_count: atRiskStudents.length },
      });
      facultyAlertsGenerated++;
    }
  }

  console.log(`Daily checks complete. Student alerts: ${studentAlertsGenerated}, Faculty alerts: ${facultyAlertsGenerated}`);

  return {
    students_checked: students?.length || 0,
    student_alerts: studentAlertsGenerated,
    faculty_alerts: facultyAlertsGenerated,
  };
}

async function createAlert(supabase: any, alertData: any) {
  // Check for duplicate recent alert
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: existing } = await supabase
    .from("ai_alerts")
    .select("id")
    .eq("recipient_id", alertData.recipient_id)
    .eq("alert_type", alertData.alert_type)
    .gte("created_at", oneHourAgo)
    .limit(1);

  if (existing?.length) {
    console.log(`Skipping duplicate alert: ${alertData.alert_type} for ${alertData.recipient_id}`);
    return null;
  }

  const { data, error } = await supabase
    .from("ai_alerts")
    .insert(alertData)
    .select()
    .single();

  if (error) {
    console.error("Failed to create alert:", error);
    return null;
  }

  return data;
}
