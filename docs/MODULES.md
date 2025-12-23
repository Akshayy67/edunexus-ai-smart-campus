# EduNexus AI - Complete Module Architecture

## Module Overview

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                              EDUNEXUS AI ERP MODULES                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  ┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐     │
│  │  Student Info     │◄───►│    Attendance     │◄───►│    Timetable      │     │
│  │  System (SIS)     │     │    Automation     │     │  & Notifications  │     │
│  └────────┬──────────┘     └────────┬──────────┘     └────────┬──────────┘     │
│           │                         │                         │                 │
│           ▼                         ▼                         ▼                 │
│  ┌───────────────────┐     ┌───────────────────┐     ┌───────────────────┐     │
│  │   Assessments     │◄───►│    Projects &     │◄───►│  Marks, Exams &   │     │
│  │  & Assignments    │     │     Grouping      │     │  Normalization    │     │
│  └────────┬──────────┘     └────────┬──────────┘     └────────┬──────────┘     │
│           │                         │                         │                 │
│           └─────────────────────────┼─────────────────────────┘                 │
│                                     │                                           │
│                                     ▼                                           │
│           ┌───────────────────────────────────────────────────┐                 │
│           │              Performance Analytics                │                 │
│           │          (AI-Powered Insights Engine)             │                 │
│           └───────────────────────────────────────────────────┘                 │
│                                     │                                           │
│                                     ▼                                           │
│           ┌───────────────────────────────────────────────────┐                 │
│           │             Admin Control Panel                    │                 │
│           │      (System Configuration & Management)           │                 │
│           └───────────────────────────────────────────────────┘                 │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

---

## Module 1: Student Information System (SIS)

### 1.1 Responsibilities
- Central repository for all student data
- Academic history and enrollment tracking
- Document management (certificates, ID cards, transcripts)
- Parent/Guardian information management
- Student lifecycle management (admission → graduation)

### 1.2 Key Features
| Feature | Description |
|---------|-------------|
| Student Profile | Complete personal, academic, and contact information |
| Enrollment Management | Course registration, semester enrollment, batch assignment |
| Document Vault | Secure storage for academic documents |
| Academic History | Transcript generation, previous institution records |
| Parent Portal | Guardian access with limited view permissions |
| Batch Management | Cohort-based student grouping |

### 1.3 Database Schema

```sql
-- Core student profile table
CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    roll_number VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    date_of_birth DATE,
    gender VARCHAR(20),
    blood_group VARCHAR(5),
    address_line1 VARCHAR(255),
    address_line2 VARCHAR(255),
    city VARCHAR(100),
    state VARCHAR(100),
    country VARCHAR(100) DEFAULT 'India',
    postal_code VARCHAR(20),
    admission_date DATE NOT NULL DEFAULT CURRENT_DATE,
    graduation_date DATE,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'graduated', 'suspended', 'withdrawn')),
    profile_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Departments table
CREATE TABLE departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    head_faculty_id UUID,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Programs/Degrees table
CREATE TABLE programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    degree_type VARCHAR(50) NOT NULL, -- B.Tech, M.Tech, MBA, etc.
    duration_years INTEGER DEFAULT 4,
    total_credits INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Batches/Cohorts table
CREATE TABLE batches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    name VARCHAR(50) NOT NULL,
    start_year INTEGER NOT NULL,
    end_year INTEGER NOT NULL,
    current_semester INTEGER DEFAULT 1,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student enrollment in batches
CREATE TABLE student_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,
    current_semester INTEGER DEFAULT 1,
    status VARCHAR(20) DEFAULT 'enrolled',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, batch_id)
);

-- Parent/Guardian information
CREATE TABLE guardians (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    relationship VARCHAR(50) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(20) NOT NULL,
    occupation VARCHAR(100),
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Student documents
CREATE TABLE student_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL,
    document_name VARCHAR(255) NOT NULL,
    file_url TEXT NOT NULL,
    file_size INTEGER,
    uploaded_at TIMESTAMPTZ DEFAULT NOW(),
    verified BOOLEAN DEFAULT false,
    verified_by UUID,
    verified_at TIMESTAMPTZ
);
```

### 1.4 Relationships
```
students ──┬── student_enrollments ──── batches ──── programs ──── departments
           ├── guardians
           ├── student_documents
           ├── attendance_records (Module 2)
           ├── assessment_submissions (Module 4)
           ├── project_members (Module 5)
           └── exam_results (Module 6)
```

### 1.5 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/students` | List all students (paginated, filtered) |
| GET | `/api/students/:id` | Get student details |
| POST | `/api/students` | Create new student |
| PUT | `/api/students/:id` | Update student info |
| DELETE | `/api/students/:id` | Soft delete student |
| GET | `/api/students/:id/enrollments` | Get student enrollments |
| POST | `/api/students/:id/documents` | Upload document |
| GET | `/api/batches` | List all batches |
| GET | `/api/batches/:id/students` | Get students in batch |

### 1.6 Edge Cases & Failure Handling

| Scenario | Handling Strategy |
|----------|-------------------|
| Duplicate roll number | Return 409 Conflict with existing student info |
| Missing required fields | Return 400 with field-level validation errors |
| Student transfer between batches | Create new enrollment, mark old as 'transferred' |
| Document upload failure | Retry with exponential backoff, notify user |
| Guardian with invalid email | Allow save, flag for admin review |
| Bulk student import | Transaction-based import, rollback on any failure |
| Student re-enrollment after withdrawal | Check eligibility rules, require admin approval |

---

## Module 2: Attendance Automation (Location-Based)

### 2.1 Responsibilities
- Geo-fence zone configuration and management
- Automatic check-in/check-out based on location
- Manual attendance override for faculty
- Attendance reports and analytics
- Leave management integration

