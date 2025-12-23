import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Award, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface MarkEntry {
  id: string;
  title: string;
  type: string;
  marks_obtained: number;
  total_marks: number;
  percentage: number;
  feedback: string | null;
  course: {
    name: string;
    code: string;
  } | null;
}

interface SubjectSummary {
  courseId: string;
  courseName: string;
  courseCode: string;
  totalObtained: number;
  totalMarks: number;
  percentage: number;
  assessmentCount: number;
}

export default function StudentMarks() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [marks, setMarks] = useState<MarkEntry[]>([]);
  const [subjectSummaries, setSubjectSummaries] = useState<SubjectSummary[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<string>("all");
  const [overallStats, setOverallStats] = useState({
    totalObtained: 0,
    totalMarks: 0,
    percentage: 0,
    totalAssessments: 0,
  });

  useEffect(() => {
    if (user) {
      fetchMarks();
    }
  }, [user]);

  const fetchMarks = async () => {
    try {
      // Get student record
      const { data: studentData } = await supabase
        .from("students")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (!studentData) {
        setLoading(false);
        return;
      }

      // Fetch graded submissions
      const { data: submissions, error } = await supabase
        .from("assessment_submissions")
        .select(`
          id,
          marks_obtained,
          feedback,
          assessment_id
        `)
        .eq("student_id", studentData.id)
        .eq("status", "graded")
        .not("marks_obtained", "is", null);

      if (error) throw error;

      const markEntries: MarkEntry[] = [];
      const courseSummaries: Record<string, SubjectSummary> = {};

      for (const submission of submissions || []) {
        const { data: assessment } = await supabase
          .from("assessments")
          .select("title, assessment_type, total_marks, course_id")
          .eq("id", submission.assessment_id)
          .maybeSingle();

        if (!assessment) continue;

        let course = null;
        if (assessment.course_id) {
          const { data: courseData } = await supabase
            .from("courses")
            .select("name, code")
            .eq("id", assessment.course_id)
            .maybeSingle();
          course = courseData;
        }

        const percentage = Math.round((submission.marks_obtained! / assessment.total_marks) * 100);

        markEntries.push({
          id: submission.id,
          title: assessment.title,
          type: assessment.assessment_type,
          marks_obtained: submission.marks_obtained!,
          total_marks: assessment.total_marks,
          percentage,
          feedback: submission.feedback,
          course,
        });

        // Aggregate by course
        if (assessment.course_id) {
          if (!courseSummaries[assessment.course_id]) {
            courseSummaries[assessment.course_id] = {
              courseId: assessment.course_id,
              courseName: course?.name || "Unknown",
              courseCode: course?.code || "",
              totalObtained: 0,
              totalMarks: 0,
              percentage: 0,
              assessmentCount: 0,
            };
          }
          courseSummaries[assessment.course_id].totalObtained += submission.marks_obtained!;
          courseSummaries[assessment.course_id].totalMarks += assessment.total_marks;
          courseSummaries[assessment.course_id].assessmentCount++;
        }
      }

      // Calculate percentages
      Object.values(courseSummaries).forEach((summary) => {
        summary.percentage = summary.totalMarks > 0
          ? Math.round((summary.totalObtained / summary.totalMarks) * 100)
          : 0;
      });

      setMarks(markEntries);
      setSubjectSummaries(Object.values(courseSummaries));

      // Calculate overall stats
      const overall = Object.values(courseSummaries).reduce(
        (acc, summary) => ({
          totalObtained: acc.totalObtained + summary.totalObtained,
          totalMarks: acc.totalMarks + summary.totalMarks,
          percentage: 0,
          totalAssessments: acc.totalAssessments + summary.assessmentCount,
        }),
        { totalObtained: 0, totalMarks: 0, percentage: 0, totalAssessments: 0 }
      );
      overall.percentage = overall.totalMarks > 0
        ? Math.round((overall.totalObtained / overall.totalMarks) * 100)
        : 0;
      setOverallStats(overall);
    } catch (error) {
      console.error("Error fetching marks:", error);
      toast({
        title: "Error",
        description: "Failed to load marks",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getGradeBadge = (percentage: number) => {
    if (percentage >= 90) return <Badge className="bg-green-500">A+</Badge>;
    if (percentage >= 80) return <Badge className="bg-green-400">A</Badge>;
    if (percentage >= 70) return <Badge className="bg-blue-500">B</Badge>;
    if (percentage >= 60) return <Badge className="bg-yellow-500">C</Badge>;
    if (percentage >= 50) return <Badge className="bg-orange-500">D</Badge>;
    return <Badge variant="destructive">F</Badge>;
  };

  const getPerformanceIcon = (percentage: number) => {
    if (percentage >= 70) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (percentage >= 50) return <Minus className="h-4 w-4 text-yellow-500" />;
    return <TrendingDown className="h-4 w-4 text-destructive" />;
  };

  const filteredMarks = selectedSubject === "all"
    ? marks
    : marks.filter((m) => m.course?.code === selectedSubject);

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
        <h1 className="text-2xl font-bold text-foreground">My Marks</h1>
        <p className="text-muted-foreground">View your grades and feedback</p>
      </div>

      {/* Overall Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Overall Percentage</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className="text-3xl font-bold text-foreground">{overallStats.percentage}%</div>
              {getGradeBadge(overallStats.percentage)}
            </div>
            <Progress value={overallStats.percentage} className="mt-2" />
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Marks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">
              {overallStats.totalObtained}/{overallStats.totalMarks}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assessments Graded</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{overallStats.totalAssessments}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Subjects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{subjectSummaries.length}</div>
          </CardContent>
        </Card>
      </div>

      {/* Subject-wise Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Subject-wise Performance</CardTitle>
          <CardDescription>Your marks breakdown by subject</CardDescription>
        </CardHeader>
        <CardContent>
          {subjectSummaries.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No graded assessments yet</p>
          ) : (
            <div className="space-y-4">
              {subjectSummaries.map((subject) => (
                <div key={subject.courseId} className="flex items-center justify-between p-4 rounded-lg border border-border">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-primary" />
                      <span className="font-medium text-foreground">{subject.courseName}</span>
                      <Badge variant="outline">{subject.courseCode}</Badge>
                    </div>
                    <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                      <span>Marks: {subject.totalObtained}/{subject.totalMarks}</span>
                      <span>Assessments: {subject.assessmentCount}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    {getPerformanceIcon(subject.percentage)}
                    <div className="w-24">
                      <Progress value={subject.percentage} />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold">{subject.percentage}%</span>
                      {getGradeBadge(subject.percentage)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed Marks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Detailed Marks</CardTitle>
              <CardDescription>Individual assessment scores</CardDescription>
            </div>
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filter by subject" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Subjects</SelectItem>
                {subjectSummaries.map((subject) => (
                  <SelectItem key={subject.courseCode} value={subject.courseCode}>
                    {subject.courseCode}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredMarks.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No graded assessments found</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Assessment</TableHead>
                  <TableHead>Subject</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Marks</TableHead>
                  <TableHead>Percentage</TableHead>
                  <TableHead>Grade</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredMarks.map((mark) => (
                  <TableRow key={mark.id}>
                    <TableCell>
                      <div>
                        <span className="font-medium">{mark.title}</span>
                        {mark.feedback && (
                          <p className="text-xs text-muted-foreground mt-1 max-w-xs truncate">
                            Feedback: {mark.feedback}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{mark.course?.code || "-"}</TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="capitalize">{mark.type}</Badge>
                    </TableCell>
                    <TableCell className="font-medium">
                      {mark.marks_obtained}/{mark.total_marks}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getPerformanceIcon(mark.percentage)}
                        {mark.percentage}%
                      </div>
                    </TableCell>
                    <TableCell>{getGradeBadge(mark.percentage)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
