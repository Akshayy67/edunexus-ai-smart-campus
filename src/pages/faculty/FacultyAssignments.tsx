import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, FileText, Users, Calendar, Eye } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";

interface Course {
  id: string;
  name: string;
  code: string;
}

interface Assessment {
  id: string;
  title: string;
  description: string | null;
  assessment_type: string;
  due_date: string;
  total_marks: number;
  status: string | null;
  course: Course | null;
  submissions_count: number;
}

interface Submission {
  id: string;
  status: string | null;
  submitted_at: string | null;
  marks_obtained: number | null;
  is_late: boolean | null;
  student: {
    first_name: string;
    last_name: string;
    roll_number: string;
  } | null;
}

export default function FacultyAssignments() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [facultyId, setFacultyId] = useState<string | null>(null);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showSubmissionsDialog, setShowSubmissionsDialog] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assessment_type: "assignment",
    course_id: "",
    due_date: "",
    total_marks: 100,
  });

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      // Get faculty record
      const { data: facultyData } = await supabase
        .from("faculty")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (facultyData) {
        setFacultyId(facultyData.id);

        // Fetch courses
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

        // Fetch assessments
        const { data: assessmentsData } = await supabase
          .from("assessments")
          .select("*")
          .eq("faculty_id", facultyData.id)
          .order("created_at", { ascending: false });

        const enrichedAssessments: Assessment[] = [];
        for (const assessment of assessmentsData || []) {
          let course = null;
          if (assessment.course_id) {
            const { data: courseData } = await supabase
              .from("courses")
              .select("id, name, code")
              .eq("id", assessment.course_id)
              .maybeSingle();
            course = courseData;
          }

          const { count } = await supabase
            .from("assessment_submissions")
            .select("*", { count: "exact", head: true })
            .eq("assessment_id", assessment.id);

          enrichedAssessments.push({
            ...assessment,
            course,
            submissions_count: count || 0,
          });
        }

        setAssessments(enrichedAssessments);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error",
        description: "Failed to load data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createAssessment = async () => {
    if (!facultyId || !formData.title || !formData.course_id || !formData.due_date) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase.from("assessments").insert({
        title: formData.title,
        description: formData.description,
        assessment_type: formData.assessment_type,
        course_id: formData.course_id,
        faculty_id: facultyId,
        due_date: formData.due_date,
        total_marks: formData.total_marks,
        status: "published",
      });

      if (error) throw error;

      toast({
        title: "Assessment Created",
        description: "The assignment has been published to students",
      });

      setShowCreateDialog(false);
      setFormData({
        title: "",
        description: "",
        assessment_type: "assignment",
        course_id: "",
        due_date: "",
        total_marks: 100,
      });
      fetchData();
    } catch (error: any) {
      console.error("Error creating assessment:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to create assessment",
        variant: "destructive",
      });
    }
  };

  const viewSubmissions = async (assessment: Assessment) => {
    setSelectedAssessment(assessment);
    setShowSubmissionsDialog(true);

    try {
      const { data } = await supabase
        .from("assessment_submissions")
        .select("id, status, submitted_at, marks_obtained, is_late, student_id")
        .eq("assessment_id", assessment.id);

      const enrichedSubmissions: Submission[] = [];
      for (const sub of data || []) {
        const { data: student } = await supabase
          .from("students")
          .select("first_name, last_name, roll_number")
          .eq("id", sub.student_id)
          .maybeSingle();

        enrichedSubmissions.push({ ...sub, student });
      }

      setSubmissions(enrichedSubmissions);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case "published":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Published</Badge>;
      case "draft":
        return <Badge variant="secondary">Draft</Badge>;
      case "closed":
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Assignments</h1>
          <p className="text-muted-foreground">Create and manage student assignments</p>
        </div>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Assignment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Assignment</DialogTitle>
              <DialogDescription>
                Create an assignment for your students
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div>
                <label className="text-sm font-medium">Title *</label>
                <Input
                  placeholder="Assignment title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Assignment description and instructions..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="mt-1"
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Course *</label>
                  <Select
                    value={formData.course_id}
                    onValueChange={(v) => setFormData({ ...formData, course_id: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select course" />
                    </SelectTrigger>
                    <SelectContent>
                      {courses.map((course) => (
                        <SelectItem key={course.id} value={course.id}>
                          {course.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium">Type</label>
                  <Select
                    value={formData.assessment_type}
                    onValueChange={(v) => setFormData({ ...formData, assessment_type: v })}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="assignment">Assignment</SelectItem>
                      <SelectItem value="quiz">Quiz</SelectItem>
                      <SelectItem value="project">Project</SelectItem>
                      <SelectItem value="exam">Exam</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Due Date *</label>
                  <Input
                    type="datetime-local"
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    className="mt-1"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Total Marks</label>
                  <Input
                    type="number"
                    value={formData.total_marks}
                    onChange={(e) => setFormData({ ...formData, total_marks: parseInt(e.target.value) || 100 })}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button onClick={createAssessment}>Create Assignment</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Assignments List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            All Assignments
          </CardTitle>
          <CardDescription>{assessments.length} assignments created</CardDescription>
        </CardHeader>
        <CardContent>
          {assessments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No assignments created yet</p>
              <Button className="mt-4" onClick={() => setShowCreateDialog(true)}>
                Create Your First Assignment
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Course</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Submissions</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {assessments.map((assessment) => (
                  <TableRow key={assessment.id}>
                    <TableCell className="font-medium">{assessment.title}</TableCell>
                    <TableCell>{assessment.course?.code || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">
                        {assessment.assessment_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(assessment.due_date), "MMM dd, yyyy")}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {assessment.submissions_count}
                      </div>
                    </TableCell>
                    <TableCell>{getStatusBadge(assessment.status)}</TableCell>
                    <TableCell>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => viewSubmissions(assessment)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Submissions Dialog */}
      <Dialog open={showSubmissionsDialog} onOpenChange={setShowSubmissionsDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Submissions - {selectedAssessment?.title}</DialogTitle>
            <DialogDescription>
              {submissions.length} submissions received
            </DialogDescription>
          </DialogHeader>
          <div className="max-h-96 overflow-y-auto">
            {submissions.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No submissions yet</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Roll No</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Marks</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {submissions.map((sub) => (
                    <TableRow key={sub.id}>
                      <TableCell>{sub.student?.roll_number || "-"}</TableCell>
                      <TableCell>
                        {sub.student
                          ? `${sub.student.first_name} ${sub.student.last_name}`
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {sub.submitted_at
                          ? format(new Date(sub.submitted_at), "MMM dd, h:mm a")
                          : "-"}
                        {sub.is_late && (
                          <Badge variant="destructive" className="ml-2 text-xs">Late</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant={sub.status === "graded" ? "default" : "secondary"}>
                          {sub.status || "pending"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {sub.marks_obtained !== null
                          ? `${sub.marks_obtained}/${selectedAssessment?.total_marks}`
                          : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
          <DialogFooter>
            <Button onClick={() => setShowSubmissionsDialog(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