### 2.2 Key Features
| Feature | Description |
|---------|-------------|
| Geo-Fence Zones | Define campus areas with GPS coordinates and radius |
| Auto Check-In | Automatic attendance when student enters zone during class |
| Manual Override | Faculty can mark attendance manually |
| Attendance History | Complete log with timestamps and locations |
| Leave Integration | Connect with leave application system |
| Proxy Detection | Prevent attendance spoofing with device fingerprinting |
| Offline Support | Queue attendance when offline, sync when connected |

### 2.3 Database Schema

```sql
-- Geo-fence zones (classrooms, labs, campus areas)
CREATE TABLE geo_fence_zones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    zone_type VARCHAR(50) NOT NULL, -- 'classroom', 'lab', 'campus', 'library'
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    radius_meters INTEGER NOT NULL DEFAULT 50,
    building VARCHAR(100),
    floor VARCHAR(20),
    room_number VARCHAR(20),
    capacity INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Attendance sessions (linked to timetable)
CREATE TABLE attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timetable_slot_id UUID REFERENCES timetable_slots(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
    zone_id UUID REFERENCES geo_fence_zones(id),
    session_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'ongoing', 'completed', 'cancelled'
    auto_attendance_enabled BOOLEAN DEFAULT true,
    late_threshold_minutes INTEGER DEFAULT 15,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Individual attendance records
CREATE TABLE attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    status VARCHAR(20) NOT NULL, -- 'present', 'absent', 'late', 'excused'
    check_in_time TIMESTAMPTZ,
    check_out_time TIMESTAMPTZ,
    check_in_latitude DECIMAL(10, 8),
    check_in_longitude DECIMAL(11, 8),
    check_in_method VARCHAR(20) DEFAULT 'geo_fence', -- 'geo_fence', 'manual', 'qr_code'
    device_id VARCHAR(255),
    marked_by UUID REFERENCES faculty(id), -- NULL if auto, faculty_id if manual
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);

-- Attendance summary (denormalized for performance)
CREATE TABLE attendance_summary (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL,
    academic_year VARCHAR(10) NOT NULL,
    total_sessions INTEGER DEFAULT 0,
    present_count INTEGER DEFAULT 0,
    absent_count INTEGER DEFAULT 0,
    late_count INTEGER DEFAULT 0,
    excused_count INTEGER DEFAULT 0,
    attendance_percentage DECIMAL(5, 2) DEFAULT 0.00,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, course_id, semester, academic_year)
);

-- Leave applications
CREATE TABLE leave_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    leave_type VARCHAR(50) NOT NULL, -- 'medical', 'personal', 'emergency', 'academic'
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    supporting_document_url TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    reviewed_by UUID REFERENCES faculty(id),
    reviewed_at TIMESTAMPTZ,
    review_remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.4 Relationships
```
geo_fence_zones ──── attendance_sessions ──┬── attendance_records ──── students
                            │              └── timetable_slots
                            └── courses, faculty

students ──── leave_applications ──── faculty (reviewer)

attendance_records ──► attendance_summary (aggregated)
```

### 2.5 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/attendance/check-in` | Geo-fence based check-in |
| GET | `/api/attendance/sessions/:id` | Get session attendance |
| PUT | `/api/attendance/records/:id` | Manual attendance update |
| GET | `/api/attendance/student/:id` | Student attendance history |
| GET | `/api/attendance/course/:id` | Course attendance report |
| GET | `/api/attendance/summary` | Aggregated attendance stats |
| POST | `/api/geo-zones` | Create geo-fence zone |
| GET | `/api/geo-zones/nearby` | Get zones near coordinates |
| POST | `/api/leaves` | Submit leave application |
| PUT | `/api/leaves/:id/review` | Approve/reject leave |

### 2.6 Edge Cases & Failure Handling

| Scenario | Handling Strategy |
|----------|-------------------|
| GPS unavailable | Fall back to WiFi-based location, prompt manual check-in |
| Outside geo-fence | Queue request, notify student, allow manual override |
| Multiple devices detected | Flag for review, allow only registered device |
| Network timeout | Cache locally, sync when online with conflict resolution |
| Duplicate check-in | Ignore duplicate, update check-out time if re-entering |
| Class cancelled mid-session | Mark all as 'excused', notify students |
| GPS spoofing detected | Block check-in, flag student, notify admin |
| Leave overlaps with attendance | Auto-mark as 'excused' for approved leaves |
| Attendance below threshold | Trigger alert to student, faculty, and parent |

---

## Module 3: Timetable & Notifications

### 3.1 Responsibilities
- Master schedule management
- Conflict detection and resolution
- Room and resource allocation
- Real-time notifications for changes
- Calendar synchronization

### 3.2 Key Features
| Feature | Description |
|---------|-------------|
| Schedule Builder | Visual drag-drop timetable creation |
| Conflict Detection | Automatic detection of room/faculty/student conflicts |
| Substitution Management | Handle faculty absences with substitutes |
| Push Notifications | Real-time alerts for schedule changes |
| Calendar Sync | Export to Google Calendar, Outlook |
| Room Booking | Resource allocation and availability tracking |
| Recurring Schedules | Template-based schedule generation |

### 3.3 Database Schema

