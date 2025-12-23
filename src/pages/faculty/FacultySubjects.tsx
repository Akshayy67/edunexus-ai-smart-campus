import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { BookOpen, Users, Calendar, Search, GraduationCap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface CourseAssignment {
  id: string;
  academic_year: string;
  semester: number;
  role: string | null;
  course: {
    id: string;
    name: string;
    code: string;
    credits: number;
    semester: number;
  } | null;
  batch: {
    id: string;
    name: string;
    current_semester: number | null;
    program: {
      name: string;
      code: string;
    } | null;
  } | null;
}

export default function FacultySubjects() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");

  const { data: assignments, isLoading } = useQuery({
    queryKey: ["faculty-subjects", user?.id],
    queryFn: async () => {
      // First get the faculty record
      const { data: facultyData } = await supabase
        .from("faculty")
        .select("id")
        .eq("user_id", user?.id)
        .maybeSingle();

      if (!facultyData) return [];

      // Then get course assignments
      const { data, error } = await supabase
        .from("course_assignments")
        .select(`
          id,
          academic_year,
          semester,
          role,
          course_id,
          batch_id
        `)
        .eq("faculty_id", facultyData.id);

      if (error) throw error;

      // Enrich with course and batch details
      const enrichedAssignments: CourseAssignment[] = [];

      for (const assignment of data || []) {
        let course = null;
        let batch = null;

        if (assignment.course_id) {
          const { data: courseData } = await supabase
            .from("courses")
            .select("id, name, code, credits, semester")
            .eq("id", assignment.course_id)
            .maybeSingle();
          course = courseData;
        }

        if (assignment.batch_id) {
          const { data: batchData } = await supabase
            .from("batches")
            .select("id, name, current_semester, program_id")
            .eq("id", assignment.batch_id)
            .maybeSingle();

          if (batchData?.program_id) {
            const { data: programData } = await supabase
              .from("programs")
              .select("name, code")
              .eq("id", batchData.program_id)
              .maybeSingle();
            batch = { ...batchData, program: programData };
          } else {
            batch = { ...batchData, program: null };
          }
        }

        enrichedAssignments.push({ ...assignment, course, batch });
      }

      return enrichedAssignments;
    },
    enabled: !!user?.id,
  });

  const filteredAssignments = assignments?.filter((assignment) => {
    const searchLower = searchTerm.toLowerCase();
    return (
      assignment.course?.name.toLowerCase().includes(searchLower) ||
      assignment.course?.code.toLowerCase().includes(searchLower) ||
      assignment.batch?.name.toLowerCase().includes(searchLower) ||
      assignment.batch?.program?.name.toLowerCase().includes(searchLower)
    );
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Subjects</h1>
        <p className="text-muted-foreground">View all courses assigned to you</p>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search subjects..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{assignments?.length || 0}</p>
                <p className="text-sm text-muted-foreground">Total Subjects</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-green-500/10">
                <GraduationCap className="h-6 w-6 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {new Set(assignments?.map((a) => a.batch?.id)).size || 0}
                </p>
                <p className="text-sm text-muted-foreground">Batches</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-lg bg-blue-500/10">
                <Calendar className="h-6 w-6 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {assignments?.[0]?.academic_year || new Date().getFullYear()}
                </p>
                <p className="text-sm text-muted-foreground">Academic Year</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Subjects List */}
      <Card>
        <CardHeader>
          <CardTitle>Assigned Courses</CardTitle>
          <CardDescription>All courses you are teaching this semester</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredAssignments?.length === 0 ? (
            <div className="text-center py-12">
              <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No subjects assigned yet</p>
              <p className="text-sm text-muted-foreground mt-2">
                Contact admin to get subjects assigned
              </p>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {filteredAssignments?.map((assignment) => (
                <Card key={assignment.id} className="border border-border">
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-foreground">
                            {assignment.course?.name || "Unknown Course"}
                          </h3>
                          <p className="text-sm text-muted-foreground">
                            {assignment.course?.code}
                          </p>
                        </div>
                        <Badge variant="outline">
                          {assignment.role === "primary" ? "Primary" : assignment.role}
                        </Badge>
                      </div>

                      <div className="space-y-2 text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <GraduationCap className="h-4 w-4" />
                          <span>
                            {assignment.batch?.program?.name} - {assignment.batch?.name}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="h-4 w-4" />
                          <span>Semester {assignment.semester}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <BookOpen className="h-4 w-4" />
                          <span>{assignment.course?.credits} Credits</span>
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Users className="h-4 w-4 mr-1" />
                          Students
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
