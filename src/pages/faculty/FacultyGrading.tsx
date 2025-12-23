import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ClipboardCheck, Eye, Save, CheckCircle, AlertTriangle, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface Submission {
  id: string;
  submission_content: string | null;
  submitted_at: string | null;
  marks_obtained: number | null;
  feedback: string | null;
  is_late: boolean | null;
  status: string | null;
  student: {
    first_name: string;
    last_name: string;
    roll_number: string;
  } | null;
  assessment: {
    title: string;
    total_marks: number;
    course: {
      code: string;
    } | null;
  } | null;
  risk_category?: string;
}

export default function FacultyGrading() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [showGradeDialog, setShowGradeDialog] = useState(false);
  const [gradeData, setGradeData] = useState({
    marks: 0,
    feedback: "",
  });
  const [facultyId, setFacultyId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchSubmissions();
    }
  }, [user]);

  const fetchSubmissions = async () => {
    try {
      // Get faculty record
      const { data: facultyData } = await supabase
        .from("faculty")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (facultyData) {
        setFacultyId(facultyData.id);

        // Fetch assessments by this faculty
        const { data: assessments } = await supabase
          .from("assessments")
          .select("id, title, total_marks, course_id")
          .eq("faculty_id", facultyData.id);

        if (!assessments || assessments.length === 0) {
          setLoading(false);
          return;
        }

        const assessmentIds = assessments.map((a) => a.id);

        // Fetch all submissions for these assessments
        const { data: submissionsData } = await supabase
          .from("assessment_submissions")
          .select("*")
          .in("assessment_id", assessmentIds)
          .order("submitted_at", { ascending: false });

        const enrichedSubmissions: Submission[] = [];

        for (const sub of submissionsData || []) {
          const assessment = assessments.find((a) => a.id === sub.assessment_id);
          
          let student = null;
          let riskCategory = undefined;
          if (sub.student_id) {
            const { data: studentData } = await supabase
              .from("students")
              .select("first_name, last_name, roll_number")
              .eq("id", sub.student_id)
              .maybeSingle();
            student = studentData;

            // Get risk score
            const { data: riskData } = await supabase
              .from("ai_risk_scores")
              .select("risk_category")
              .eq("student_id", sub.student_id)
              .order("calculated_at", { ascending: false })
              .limit(1)
              .maybeSingle();
            riskCategory = riskData?.risk_category;
          }

          let course = null;
          if (assessment?.course_id) {
            const { data: courseData } = await supabase
              .from("courses")
              .select("code")
              .eq("id", assessment.course_id)
              .maybeSingle();
            course = courseData;
          }

          enrichedSubmissions.push({
            ...sub,
            student,
            assessment: assessment
              ? { title: assessment.title, total_marks: assessment.total_marks, course }
              : null,
            risk_category: riskCategory,
          });
        }

        setSubmissions(enrichedSubmissions);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
      toast({
        title: "Error",
        description: "Failed to load submissions",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openGradeDialog = (submission: Submission) => {
    setSelectedSubmission(submission);
    setGradeData({
      marks: submission.marks_obtained || 0,
      feedback: submission.feedback || "",
    });
    setShowGradeDialog(true);
  };

  const saveGrade = async () => {
    if (!selectedSubmission || !facultyId) return;

    try {
      const { error } = await supabase
        .from("assessment_submissions")
        .update({
          marks_obtained: gradeData.marks,
          feedback: gradeData.feedback,
          status: "graded",
          graded_at: new Date().toISOString(),
          graded_by: facultyId,
        })
        .eq("id", selectedSubmission.id);

      if (error) throw error;

      toast({
        title: "Grade Saved",
        description: "The submission has been graded successfully",
      });

      setShowGradeDialog(false);
      fetchSubmissions();
    } catch (error: any) {
      console.error("Error saving grade:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save grade",
        variant: "destructive",
      });
    }
  };

  const pendingSubmissions = submissions.filter((s) => s.status !== "graded");
  const gradedSubmissions = submissions.filter((s) => s.status === "graded");
  const lowPerformingGraded = gradedSubmissions.filter(
    (s) => s.marks_obtained !== null && s.assessment?.total_marks && 
           (s.marks_obtained / s.assessment.total_marks) < 0.4
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Grading</h1>
        <p className="text-muted-foreground">Review and grade student submissions</p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{pendingSubmissions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Graded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{gradedSubmissions.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{submissions.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Low Performing Students Alert */}
      {lowPerformingGraded.length > 0 && (
        <Card className="border-amber-500/50 bg-amber-500/5">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Students Needing Improvement
            </CardTitle>
            <CardDescription>
              {lowPerformingGraded.length} student(s) scored below 40% - consider reaching out for support
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {lowPerformingGraded.slice(0, 8).map((submission) => (
                <Badge key={submission.id} variant="outline" className="bg-amber-500/10">
                  <TrendingDown className="h-3 w-3 mr-1" />
                  {submission.student?.roll_number} - {submission.student?.first_name}
                  <span className="ml-1 text-xs opacity-70">
                    ({Math.round((submission.marks_obtained! / submission.assessment!.total_marks) * 100)}%)
                  </span>
                </Badge>
              ))}
              {lowPerformingGraded.length > 8 && (
                <Badge variant="outline">+{lowPerformingGraded.length - 8} more</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Pending Submissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardCheck className="h-5 w-5" />
            Pending Review
          </CardTitle>
          <CardDescription>Submissions awaiting your review and grading</CardDescription>
        </CardHeader>
        <CardContent>
          {pendingSubmissions.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
              <p className="text-muted-foreground">All submissions have been graded!</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Risk</TableHead>
                  <TableHead>Submitted</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingSubmissions.map((submission) => (
                  <TableRow key={submission.id} className={cn(
                    submission.risk_category === "high" || submission.risk_category === "critical" 
                      ? "bg-amber-500/5" 
                      : ""
                  )}>
                    <TableCell>
                      <div>
                        <div className="font-medium">
                          {submission.student
                            ? `${submission.student.first_name} ${submission.student.last_name}`
                            : "-"}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {submission.student?.roll_number}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{submission.assessment?.title || "-"}</TableCell>
                    <TableCell>{submission.assessment?.course?.code || "-"}</TableCell>
                    <TableCell>
                      {submission.risk_category ? (
                        <Badge
                          variant="outline"
                          className={cn({
                            "text-green-500 bg-green-500/10": submission.risk_category === "low",
                            "text-amber-500 bg-amber-500/10": submission.risk_category === "moderate",
                            "text-orange-500 bg-orange-500/10": submission.risk_category === "high",
                            "text-destructive bg-destructive/10": submission.risk_category === "critical",
                          })}
                        >
                          {submission.risk_category === "high" || submission.risk_category === "critical" ? (
                            <AlertTriangle className="h-3 w-3 mr-1" />
                          ) : null}
                          {submission.risk_category}
                        </Badge>
                      ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {submission.submitted_at
                        ? format(new Date(submission.submitted_at), "MMM dd, h:mm a")
                        : "-"}
                      {submission.is_late && (
                        <Badge variant="destructive" className="ml-2 text-xs">Late</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">Pending</Badge>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" onClick={() => openGradeDialog(submission)}>
                        <Eye className="h-4 w-4 mr-1" />
                        Grade
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Recently Graded */}
      {gradedSubmissions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recently Graded</CardTitle>
            <CardDescription>Submissions you have already graded</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Student</TableHead>
                  <TableHead>Assignment</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {gradedSubmissions.slice(0, 10).map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell>
                      {submission.student
                        ? `${submission.student.first_name} ${submission.student.last_name}`
                        : "-"}
                    </TableCell>
                    <TableCell>{submission.assessment?.title || "-"}</TableCell>
                    <TableCell>
                      <span className="font-medium">
                        {submission.marks_obtained}/{submission.assessment?.total_marks}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="outline" onClick={() => openGradeDialog(submission)}>
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Grade Dialog */}
      <Dialog open={showGradeDialog} onOpenChange={setShowGradeDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Grade Submission</DialogTitle>
            <DialogDescription>
              {selectedSubmission?.student?.first_name} {selectedSubmission?.student?.last_name} - {selectedSubmission?.assessment?.title}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 bg-muted rounded-lg max-h-48 overflow-y-auto">
              <h4 className="font-medium mb-2">Student's Submission:</h4>
              <p className="text-sm whitespace-pre-wrap">
                {selectedSubmission?.submission_content || "No content submitted"}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Marks (out of {selectedSubmission?.assessment?.total_marks})</label>
                <Input
                  type="number"
                  min={0}
                  max={selectedSubmission?.assessment?.total_marks || 100}
                  value={gradeData.marks}
                  onChange={(e) => setGradeData({ ...gradeData, marks: parseInt(e.target.value) || 0 })}
                  className="mt-1"
                />
              </div>
              <div className="flex items-end">
                <Badge variant={gradeData.marks >= (selectedSubmission?.assessment?.total_marks || 100) * 0.5 ? "default" : "destructive"}>
                  {Math.round((gradeData.marks / (selectedSubmission?.assessment?.total_marks || 100)) * 100)}%
                </Badge>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Feedback</label>
              <Textarea
                placeholder="Provide feedback to the student..."
                value={gradeData.feedback}
                onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
                className="mt-1"
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowGradeDialog(false)}>
              Cancel
            </Button>
            <Button onClick={saveGrade}>
              <Save className="h-4 w-4 mr-2" />
              Save Grade
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
