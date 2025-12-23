-- Geo-fence zones for attendance
CREATE TABLE geo_fence_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    zone_type VARCHAR(50) NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius_meters INTEGER NOT NULL DEFAULT 50,
    building VARCHAR(100),
    room_number VARCHAR(20),
    capacity INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course assignments
CREATE TABLE course_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL,
    academic_year VARCHAR(10) NOT NULL,
    role VARCHAR(20) DEFAULT 'primary',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(course_id, faculty_id, batch_id, academic_year)
);

-- Timetable slots
CREATE TABLE timetable_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_assignment_id UUID REFERENCES course_assignments(id) ON DELETE CASCADE,
    zone_id UUID REFERENCES geo_fence_zones(id),
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    slot_type VARCHAR(20) DEFAULT 'lecture',
    is_recurring BOOLEAN DEFAULT true,
    effective_from DATE NOT NULL,
    effective_until DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance sessions
CREATE TABLE attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timetable_slot_id UUID REFERENCES timetable_slots(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
    zone_id UUID REFERENCES geo_fence_zones(id),
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled',
    auto_attendance_enabled BOOLEAN DEFAULT true,
    late_threshold_minutes INTEGER DEFAULT 15,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance records
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL,
    check_in_time TIMESTAMPTZ,
    check_in_latitude DECIMAL(10, 8),
    check_in_longitude DECIMAL(11, 8),
    check_in_method VARCHAR(20) DEFAULT 'geo_fence',
    device_id VARCHAR(255),
    marked_by UUID REFERENCES faculty(id),
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL,
    priority VARCHAR(20) DEFAULT 'normal',
    reference_type VARCHAR(50),
    reference_id UUID,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessments
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assessment_type VARCHAR(30) NOT NULL,
    total_marks DECIMAL(6, 2) NOT NULL,
    weightage_percentage DECIMAL(5, 2),
    due_date TIMESTAMPTZ NOT NULL,
    available_from TIMESTAMPTZ DEFAULT NOW(),
    late_submission_allowed BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment submissions
CREATE TABLE assessment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    submission_content TEXT,
    submitted_files JSONB,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    is_late BOOLEAN DEFAULT false,
    status VARCHAR(20) DEFAULT 'submitted',
    marks_obtained DECIMAL(6, 2),
    feedback TEXT,
    graded_by UUID REFERENCES faculty(id),
    graded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(assessment_id, student_id)
);

-- Enable RLS
ALTER TABLE geo_fence_zones ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE timetable_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_submissions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view geo zones" ON geo_fence_zones FOR SELECT USING (true);
CREATE POLICY "Admins can manage geo zones" ON geo_fence_zones FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view course assignments" ON course_assignments FOR SELECT USING (true);
CREATE POLICY "Admins can manage assignments" ON course_assignments FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view timetable" ON timetable_slots FOR SELECT USING (true);
CREATE POLICY "Faculty and admins can manage timetable" ON timetable_slots FOR ALL 
    USING (public.has_role(auth.uid(), 'faculty') OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view attendance sessions" ON attendance_sessions FOR SELECT USING (true);
CREATE POLICY "Faculty can manage sessions" ON attendance_sessions FOR ALL USING (public.has_role(auth.uid(), 'faculty'));

CREATE POLICY "Students view own attendance" ON attendance_records FOR SELECT 
    USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));
CREATE POLICY "Faculty view all attendance" ON attendance_records FOR SELECT USING (public.has_role(auth.uid(), 'faculty'));
CREATE POLICY "Faculty can manage attendance" ON attendance_records FOR ALL USING (public.has_role(auth.uid(), 'faculty'));

CREATE POLICY "Users view own notifications" ON notifications FOR SELECT USING (recipient_id = auth.uid());
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (recipient_id = auth.uid());

CREATE POLICY "Anyone can view published assessments" ON assessments FOR SELECT USING (status = 'published' OR public.has_role(auth.uid(), 'faculty'));
CREATE POLICY "Faculty can manage assessments" ON assessments FOR ALL USING (public.has_role(auth.uid(), 'faculty'));

CREATE POLICY "Students view own submissions" ON assessment_submissions FOR SELECT 
    USING (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));
CREATE POLICY "Students can submit" ON assessment_submissions FOR INSERT 
    WITH CHECK (student_id IN (SELECT id FROM students WHERE user_id = auth.uid()));
CREATE POLICY "Faculty view all submissions" ON assessment_submissions FOR SELECT USING (public.has_role(auth.uid(), 'faculty'));
CREATE POLICY "Faculty can grade" ON assessment_submissions FOR UPDATE USING (public.has_role(auth.uid(), 'faculty'));