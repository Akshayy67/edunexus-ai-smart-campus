import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, Calendar, Clock, MapPin, Trash2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default function AdminTimetables() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    course_assignment_id: "", day_of_week: "1", start_time: "09:00", end_time: "10:00",
    zone_id: "", effective_from: new Date().toISOString().split("T")[0],
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: slots, isLoading } = useQuery({
    queryKey: ["admin-timetable-slots"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("timetable_slots")
        .select(`*, course_assignments:course_assignment_id (*, courses:course_id (name, code), faculty:faculty_id (first_name, last_name)), geo_fence_zones:zone_id (name, room_number)`)
        .order("day_of_week").order("start_time");
      if (error) throw error;
      return data;
    },
  });

  const { data: courseAssignments } = useQuery({
    queryKey: ["course-assignments"],
    queryFn: async () => {
      const { data, error } = await supabase.from("course_assignments")
        .select(`*, courses:course_id (name, code), faculty:faculty_id (first_name, last_name)`);
      if (error) throw error;
      return data;
    },
  });

  const { data: zones } = useQuery({
    queryKey: ["geo-zones"],
    queryFn: async () => {
      const { data, error } = await supabase.from("geo_fence_zones").select("*").eq("is_active", true);
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const { error } = await supabase.from("timetable_slots").insert([{
        ...data, day_of_week: parseInt(data.day_of_week),
        course_assignment_id: data.course_assignment_id || null,
        zone_id: data.zone_id || null,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-timetable-slots"] });
      toast({ title: "Success", description: "Timetable slot created" });
      setIsAddDialogOpen(false);
    },
    onError: (error: any) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("timetable_slots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-timetable-slots"] });
      toast({ title: "Success", description: "Slot deleted" });
    },
  });

  const groupedSlots = slots?.reduce((acc: any, slot) => {
    const day = slot.day_of_week;
    if (!acc[day]) acc[day] = [];
    acc[day].push(slot);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timetable Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage class schedules</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Slot</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Timetable Slot</DialogTitle>
              <DialogDescription>Create a new class schedule entry</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label>Course Assignment</Label>
                <Select value={formData.course_assignment_id} onValueChange={(v) => setFormData({ ...formData, course_assignment_id: v })}>
                  <SelectTrigger><SelectValue placeholder="Select course" /></SelectTrigger>
                  <SelectContent>
                    {courseAssignments?.map((ca) => (
                      <SelectItem key={ca.id} value={ca.id}>
                        {ca.courses?.code} - {ca.faculty?.first_name} {ca.faculty?.last_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Day</Label>
                  <Select value={formData.day_of_week} onValueChange={(v) => setFormData({ ...formData, day_of_week: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {DAYS.map((day, i) => <SelectItem key={i} value={i.toString()}>{day}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Room/Zone</Label>
                  <Select value={formData.zone_id} onValueChange={(v) => setFormData({ ...formData, zone_id: v })}>
                    <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                    <SelectContent>
                      {zones?.map((z) => <SelectItem key={z.id} value={z.id}>{z.name} {z.room_number && `(${z.room_number})`}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Start Time</Label>
                  <Input type="time" value={formData.start_time} onChange={(e) => setFormData({ ...formData, start_time: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>End Time</Label>
                  <Input type="time" value={formData.end_time} onChange={(e) => setFormData({ ...formData, end_time: e.target.value })} />
                </div>
                <div className="space-y-2">
                  <Label>Effective From</Label>
                  <Input type="date" value={formData.effective_from} onChange={(e) => setFormData({ ...formData, effective_from: e.target.value })} />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button onClick={() => addMutation.mutate(formData)} disabled={addMutation.isPending}>Create Slot</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading timetable...</div>
      ) : (
        <div className="grid gap-4">
          {DAYS.map((day, dayIndex) => (
            <Card key={dayIndex}>
              <CardHeader className="py-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Calendar className="h-4 w-4" />{day}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {!groupedSlots?.[dayIndex]?.length ? (
                  <p className="text-sm text-muted-foreground">No classes scheduled</p>
                ) : (
                  <div className="space-y-2">
                    {groupedSlots[dayIndex].map((slot: any) => (
                      <div key={slot.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-4">
                          <div className="flex items-center gap-1 text-sm">
                            <Clock className="h-3 w-3" />
                            {slot.start_time.slice(0,5)} - {slot.end_time.slice(0,5)}
                          </div>
                          <Badge>{slot.course_assignments?.courses?.code || "N/A"}</Badge>
                          <span className="text-sm">{slot.course_assignments?.courses?.name}</span>
                          {slot.geo_fence_zones && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <MapPin className="h-3 w-3" />{slot.geo_fence_zones.name}
                            </div>
                          )}
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(slot.id)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
