import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, user_type, user_id } = await req.json();
    console.log(`AI Insights Generator: action=${action}, user_type=${user_type}, user_id=${user_id}`);

    if (action === "generate_student_insights") {
      if (!user_id) throw new Error("user_id is required");
      const insights = await generateStudentInsights(supabase, user_id, lovableApiKey);
      return new Response(JSON.stringify({ success: true, insights }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "generate_faculty_insights") {
      if (!user_id) throw new Error("user_id is required");
      const insights = await generateFacultyInsights(supabase, user_id, lovableApiKey);
      return new Response(JSON.stringify({ success: true, insights }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "generate_admin_insights") {
      const insights = await generateAdminInsights(supabase, lovableApiKey);
      return new Response(JSON.stringify({ success: true, insights }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "get_user_insights") {
      if (!user_id || !user_type) throw new Error("user_id and user_type are required");
      
      const { data: insights } = await supabase
        .from("ai_insights")
        .select("*")
        .eq("user_id", user_id)
        .eq("user_type", user_type)
        .order("created_at", { ascending: false })
        .limit(10);

      return new Response(JSON.stringify({ success: true, insights }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    console.error("AI Insights Generator Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function generateStudentInsights(supabase: any, studentId: string, apiKey?: string) {
  const insights: any[] = [];

  // Get student's risk score
  const { data: riskScore } = await supabase
    .from("ai_risk_scores")
    .select("*")
    .eq("student_id", studentId)
    .order("calculated_at", { ascending: false })
    .limit(1)
    .single();

  // Get student's attendance
  const { data: attendanceRecords } = await supabase
    .from("attendance_records")
    .select("status, created_at")
    .eq("student_id", studentId)
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const totalRecords = attendanceRecords?.length || 0;
  const presentCount = attendanceRecords?.filter((r: any) => r.status === "present").length || 0;
  const attendanceRate = totalRecords > 0 ? presentCount / totalRecords : 1;

  // Get upcoming assessments
  const { data: upcomingAssessments } = await supabase
    .from("assessments")
    .select("title, due_date, total_marks")
    .eq("status", "published")
    .gte("due_date", new Date().toISOString())
    .order("due_date")
    .limit(5);

  // Generate insights based on data

  // 1. Risk Alert
  if (riskScore && riskScore.risk_category !== "low") {
    insights.push({
      user_id: studentId,
      user_type: "student",
      insight_type: "alert",
      category: "risk",
      title: `${riskScore.risk_category.charAt(0).toUpperCase() + riskScore.risk_category.slice(1)} Risk Alert`,
      message: riskScore.explanation || `Your current risk level is ${riskScore.risk_category}. Consider focusing on areas that need improvement.`,
      priority: riskScore.risk_category === "critical" ? "high" : "normal",
      confidence: riskScore.confidence,
      is_actionable: true,
      action_url: "/student/performance",
      data: { risk_score: riskScore.risk_score, factors: riskScore.contributing_factors },
    });
  }

  // 2. Attendance Insight
  if (attendanceRate < 0.75) {
    insights.push({
      user_id: studentId,
      user_type: "student",
      insight_type: "warning",
      category: "attendance",
      title: "Attendance Needs Attention",
      message: `Your attendance is at ${Math.round(attendanceRate * 100)}%. Aim for at least 75% to avoid academic penalties.`,
      priority: attendanceRate < 0.6 ? "high" : "normal",
      confidence: 0.95,
      is_actionable: true,
      action_url: "/student/attendance",
      data: { attendance_rate: attendanceRate, total_classes: totalRecords },
    });
  } else if (attendanceRate >= 0.9) {
    insights.push({
      user_id: studentId,
      user_type: "student",
      insight_type: "recommendation",
      category: "attendance",
      title: "Excellent Attendance!",
      message: `Great job! Your ${Math.round(attendanceRate * 100)}% attendance shows dedication. Keep it up!`,
      priority: "low",
      confidence: 0.95,
      is_actionable: false,
      data: { attendance_rate: attendanceRate },
    });
  }

  // 3. Upcoming Deadline Reminder
  if (upcomingAssessments?.length) {
    const nextDue = upcomingAssessments[0];
    const daysUntilDue = Math.ceil((new Date(nextDue.due_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    
    if (daysUntilDue <= 3) {
      insights.push({
        user_id: studentId,
        user_type: "student",
        insight_type: "reminder",
        category: "assignments",
        title: "Assignment Due Soon",
        message: `"${nextDue.title}" is due in ${daysUntilDue} day(s). Make sure to submit on time!`,
        priority: daysUntilDue <= 1 ? "high" : "normal",
        confidence: 1.0,
        is_actionable: true,
        action_url: "/student/assignments",
        data: { assessment: nextDue, days_remaining: daysUntilDue },
      });
    }
  }

  // Use AI to generate personalized recommendation if available
  if (apiKey && riskScore) {
    try {
      const aiRecommendation = await generateAIRecommendation(
        studentId,
        {
          risk: riskScore,
          attendance_rate: attendanceRate,
          upcoming_assessments: upcomingAssessments?.length || 0,
        },
        apiKey
      );
      
      if (aiRecommendation) {
        insights.push({
          user_id: studentId,
          user_type: "student",
          insight_type: "recommendation",
          category: "ai_personalized",
          title: "Personalized Recommendation",
          message: aiRecommendation,
          priority: "normal",
          confidence: 0.85,
          is_actionable: true,
          action_url: "/student/performance",
        });
      }
    } catch (e) {
      console.error("Failed to generate AI recommendation:", e);
    }
  }

  // Store insights in database
  for (const insight of insights) {
    await supabase.from("ai_insights").insert(insight);
  }

  return insights;
}

async function generateFacultyInsights(supabase: any, facultyId: string, apiKey?: string) {
  const insights: any[] = [];

  // Get faculty's courses and sections
  const { data: assignments } = await supabase
    .from("course_assignments")
    .select("id, course:courses(id, name), batch:batches(id, name)")
    .eq("faculty_id", facultyId);

  // Get students at risk in faculty's classes
  const { data: riskScores } = await supabase
    .from("ai_risk_scores")
    .select("student_id, risk_score, risk_category")
    .in("risk_category", ["high", "critical"])
    .order("risk_score", { ascending: false })
    .limit(10);

  // Get grading profile
  const { data: gradingProfile } = await supabase
    .from("ai_faculty_grading_profile")
    .select("*")
    .eq("faculty_id", facultyId)
    .order("calculated_at", { ascending: false })
    .limit(1)
    .single();

  // Get pending submissions to grade
  const { data: pendingSubmissions } = await supabase
    .from("assessment_submissions")
    .select("id, assessment:assessments!inner(faculty_id, title)")
    .eq("assessment.faculty_id", facultyId)
    .eq("status", "submitted")
    .is("marks_obtained", null);

  // 1. At-Risk Students Alert
  if (riskScores?.length) {
    insights.push({
      user_id: facultyId,
      user_type: "faculty",
      insight_type: "alert",
      category: "student_risk",
      title: `${riskScores.length} Students Need Attention`,
      message: `You have ${riskScores.length} student(s) at high or critical risk. Consider reaching out to provide support.`,
      priority: "high",
      confidence: 0.9,
      is_actionable: true,
      action_url: "/faculty/analytics",
      data: { at_risk_count: riskScores.length, top_risks: riskScores.slice(0, 3) },
    });
  }

  // 2. Pending Grading
  if (pendingSubmissions?.length) {
    insights.push({
      user_id: facultyId,
      user_type: "faculty",
      insight_type: "reminder",
      category: "grading",
      title: "Submissions Pending Review",
      message: `You have ${pendingSubmissions.length} submission(s) waiting to be graded.`,
      priority: pendingSubmissions.length > 10 ? "high" : "normal",
      confidence: 1.0,
      is_actionable: true,
      action_url: "/faculty/grading",
      data: { pending_count: pendingSubmissions.length },
    });
  }

  // 3. Grading Pattern Insight
  if (gradingProfile) {
    if (gradingProfile.strictness_index > 0.7) {
      insights.push({
        user_id: facultyId,
        user_type: "faculty",
        insight_type: "info",
        category: "grading_pattern",
        title: "Grading Pattern Analysis",
        message: `Your grading tends to be stricter than average. Consider reviewing grade distributions for fairness.`,
        priority: "low",
        confidence: 0.8,
        is_actionable: true,
        action_url: "/faculty/analytics",
        data: gradingProfile,
      });
    }
  }

  // Store insights
  for (const insight of insights) {
    await supabase.from("ai_insights").insert(insight);
  }

  return insights;
}

async function generateAdminInsights(supabase: any, apiKey?: string) {
  const insights: any[] = [];

  // Get overall risk distribution
  const { data: riskDistribution } = await supabase
    .from("ai_risk_scores")
    .select("risk_category");

  const riskCounts = {
    low: 0,
    moderate: 0,
    high: 0,
    critical: 0,
  };

  for (const score of riskDistribution || []) {
    riskCounts[score.risk_category as keyof typeof riskCounts]++;
  }

  const totalStudents = Object.values(riskCounts).reduce((a, b) => a + b, 0);
  const atRiskPercentage = totalStudents > 0 
    ? ((riskCounts.high + riskCounts.critical) / totalStudents) * 100 
    : 0;

  // 1. Institution-wide Risk Overview
  if (atRiskPercentage > 10) {
    insights.push({
      user_id: "admin",
      user_type: "admin",
      insight_type: "alert",
      category: "institutional_risk",
      title: "Elevated Student Risk Levels",
      message: `${atRiskPercentage.toFixed(1)}% of students are at high or critical risk. Consider institutional interventions.`,
      priority: atRiskPercentage > 20 ? "high" : "normal",
      confidence: 0.92,
      is_actionable: true,
      action_url: "/admin/analytics",
      data: { risk_distribution: riskCounts, at_risk_percentage: atRiskPercentage },
    });
  }

  // Get attendance trends
  const { data: recentAttendance } = await supabase
    .from("attendance_records")
    .select("status, created_at")
    .gte("created_at", new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());

  const weeklyPresent = recentAttendance?.filter((r: any) => r.status === "present").length || 0;
  const weeklyTotal = recentAttendance?.length || 0;
  const weeklyRate = weeklyTotal > 0 ? weeklyPresent / weeklyTotal : 1;

  // 2. Weekly Attendance Summary
  insights.push({
    user_id: "admin",
    user_type: "admin",
    insight_type: "info",
    category: "attendance_summary",
    title: "Weekly Attendance Report",
    message: `This week's attendance rate is ${Math.round(weeklyRate * 100)}% across ${weeklyTotal} recorded sessions.`,
    priority: weeklyRate < 0.7 ? "high" : "low",
    confidence: 0.98,
    is_actionable: false,
    data: { weekly_rate: weeklyRate, total_records: weeklyTotal },
  });

  // 3. Subject Difficulty Analysis
  const { data: difficultSubjects } = await supabase
    .from("ai_subject_difficulty")
    .select("course_id, difficulty_score, failure_rate")
    .gt("failure_rate", 0.3)
    .order("failure_rate", { ascending: false })
    .limit(5);

  if (difficultSubjects?.length) {
    insights.push({
      user_id: "admin",
      user_type: "admin",
      insight_type: "warning",
      category: "curriculum",
      title: "High Failure Rate Subjects",
      message: `${difficultSubjects.length} subject(s) have failure rates above 30%. Consider curriculum review or additional support.`,
      priority: "normal",
      confidence: 0.9,
      is_actionable: true,
      action_url: "/admin/subjects",
      data: { subjects: difficultSubjects },
    });
  }

  // Store insights
  for (const insight of insights) {
    await supabase.from("ai_insights").insert(insight);
  }

  return insights;
}

async function generateAIRecommendation(
  studentId: string,
  data: { risk: any; attendance_rate: number; upcoming_assessments: number },
  apiKey: string
): Promise<string | null> {
  const prompt = `Based on this student's profile, provide ONE specific, actionable recommendation (2 sentences max):

Risk Level: ${data.risk.risk_category}
Risk Factors: ${data.risk.contributing_factors?.join(", ") || "None"}
Attendance: ${Math.round(data.attendance_rate * 100)}%
Upcoming Assessments: ${data.upcoming_assessments}

Focus on the most impactful improvement the student can make this week.`;

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash-lite",
      messages: [
        { role: "system", content: "You are a supportive academic advisor. Be encouraging but direct." },
        { role: "user", content: prompt },
      ],
      max_tokens: 100,
    }),
  });

  if (!response.ok) return null;

  const result = await response.json();
  return result.choices?.[0]?.message?.content || null;
}
