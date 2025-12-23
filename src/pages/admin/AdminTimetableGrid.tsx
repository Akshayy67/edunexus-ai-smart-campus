import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Plus, Trash2, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { usePeriods, useSections, useTimetableSlots, useTimetableMutations, useRealtimeTimetable } from "@/hooks/useTimetable";
import { cn } from "@/lib/utils";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const WORKING_DAYS = [1, 2, 3, 4, 5, 6]; // Mon-Sat

export default function AdminTimetableGrid() {
  const [selectedSection, setSelectedSection] = useState<string>("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [selectedCell, setSelectedCell] = useState<{ day: number; periodId: string } | null>(null);
  const [formData, setFormData] = useState({
    course_assignment_id: "",
    zone_id: "",
  });
  const { toast } = useToast();

  const { data: periods, isLoading: periodsLoading } = usePeriods();
  const { data: sections } = useSections();
  const { data: slots, isLoading: slotsLoading } = useTimetableSlots(selectedSection || undefined);
  const { addSlot, deleteSlot } = useTimetableMutations();
  
  // Enable realtime updates
  useRealtimeTimetable(selectedSection || undefined);

  const { data: courseAssignments } = useQuery({
    queryKey: ["course-assignments-for-section", selectedSection],
    queryFn: async () => {
      if (!selectedSection) return [];
      
      // Get the batch_id from the section
      const { data: section } = await supabase
        .from("sections")
        .select("batch_id")
        .eq("id", selectedSection)
        .single();
      
      if (!section) return [];

      const { data, error } = await supabase
        .from("course_assignments")
        .select(`
          id,
          courses:course_id(name, code),
          faculty:faculty_id(first_name, last_name)
        `)
        .eq("batch_id", section.batch_id);
      
      if (error) throw error;
      return data;
    },
    enabled: !!selectedSection,
  });

  const { data: zones } = useQuery({
    queryKey: ["geo-zones-active"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("geo_fence_zones")
        .select("*")
        .eq("is_active", true)
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  // Get slot for a specific cell
  const getSlotForCell = (day: number, periodId: string) => {
    return slots?.find(
      (slot) => slot.day_of_week === day && slot.period_id === periodId
    );
  };

  const handleCellClick = (day: number, periodId: string) => {
    const existingSlot = getSlotForCell(day, periodId);
    if (!existingSlot && selectedSection) {
      setSelectedCell({ day, periodId });
      setFormData({ course_assignment_id: "", zone_id: "" });
      setIsAddDialogOpen(true);
    }
  };

  const handleAddSlot = async () => {
    if (!selectedCell || !selectedSection || !formData.course_assignment_id) return;

    const period = periods?.find((p) => p.id === selectedCell.periodId);
    if (!period) return;

    await addSlot.mutateAsync({
      day_of_week: selectedCell.day,
      period_id: selectedCell.periodId,
      section_id: selectedSection,
      course_assignment_id: formData.course_assignment_id,
      zone_id: formData.zone_id || null,
      start_time: period.start_time,
      end_time: period.end_time,
    });

    setIsAddDialogOpen(false);
    setSelectedCell(null);
  };

  const handleDeleteSlot = async (slotId: string) => {
    await deleteSlot.mutateAsync(slotId);
  };

  const activePeriods = periods?.filter((p) => !p.is_break) || [];
  const isLoading = periodsLoading || slotsLoading;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Timetable Management</h1>
          <p className="text-muted-foreground mt-1">
            Click on empty cells to assign classes. Changes update in real-time.
          </p>
        </div>
      </div>

      {/* Section Selector */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-4">
            <div className="flex-1 max-w-xs">
              <Label className="mb-2 block">Select Class / Section</Label>
              <Select value={selectedSection} onValueChange={setSelectedSection}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose a section..." />
                </SelectTrigger>
                <SelectContent>
                  {sections?.map((section) => (
                    <SelectItem key={section.id} value={section.id}>
                      {section.display_name || `${section.batches?.name} - Section ${section.section_name}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {!selectedSection && (
              <Alert className="flex-1">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Select a section to view and manage its timetable
                </AlertDescription>
              </Alert>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Timetable Grid */}
      {selectedSection && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Weekly Timetable Grid
            </CardTitle>
            <CardDescription>
              Click on empty cells to assign classes. Red border = clash detected.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead>
                    <tr>
                      <th className="border p-2 bg-muted font-medium text-left min-w-[100px]">
                        Day / Period
                      </th>
                      {activePeriods.map((period) => (
                        <th 
                          key={period.id} 
                          className="border p-2 bg-muted font-medium text-center min-w-[140px]"
                        >
                          <div>{period.name}</div>
                          <div className="text-xs text-muted-foreground font-normal">
                            {period.start_time.slice(0, 5)} - {period.end_time.slice(0, 5)}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {WORKING_DAYS.map((day) => (
                      <tr key={day}>
                        <td className="border p-2 bg-muted/50 font-medium">
                          {DAYS[day]}
                        </td>
                        {activePeriods.map((period) => {
                          const slot = getSlotForCell(day, period.id);
                          return (
                            <td 
                              key={period.id}
                              className={cn(
                                "border p-1 min-h-[80px] h-[80px] align-top transition-colors",
                                !slot && "hover:bg-muted/50 cursor-pointer"
                              )}
                              onClick={() => !slot && handleCellClick(day, period.id)}
                            >
                              {slot ? (
                                <div className="bg-primary/10 border border-primary/20 rounded p-2 h-full relative group">
                                  <div className="font-medium text-sm">
                                    {slot.course_assignments?.courses?.code}
                                  </div>
                                  <div className="text-xs text-muted-foreground">
                                    {slot.course_assignments?.courses?.name}
                                  </div>
                                  <div className="text-xs text-muted-foreground mt-1">
                                    {slot.course_assignments?.faculty?.first_name} {slot.course_assignments?.faculty?.last_name}
                                  </div>
                                  {slot.geo_fence_zones && (
                                    <Badge variant="outline" className="text-xs mt-1">
                                      {slot.geo_fence_zones.room_number || slot.geo_fence_zones.name}
                                    </Badge>
                                  )}
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteSlot(slot.id);
                                    }}
                                  >
                                    <Trash2 className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                                  <Plus className="h-4 w-4" />
                                </div>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Slot Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Class</DialogTitle>
            <DialogDescription>
              {selectedCell && (
                <>
                  {DAYS[selectedCell.day]} - {periods?.find((p) => p.id === selectedCell.periodId)?.name}
                </>
              )}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Subject / Course *</Label>
              <Select 
                value={formData.course_assignment_id} 
                onValueChange={(v) => setFormData({ ...formData, course_assignment_id: v })}
              >
                <SelectTrigger><SelectValue placeholder="Select subject" /></SelectTrigger>
                <SelectContent>
                  {courseAssignments?.map((ca: any) => (
                    <SelectItem key={ca.id} value={ca.id}>
                      <div className="flex flex-col">
                        <span>{ca.courses?.code} - {ca.courses?.name}</span>
                        <span className="text-xs text-muted-foreground">
                          Faculty: {ca.faculty?.first_name} {ca.faculty?.last_name}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Faculty is auto-assigned based on course assignment
              </p>
            </div>
            <div className="space-y-2">
              <Label>Room</Label>
              <Select 
                value={formData.zone_id} 
                onValueChange={(v) => setFormData({ ...formData, zone_id: v })}
              >
                <SelectTrigger><SelectValue placeholder="Select room (optional)" /></SelectTrigger>
                <SelectContent>
                  {zones?.map((zone: any) => (
                    <SelectItem key={zone.id} value={zone.id}>
                      {zone.name} {zone.room_number && `(${zone.room_number})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleAddSlot} 
              disabled={!formData.course_assignment_id || addSlot.isPending}
            >
              {addSlot.isPending ? "Checking clashes..." : "Assign Class"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
