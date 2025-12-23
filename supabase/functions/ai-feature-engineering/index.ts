import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface AttendanceFeatures {
  overall_attendance_rate: number;
  recent_attendance_rate: number;
  consecutive_absences: number;
  attendance_trend: "improving" | "declining" | "stable";
  subjects_below_threshold: string[];
}

interface AcademicFeatures {
  current_gpa_equivalent: number;
  performance_momentum: number;
  weak_subjects: string[];
  strong_subjects: string[];
  assignment_completion_rate: number;
}

interface EngagementFeatures {
  login_frequency: number;
  assignment_submission_timeliness: number;
  class_participation_score: number;
}

interface StudentFeatures {
  student_id: string;
  attendance: AttendanceFeatures;
  academic: AcademicFeatures;
  engagement: EngagementFeatures;
  calculated_at: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, student_id, batch_id } = await req.json();
    console.log(`AI Feature Engineering: action=${action}, student_id=${student_id}, batch_id=${batch_id}`);

    if (action === "calculate_student_features") {
      if (!student_id) {
        throw new Error("student_id is required");
      }
      const features = await calculateStudentFeatures(supabase, student_id);
      
      // Cache the features
      await supabase.from("ai_feature_cache").upsert({
        entity_type: "student",
        entity_id: student_id,
        feature_set: "full_profile",
        features: features,
        calculated_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        is_stale: false,
      });

      return new Response(JSON.stringify({ success: true, features }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "calculate_batch_features") {
      if (!batch_id) {
        throw new Error("batch_id is required");
      }
      
      // Get all students in the batch
      const { data: students, error: studentsError } = await supabase
        .from("students")
        .select(`
          id,
          student_enrollments!inner(
            section:sections!inner(
              batch_id
            )
          )
        `)
        .eq("student_enrollments.section.batch_id", batch_id);

      if (studentsError) throw studentsError;

      const results = [];
      for (const student of students || []) {
        const features = await calculateStudentFeatures(supabase, student.id);
        results.push({ student_id: student.id, features });
        
        // Cache each student's features
        await supabase.from("ai_feature_cache").upsert({
          entity_type: "student",
          entity_id: student.id,
          feature_set: "full_profile",
          features: features,
          calculated_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          is_stale: false,
        });
      }

      return new Response(JSON.stringify({ success: true, count: results.length, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "calculate_subject_difficulty") {
      const difficulties = await calculateSubjectDifficulty(supabase);
      
      return new Response(JSON.stringify({ success: true, difficulties }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "calculate_faculty_grading_profile") {
      const profiles = await calculateFacultyGradingProfiles(supabase);
      
      return new Response(JSON.stringify({ success: true, profiles }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    console.error("AI Feature Engineering Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function calculateStudentFeatures(supabase: any, studentId: string): Promise<StudentFeatures> {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Fetch attendance records
  const { data: attendanceRecords } = await supabase
    .from("attendance_records")
    .select("status, created_at, session:attendance_sessions(course_id)")
    .eq("student_id", studentId)
    .gte("created_at", thirtyDaysAgo);

  // Fetch assessment submissions
  const { data: submissions } = await supabase
    .from("assessment_submissions")
    .select("marks_obtained, submitted_at, is_late, assessment:assessments(total_marks, due_date, course_id)")
    .eq("student_id", studentId);

  // Calculate attendance features
  const totalAttendance = attendanceRecords?.length || 0;
  const presentCount = attendanceRecords?.filter((r: any) => r.status === "present").length || 0;
  const recentRecords = attendanceRecords?.filter((r: any) => new Date(r.created_at) >= new Date(sevenDaysAgo)) || [];
  const recentPresent = recentRecords.filter((r: any) => r.status === "present").length;

  // Calculate consecutive absences
  let consecutiveAbsences = 0;
  let maxConsecutive = 0;
  const sortedRecords = (attendanceRecords || []).sort((a: any, b: any) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
  
  for (const record of sortedRecords) {
    if (record.status === "absent") {
      consecutiveAbsences++;
      maxConsecutive = Math.max(maxConsecutive, consecutiveAbsences);
    } else {
      break;
    }
  }

  // Determine attendance trend
  const firstHalf = attendanceRecords?.slice(0, Math.floor(totalAttendance / 2)) || [];
  const secondHalf = attendanceRecords?.slice(Math.floor(totalAttendance / 2)) || [];
  const firstHalfRate = firstHalf.filter((r: any) => r.status === "present").length / (firstHalf.length || 1);
  const secondHalfRate = secondHalf.filter((r: any) => r.status === "present").length / (secondHalf.length || 1);
  
  let attendanceTrend: "improving" | "declining" | "stable" = "stable";
  if (secondHalfRate - firstHalfRate > 0.1) attendanceTrend = "improving";
  else if (firstHalfRate - secondHalfRate > 0.1) attendanceTrend = "declining";

  // Calculate academic features
  const totalMarks = submissions?.reduce((sum: number, s: any) => sum + (s.assessment?.total_marks || 0), 0) || 0;
  const obtainedMarks = submissions?.reduce((sum: number, s: any) => sum + (s.marks_obtained || 0), 0) || 0;
  const gpaEquivalent = totalMarks > 0 ? (obtainedMarks / totalMarks) * 10 : 0;

  // Find weak and strong subjects
  const subjectPerformance: Record<string, { obtained: number; total: number }> = {};
  for (const submission of submissions || []) {
    const courseId = submission.assessment?.course_id;
    if (courseId) {
      if (!subjectPerformance[courseId]) {
        subjectPerformance[courseId] = { obtained: 0, total: 0 };
      }
      subjectPerformance[courseId].obtained += submission.marks_obtained || 0;
      subjectPerformance[courseId].total += submission.assessment?.total_marks || 0;
    }
  }

  const weakSubjects: string[] = [];
  const strongSubjects: string[] = [];
  
  for (const [courseId, perf] of Object.entries(subjectPerformance)) {
    const percentage = perf.total > 0 ? (perf.obtained / perf.total) * 100 : 0;
    if (percentage < 50) weakSubjects.push(courseId);
    else if (percentage >= 75) strongSubjects.push(courseId);
  }

  // Calculate assignment completion
  const { data: totalAssessments } = await supabase
    .from("assessments")
    .select("id")
    .eq("status", "published")
    .lte("due_date", new Date().toISOString());

  const completionRate = totalAssessments?.length 
    ? (submissions?.length || 0) / totalAssessments.length 
    : 1;

  // Calculate late submission rate
  const lateSubmissions = submissions?.filter((s: any) => s.is_late).length || 0;
  const submissionTimeliness = submissions?.length 
    ? 1 - (lateSubmissions / submissions.length) 
    : 1;

  return {
    student_id: studentId,
    attendance: {
      overall_attendance_rate: totalAttendance > 0 ? presentCount / totalAttendance : 1,
      recent_attendance_rate: recentRecords.length > 0 ? recentPresent / recentRecords.length : 1,
      consecutive_absences: consecutiveAbsences,
      attendance_trend: attendanceTrend,
      subjects_below_threshold: [],
    },
    academic: {
      current_gpa_equivalent: Math.round(gpaEquivalent * 100) / 100,
      performance_momentum: secondHalfRate - firstHalfRate,
      weak_subjects: weakSubjects,
      strong_subjects: strongSubjects,
      assignment_completion_rate: Math.round(completionRate * 100) / 100,
    },
    engagement: {
      login_frequency: 0.8, // Placeholder - would need login tracking
      assignment_submission_timeliness: Math.round(submissionTimeliness * 100) / 100,
      class_participation_score: 0.7, // Placeholder
    },
    calculated_at: new Date().toISOString(),
  };
}

async function calculateSubjectDifficulty(supabase: any) {
  const { data: courses } = await supabase.from("courses").select("id, name, code");
  
  const difficulties = [];
  
  for (const course of courses || []) {
    const { data: submissions } = await supabase
      .from("assessment_submissions")
      .select("marks_obtained, assessment:assessments!inner(total_marks, course_id)")
      .eq("assessment.course_id", course.id);

    if (!submissions?.length) continue;

    const percentages = submissions.map((s: any) => 
      s.assessment?.total_marks > 0 ? (s.marks_obtained / s.assessment.total_marks) * 100 : 0
    );

    const mean = percentages.reduce((a: number, b: number) => a + b, 0) / percentages.length;
    const variance = percentages.reduce((sum: number, p: number) => sum + Math.pow(p - mean, 2), 0) / percentages.length;
    const stdDev = Math.sqrt(variance);
    const failureRate = percentages.filter((p: number) => p < 40).length / percentages.length;
    const topPerformerCeiling = Math.max(...percentages);

    // Difficulty score: higher failure rate + lower average = harder subject
    const difficultyScore = (failureRate * 40) + ((100 - mean) * 0.4) + (stdDev * 0.2);

    const difficultyRecord = {
      course_id: course.id,
      difficulty_score: Math.round(difficultyScore * 100) / 100,
      class_average: Math.round(mean * 100) / 100,
      class_std_deviation: Math.round(stdDev * 100) / 100,
      failure_rate: Math.round(failureRate * 100) / 100,
      top_performer_ceiling: Math.round(topPerformerCeiling * 100) / 100,
      sample_size: submissions.length,
      academic_year: new Date().getFullYear().toString(),
      calculated_at: new Date().toISOString(),
    };

    await supabase.from("ai_subject_difficulty").upsert(difficultyRecord, {
      onConflict: "course_id,academic_year",
    });

    difficulties.push(difficultyRecord);
  }

  return difficulties;
}

async function calculateFacultyGradingProfiles(supabase: any) {
  const { data: faculty } = await supabase.from("faculty").select("id, first_name, last_name");
  
  const profiles = [];
  
  for (const member of faculty || []) {
    const { data: submissions } = await supabase
      .from("assessment_submissions")
      .select("marks_obtained, graded_by, assessment:assessments!inner(total_marks, faculty_id)")
      .eq("assessment.faculty_id", member.id)
      .not("marks_obtained", "is", null);

    if (!submissions?.length || submissions.length < 5) continue;

    const percentages = submissions.map((s: any) =>
      s.assessment?.total_marks > 0 ? (s.marks_obtained / s.assessment.total_marks) * 100 : 0
    );

    const mean = percentages.reduce((a: number, b: number) => a + b, 0) / percentages.length;
    const median = percentages.sort((a: number, b: number) => a - b)[Math.floor(percentages.length / 2)];
    const variance = percentages.reduce((sum: number, p: number) => sum + Math.pow(p - mean, 2), 0) / percentages.length;
    const stdDev = Math.sqrt(variance);

    // Strictness: lower average = stricter grading (normalized 0-1, 1 being strictest)
    const strictnessIndex = (100 - mean) / 100;

    // Consistency: lower std dev = more consistent (normalized 0-1, 1 being most consistent)
    const gradingConsistency = 1 - Math.min(stdDev / 30, 1);

    const profileRecord = {
      faculty_id: member.id,
      avg_marks_given: Math.round(mean * 100) / 100,
      median_marks_given: Math.round(median * 100) / 100,
      grading_std_deviation: Math.round(stdDev * 100) / 100,
      strictness_index: Math.round(strictnessIndex * 100) / 100,
      grading_consistency: Math.round(gradingConsistency * 100) / 100,
      sample_size: submissions.length,
      academic_year: new Date().getFullYear().toString(),
      calculated_at: new Date().toISOString(),
    };

    await supabase.from("ai_faculty_grading_profile").upsert(profileRecord, {
      onConflict: "faculty_id,academic_year",
    });

    profiles.push(profileRecord);
  }

  return profiles;
}