```sql
-- Courses/Subjects
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES programs(id) ON DELETE CASCADE,
    code VARCHAR(20) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    credits INTEGER NOT NULL,
    lecture_hours INTEGER DEFAULT 0,
    lab_hours INTEGER DEFAULT 0,
    tutorial_hours INTEGER DEFAULT 0,
    semester INTEGER NOT NULL,
    is_elective BOOLEAN DEFAULT false,
    prerequisites JSONB, -- Array of course IDs
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Faculty members
CREATE TABLE faculty (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id VARCHAR(20) UNIQUE NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    department_id UUID REFERENCES departments(id),
    designation VARCHAR(100),
    specialization TEXT[],
    joining_date DATE,
    status VARCHAR(20) DEFAULT 'active',
    profile_image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course-Faculty assignments
CREATE TABLE course_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL,
    academic_year VARCHAR(10) NOT NULL,
    role VARCHAR(20) DEFAULT 'primary', -- 'primary', 'assistant', 'lab'
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
    slot_type VARCHAR(20) DEFAULT 'lecture', -- 'lecture', 'lab', 'tutorial'
    is_recurring BOOLEAN DEFAULT true,
    effective_from DATE NOT NULL,
    effective_until DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Schedule exceptions (cancellations, substitutions)
CREATE TABLE schedule_exceptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timetable_slot_id UUID REFERENCES timetable_slots(id) ON DELETE CASCADE,
    exception_date DATE NOT NULL,
    exception_type VARCHAR(20) NOT NULL, -- 'cancelled', 'substituted', 'rescheduled'
    substitute_faculty_id UUID REFERENCES faculty(id),
    new_zone_id UUID REFERENCES geo_fence_zones(id),
    new_start_time TIME,
    new_end_time TIME,
    reason TEXT,
    created_by UUID REFERENCES faculty(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(timetable_slot_id, exception_date)
);

-- Notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_type VARCHAR(20) NOT NULL, -- 'student', 'faculty', 'batch', 'all'
    recipient_id UUID, -- student_id, faculty_id, or batch_id
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- 'schedule_change', 'assignment', 'announcement', etc.
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    reference_type VARCHAR(50), -- 'timetable_slot', 'assessment', etc.
    reference_id UUID,
    is_read BOOLEAN DEFAULT false,
    read_at TIMESTAMPTZ,
    sent_via JSONB DEFAULT '["in_app"]', -- ['in_app', 'push', 'email', 'sms']
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Notification preferences
CREATE TABLE notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    notification_type VARCHAR(50) NOT NULL,
    in_app BOOLEAN DEFAULT true,
    push BOOLEAN DEFAULT true,
    email BOOLEAN DEFAULT false,
    sms BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, notification_type)
);
```

### 3.4 Relationships
```
courses ──── course_assignments ──┬── faculty
                                  ├── batches
                                  └── timetable_slots ──┬── geo_fence_zones
                                                        └── schedule_exceptions

notifications ──── users (recipients)
notification_preferences ──── users
```

### 3.5 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/timetable/student/:id` | Get student's timetable |
| GET | `/api/timetable/faculty/:id` | Get faculty's schedule |
| GET | `/api/timetable/batch/:id` | Get batch timetable |
| POST | `/api/timetable/slots` | Create timetable slot |
| PUT | `/api/timetable/slots/:id` | Update slot |
| POST | `/api/timetable/exceptions` | Create exception |
| GET | `/api/notifications` | Get user notifications |
| PUT | `/api/notifications/:id/read` | Mark as read |
| PUT | `/api/notifications/preferences` | Update preferences |
| GET | `/api/courses` | List courses |
| GET | `/api/faculty` | List faculty |

### 3.6 Edge Cases & Failure Handling

| Scenario | Handling Strategy |
|----------|-------------------|
| Room conflict detected | Block creation, suggest alternatives |
| Faculty double-booked | Show conflict, require resolution |
| Push notification fails | Retry 3 times, fall back to in-app |
| Timezone discrepancies | Store in UTC, convert on display |
| Bulk schedule import | Validate all before commit, transaction-based |
| Last-minute cancellation | High-priority push to all affected |
| Substitution not confirmed | Show pending status, escalate if <1hr |
| Calendar sync failure | Queue for retry, show sync status |

---

## Module 4: Assessments & Assignments

### 4.1 Responsibilities
- Create and manage various assessment types
- Assignment submission and deadline management
- Plagiarism detection integration
- Grading rubrics and feedback
- Resubmission handling

### 4.2 Key Features
| Feature | Description |
|---------|-------------|
| Multi-Type Assessments | Assignments, quizzes, presentations, practicals |
| Rich Content Support | Text, files, code, multimedia submissions |
| Auto-Grading | MCQ and code assessment automation |
| Rubric Builder | Customizable grading criteria |
| Deadline Extensions | Request and approve extensions |
| Plagiarism Check | Integration with detection services |
| Peer Review | Student-to-student evaluation option |

### 4.3 Database Schema

