import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { GraduationCap, Save, AlertTriangle, TrendingDown, CheckCircle, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Student {
  id: string;
  first_name: string;
  last_name: string;
  roll_number: string;
  risk_category?: string;
  risk_score?: number;
}

interface ExamMark {
  student_id: string;
  mid_marks: number | null;
  sem_marks: number | null;
}

interface Course {
  id: string;
  name: string;
  code: string;
}

export default function FacultyMarksEntry() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<string>("");
  const [students, setStudents] = useState<Student[]>([]);
  const [marks, setMarks] = useState<Record<string, ExamMark>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const [examType, setExamType] = useState<"mid" | "sem">("mid");
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [facultyId, setFacultyId] = useState<string | null>(null);
  const [maxMarks, setMaxMarks] = useState({ mid: 30, sem: 70 });

  useEffect(() => {
    if (user) {
      fetchFacultyData();
    }
  }, [user]);

  useEffect(() => {
    if (selectedCourse) {
      fetchStudentsForCourse();
    }
  }, [selectedCourse]);

  async function fetchFacultyData() {
    try {
      const { data: facultyData } = await supabase
        .from("faculty")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (facultyData) {
        setFacultyId(facultyData.id);

        const { data: assignments } = await supabase
          .from("course_assignments")
          .select("course_id")
          .eq("faculty_id", facultyData.id);

        if (assignments && assignments.length > 0) {
          const courseIds = assignments.map((a) => a.course_id).filter(Boolean);
          const { data: coursesData } = await supabase
            .from("courses")
            .select("id, name, code")
            .in("id", courseIds);
          setCourses(coursesData || []);
        }
      }
    } catch (error) {
      console.error("Error fetching faculty data:", error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchStudentsForCourse() {
    if (!selectedCourse) return;

    try {
      setLoading(true);

      // Get batch for this course
      const { data: assignment } = await supabase
        .from("course_assignments")
        .select("batch_id")
        .eq("course_id", selectedCourse)
        .maybeSingle();

      if (!assignment?.batch_id) {
        setStudents([]);
        return;
      }

      // Get sections for this batch
      const { data: sections } = await supabase
        .from("sections")
        .select("id")
        .eq("batch_id", assignment.batch_id);

      if (!sections?.length) {
        setStudents([]);
        return;
      }

      const sectionIds = sections.map((s) => s.id);

      // Get enrolled students
      const { data: enrollments } = await supabase
        .from("student_enrollments")
        .select("student_id")
        .in("section_id", sectionIds)
        .eq("status", "active");

      if (!enrollments?.length) {
        setStudents([]);
        return;
      }

      const studentIds = enrollments.map((e) => e.student_id);

      // Get student details
      const { data: studentsData } = await supabase
        .from("students")
        .select("id, first_name, last_name, roll_number")
        .in("id", studentIds)
        .order("roll_number");

      // Get risk scores for these students
      const { data: riskScores } = await supabase
        .from("ai_risk_scores")
        .select("student_id, risk_category, risk_score")
        .in("student_id", studentIds);

      const riskMap = new Map(riskScores?.map((r) => [r.student_id, r]));

      const enrichedStudents = (studentsData || []).map((s) => {
        const risk = riskMap.get(s.id);
        return {
          ...s,
          risk_category: risk?.risk_category,
          risk_score: risk?.risk_score,
        };
      });

      setStudents(enrichedStudents);

      // Initialize marks
      const initialMarks: Record<string, ExamMark> = {};
      for (const student of enrichedStudents) {
        initialMarks[student.id] = {
          student_id: student.id,
          mid_marks: null,
          sem_marks: null,
        };
      }
      setMarks(initialMarks);

      // Fetch existing marks from assessments
      await fetchExistingMarks(studentIds);
    } catch (error) {
      console.error("Error fetching students:", error);
      toast.error("Failed to load students");
    } finally {
      setLoading(false);
    }
  }

  async function fetchExistingMarks(studentIds: string[]) {
    // Get mid-term and semester assessments for this course
    const { data: assessments } = await supabase
      .from("assessments")
      .select("id, assessment_type, total_marks")
      .eq("course_id", selectedCourse)
      .in("assessment_type", ["mid_term", "semester"]);

    if (!assessments?.length) return;

    const midAssessment = assessments.find((a) => a.assessment_type === "mid_term");
    const semAssessment = assessments.find((a) => a.assessment_type === "semester");

    if (midAssessment) setMaxMarks((prev) => ({ ...prev, mid: midAssessment.total_marks }));
    if (semAssessment) setMaxMarks((prev) => ({ ...prev, sem: semAssessment.total_marks }));

    const assessmentIds = assessments.map((a) => a.id);

    const { data: submissions } = await supabase
      .from("assessment_submissions")
      .select("student_id, marks_obtained, assessment_id")
      .in("assessment_id", assessmentIds)
      .in("student_id", studentIds);

    if (submissions) {
      setMarks((prev) => {
        const updated = { ...prev };
        for (const sub of submissions) {
          const assessment = assessments.find((a) => a.id === sub.assessment_id);
          if (updated[sub.student_id]) {
            if (assessment?.assessment_type === "mid_term") {
              updated[sub.student_id].mid_marks = sub.marks_obtained;
            } else if (assessment?.assessment_type === "semester") {
              updated[sub.student_id].sem_marks = sub.marks_obtained;
            }
          }
        }
        return updated;
      });
    }
  }

  function updateMark(studentId: string, value: number | null) {
    setMarks((prev) => ({
      ...prev,
      [studentId]: {
        ...prev[studentId],
        [examType === "mid" ? "mid_marks" : "sem_marks"]: value,
      },
    }));
  }

  async function saveMarks() {
    if (!facultyId || !selectedCourse) return;

    try {
      setSaving(true);

      // Get or create the assessment
      const assessmentType = examType === "mid" ? "mid_term" : "semester";
      let { data: assessment } = await supabase
        .from("assessments")
        .select("id")
        .eq("course_id", selectedCourse)
        .eq("assessment_type", assessmentType)
        .eq("faculty_id", facultyId)
        .maybeSingle();

      if (!assessment) {
        const { data: newAssessment, error } = await supabase
          .from("assessments")
          .insert({
            course_id: selectedCourse,
            faculty_id: facultyId,
            assessment_type: assessmentType,
            title: examType === "mid" ? "Mid-Term Examination" : "Semester Examination",
            total_marks: examType === "mid" ? maxMarks.mid : maxMarks.sem,
            due_date: new Date().toISOString(),
            status: "published",
          })
          .select()
          .single();

        if (error) throw error;
        assessment = newAssessment;
      }

      // Save marks for each student
      const submissions = Object.entries(marks)
        .filter(([_, mark]) => {
          const value = examType === "mid" ? mark.mid_marks : mark.sem_marks;
          return value !== null && value !== undefined;
        })
        .map(([studentId, mark]) => ({
          assessment_id: assessment!.id,
          student_id: studentId,
          marks_obtained: examType === "mid" ? mark.mid_marks : mark.sem_marks,
          status: "graded",
          graded_by: facultyId,
          graded_at: new Date().toISOString(),
          submitted_at: new Date().toISOString(),
        }));

      if (submissions.length > 0) {
        // Upsert submissions
        for (const sub of submissions) {
          const { data: existing } = await supabase
            .from("assessment_submissions")
            .select("id")
            .eq("assessment_id", sub.assessment_id)
            .eq("student_id", sub.student_id)
            .maybeSingle();

          if (existing) {
            await supabase
              .from("assessment_submissions")
              .update({
                marks_obtained: sub.marks_obtained,
                graded_by: sub.graded_by,
                graded_at: sub.graded_at,
              })
              .eq("id", existing.id);
          } else {
            await supabase.from("assessment_submissions").insert(sub);
          }
        }
      }

      toast.success(`${examType === "mid" ? "Mid-term" : "Semester"} marks saved successfully`);
      setShowSaveDialog(false);
    } catch (error) {
      console.error("Error saving marks:", error);
      toast.error("Failed to save marks");
    } finally {
      setSaving(false);
    }
  }

  const filteredStudents = students.filter(
    (s) =>
      s.first_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.last_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.roll_number.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const lowPerformingStudents = students.filter((s) => {
    const mark = marks[s.id];
    if (!mark) return false;
    const currentMark = examType === "mid" ? mark.mid_marks : mark.sem_marks;
    const max = examType === "mid" ? maxMarks.mid : maxMarks.sem;
    return currentMark !== null && currentMark < max * 0.4;
  });

  if (loading && courses.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <GraduationCap className="h-6 w-6" />
          Marks Entry
        </h1>
        <p className="text-muted-foreground">Enter mid-term and semester examination marks</p>
      </div>

      {/* Course Selection and Exam Type */}
      <Card>
        <CardHeader>
          <CardTitle>Select Course & Exam</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-4">
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="Select a course" />
              </SelectTrigger>
              <SelectContent>
                {courses.map((course) => (
                  <SelectItem key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Tabs value={examType} onValueChange={(v) => setExamType(v as "mid" | "sem")}>
              <TabsList>
                <TabsTrigger value="mid">Mid-Term ({maxMarks.mid} marks)</TabsTrigger>
                <TabsTrigger value="sem">Semester ({maxMarks.sem} marks)</TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          {selectedCourse && (
            <div className="flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search students..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button onClick={() => setShowSaveDialog(true)} disabled={!selectedCourse}>
                <Save className="h-4 w-4 mr-2" />
                Save Marks
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Low Performing Alert */}
      {lowPerformingStudents.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Students Needing Attention
            </CardTitle>
            <CardDescription>
              {lowPerformingStudents.length} student(s) have scored below 40% - consider offering additional support
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowPerformingStudents.slice(0, 10).map((student) => (
                <Badge key={student.id} variant="outline" className="bg-amber-500/10">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  {student.roll_number} - {student.first_name}
                </Badge>
              ))}
              {lowPerformingStudents.length > 10 && (
                <Badge variant="outline">+{lowPerformingStudents.length - 10} more</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Marks Entry Table */}
      {selectedCourse && (
        <Card>
          <CardHeader>
            <CardTitle>Enter {examType === "mid" ? "Mid-Term" : "Semester"} Marks</CardTitle>
            <CardDescription>
              {filteredStudents.length} students | Max marks: {examType === "mid" ? maxMarks.mid : maxMarks.sem}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No students found for this course
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Risk Level</TableHead>
                    <TableHead className="w-32">
                      {examType === "mid" ? "Mid-Term" : "Semester"} Marks
                    </TableHead>
                    <TableHead>Percentage</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => {
                    const mark = marks[student.id];
                    const currentMark = examType === "mid" ? mark?.mid_marks : mark?.sem_marks;
                    const max = examType === "mid" ? maxMarks.mid : maxMarks.sem;
                    const percentage = currentMark !== null ? (currentMark / max) * 100 : null;
                    const isLow = percentage !== null && percentage < 40;

                    return (
                      <TableRow key={student.id} className={cn(isLow && "bg-destructive/5")}>
                        <TableCell className="font-medium">{student.roll_number}</TableCell>
                        <TableCell>
                          {student.first_name} {student.last_name}
                        </TableCell>
                        <TableCell>
                          {student.risk_category ? (
                            <Badge
                              variant="outline"
                              className={cn({
                                "text-green-500 bg-green-500/10": student.risk_category === "low",
                                "text-amber-500 bg-amber-500/10": student.risk_category === "moderate",
                                "text-orange-500 bg-orange-500/10": student.risk_category === "high",
                                "text-destructive bg-destructive/10": student.risk_category === "critical",
                              })}
                            >
                              {student.risk_category}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground text-sm">-</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <Input
                            type="number"
                            min={0}
                            max={max}
                            value={currentMark ?? ""}
                            onChange={(e) =>
                              updateMark(
                                student.id,
                                e.target.value === "" ? null : parseFloat(e.target.value)
                              )
                            }
                            className={cn("w-20", isLow && "border-destructive")}
                            placeholder={`/${max}`}
                          />
                        </TableCell>
                        <TableCell>
                          {percentage !== null ? (
                            <Badge
                              variant={isLow ? "destructive" : percentage >= 75 ? "default" : "secondary"}
                            >
                              {percentage.toFixed(0)}%
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

      {/* Save Confirmation Dialog */}
      <Dialog open={showSaveDialog} onOpenChange={setShowSaveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Save {examType === "mid" ? "Mid-Term" : "Semester"} Marks</DialogTitle>
            <DialogDescription>
              You are about to save marks for {Object.values(marks).filter((m) =>
                examType === "mid" ? m.mid_marks !== null : m.sem_marks !== null
              ).length}{" "}
              students.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            {lowPerformingStudents.length > 0 && (
              <div className="p-3 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <p className="text-sm text-amber-600 flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4" />
                  {lowPerformingStudents.length} student(s) scored below 40%
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSaveDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveMarks} disabled={saving}>
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <CheckCircle className="h-4 w-4 mr-2" />
              )}
              Confirm Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
