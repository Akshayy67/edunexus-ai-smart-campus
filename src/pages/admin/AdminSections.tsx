import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Users, Trash2, UserPlus, X, Search } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";

export default function AdminSections() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isManageStudentsOpen, setIsManageStudentsOpen] = useState(false);
  const [selectedSection, setSelectedSection] = useState<any>(null);
  const [studentSearch, setStudentSearch] = useState("");
  const [selectedStudents, setSelectedStudents] = useState<string[]>([]);
  const [formData, setFormData] = useState({
    batch_id: "",
    section_name: "A",
    display_name: "",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sections, isLoading } = useQuery({
    queryKey: ["admin-sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sections")
        .select(`
          *,
          batches:batch_id(name, program_id, current_semester, programs:program_id(name, code))
        `)
        .order("section_name");
      if (error) throw error;
      return data;
    },
  });

  const { data: batches } = useQuery({
    queryKey: ["batches-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("batches")
        .select("*, programs:program_id(name, code)")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: enrollmentCounts } = useQuery({
    queryKey: ["enrollment-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_enrollments")
        .select("section_id")
        .eq("status", "active");
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data?.forEach((e) => {
        counts[e.section_id] = (counts[e.section_id] || 0) + 1;
      });
      return counts;
    },
  });

  const { data: allStudents } = useQuery({
    queryKey: ["all-students"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("students")
        .select("id, first_name, last_name, roll_number, email")
        .eq("status", "active")
        .order("roll_number");
      if (error) throw error;
      return data;
    },
  });

  const { data: sectionEnrollments, refetch: refetchEnrollments } = useQuery({
    queryKey: ["section-enrollments", selectedSection?.id],
    enabled: !!selectedSection,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("student_enrollments")
        .select("*, students:student_id(id, first_name, last_name, roll_number)")
        .eq("section_id", selectedSection.id)
        .eq("status", "active");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("sections").insert([{
        batch_id: data.batch_id,
        section_name: data.section_name,
        display_name: data.display_name || null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sections"] });
      toast({ title: "Success", description: "Section created" });
      setIsAddDialogOpen(false);
      setFormData({ batch_id: "", section_name: "A", display_name: "" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("sections").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-sections"] });
      toast({ title: "Success", description: "Section deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const enrollStudentsMutation = useMutation({
    mutationFn: async ({ sectionId, studentIds }: { sectionId: string; studentIds: string[] }) => {
      const currentYear = new Date().getFullYear();
      const academicYear = `${currentYear}-${currentYear + 1}`;
      const semester = selectedSection?.batches?.current_semester || 1;
      
      const enrollments = studentIds.map((studentId) => ({
        student_id: studentId,
        section_id: sectionId,
        academic_year: academicYear,
        semester: semester,
        status: "active",
      }));

      const { error } = await supabase.from("student_enrollments").insert(enrollments);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["enrollment-counts"] });
      toast({ title: "Success", description: "Students enrolled successfully" });
      setSelectedStudents([]);
      refetchEnrollments();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const removeEnrollmentMutation = useMutation({
    mutationFn: async (enrollmentId: string) => {
      const { error } = await supabase
        .from("student_enrollments")
        .update({ status: "inactive" })
        .eq("id", enrollmentId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["section-enrollments"] });
      queryClient.invalidateQueries({ queryKey: ["enrollment-counts"] });
      toast({ title: "Success", description: "Student removed from section" });
      refetchEnrollments();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const openManageStudents = (section: any) => {
    setSelectedSection(section);
    setIsManageStudentsOpen(true);
    setSelectedStudents([]);
    setStudentSearch("");
  };

  const enrolledStudentIds = sectionEnrollments?.map((e: any) => e.student_id) || [];
  
  const filteredStudents = allStudents?.filter((student) => {
    const matchesSearch = 
      student.first_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.last_name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      student.roll_number.toLowerCase().includes(studentSearch.toLowerCase());
    const notEnrolled = !enrolledStudentIds.includes(student.id);
    return matchesSearch && notEnrolled;
  }) || [];

  const toggleStudent = (studentId: string) => {
    setSelectedStudents((prev) =>
      prev.includes(studentId)
        ? prev.filter((id) => id !== studentId)
        : [...prev, studentId]
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Classes / Sections</h1>
          <p className="text-muted-foreground mt-1">Manage class sections and student assignments</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Section</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Section</DialogTitle>
              <DialogDescription>Add a new class section</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Batch / Year</Label>
                <Select 
                  value={formData.batch_id} 
                  onValueChange={(v) => setFormData({ ...formData, batch_id: v })}
                >
                  <SelectTrigger><SelectValue placeholder="Select batch" /></SelectTrigger>
                  <SelectContent>
                    {batches?.map((batch: any) => (
                      <SelectItem key={batch.id} value={batch.id}>
                        {batch.name} ({batch.programs?.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Section Name</Label>
                  <Select 
                    value={formData.section_name} 
                    onValueChange={(v) => setFormData({ ...formData, section_name: v })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["A", "B", "C", "D", "E", "F"].map((s) => (
                        <SelectItem key={s} value={s}>Section {s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Display Name (Optional)</Label>
                  <Input 
                    placeholder="e.g., CSE-A 2024"
                    value={formData.display_name}
                    onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={() => addMutation.mutate(formData)} 
                disabled={!formData.batch_id || addMutation.isPending}
              >
                Create Section
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading sections...</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Sections</CardTitle>
            <CardDescription>
              {sections?.length || 0} sections configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Section</TableHead>
                  <TableHead>Batch / Program</TableHead>
                  <TableHead>Students</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sections?.map((section: any) => (
                  <TableRow key={section.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {section.display_name || `Section ${section.section_name}`}
                        </span>
                        <Badge variant="secondary">{section.section_name}</Badge>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div>{section.batches?.name}</div>
                        <div className="text-sm text-muted-foreground">
                          {section.batches?.programs?.name}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {enrollmentCounts?.[section.id] || 0} students
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => openManageStudents(section)}
                        >
                          <UserPlus className="h-4 w-4 mr-1" />
                          Manage Students
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => deleteMutation.mutate(section.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {sections?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      No sections created yet. Click "Add Section" to create one.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Manage Students Dialog */}
      <Dialog open={isManageStudentsOpen} onOpenChange={setIsManageStudentsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Manage Students - {selectedSection?.display_name || `Section ${selectedSection?.section_name}`}
            </DialogTitle>
            <DialogDescription>
              Add or remove students from this section
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-4">
            {/* Currently Enrolled */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Enrolled Students ({sectionEnrollments?.length || 0})</h4>
              <ScrollArea className="h-[300px] border rounded-md p-2">
                {sectionEnrollments?.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">No students enrolled</p>
                ) : (
                  <div className="space-y-2">
                    {sectionEnrollments?.map((enrollment: any) => (
                      <div 
                        key={enrollment.id} 
                        className="flex items-center justify-between p-2 rounded-md bg-muted/50"
                      >
                        <div>
                          <div className="font-medium text-sm">
                            {enrollment.students?.first_name} {enrollment.students?.last_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {enrollment.students?.roll_number}
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => removeEnrollmentMutation.mutate(enrollment.id)}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </div>

            {/* Add Students */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Add Students</h4>
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by name or roll number..."
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <ScrollArea className="h-[250px] border rounded-md p-2">
                {filteredStudents.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    {studentSearch ? "No matching students" : "All students enrolled"}
                  </p>
                ) : (
                  <div className="space-y-1">
                    {filteredStudents.map((student) => (
                      <div 
                        key={student.id}
                        className="flex items-center gap-2 p-2 rounded-md hover:bg-muted cursor-pointer"
                        onClick={() => toggleStudent(student.id)}
                      >
                        <Checkbox 
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={() => toggleStudent(student.id)}
                        />
                        <div className="flex-1">
                          <div className="font-medium text-sm">
                            {student.first_name} {student.last_name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {student.roll_number}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
              <Button
                className="w-full"
                disabled={selectedStudents.length === 0 || enrollStudentsMutation.isPending}
                onClick={() => enrollStudentsMutation.mutate({
                  sectionId: selectedSection.id,
                  studentIds: selectedStudents,
                })}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Add {selectedStudents.length} Student{selectedStudents.length !== 1 ? "s" : ""}
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsManageStudentsOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