```sql
-- Assessments (assignments, quizzes, etc.)
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    faculty_id UUID REFERENCES faculty(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    instructions TEXT,
    assessment_type VARCHAR(30) NOT NULL, -- 'assignment', 'quiz', 'project', 'practical', 'presentation'
    total_marks DECIMAL(6, 2) NOT NULL,
    passing_marks DECIMAL(6, 2),
    weightage_percentage DECIMAL(5, 2), -- Contribution to final grade
    due_date TIMESTAMPTZ NOT NULL,
    available_from TIMESTAMPTZ DEFAULT NOW(),
    late_submission_allowed BOOLEAN DEFAULT false,
    late_penalty_per_day DECIMAL(5, 2) DEFAULT 0, -- Percentage deduction
    max_late_days INTEGER DEFAULT 0,
    max_attempts INTEGER DEFAULT 1,
    time_limit_minutes INTEGER, -- For quizzes
    shuffle_questions BOOLEAN DEFAULT false,
    show_answers_after_submission BOOLEAN DEFAULT false,
    attachments JSONB, -- Array of file URLs
    rubric_id UUID REFERENCES grading_rubrics(id),
    status VARCHAR(20) DEFAULT 'draft', -- 'draft', 'published', 'closed', 'graded'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Grading rubrics
CREATE TABLE grading_rubrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES faculty(id),
    is_template BOOLEAN DEFAULT false,
    criteria JSONB NOT NULL,
    /* Structure:
    [
        {
            "name": "Code Quality",
            "weight": 30,
            "levels": [
                {"score": 5, "description": "Excellent - Clean, well-structured code"},
                {"score": 4, "description": "Good - Minor issues"},
                {"score": 3, "description": "Acceptable - Some issues"},
                {"score": 2, "description": "Poor - Major issues"},
                {"score": 1, "description": "Unacceptable"}
            ]
        }
    ]
    */
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assessment submissions
CREATE TABLE assessment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    attempt_number INTEGER DEFAULT 1,
    submission_content TEXT, -- For text-based submissions
    submitted_files JSONB, -- Array of file URLs
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    is_late BOOLEAN DEFAULT false,
    late_days INTEGER DEFAULT 0,
    plagiarism_score DECIMAL(5, 2), -- 0-100
    plagiarism_report_url TEXT,
    status VARCHAR(20) DEFAULT 'submitted', -- 'submitted', 'grading', 'graded', 'returned'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(assessment_id, student_id, attempt_number)
);

-- Submission grades
CREATE TABLE submission_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES assessment_submissions(id) ON DELETE CASCADE,
    graded_by UUID REFERENCES faculty(id),
    marks_obtained DECIMAL(6, 2) NOT NULL,
    late_penalty_applied DECIMAL(6, 2) DEFAULT 0,
    final_marks DECIMAL(6, 2) NOT NULL,
    rubric_scores JSONB, -- Scores per rubric criterion
    feedback TEXT,
    private_notes TEXT, -- Faculty-only notes
    graded_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(submission_id)
);

-- Quiz questions (for quiz-type assessments)
CREATE TABLE quiz_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    question_type VARCHAR(20) NOT NULL, -- 'mcq', 'multiple_select', 'true_false', 'short_answer', 'essay', 'code'
    question_text TEXT NOT NULL,
    question_media JSONB, -- Images, code snippets
    options JSONB, -- For MCQ: [{id, text, is_correct}]
    correct_answer TEXT, -- For non-MCQ
    marks DECIMAL(6, 2) NOT NULL,
    explanation TEXT, -- Shown after submission if enabled
    order_index INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz responses
CREATE TABLE quiz_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES assessment_submissions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
    response TEXT,
    selected_options JSONB, -- For MCQ
    is_correct BOOLEAN,
    marks_awarded DECIMAL(6, 2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(submission_id, question_id)
);

-- Extension requests
CREATE TABLE extension_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID REFERENCES assessments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    requested_date TIMESTAMPTZ NOT NULL,
    reason TEXT NOT NULL,
    supporting_document_url TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
    approved_date TIMESTAMPTZ,
    reviewed_by UUID REFERENCES faculty(id),
    review_remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 4.4 Relationships
```
assessments ──┬── course, batch, faculty
              ├── grading_rubrics
              ├── assessment_submissions ──┬── students
              │                            ├── submission_grades ──── faculty
              │                            └── quiz_responses ──── quiz_questions
              ├── quiz_questions
              └── extension_requests ──── students

assessments → exams (Module 6) via grading integration
```

### 4.5 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/assessments` | List assessments (filtered) |
| GET | `/api/assessments/:id` | Get assessment details |
| POST | `/api/assessments` | Create assessment |
| PUT | `/api/assessments/:id` | Update assessment |
| POST | `/api/assessments/:id/publish` | Publish assessment |
| POST | `/api/submissions` | Submit assignment |
| GET | `/api/submissions/:id` | Get submission details |
| POST | `/api/submissions/:id/grade` | Grade submission |
| GET | `/api/assessments/:id/submissions` | List all submissions |
| POST | `/api/rubrics` | Create rubric |
| POST | `/api/extensions` | Request extension |
| PUT | `/api/extensions/:id/review` | Review extension |

### 4.6 Edge Cases & Failure Handling

| Scenario | Handling Strategy |
|----------|-------------------|
| Submission after deadline | Apply late penalty or reject based on settings |
| File upload fails | Provide retry, save progress, allow resume |
| Plagiarism service unavailable | Queue for later check, proceed with submission |
| Re-submission attempt | Validate attempt count, version previous submission |
| Grading conflict (multiple graders) | Lock submission during grading, merge feedback |
| Quiz time expires mid-submission | Auto-submit with answered questions |
| Large file submission | Chunked upload, progress indicator |
| Extension request after deadline | Auto-reject, notify student |

---

## Module 5: Projects & Grouping

### 5.1 Responsibilities
- Team formation and management
- Project lifecycle tracking
- Milestone and task management
- Mentor/Guide assignment
- Inter-team collaboration

### 5.2 Key Features
| Feature | Description |
|---------|-------------|
| Team Formation | Self-selection or admin-assigned groups |
| Project Proposals | Submission and approval workflow |
| Milestone Tracking | Phase-based progress monitoring |
| Task Board | Kanban-style task management |
| Mentor Assignment | Faculty guide allocation |
| Progress Reports | Periodic review submissions |
| Resource Sharing | Team document repository |

### 5.3 Database Schema

