import { useState } from "react";
import { 
  FileText, 
  Plus, 
  Calendar, 
  Clock, 
  Users, 
  Filter,
  CheckCircle2,
  AlertCircle,
  Upload
} from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface Assessment {
  id: string;
  title: string;
  course: string;
  courseCode: string;
  type: "assignment" | "quiz" | "project" | "exam";
  dueDate: string;
  totalMarks: number;
  submissions: number;
  totalStudents: number;
  status: "active" | "grading" | "completed";
}

const assessments: Assessment[] = [
  { id: "1", title: "Binary Tree Implementation", course: "Data Structures", courseCode: "CS201", type: "assignment", dueDate: "Dec 25, 2024", totalMarks: 100, submissions: 38, totalStudents: 45, status: "active" },
  { id: "2", title: "SQL Query Optimization", course: "Database Systems", courseCode: "CS301", type: "project", dueDate: "Dec 28, 2024", totalMarks: 150, submissions: 25, totalStudents: 52, status: "active" },
  { id: "3", title: "Neural Network Basics", course: "Machine Learning", courseCode: "CS401", type: "quiz", dueDate: "Dec 23, 2024", totalMarks: 50, submissions: 38, totalStudents: 38, status: "grading" },
  { id: "4", title: "Midterm Examination", course: "Software Engineering", courseCode: "CS302", type: "exam", dueDate: "Dec 20, 2024", totalMarks: 100, submissions: 48, totalStudents: 48, status: "completed" },
  { id: "5", title: "Graph Algorithms", course: "Algorithms", courseCode: "CS303", type: "assignment", dueDate: "Dec 30, 2024", totalMarks: 80, submissions: 12, totalStudents: 40, status: "active" },
  { id: "6", title: "ER Diagram Design", course: "Database Systems", courseCode: "CS301", type: "assignment", dueDate: "Dec 22, 2024", totalMarks: 60, submissions: 52, totalStudents: 52, status: "completed" },
];

const typeConfig = {
  assignment: { label: "Assignment", color: "bg-primary/10 text-primary" },
  quiz: { label: "Quiz", color: "bg-amber-500/10 text-amber-600" },
  project: { label: "Project", color: "bg-emerald-500/10 text-emerald-600" },
  exam: { label: "Exam", color: "bg-destructive/10 text-destructive" },
};

const statusConfig = {
  active: { label: "Active", variant: "default" as const, icon: Clock },
  grading: { label: "Grading", variant: "secondary" as const, icon: FileText },
  completed: { label: "Completed", variant: "outline" as const, icon: CheckCircle2 },
};

const Assessments = () => {
  const [activeTab, setActiveTab] = useState("all");

  const filteredAssessments = activeTab === "all" 
    ? assessments 
    : assessments.filter(a => a.status === activeTab);

  return (
    <AppLayout>
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Assessments</h1>
          <p className="text-muted-foreground mt-1">
            Manage assignments, quizzes, projects, and exams
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Create Assessment
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-4 mb-8">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold">{assessments.filter(a => a.status === "active").length}</p>
              </div>
              <Clock className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pending Grading</p>
                <p className="text-2xl font-bold">{assessments.filter(a => a.status === "grading").length}</p>
              </div>
              <FileText className="h-8 w-8 text-amber-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold">{assessments.filter(a => a.status === "completed").length}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-emerald-500/20" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Submissions</p>
                <p className="text-2xl font-bold">{assessments.reduce((acc, a) => acc + a.submissions, 0)}</p>
              </div>
              <Upload className="h-8 w-8 text-primary/20" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="grading">Grading</TabsTrigger>
          <TabsTrigger value="completed">Completed</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          <AssessmentGrid assessments={assessments} />
        </TabsContent>
        <TabsContent value="active" className="space-y-4">
          <AssessmentGrid assessments={assessments.filter(a => a.status === "active")} />
        </TabsContent>
        <TabsContent value="grading" className="space-y-4">
          <AssessmentGrid assessments={assessments.filter(a => a.status === "grading")} />
        </TabsContent>
        <TabsContent value="completed" className="space-y-4">
          <AssessmentGrid assessments={assessments.filter(a => a.status === "completed")} />
        </TabsContent>
      </Tabs>
    </AppLayout>
  );
};

function AssessmentGrid({ assessments }: { assessments: Assessment[] }) {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {assessments.map((assessment) => {
        const typeConf = typeConfig[assessment.type];
        const statusConf = statusConfig[assessment.status];
        const StatusIcon = statusConf.icon;
        const progress = (assessment.submissions / assessment.totalStudents) * 100;

        return (
          <Card key={assessment.id} className="hover:shadow-md transition-shadow cursor-pointer">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Badge className={cn("text-xs", typeConf.color)}>
                      {typeConf.label}
                    </Badge>
                    <Badge variant={statusConf.variant} className="text-xs gap-1">
                      <StatusIcon className="h-3 w-3" />
                      {statusConf.label}
                    </Badge>
                  </div>
                  <CardTitle className="text-base leading-tight">{assessment.title}</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="font-medium">{assessment.courseCode}</span>
                <span>•</span>
                <span>{assessment.course}</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="h-4 w-4" />
                  <span>{assessment.dueDate}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>{assessment.totalMarks} marks</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Submissions</span>
                  <span className="font-medium">{assessment.submissions}/{assessment.totalStudents}</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

export default Assessments;
