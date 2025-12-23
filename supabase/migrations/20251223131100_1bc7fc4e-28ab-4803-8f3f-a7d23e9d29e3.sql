-- =============================================
-- AI INTELLIGENCE LAYER - DATABASE SCHEMA
-- =============================================

-- AI Insights Table (personalized insights for all users)
CREATE TABLE public.ai_insights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_type VARCHAR(20) NOT NULL CHECK (user_type IN ('student', 'faculty', 'admin')),
  insight_type VARCHAR(50) NOT NULL,
  category VARCHAR(50),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'medium', 'high', 'critical')),
  confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  is_read BOOLEAN DEFAULT false,
  is_actionable BOOLEAN DEFAULT false,
  action_url VARCHAR(255),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Risk Scores Table (student risk assessment)
CREATE TABLE public.ai_risk_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  risk_score NUMERIC(5,2) NOT NULL CHECK (risk_score >= 0 AND risk_score <= 100),
  risk_category VARCHAR(20) NOT NULL CHECK (risk_category IN ('low', 'medium', 'high', 'critical')),
  contributing_factors JSONB DEFAULT '[]',
  attendance_factor NUMERIC(5,2),
  academic_factor NUMERIC(5,2),
  engagement_factor NUMERIC(5,2),
  confidence NUMERIC(3,2) CHECK (confidence >= 0 AND confidence <= 1),
  model_version VARCHAR(50) DEFAULT 'v1.0',
  explanation TEXT,
  calculated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(student_id, calculated_at)
);

-- AI Recommendations Table (personalized action items)
CREATE TABLE public.ai_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  recommendation_type VARCHAR(50) NOT NULL CHECK (recommendation_type IN ('study_focus', 'improvement_plan', 'resource', 'attendance', 'submission')),
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  action_items JSONB DEFAULT '[]',
  priority INTEGER DEFAULT 0,
  estimated_impact VARCHAR(100),
  confidence NUMERIC(3,2),
  is_completed BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Alerts Table (system-wide alerts for all user types)
CREATE TABLE public.ai_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient_id UUID NOT NULL,
  recipient_type VARCHAR(20) NOT NULL CHECK (recipient_type IN ('student', 'faculty', 'admin')),
  alert_type VARCHAR(50) NOT NULL,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('info', 'warning', 'critical')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  data JSONB DEFAULT '{}',
  related_entity_type VARCHAR(50),
  related_entity_id UUID,
  is_acknowledged BOOLEAN DEFAULT false,
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by UUID,
  requires_action BOOLEAN DEFAULT false,
  action_taken TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Feature Cache Table (pre-computed features for ML)
CREATE TABLE public.ai_feature_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_id UUID NOT NULL,
  entity_type VARCHAR(20) NOT NULL CHECK (entity_type IN ('student', 'faculty', 'course', 'section', 'batch')),
  feature_set VARCHAR(50) NOT NULL,
  features JSONB NOT NULL,
  calculated_at TIMESTAMPTZ DEFAULT now(),
  expires_at TIMESTAMPTZ,
  is_stale BOOLEAN DEFAULT false,
  UNIQUE(entity_id, entity_type, feature_set)
);

-- AI Audit Log Table (complete audit trail for compliance)
CREATE TABLE public.ai_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_type VARCHAR(50) NOT NULL,
  entity_type VARCHAR(50),
  entity_id UUID,
  user_id UUID,
  input_data JSONB,
  output_data JSONB,
  model_version VARCHAR(50),
  confidence NUMERIC(3,2),
  explanation TEXT,
  factors_used JSONB,
  processing_time_ms INTEGER,
  was_overridden BOOLEAN DEFAULT false,
  override_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- AI Subject Difficulty Index (fair assessment normalization)
CREATE TABLE public.ai_subject_difficulty (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  batch_id UUID REFERENCES public.batches(id),
  semester INTEGER,
  academic_year VARCHAR(20),
  difficulty_score NUMERIC(3,2) CHECK (difficulty_score >= 0 AND difficulty_score <= 1),
  class_average NUMERIC(5,2),
  class_std_deviation NUMERIC(5,2),
  failure_rate NUMERIC(5,2),
  top_performer_ceiling NUMERIC(5,2),
  sample_size INTEGER,
  calculated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(course_id, batch_id, semester, academic_year)
);

-- AI Faculty Grading Profile (grading pattern analysis)
CREATE TABLE public.ai_faculty_grading_profile (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  faculty_id UUID NOT NULL REFERENCES public.faculty(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id),
  academic_year VARCHAR(20),
  avg_marks_given NUMERIC(5,2),
  median_marks_given NUMERIC(5,2),
  grading_std_deviation NUMERIC(5,2),
  strictness_index NUMERIC(3,2) CHECK (strictness_index >= -1 AND strictness_index <= 1),
  grading_consistency NUMERIC(3,2),
  deviation_from_dept_avg NUMERIC(5,2),
  sample_size INTEGER,
  calculated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(faculty_id, course_id, academic_year)
);

-- Create indexes for performance
CREATE INDEX idx_ai_insights_user ON public.ai_insights(user_id, user_type);
CREATE INDEX idx_ai_insights_unread ON public.ai_insights(user_id, is_read) WHERE is_read = false;
CREATE INDEX idx_ai_insights_created ON public.ai_insights(created_at DESC);

CREATE INDEX idx_ai_risk_scores_student ON public.ai_risk_scores(student_id);
CREATE INDEX idx_ai_risk_scores_category ON public.ai_risk_scores(risk_category);
CREATE INDEX idx_ai_risk_scores_latest ON public.ai_risk_scores(student_id, calculated_at DESC);