```sql
-- Projects
CREATE TABLE projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    project_type VARCHAR(50) DEFAULT 'group', -- 'individual', 'group'
    min_team_size INTEGER DEFAULT 1,
    max_team_size INTEGER DEFAULT 4,
    start_date DATE,
    end_date DATE,
    proposal_deadline TIMESTAMPTZ,
    total_marks DECIMAL(6, 2),
    status VARCHAR(20) DEFAULT 'open', -- 'open', 'in_progress', 'completed', 'archived'
    created_by UUID REFERENCES faculty(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Project teams
CREATE TABLE project_teams (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    team_name VARCHAR(100) NOT NULL,
    team_code VARCHAR(20) UNIQUE,
    topic VARCHAR(255),
    abstract TEXT,
    proposal_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'approved', 'revision_required', 'rejected'
    proposal_feedback TEXT,
    mentor_id UUID REFERENCES faculty(id),
    repository_url TEXT,
    documentation_url TEXT,
    final_grade DECIMAL(6, 2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Team members
CREATE TABLE project_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES project_teams(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- 'leader', 'member'
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    contribution_score DECIMAL(5, 2), -- Peer evaluation score
    UNIQUE(team_id, student_id)
);

-- Project milestones
CREATE TABLE project_milestones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date DATE NOT NULL,
    weightage DECIMAL(5, 2), -- Percentage of total marks
    order_index INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Milestone submissions
CREATE TABLE milestone_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    milestone_id UUID REFERENCES project_milestones(id) ON DELETE CASCADE,
    team_id UUID REFERENCES project_teams(id) ON DELETE CASCADE,
    submission_content TEXT,
    submitted_files JSONB,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    submitted_by UUID REFERENCES students(id),
    status VARCHAR(20) DEFAULT 'submitted', -- 'submitted', 'reviewed', 'approved'
    marks_obtained DECIMAL(6, 2),
    feedback TEXT,
    reviewed_by UUID REFERENCES faculty(id),
    reviewed_at TIMESTAMPTZ,
    UNIQUE(milestone_id, team_id)
);

-- Project tasks (Kanban-style)
CREATE TABLE project_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES project_teams(id) ON DELETE CASCADE,
    milestone_id UUID REFERENCES project_milestones(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    assigned_to UUID REFERENCES students(id),
    priority VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high', 'urgent'
    status VARCHAR(20) DEFAULT 'todo', -- 'todo', 'in_progress', 'review', 'done'
    due_date DATE,
    estimated_hours DECIMAL(5, 2),
    actual_hours DECIMAL(5, 2),
    order_index INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Peer evaluations
CREATE TABLE peer_evaluations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID REFERENCES project_teams(id) ON DELETE CASCADE,
    evaluator_id UUID REFERENCES students(id) ON DELETE CASCADE,
    evaluatee_id UUID REFERENCES students(id) ON DELETE CASCADE,
    criteria_scores JSONB NOT NULL,
    /* Structure:
    {
        "contribution": 4,
        "collaboration": 5,
        "communication": 4,
        "technical_skills": 4,
        "reliability": 5
    }
    */
    overall_score DECIMAL(3, 1),
    comments TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(team_id, evaluator_id, evaluatee_id)
);
```

### 5.4 Relationships
```
projects ──┬── course, batch
           ├── project_teams ──┬── project_members ──── students
           │                   ├── faculty (mentor)
           │                   ├── milestone_submissions
           │                   ├── project_tasks ──── students (assigned)
           │                   └── peer_evaluations
           └── project_milestones

project_teams.final_grade → exam_results (Module 6)
```

### 5.5 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id/teams` | List teams for project |
| POST | `/api/teams` | Create team |
| POST | `/api/teams/:id/members` | Add team member |
| DELETE | `/api/teams/:id/members/:studentId` | Remove member |
| POST | `/api/teams/:id/proposal` | Submit proposal |
| PUT | `/api/teams/:id/proposal/review` | Review proposal |
| GET | `/api/milestones/:projectId` | List milestones |
| POST | `/api/milestones/:id/submit` | Submit milestone |
| GET | `/api/teams/:id/tasks` | Get team tasks |
| POST | `/api/tasks` | Create task |
| PUT | `/api/tasks/:id` | Update task |
| POST | `/api/teams/:id/peer-evaluation` | Submit peer eval |

### 5.6 Edge Cases & Failure Handling

| Scenario | Handling Strategy |
|----------|-------------------|
| Student already in another team | Reject, show existing team info |
| Team exceeds max size | Block addition, notify |
| Leader leaves team | Promote next member or require new leader selection |
| Proposal rejected | Allow resubmission with feedback |
| Milestone past due | Allow late with notification |
| Task assignment to non-member | Reject with error |
| Peer evaluation bias detected | Flag outliers, weight adjustments |
| Repository URL invalid | Validate format, attempt connection |

---

## Module 6: Marks, Exams & Normalization

### 6.1 Responsibilities
- Exam scheduling and management
- Grade entry and calculation
- Normalization across sections/batches
- Grade appeal handling
- Transcript generation

### 6.2 Key Features
| Feature | Description |
|---------|-------------|
| Exam Scheduling | Date, time, venue management |
| Grade Entry | Batch/individual mark entry |
| Auto-Calculation | Weighted grade computation |
| Normalization | Statistical grade adjustment |
| Grade Moderation | Review and adjustment workflow |
| Transcripts | Official grade document generation |
| Grade Appeals | Student grievance handling |

### 6.3 Database Schema

