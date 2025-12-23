import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface RiskFactors {
  attendance_factor: number;
  academic_factor: number;
  engagement_factor: number;
  contributing_factors: string[];
}

interface RiskScore {
  student_id: string;
  risk_score: number;
  risk_category: "low" | "moderate" | "high" | "critical";
  factors: RiskFactors;
  explanation: string;
  confidence: number;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { action, student_id, batch_id, use_ai } = await req.json();
    console.log(`AI Risk Assessment: action=${action}, student_id=${student_id}, use_ai=${use_ai}`);

    if (action === "assess_student_risk") {
      if (!student_id) {
        throw new Error("student_id is required");
      }

      // Get cached features or calculate new ones
      const { data: cachedFeatures } = await supabase
        .from("ai_feature_cache")
        .select("features")
        .eq("entity_id", student_id)
        .eq("entity_type", "student")
        .eq("is_stale", false)
        .single();

      let features = cachedFeatures?.features;
      
      if (!features) {
        // Calculate features if not cached
        const featureResponse = await fetch(`${supabaseUrl}/functions/v1/ai-feature-engineering`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${supabaseServiceKey}`,
          },
          body: JSON.stringify({ action: "calculate_student_features", student_id }),
        });
        const featureData = await featureResponse.json();
        features = featureData.features;
      }

      // Calculate risk using rule-based engine
      let riskScore = calculateRuleBasedRisk(features);

      // Optionally enhance with AI explanation
      if (use_ai && lovableApiKey) {
        riskScore = await enhanceWithAI(riskScore, features, lovableApiKey);
      }

      // Store risk score
      await supabase.from("ai_risk_scores").upsert({
        student_id: student_id,
        risk_score: riskScore.risk_score,
        risk_category: riskScore.risk_category,
        attendance_factor: riskScore.factors.attendance_factor,
        academic_factor: riskScore.factors.academic_factor,
        engagement_factor: riskScore.factors.engagement_factor,
        contributing_factors: riskScore.factors.contributing_factors,
        explanation: riskScore.explanation,
        confidence: riskScore.confidence,
        model_version: "v1.0-hybrid",
        calculated_at: new Date().toISOString(),
      });

      // Log to audit trail
      await supabase.from("ai_audit_log").insert({
        action_type: "risk_assessment",
        entity_type: "student",
        entity_id: student_id,
        input_data: features,
        output_data: riskScore,
        confidence: riskScore.confidence,
        factors_used: riskScore.factors,
        explanation: riskScore.explanation,
        model_version: use_ai ? "v1.0-hybrid-ai" : "v1.0-rule-based",
      });

      return new Response(JSON.stringify({ success: true, risk: riskScore }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "assess_batch_risk") {
      if (!batch_id) {
        throw new Error("batch_id is required");
      }

      // Get all students in the batch
      const { data: students } = await supabase
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

      const results = [];
      for (const student of students || []) {
        try {
          const response = await fetch(`${supabaseUrl}/functions/v1/ai-risk-assessment`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${supabaseServiceKey}`,
            },
            body: JSON.stringify({ action: "assess_student_risk", student_id: student.id, use_ai }),
          });
          const data = await response.json();
          results.push({ student_id: student.id, ...data });
        } catch (e) {
          console.error(`Failed to assess risk for student ${student.id}:`, e);
          results.push({ student_id: student.id, error: e instanceof Error ? e.message : "Unknown error" });
        }
      }

      return new Response(JSON.stringify({ success: true, count: results.length, results }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    throw new Error(`Unknown action: ${action}`);

  } catch (error) {
    console.error("AI Risk Assessment Error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

function calculateRuleBasedRisk(features: any): RiskScore {
  const weights = {
    attendance: 0.35,
    academic: 0.40,
    engagement: 0.25,
  };

  const contributingFactors: string[] = [];

  // Attendance factor (0-1, higher = more risk)
  let attendanceFactor = 0;
  const attendanceRate = features.attendance?.overall_attendance_rate || 1;
  
  if (attendanceRate < 0.75) {
    attendanceFactor = 1 - attendanceRate;
    contributingFactors.push(`Low attendance rate: ${Math.round(attendanceRate * 100)}%`);
  }
  
  if (features.attendance?.consecutive_absences > 3) {
    attendanceFactor += 0.2;
    contributingFactors.push(`${features.attendance.consecutive_absences} consecutive absences`);
  }
  
  if (features.attendance?.attendance_trend === "declining") {
    attendanceFactor += 0.15;
    contributingFactors.push("Declining attendance trend");
  }
  
  attendanceFactor = Math.min(attendanceFactor, 1);

  // Academic factor (0-1, higher = more risk)
  let academicFactor = 0;
  const gpa = features.academic?.current_gpa_equivalent || 10;
  
  if (gpa < 5) {
    academicFactor = (5 - gpa) / 5;
    contributingFactors.push(`Low GPA equivalent: ${gpa.toFixed(1)}`);
  }
  
  const weakSubjectsCount = features.academic?.weak_subjects?.length || 0;
  if (weakSubjectsCount > 0) {
    academicFactor += weakSubjectsCount * 0.1;
    contributingFactors.push(`${weakSubjectsCount} weak subject(s)`);
  }
  
  const completionRate = features.academic?.assignment_completion_rate || 1;
  if (completionRate < 0.7) {
    academicFactor += (0.7 - completionRate);
    contributingFactors.push(`Low assignment completion: ${Math.round(completionRate * 100)}%`);
  }
  
  academicFactor = Math.min(academicFactor, 1);

  // Engagement factor (0-1, higher = more risk)
  let engagementFactor = 0;
  const timeliness = features.engagement?.assignment_submission_timeliness || 1;
  
  if (timeliness < 0.8) {
    engagementFactor = 1 - timeliness;
    contributingFactors.push(`Late submissions: ${Math.round((1 - timeliness) * 100)}%`);
  }
  
  engagementFactor = Math.min(engagementFactor, 1);

  // Calculate weighted risk score
  const riskScore = (
    attendanceFactor * weights.attendance +
    academicFactor * weights.academic +
    engagementFactor * weights.engagement
  );

  // Determine risk category
  let riskCategory: "low" | "moderate" | "high" | "critical";
  if (riskScore < 0.25) riskCategory = "low";
  else if (riskScore < 0.50) riskCategory = "moderate";
  else if (riskScore < 0.75) riskCategory = "high";
  else riskCategory = "critical";

  // Calculate confidence based on data completeness
  let confidence = 0.9;
  if (!features.attendance?.overall_attendance_rate) confidence -= 0.2;
  if (!features.academic?.current_gpa_equivalent) confidence -= 0.2;
  if (contributingFactors.length === 0) confidence -= 0.1;

  // Generate explanation
  const explanation = generateExplanation(riskCategory, contributingFactors, riskScore);

  return {
    student_id: features.student_id,
    risk_score: Math.round(riskScore * 100) / 100,
    risk_category: riskCategory,
    factors: {
      attendance_factor: Math.round(attendanceFactor * 100) / 100,
      academic_factor: Math.round(academicFactor * 100) / 100,
      engagement_factor: Math.round(engagementFactor * 100) / 100,
      contributing_factors: contributingFactors,
    },
    explanation,
    confidence: Math.max(confidence, 0.5),
  };
}

function generateExplanation(
  category: string,
  factors: string[],
  score: number
): string {
  if (factors.length === 0) {
    return `Student shows ${category} risk level with a score of ${Math.round(score * 100)}%. No significant risk factors identified.`;
  }

  const primaryFactor = factors[0];
  const otherFactors = factors.slice(1);

  let explanation = `Student is at ${category} risk (score: ${Math.round(score * 100)}%). `;
  explanation += `Primary concern: ${primaryFactor}. `;
  
  if (otherFactors.length > 0) {
    explanation += `Additional factors: ${otherFactors.join("; ")}.`;
  }

  return explanation;
}

async function enhanceWithAI(
  riskScore: RiskScore,
  features: any,
  apiKey: string
): Promise<RiskScore> {
  try {
    const prompt = `Analyze this student's academic profile and provide a brief, actionable insight:

Risk Score: ${riskScore.risk_score} (${riskScore.risk_category})
Attendance Rate: ${Math.round((features.attendance?.overall_attendance_rate || 0) * 100)}%
GPA Equivalent: ${features.academic?.current_gpa_equivalent?.toFixed(1) || 'N/A'}
Assignment Completion: ${Math.round((features.academic?.assignment_completion_rate || 0) * 100)}%
Risk Factors: ${riskScore.factors.contributing_factors.join(", ") || "None identified"}

Provide a 2-3 sentence explanation of the risk assessment and one specific recommendation. Be concise and actionable.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: "You are an educational AI assistant helping identify at-risk students. Be empathetic, factual, and solution-oriented." },
          { role: "user", content: prompt },
        ],
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      console.error("AI enhancement failed:", await response.text());
      return riskScore;
    }

    const data = await response.json();
    const aiExplanation = data.choices?.[0]?.message?.content;

    if (aiExplanation) {
      riskScore.explanation = aiExplanation;
      riskScore.confidence = Math.min(riskScore.confidence + 0.05, 0.98);
    }

    return riskScore;
  } catch (error) {
    console.error("AI enhancement error:", error);
    return riskScore;
  }
}
