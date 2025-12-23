# EduNexus AI - Role-Based System Architecture

## 1. MANDATORY ROLE SEPARATION

EduNexus AI is a **STRICT ROLE-BASED ERP** with completely separate pages, flows, and permissions for each role.

### Core Roles

| Role | App Type | Access Level |
|------|----------|--------------|
| **Student** | Student Portal | Own data only |
| **Faculty** | Faculty Portal | Assigned subjects only |
| **Admin** | Admin Console | Institution-wide |

### Security Principles

1. **Zero Cross-Role Access**: No role can access another role's features
2. **Backend Enforcement**: All permissions enforced via RLS policies
3. **Separate Routes**: Each role has isolated route structure
4. **API Protection**: Edge functions validate role before execution

---

## 2. PAGE STRUCTURE BY ROLE

### Student Pages (`/student/*`)

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/student` | Personal overview, quick stats |
| Attendance | `/student/attendance` | View own attendance by subject |
| Timetable | `/student/timetable` | Personal schedule (read-only) |
| Mark Attendance | `/student/mark-attendance` | QR scan for attendance |
| Assignments | `/student/assignments` | View and submit assignments |
| Assignment Detail | `/student/assignments/:id` | Submit work, view feedback |
| Marks | `/student/marks` | View grades and feedback |
| Performance | `/student/performance` | Analytics and AI insights |
| Notifications | `/student/notifications` | Alerts and announcements |
| Profile | `/student/profile` | Personal info |

### Faculty Pages (`/faculty/*`)

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/faculty` | Teaching overview, quick actions |
| My Subjects | `/faculty/subjects` | List of assigned subjects |
| Subject Detail | `/faculty/subjects/:id` | Subject management hub |
| Timetable | `/faculty/timetable` | Teaching schedule |
| Attendance | `/faculty/attendance` | Open/manage attendance sessions |
| Attendance Session | `/faculty/attendance/:sessionId` | QR generation, live tracking |
| Assignments | `/faculty/assignments` | Create and manage assignments |
| Assignment Detail | `/faculty/assignments/:id` | View submissions, grade |
| Grading | `/faculty/grading` | Grade submissions |
| Class Analytics | `/faculty/analytics` | Subject-wise performance |
| Notifications | `/faculty/notifications` | Alerts |
| Profile | `/faculty/profile` | Personal info |

### Admin Pages (`/admin/*`)

| Page | Route | Description |
|------|-------|-------------|
| Dashboard | `/admin` | Institution overview |
| Users | `/admin/users` | Manage students & faculty |
| Students | `/admin/users/students` | Student management |
| Faculty | `/admin/users/faculty` | Faculty management |
| Departments | `/admin/departments` | Department CRUD |
| Programs | `/admin/programs` | Program/course catalog |
| Subjects | `/admin/subjects` | Subject management |
| Timetables | `/admin/timetables` | Create timetables |
| Faculty Assignment | `/admin/assign-faculty` | Assign faculty to subjects |
| Geo Zones | `/admin/geo-zones` | Manage attendance zones |
| Attendance Rules | `/admin/attendance-rules` | Configure thresholds |
| Analytics | `/admin/analytics` | Institution-wide metrics |
| Audit Logs | `/admin/audit-logs` | System activity logs |
| Settings | `/admin/settings` | System configuration |

---

## 3. ACCESS CONTROL MATRIX

### Student Permissions

| Action | Allowed | Scope |
|--------|---------|-------|
| View own attendance | ✅ | Own records only |
| View own timetable | ✅ | Enrolled subjects |
| Scan QR for attendance | ✅ | Active sessions only |
| Submit assignments | ✅ | Enrolled subjects |
| View own marks | ✅ | Own grades only |
| View own analytics | ✅ | Personal performance |
| View other students | ❌ | - |
| Generate QR codes | ❌ | - |
| Edit attendance | ❌ | - |
| Create assignments | ❌ | - |
| See faculty analytics | ❌ | - |

### Faculty Permissions

| Action | Allowed | Scope |
|--------|---------|-------|
| View assigned subjects | ✅ | Assigned only |
| Open attendance session | ✅ | Own subjects |
| Generate QR code | ✅ | Active sessions |
| Mark attendance manually | ✅ | Own subjects |
| View subject attendance | ✅ | Own subjects only |
| Create assignments | ✅ | Own subjects |
| Grade submissions | ✅ | Own subjects |
| View class analytics | ✅ | Own subjects |
| See other faculty data | ❌ | - |
| Institution analytics | ❌ | - |
| Edit student profiles | ❌ | - |
| Create subjects | ❌ | - |

### Admin Permissions

| Action | Allowed | Scope |
|--------|---------|-------|
| Manage all users | ✅ | Institution-wide |
| Create subjects/courses | ✅ | All |
| Assign faculty | ✅ | All |
| Create timetables | ✅ | All |
| Configure geo-zones | ✅ | All |
| View all analytics | ✅ | Institution-wide |
| View audit logs | ✅ | All |
| Mark attendance | ❌ | - |
| Submit assignments | ❌ | - |
| Grade submissions | ❌ | - |

---

## 4. ATTENDANCE FLOW

### Faculty Opens Attendance Session

```
FACULTY FLOW:
┌─────────────────────────────────────────────────────────────────────┐
│ 1. Faculty → My Subjects → Select Subject                          │
│ 2. Faculty → Click "Open Attendance" for current period            │
│ 3. System → Creates attendance_session record                      │
│           → Status: 'active'                                        │
│           → Generates time-bound QR code (expires in 30 sec)       │
│           → Links to geo-fence zone                                 │
│ 4. Faculty → Displays QR on screen                                  │
│ 5. Faculty → Can refresh QR every 30 seconds                       │
│ 6. Faculty → Views live attendance count                           │
│ 7. Faculty → Can mark students manually if needed                  │
│ 8. Faculty → Clicks "Close Session"                                │
│ 9. System → Status: 'completed'                                     │
│           → Lock all records (no more changes)                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Student Marks Attendance

```
STUDENT FLOW:
┌─────────────────────────────────────────────────────────────────────┐
│ 1. Student → "Mark Attendance" page                                 │
│ 2. Student → Scans QR code from faculty screen                     │
│ 3. App → Captures:                                                  │
│        → QR data (session_id, timestamp, hash)                     │
│        → GPS coordinates                                            │
│        → Device ID                                                   │
│ 4. Backend → Validates:                                             │
│           → QR not expired (< 30 seconds old)                       │
│           → Student enrolled in subject                             │
│           → GPS within geo-fence zone                               │
│           → Session status = 'active'                               │
│           → No duplicate attendance                                 │
│ 5a. SUCCESS:                                                        │
│    → Create attendance_record (status: 'present'/'late')           │
│    → Show confirmation with checkmark                               │
│ 5b. FAILURE:                                                        │
│    → Show specific error message                                    │
│    → Log attempt for audit                                          │
└─────────────────────────────────────────────────────────────────────┘
```

### Failure Cases

| Error | Cause | Message |
|-------|-------|---------|
| QR_EXPIRED | QR > 30 seconds old | "QR code expired. Ask faculty to refresh." |
| NOT_ENROLLED | Student not in subject | "You are not enrolled in this subject." |
| OUTSIDE_ZONE | GPS outside geo-fence | "You must be in the classroom to mark attendance." |
| SESSION_CLOSED | Session not active | "Attendance session has ended." |
| ALREADY_MARKED | Duplicate attempt | "Attendance already marked for this session." |
| INVALID_QR | Tampered/fake QR | "Invalid QR code." |

---

## 5. ASSIGNMENT FLOW

### Faculty Creates Assignment

```
FACULTY FLOW:
┌─────────────────────────────────────────────────────────────────────┐
│ 1. Faculty → Assignments → Create New                               │
│ 2. Faculty → Fills form:                                            │
│           → Title, Description                                       │
│           → Subject (from assigned list only)                       │
│           → Due Date                                                 │
│           → Total Marks                                              │
│           → Late Submission Allowed (yes/no)                        │
│ 3. System → Creates assessment record                               │
│           → Status: 'draft'                                         │
│ 4. Faculty → Reviews → Publishes                                    │
│ 5. System → Status: 'published'                                     │
│           → Notifies enrolled students                              │
└─────────────────────────────────────────────────────────────────────┘
```

### Student Submits Assignment

```
STUDENT FLOW:
┌─────────────────────────────────────────────────────────────────────┐
│ 1. Student → Assignments → Views published assignments             │
│ 2. Student → Opens assignment detail                               │
│ 3. Student → Uploads file / enters text                            │
│ 4. System → Validates:                                              │
│           → Student enrolled in subject                             │
│           → Before due date (or late allowed)                       │
│           → File size/type valid                                    │
│ 5. System → Creates submission record                               │
│           → is_late: true/false                                     │
│           → Status: 'submitted'                                     │
│ 6. System → Notifies faculty                                        │
│ 7. Student → Can resubmit until due date                           │
└─────────────────────────────────────────────────────────────────────┘
```

### Faculty Grades Assignment

```
GRADING FLOW:
┌─────────────────────────────────────────────────────────────────────┐
│ 1. Faculty → Assignment → View Submissions                          │
│ 2. Faculty → Opens submission                                       │
│ 3. Faculty → Downloads/views file                                  │
│ 4. Faculty → Enters marks and feedback                             │
│ 5. System → Updates submission:                                     │
│           → marks_obtained                                          │
│           → feedback                                                 │
│           → graded_by                                               │
│           → graded_at                                               │
│           → Status: 'graded'                                        │
│ 6. System → Notifies student                                        │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 6. DATA VISIBILITY RULES

### Attendance Data

| Role | Can See |
|------|---------|
| Student | Own attendance: all subjects, all dates |
| Faculty | Attendance for subjects they teach only |
| Admin | All attendance, institution-wide |

### Assignment Data

| Role | Can See |
|------|---------|
| Student | Assignments for enrolled subjects + own submissions |
| Faculty | Assignments they created + all submissions for those |
| Admin | All assignments (read-only, no grading) |

### Marks Data

| Role | Can See |
|------|---------|
| Student | Own marks only |
| Faculty | Marks for subjects they teach |
| Admin | Aggregated analytics (not individual marks) |

### Analytics Data

| Role | Can See |
|------|---------|
| Student | Personal performance, subject-wise breakdown |
| Faculty | Class performance for taught subjects |
| Admin | Institution-wide metrics, department comparisons |

---

## 7. DATABASE SECURITY (RLS POLICIES)

### Existing Policies Summary

```sql
-- Students: Own data only
"Students view own attendance" → student_id matches user's student record
"Students view own submissions" → student_id matches user's student record

-- Faculty: Assigned subjects only
"Faculty view all attendance" → has_role('faculty')
"Faculty can manage attendance" → has_role('faculty')
"Faculty view all submissions" → has_role('faculty')
"Faculty can grade" → has_role('faculty')

-- Admin: Full access
"Admins can manage students" → has_role('admin')
"Admins can manage faculty" → has_role('admin')
```

### Additional Required Policies

```sql
-- Faculty should only see their assigned subjects
-- This requires filtering in application logic using course_assignments table

-- Example query for faculty attendance:
SELECT ar.* FROM attendance_records ar
JOIN attendance_sessions as ON ar.session_id = as.id
JOIN course_assignments ca ON as.course_id = ca.course_id
WHERE ca.faculty_id = (SELECT id FROM faculty WHERE user_id = auth.uid())
```

---

## 8. ROUTING STRUCTURE

### App.tsx Routes

```typescript
// Public Routes
/auth/login          → Login page (role selection)
/auth/student        → Student login
/auth/faculty        → Faculty login  
/auth/admin          → Admin login

// Protected: Student Routes
/student/*           → StudentLayout wrapper
  /student           → StudentDashboard
  /student/attendance → StudentAttendance
  /student/timetable → StudentTimetable
  /student/mark-attendance → MarkAttendance (QR scan)
  /student/assignments → StudentAssignments
  /student/assignments/:id → AssignmentDetail
  /student/marks     → StudentMarks
  /student/performance → StudentPerformance
  /student/profile   → StudentProfile

// Protected: Faculty Routes
/faculty/*           → FacultyLayout wrapper
  /faculty           → FacultyDashboard
  /faculty/subjects  → FacultySubjects
  /faculty/subjects/:id → SubjectDetail
  /faculty/timetable → FacultyTimetable
  /faculty/attendance → FacultyAttendance
  /faculty/attendance/:sessionId → AttendanceSession
  /faculty/assignments → FacultyAssignments
  /faculty/assignments/:id → AssignmentManagement
  /faculty/grading   → Grading
  /faculty/analytics → FacultyAnalytics
  /faculty/profile   → FacultyProfile

// Protected: Admin Routes
/admin/*             → AdminLayout wrapper
  /admin             → AdminDashboard
  /admin/users/students → StudentManagement
  /admin/users/faculty → FacultyManagement
  /admin/departments → DepartmentManagement
  /admin/programs    → ProgramManagement
  /admin/subjects    → SubjectManagement
  /admin/timetables  → TimetableManagement
  /admin/assign-faculty → FacultyAssignment
  /admin/geo-zones   → GeoZoneManagement
  /admin/attendance-rules → AttendanceRules
  /admin/analytics   → AdminAnalytics
  /admin/audit-logs  → AuditLogs
  /admin/settings    → SystemSettings
```

---

## 9. TECHNOLOGY STACK

### Frontend
| Component | Technology |
|-----------|------------|
| Web App | React 18 + TypeScript + Vite |
| UI Library | shadcn/ui + Tailwind CSS |
| State | TanStack Query |
| Routing | React Router v6 |
| Forms | React Hook Form + Zod |
| Charts | Recharts |

### Backend (Lovable Cloud)
| Component | Technology |
|-----------|------------|
| Database | PostgreSQL |
| Auth | Supabase Auth |
| API | Edge Functions |
| Real-time | Supabase Realtime |
| Storage | Supabase Storage |

### Security
| Layer | Implementation |
|-------|----------------|
| Authentication | JWT + Session management |
| Authorization | RLS policies + has_role() function |
| Route Guards | React Router protected routes |
| API Protection | Edge function role validation |

---

## 10. RELIABILITY & CONSISTENCY RULES

### Attendance Reliability

1. **Atomic Operations**: Each attendance mark is a single transaction
2. **Idempotency**: Duplicate scans are rejected gracefully
3. **Audit Trail**: All attempts logged (success and failure)
4. **Session Locking**: Closed sessions cannot be modified
5. **Time Validation**: Server time used, not client time

### Assignment Reliability

1. **File Storage**: Files stored with versioning
2. **Submission Tracking**: Every submission creates new record
3. **Deadline Enforcement**: Server-side deadline check
4. **Grade Integrity**: Only assigned faculty can grade

### Data Consistency

1. **Referential Integrity**: Foreign keys enforced
2. **Cascade Rules**: Proper ON DELETE behavior
3. **Validation Triggers**: Data validated before insert
4. **Updated Timestamps**: auto-updated on changes

---

## 11. SYSTEM CONSTRAINTS

1. **No Mixed-Role Pages**: Each page serves exactly one role
2. **API Role Enforcement**: Every endpoint checks user role
3. **Subject-Specific Attendance**: Always linked to subject + period
4. **Faculty-Controlled Sessions**: Only faculty can open/close
5. **Complete Student View**: Students see ALL their attendance
6. **Scoped Faculty View**: Faculty see ONLY their subjects
7. **No Admin Data Entry**: Admins configure, don't operate