```sql
-- Examinations
CREATE TABLE examinations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    exam_name VARCHAR(100) NOT NULL, -- 'Mid-Term 1', 'Final', 'Quiz 3'
    exam_type VARCHAR(30) NOT NULL, -- 'midterm', 'final', 'quiz', 'practical', 'viva'
    total_marks DECIMAL(6, 2) NOT NULL,
    passing_marks DECIMAL(6, 2),
    weightage_percentage DECIMAL(5, 2), -- Contribution to final grade
    exam_date DATE NOT NULL,
    start_time TIME,
    duration_minutes INTEGER,
    venue_id UUID REFERENCES geo_fence_zones(id),
    instructions TEXT,
    status VARCHAR(20) DEFAULT 'scheduled', -- 'scheduled', 'ongoing', 'completed', 'results_published'
    created_by UUID REFERENCES faculty(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Exam results
CREATE TABLE exam_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    examination_id UUID REFERENCES examinations(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    marks_obtained DECIMAL(6, 2),
    normalized_marks DECIMAL(6, 2),
    grade VARCHAR(5),
    grade_points DECIMAL(3, 1),
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'entered', 'verified', 'published'
    entered_by UUID REFERENCES faculty(id),
    entered_at TIMESTAMPTZ,
    verified_by UUID REFERENCES faculty(id),
    verified_at TIMESTAMPTZ,
    remarks TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(examination_id, student_id)
);

-- Grading scale
CREATE TABLE grading_scales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    scale_type VARCHAR(20) DEFAULT 'absolute', -- 'absolute', 'relative'
    grades JSONB NOT NULL,
    /* Structure:
    [
        {"grade": "A+", "min_marks": 90, "max_marks": 100, "grade_points": 10},
        {"grade": "A", "min_marks": 80, "max_marks": 89.99, "grade_points": 9},
        ...
    ]
    */
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course-wise grade distribution (for normalization)
CREATE TABLE grade_distribution (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL,
    academic_year VARCHAR(10) NOT NULL,
    grading_scale_id UUID REFERENCES grading_scales(id),
    mean_marks DECIMAL(6, 2),
    std_deviation DECIMAL(6, 2),
    normalization_applied BOOLEAN DEFAULT false,
    normalization_method VARCHAR(50), -- 'z-score', 'percentile', 'bell-curve'
    distribution_data JSONB, -- Histogram data
    finalized BOOLEAN DEFAULT false,
    finalized_by UUID REFERENCES faculty(id),
    finalized_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(course_id, batch_id, academic_year, semester)
);

-- Final course grades (aggregated from all assessments)
CREATE TABLE course_grades (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL,
    academic_year VARCHAR(10) NOT NULL,
    
    -- Component-wise marks
    internal_marks DECIMAL(6, 2) DEFAULT 0, -- Assignments, quizzes
    midterm_marks DECIMAL(6, 2) DEFAULT 0,
    final_marks DECIMAL(6, 2) DEFAULT 0,
    practical_marks DECIMAL(6, 2) DEFAULT 0,
    project_marks DECIMAL(6, 2) DEFAULT 0,
    attendance_marks DECIMAL(6, 2) DEFAULT 0,
    
    -- Totals
    total_marks DECIMAL(6, 2),
    normalized_marks DECIMAL(6, 2),
    final_grade VARCHAR(5),
    grade_points DECIMAL(3, 1),
    credits_earned INTEGER,
    
    status VARCHAR(20) DEFAULT 'in_progress', -- 'in_progress', 'completed', 'published', 'withheld'
    withheld_reason TEXT,
    published_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, course_id, batch_id, academic_year, semester)
);

-- Semester GPA/CGPA
CREATE TABLE semester_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batches(id) ON DELETE CASCADE,
    semester INTEGER NOT NULL,
    academic_year VARCHAR(10) NOT NULL,
    credits_registered INTEGER DEFAULT 0,
    credits_earned INTEGER DEFAULT 0,
    sgpa DECIMAL(4, 2), -- Semester GPA
    cgpa DECIMAL(4, 2), -- Cumulative GPA
    total_backlogs INTEGER DEFAULT 0,
    cleared_backlogs INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'in_progress', -- 'in_progress', 'passed', 'failed', 'promoted'
    rank_in_batch INTEGER,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, batch_id, semester, academic_year)
);

-- Grade appeals
CREATE TABLE grade_appeals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_grade_id UUID REFERENCES course_grades(id),
    exam_result_id UUID REFERENCES exam_results(id),
    appeal_type VARCHAR(30) NOT NULL, -- 'revaluation', 'rechecking', 'moderation'
    reason TEXT NOT NULL,
    supporting_documents JSONB,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'under_review', 'approved', 'rejected', 'resolved'
    original_marks DECIMAL(6, 2),
    revised_marks DECIMAL(6, 2),
    reviewed_by UUID REFERENCES faculty(id),
    review_comments TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 6.4 Relationships
```
examinations ──┬── course, batch
               ├── venue (geo_fence_zones)
               └── exam_results ──── students

course_grades ──┬── students
                ├── courses
                └── batches

semester_results ──── students, batches

grade_appeals ──── students, course_grades, exam_results

grade_distribution ──── courses, batches, grading_scales
```

### 6.5 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/exams` | List examinations |
| POST | `/api/exams` | Create examination |
| GET | `/api/exams/:id/results` | Get exam results |
| POST | `/api/exams/:id/results` | Enter marks (bulk) |
| PUT | `/api/exams/:id/results/:studentId` | Update individual marks |
| POST | `/api/exams/:id/publish` | Publish results |
| POST | `/api/grades/normalize` | Apply normalization |
| GET | `/api/grades/student/:id` | Get student grades |
| GET | `/api/grades/course/:id` | Get course grade distribution |
| GET | `/api/results/semester/:studentId` | Semester results |
| POST | `/api/appeals` | Submit grade appeal |
| PUT | `/api/appeals/:id/review` | Review appeal |
| GET | `/api/transcripts/:studentId` | Generate transcript |

### 6.6 Edge Cases & Failure Handling

| Scenario | Handling Strategy |
|----------|-------------------|
| Marks exceed total | Validation error, block entry |
| Grade calculation mismatch | Log discrepancy, flag for review |
| Normalization outliers | Cap extreme values, notify admin |
| Duplicate mark entry | Merge or overwrite with audit trail |
| Result publication failure | Transaction rollback, retry |
| Appeal deadline passed | Auto-reject with notification |
| Backlog course grade update | Recalculate CGPA for all subsequent semesters |
| Transcript PDF generation fails | Queue for retry, provide JSON alternative |

---

## Module 7: Performance Analytics

### 7.1 Responsibilities
- Aggregate performance metrics
- Trend analysis and forecasting
- At-risk student identification
- AI-powered insights generation
- Report and dashboard creation

### 7.2 Key Features
| Feature | Description |
|---------|-------------|
| Real-time Dashboards | Live performance metrics |
| Trend Analysis | Historical performance patterns |
| Predictive Analytics | ML-based outcome predictions |
| At-Risk Alerts | Early warning system |
| Comparative Analysis | Batch, department, course comparisons |
| Custom Reports | Exportable analytics |
| AI Insights | Natural language recommendations |

### 7.3 Database Schema