CREATE INDEX idx_ai_recommendations_student ON public.ai_recommendations(student_id);
CREATE INDEX idx_ai_recommendations_incomplete ON public.ai_recommendations(student_id, is_completed) WHERE is_completed = false;

CREATE INDEX idx_ai_alerts_recipient ON public.ai_alerts(recipient_id, recipient_type);
CREATE INDEX idx_ai_alerts_unack ON public.ai_alerts(recipient_id, is_acknowledged) WHERE is_acknowledged = false;
CREATE INDEX idx_ai_alerts_severity ON public.ai_alerts(severity, created_at DESC);

CREATE INDEX idx_ai_feature_cache_entity ON public.ai_feature_cache(entity_id, entity_type);
CREATE INDEX idx_ai_feature_cache_stale ON public.ai_feature_cache(is_stale) WHERE is_stale = true;

CREATE INDEX idx_ai_audit_log_entity ON public.ai_audit_log(entity_type, entity_id);
CREATE INDEX idx_ai_audit_log_user ON public.ai_audit_log(user_id);
CREATE INDEX idx_ai_audit_log_created ON public.ai_audit_log(created_at DESC);

-- Enable RLS on all tables
ALTER TABLE public.ai_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_risk_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_feature_cache ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_subject_difficulty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_faculty_grading_profile ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS POLICIES
-- =============================================

-- AI Insights Policies
CREATE POLICY "Students view own insights"
ON public.ai_insights FOR SELECT
USING (
  user_type = 'student' AND 
  user_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);

CREATE POLICY "Faculty view own insights"
ON public.ai_insights FOR SELECT
USING (
  user_type = 'faculty' AND 
  user_id IN (SELECT id FROM public.faculty WHERE user_id = auth.uid())
);

CREATE POLICY "Admins view all insights"
ON public.ai_insights FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert insights"
ON public.ai_insights FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can mark own insights as read"
ON public.ai_insights FOR UPDATE
USING (
  (user_type = 'student' AND user_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())) OR
  (user_type = 'faculty' AND user_id IN (SELECT id FROM public.faculty WHERE user_id = auth.uid())) OR
  has_role(auth.uid(), 'admin')
);

-- AI Risk Scores Policies
CREATE POLICY "Students view own risk scores"
ON public.ai_risk_scores FOR SELECT
USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Faculty view assigned students risk scores"
ON public.ai_risk_scores FOR SELECT
USING (has_role(auth.uid(), 'faculty'));

CREATE POLICY "Admins view all risk scores"
ON public.ai_risk_scores FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can manage risk scores"
ON public.ai_risk_scores FOR ALL
USING (true)
WITH CHECK (true);

-- AI Recommendations Policies
CREATE POLICY "Students view own recommendations"
ON public.ai_recommendations FOR SELECT
USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Students can complete own recommendations"
ON public.ai_recommendations FOR UPDATE
USING (student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid()));

CREATE POLICY "Faculty view student recommendations"
ON public.ai_recommendations FOR SELECT
USING (has_role(auth.uid(), 'faculty'));

CREATE POLICY "Admins manage all recommendations"
ON public.ai_recommendations FOR ALL
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert recommendations"
ON public.ai_recommendations FOR INSERT
WITH CHECK (true);

-- AI Alerts Policies
CREATE POLICY "Students view own alerts"
ON public.ai_alerts FOR SELECT
USING (
  recipient_type = 'student' AND 
  recipient_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
);

CREATE POLICY "Faculty view own alerts"
ON public.ai_alerts FOR SELECT
USING (
  recipient_type = 'faculty' AND 
  recipient_id IN (SELECT id FROM public.faculty WHERE user_id = auth.uid())
);

CREATE POLICY "Admins view all alerts"
ON public.ai_alerts FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can acknowledge own alerts"
ON public.ai_alerts FOR UPDATE
USING (
  (recipient_type = 'student' AND recipient_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())) OR
  (recipient_type = 'faculty' AND recipient_id IN (SELECT id FROM public.faculty WHERE user_id = auth.uid())) OR
  has_role(auth.uid(), 'admin')
);

CREATE POLICY "System can manage alerts"
ON public.ai_alerts FOR INSERT
WITH CHECK (true);

-- AI Feature Cache Policies (internal use only)
CREATE POLICY "Admins can view feature cache"
ON public.ai_feature_cache FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can manage feature cache"
ON public.ai_feature_cache FOR ALL
USING (true)
WITH CHECK (true);

-- AI Audit Log Policies (read-only for admins)
CREATE POLICY "Admins can view audit log"
ON public.ai_audit_log FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can insert audit log"
ON public.ai_audit_log FOR INSERT
WITH CHECK (true);

-- AI Subject Difficulty Policies
CREATE POLICY "Anyone can view subject difficulty"
ON public.ai_subject_difficulty FOR SELECT
USING (true);

CREATE POLICY "System can manage subject difficulty"
ON public.ai_subject_difficulty FOR ALL
USING (true)
WITH CHECK (true);

-- AI Faculty Grading Profile Policies
CREATE POLICY "Faculty view own grading profile"
ON public.ai_faculty_grading_profile FOR SELECT
USING (faculty_id IN (SELECT id FROM public.faculty WHERE user_id = auth.uid()));

CREATE POLICY "Admins view all grading profiles"
ON public.ai_faculty_grading_profile FOR SELECT
USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "System can manage grading profiles"
ON public.ai_faculty_grading_profile FOR ALL
USING (true)
WITH CHECK (true);