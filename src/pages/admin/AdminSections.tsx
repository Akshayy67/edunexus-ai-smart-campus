import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Users, Trash2, Edit } from "lucide-react";
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

export default function AdminSections() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
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
          batches:batch_id(name, program_id, programs:program_id(name, code))
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
      
      // Count enrollments per section
      const counts: Record<string, number> = {};
      data?.forEach((e) => {
        counts[e.section_id] = (counts[e.section_id] || 0) + 1;
      });
      return counts;
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
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deleteMutation.mutate(section.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
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
    </div>
  );
}