```sql
-- Analytics snapshots (daily/weekly aggregations)
CREATE TABLE analytics_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    snapshot_date DATE NOT NULL,
    snapshot_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'semester'
    entity_type VARCHAR(30) NOT NULL, -- 'student', 'course', 'batch', 'department', 'institution'
    entity_id UUID NOT NULL,
    metrics JSONB NOT NULL,
    /* Structure varies by entity_type:
    For student:
    {
        "attendance_rate": 92.5,
        "assignment_completion_rate": 88.0,
        "average_grade": 78.5,
        "gpa": 3.4,
        "at_risk_score": 0.2,
        "engagement_score": 85
    }
    For course:
    {
        "avg_attendance": 87.5,
        "avg_grade": 72.3,
        "pass_rate": 89.5,
        "fail_rate": 10.5,
        "grade_distribution": {"A+": 5, "A": 15, ...}
    }
    */
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(snapshot_date, snapshot_type, entity_type, entity_id)
);

-- At-risk student tracking
CREATE TABLE at_risk_students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id),
    risk_level VARCHAR(20) NOT NULL, -- 'low', 'medium', 'high', 'critical'
    risk_score DECIMAL(5, 2), -- 0-100
    risk_factors JSONB NOT NULL,
    /* Structure:
    {
        "attendance": {"value": 65, "threshold": 75, "weight": 0.3},
        "grades": {"value": 45, "threshold": 50, "weight": 0.4},
        "assignment_completion": {"value": 50, "threshold": 70, "weight": 0.3}
    }
    */
    recommended_actions JSONB,
    intervention_status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'notified', 'in_progress', 'resolved'
    assigned_to UUID REFERENCES faculty(id),
    notes TEXT,
    identified_at TIMESTAMPTZ DEFAULT NOW(),
    resolved_at TIMESTAMPTZ,
    UNIQUE(student_id, course_id)
);

-- AI-generated insights
CREATE TABLE ai_insights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    insight_type VARCHAR(50) NOT NULL, -- 'recommendation', 'alert', 'trend', 'prediction'
    entity_type VARCHAR(30) NOT NULL,
    entity_id UUID,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    detailed_analysis TEXT,
    confidence_score DECIMAL(5, 2),
    impact_level VARCHAR(20) DEFAULT 'medium', -- 'low', 'medium', 'high'
    category VARCHAR(50), -- 'attendance', 'performance', 'engagement', 'scheduling'
    actionable BOOLEAN DEFAULT true,
    suggested_actions JSONB,
    data_sources JSONB, -- References to data used
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Report templates
CREATE TABLE report_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    report_type VARCHAR(50) NOT NULL, -- 'attendance', 'performance', 'comparison', 'custom'
    template_config JSONB NOT NULL,
    /* Structure:
    {
        "metrics": ["attendance_rate", "gpa", "pass_rate"],
        "groupBy": ["department", "batch"],
        "filters": {"semester": 1, "academic_year": "2024-25"},
        "visualizations": ["bar_chart", "line_chart", "table"]
    }
    */
    created_by UUID REFERENCES faculty(id),
    is_public BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated reports
CREATE TABLE generated_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    template_id UUID REFERENCES report_templates(id),
    name VARCHAR(255) NOT NULL,
    parameters JSONB,
    report_data JSONB,
    file_url TEXT,
    file_format VARCHAR(10) DEFAULT 'pdf', -- 'pdf', 'xlsx', 'csv', 'json'
    generated_by UUID REFERENCES faculty(id),
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ
);

-- Performance benchmarks
CREATE TABLE performance_benchmarks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    benchmark_name VARCHAR(100) NOT NULL,
    entity_type VARCHAR(30) NOT NULL, -- 'course', 'department', 'program'
    entity_id UUID NOT NULL,
    metric_name VARCHAR(50) NOT NULL,
    benchmark_value DECIMAL(10, 2) NOT NULL,
    threshold_low DECIMAL(10, 2),
    threshold_high DECIMAL(10, 2),
    academic_year VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(entity_type, entity_id, metric_name, academic_year)
);
```

### 7.4 Relationships
```
analytics_snapshots ──── various entities (polymorphic)

at_risk_students ──┬── students
                   ├── courses
                   └── faculty (assigned)

ai_insights ──── various entities (polymorphic)

report_templates ──── generated_reports ──── faculty

performance_benchmarks ──── courses, departments, programs
```

### 7.5 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/dashboard` | Get dashboard metrics |
| GET | `/api/analytics/student/:id` | Student analytics |
| GET | `/api/analytics/course/:id` | Course analytics |
| GET | `/api/analytics/trends` | Trend analysis |
| GET | `/api/at-risk` | List at-risk students |
| POST | `/api/at-risk/:id/intervene` | Record intervention |
| GET | `/api/insights` | Get AI insights |
| POST | `/api/insights/generate` | Trigger insight generation |
| GET | `/api/reports/templates` | List report templates |
| POST | `/api/reports/generate` | Generate report |
| GET | `/api/reports/:id/download` | Download report |
| GET | `/api/benchmarks` | Get benchmarks |

### 7.6 Edge Cases & Failure Handling

| Scenario | Handling Strategy |
|----------|-------------------|
| Insufficient data for prediction | Lower confidence score, warn user |
| Analytics job timeout | Chunk processing, resume capability |
| AI service unavailable | Queue for retry, show cached insights |
| Report generation exceeds size limit | Paginate or offer summary version |
| Anomaly in data pattern | Flag for manual review, don't auto-act |
| Historical data gap | Interpolate or exclude, note limitation |
| Real-time dashboard overload | Rate limiting, cached responses |
| Benchmark comparison failure | Show N/A, log for admin |

---

## Module 8: Admin Control Panel

### 8.1 Responsibilities
- System-wide configuration
- User and role management
- Audit logging and compliance
- Institution settings
- Data management and backups

