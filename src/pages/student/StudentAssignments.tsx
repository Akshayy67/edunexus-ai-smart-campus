import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Clock, Upload, CheckCircle, AlertTriangle, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Assessment {
  id: string;
  title: string;
  description: string | null;
  assessment_type: string;
  due_date: string;
  total_marks: number;
  status: string | null;
  course: {
    name: string;
    code: string;
  } | null;
  submission?: {
    id: string;
    status: string | null;
    submitted_at: string | null;
    marks_obtained: number | null;
    feedback: string | null;
  } | null;
}

export default function StudentAssignments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assessment[]>([]);
  const [selectedAssignment, setSelectedAssignment] = useState<Assessment | null>(null);
  const [submissionContent, setSubmissionContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [studentId, setStudentId] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchAssignments();
    }
  }, [user]);

  const fetchAssignments = async () => {
    try {
      // Get student record
      const { data: studentData } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (studentData) {
        setStudentId(studentData.id);
      }

      // Fetch assessments
      const { data: assessments, error } = await supabase
        .from("assessments")
        .select(`
          id,
          title,
          description,
          assessment_type,
          due_date,
          total_marks,
          status,
          course_id
        `)
        .eq("status", "published")
        .order("due_date", { ascending: true });

      if (error) throw error;

      const enrichedAssignments: Assessment[] = [];

      for (const assessment of assessments || []) {
        let course = null;
        let submission = null;

        if (assessment.course_id) {
          const { data: courseData } = await supabase
            .from("courses")
            .select("name, code")
            .eq("id", assessment.course_id)
            .maybeSingle();
          course = courseData;
        }

        if (studentData) {
          const { data: submissionData } = await supabase
            .from("assessment_submissions")
            .select("id, status, submitted_at, marks_obtained, feedback")
            .eq("assessment_id", assessment.id)
            .eq("student_id", studentData.id)
            .maybeSingle();
          submission = submissionData;
        }

        enrichedAssignments.push({ ...assessment, course, submission });
      }

      setAssignments(enrichedAssignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast({
        title: "Error",
        description: "Failed to load assignments",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!selectedAssignment || !studentId) return;

    setSubmitting(true);
    try {
      const now = new Date();
      const dueDate = new Date(selectedAssignment.due_date);
      const isLate = now > dueDate;

      const { error } = await supabase
        .from("assessment_submissions")
        .insert({
          assessment_id: selectedAssignment.id,
          student_id: studentId,
          submission_content: submissionContent,
          submitted_at: now.toISOString(),
          is_late: isLate,
          status: "submitted",
        });

      if (error) throw error;

      toast({
        title: "Assignment Submitted!",
        description: isLate ? "Your assignment was submitted late." : "Your assignment has been submitted successfully.",
      });

      setSelectedAssignment(null);
      setSubmissionContent("");
      fetchAssignments();
    } catch (error: any) {
      console.error("Error submitting:", error);
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit assignment",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (assignment: Assessment) => {
    if (assignment.submission) {
      if (assignment.submission.status === "graded") {
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Graded</Badge>;
      }
      return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Submitted</Badge>;
    }

    const dueDate = new Date(assignment.due_date);
    const now = new Date();
    const diffDays = Math.ceil((dueDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <Badge variant="destructive">Overdue</Badge>;
    }
    if (diffDays <= 2) {
      return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Due Soon</Badge>;
    }
    return <Badge variant="outline">Pending</Badge>;
  };

  const pendingAssignments = assignments.filter((a) => !a.submission);
  const submittedAssignments = assignments.filter((a) => a.submission);

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
        <h1 className="text-2xl font-bold text-foreground">My Assignments</h1>
        <p className="text-muted-foreground">View and submit your assignments</p>
      </div>

      <Tabs defaultValue="pending" className="w-full">
        <TabsList>
          <TabsTrigger value="pending">
            Pending ({pendingAssignments.length})
          </TabsTrigger>
          <TabsTrigger value="submitted">
            Submitted ({submittedAssignments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="pending" className="mt-6">
          {pendingAssignments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <p className="text-muted-foreground">All caught up! No pending assignments.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {pendingAssignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{assignment.title}</CardTitle>
                          {getStatusBadge(assignment)}
                        </div>
                        <CardDescription className="flex items-center gap-4">
                          <span className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            {assignment.course?.code} - {assignment.course?.name}
                          </span>
                          <Badge variant="secondary" className="capitalize">
                            {assignment.assessment_type}
                          </Badge>
                        </CardDescription>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-muted-foreground">Due Date</p>
                        <p className="font-medium flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {format(new Date(assignment.due_date), "MMM dd, yyyy")}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {assignment.description && (
                      <p className="text-sm text-muted-foreground mb-4">{assignment.description}</p>
                    )}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Total Marks: <span className="font-medium text-foreground">{assignment.total_marks}</span>
                      </span>
                      <Button onClick={() => setSelectedAssignment(assignment)}>
                        <Upload className="h-4 w-4 mr-2" />
                        Submit
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="submitted" className="mt-6">
          {submittedAssignments.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No submitted assignments yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {submittedAssignments.map((assignment) => (
                <Card key={assignment.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-lg">{assignment.title}</CardTitle>
                          {getStatusBadge(assignment)}
                        </div>
                        <CardDescription>
                          {assignment.course?.code} - {assignment.course?.name}
                        </CardDescription>
                      </div>
                      {assignment.submission?.marks_obtained !== null && (
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Score</p>
                          <p className="text-2xl font-bold text-primary">
                            {assignment.submission.marks_obtained}/{assignment.total_marks}
                          </p>
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Submitted:</span>
                        <span>
                          {assignment.submission?.submitted_at
                            ? format(new Date(assignment.submission.submitted_at), "MMM dd, yyyy 'at' h:mm a")
                            : "-"}
                        </span>
                      </div>
                      {assignment.submission?.feedback && (
                        <div className="mt-4 p-4 bg-muted rounded-lg">
                          <p className="font-medium mb-1">Faculty Feedback:</p>
                          <p className="text-muted-foreground">{assignment.submission.feedback}</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Submit Dialog */}
      <Dialog open={!!selectedAssignment} onOpenChange={() => setSelectedAssignment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Submit Assignment</DialogTitle>
            <DialogDescription>
              {selectedAssignment?.title} - {selectedAssignment?.course?.code}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-muted rounded-lg">
              <p className="text-sm text-muted-foreground">{selectedAssignment?.description}</p>
              <div className="flex items-center gap-4 mt-2 text-sm">
                <span>Due: {selectedAssignment?.due_date && format(new Date(selectedAssignment.due_date), "MMM dd, yyyy")}</span>
                <span>Marks: {selectedAssignment?.total_marks}</span>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Your Submission</label>
              <Textarea
                placeholder="Enter your answer or paste your work here..."
                value={submissionContent}
                onChange={(e) => setSubmissionContent(e.target.value)}
                rows={8}
                className="mt-2"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedAssignment(null)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={!submissionContent.trim() || submitting}>
              {submitting ? "Submitting..." : "Submit Assignment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