### 8.2 Key Features
| Feature | Description |
|---------|-------------|
| Role Management | RBAC with custom permissions |
| User Administration | Account lifecycle management |
| System Configuration | Global settings management |
| Audit Logs | Complete activity tracking |
| Academic Calendar | Semester, holiday management |
| Data Import/Export | Bulk data operations |
| Integration Management | Third-party service configuration |

### 8.3 Database Schema

```sql
-- User roles (separated for security)
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL,
    UNIQUE(user_id, role)
);

-- Role type enum
CREATE TYPE app_role AS ENUM ('super_admin', 'admin', 'hod', 'faculty', 'student', 'parent');

-- Role permissions
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role app_role NOT NULL,
    module VARCHAR(50) NOT NULL,
    permission VARCHAR(30) NOT NULL, -- 'create', 'read', 'update', 'delete', 'approve', 'export'
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(role, module, permission)
);

-- Security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Audit logs
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    action VARCHAR(50) NOT NULL,
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID,
    old_values JSONB,
    new_values JSONB,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- System configuration
CREATE TABLE system_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    description TEXT,
    category VARCHAR(50),
    is_sensitive BOOLEAN DEFAULT false,
    updated_by UUID REFERENCES auth.users(id),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Academic calendar
CREATE TABLE academic_calendar (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    academic_year VARCHAR(10) NOT NULL,
    event_name VARCHAR(255) NOT NULL,
    event_type VARCHAR(50) NOT NULL, -- 'semester_start', 'semester_end', 'exam', 'holiday', 'event'
    start_date DATE NOT NULL,
    end_date DATE,
    applies_to JSONB, -- {departments: [], programs: [], batches: []}
    is_holiday BOOLEAN DEFAULT false,
    description TEXT,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data import jobs
CREATE TABLE import_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_type VARCHAR(50) NOT NULL, -- 'students', 'faculty', 'courses', 'marks'
    file_url TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
    total_records INTEGER,
    processed_records INTEGER DEFAULT 0,
    failed_records INTEGER DEFAULT 0,
    error_log JSONB,
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Integration configurations
CREATE TABLE integrations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    integration_type VARCHAR(50) NOT NULL, -- 'calendar', 'email', 'sms', 'lms', 'payment'
    provider VARCHAR(100),
    config JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    sync_status VARCHAR(20),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Announcement/Broadcast system
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    announcement_type VARCHAR(30) DEFAULT 'general', -- 'general', 'urgent', 'academic', 'event'
    target_audience JSONB, -- {roles: [], departments: [], batches: []}
    attachment_urls JSONB,
    is_pinned BOOLEAN DEFAULT false,
    publish_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Login sessions (for security monitoring)
CREATE TABLE login_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    device_info JSONB,
    ip_address INET,
    user_agent TEXT,
    login_at TIMESTAMPTZ DEFAULT NOW(),
    logout_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    terminated_reason VARCHAR(50) -- 'logout', 'timeout', 'admin_force', 'suspicious'
);
```

### 8.4 Relationships
```
user_roles ──── auth.users

role_permissions ──── app_role (enum)

audit_logs ──── auth.users

system_config, academic_calendar, import_jobs, integrations, announcements ──── auth.users (created_by)

login_sessions ──── auth.users
```

### 8.5 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/admin/users` | List all users |
| POST | `/api/admin/users/:id/role` | Assign role |
| DELETE | `/api/admin/users/:id/role` | Remove role |
| GET | `/api/admin/permissions` | Get role permissions |
| PUT | `/api/admin/permissions` | Update permissions |
| GET | `/api/admin/audit-logs` | Get audit logs |
| GET | `/api/admin/config` | Get system config |
| PUT | `/api/admin/config/:key` | Update config |
| GET | `/api/admin/calendar` | Get academic calendar |
| POST | `/api/admin/calendar` | Add calendar event |
| POST | `/api/admin/import` | Start import job |
| GET | `/api/admin/import/:id` | Get import status |
| GET | `/api/admin/integrations` | List integrations |
| PUT | `/api/admin/integrations/:id` | Update integration |
| POST | `/api/admin/announcements` | Create announcement |
| GET | `/api/admin/sessions` | Get active sessions |
| POST | `/api/admin/sessions/:id/terminate` | Terminate session |

### 8.6 Edge Cases & Failure Handling

| Scenario | Handling Strategy |
|----------|-------------------|
| Last admin removal | Block, require at least one super_admin |
| Role escalation attempt | Audit log, block, notify security |
| Bulk import partial failure | Continue processing, detailed error log |
| Config update breaks system | Validation before save, rollback capability |
| Session hijacking detected | Force logout, require re-auth, notify user |
| Audit log table full | Archive to cold storage, maintain retention policy |
| Calendar conflict | Warn, allow override with reason |
| Integration sync failure | Retry with backoff, notify admin after 3 failures |

---

## Cross-Module Data Flow

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│     SIS      │────►│  Attendance  │────►│  Analytics   │
│   (Module 1) │     │  (Module 2)  │     │  (Module 7)  │
└──────┬───────┘     └──────┬───────┘     └──────────────┘
       │                    │                    ▲
       │                    ▼                    │
       │            ┌──────────────┐             │
       │            │  Timetable   │             │
       │            │  (Module 3)  │             │
       │            └──────┬───────┘             │
       │                   │                     │
       ▼                   ▼                     │
┌──────────────┐     ┌──────────────┐            │
│ Assessments  │────►│   Projects   │────────────┤
│  (Module 4)  │     │  (Module 5)  │            │
└──────┬───────┘     └──────┬───────┘            │
       │                    │                    │
       └────────┬───────────┘                    │
                ▼                                │
       ┌──────────────┐                          │
       │    Marks     │──────────────────────────┘
       │  (Module 6)  │
       └──────────────┘
                │
                ▼
       ┌──────────────┐
       │    Admin     │
       │  (Module 8)  │
       └──────────────┘
```

---

*Document Version: 1.0*
*Last Updated: December 2024*
