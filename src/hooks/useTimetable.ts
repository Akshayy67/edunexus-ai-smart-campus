import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEffect } from "react";

export interface Period {
  id: string;
  period_number: number;
  name: string;
  start_time: string;
  end_time: string;
  is_break: boolean;
}

export interface TimetableSlot {
  id: string;
  day_of_week: number;
  period_id: string | null;
  section_id: string | null;
  course_assignment_id: string | null;
  zone_id: string | null;
  start_time: string;
  end_time: string;
  slot_type: string | null;
  course_assignments?: {
    id: string;
    courses: { name: string; code: string } | null;
    faculty: { first_name: string; last_name: string } | null;
    batches: { name: string } | null;
  } | null;
  geo_fence_zones?: { name: string; room_number: string | null } | null;
  periods?: Period | null;
  sections?: { id: string; section_name: string; display_name: string | null } | null;
}

export interface Section {
  id: string;
  batch_id: string;
  section_name: string;
  display_name: string | null;
  batches?: { name: string; program_id: string | null } | null;
}

export function usePeriods() {
  return useQuery({
    queryKey: ["periods"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("periods")
        .select("*")
        .order("period_number");
      if (error) throw error;
      return data as Period[];
    },
  });
}

export function useSections() {
  return useQuery({
    queryKey: ["sections"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sections")
        .select("*, batches:batch_id(name, program_id)")
        .order("section_name");
      if (error) throw error;
      return data as Section[];
    },
  });
}

export function useTimetableSlots(sectionId?: string) {
  return useQuery({
    queryKey: ["timetable-slots", sectionId],
    queryFn: async () => {
      let query = supabase
        .from("timetable_slots")
        .select(`
          *,
          course_assignments:course_assignment_id(
            id, 
            courses:course_id(name, code), 
            faculty:faculty_id(first_name, last_name),
            batches:batch_id(name)
          ),
          geo_fence_zones:zone_id(name, room_number),
          periods:period_id(*),
          sections:section_id(id, section_name, display_name)
        `)
        .order("day_of_week")
        .order("start_time");
      
      if (sectionId) {
        query = query.eq("section_id", sectionId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as TimetableSlot[];
    },
    enabled: true,
  });
}

export function useRealtimeTimetable(sectionId?: string) {
  const queryClient = useQueryClient();
  
  useEffect(() => {
    const channel = supabase
      .channel("timetable-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "timetable_slots",
        },
        () => {
          queryClient.invalidateQueries({ queryKey: ["timetable-slots", sectionId] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient, sectionId]);
}

export function useClashDetection() {
  const { toast } = useToast();
  
  const checkClash = async (
    dayOfWeek: number,
    periodId: string,
    courseAssignmentId: string,
    zoneId: string | null,
    excludeSlotId?: string
  ): Promise<{ hasClash: boolean; message: string }> => {
    // Get the faculty from course assignment
    const { data: assignment } = await supabase
      .from("course_assignments")
      .select("faculty_id")
      .eq("id", courseAssignmentId)
      .single();
    
    if (!assignment) {
      return { hasClash: false, message: "" };
    }

    // Check for faculty clash - same faculty, same day, same period
    let facultyQuery = supabase
      .from("timetable_slots")
      .select(`
        id,
        course_assignments:course_assignment_id(faculty_id, courses:course_id(name))
      `)
      .eq("day_of_week", dayOfWeek)
      .eq("period_id", periodId);
    
    if (excludeSlotId) {
      facultyQuery = facultyQuery.neq("id", excludeSlotId);
    }

    const { data: facultySlots } = await facultyQuery;
    
    const facultyClash = facultySlots?.find(
      (slot: any) => slot.course_assignments?.faculty_id === assignment.faculty_id
    );
    
    if (facultyClash) {
      return {
        hasClash: true,
        message: `Faculty clash: Already assigned to ${facultyClash.course_assignments?.courses?.name || 'another class'} at this time`,
      };
    }

    // Check for room clash - same room, same day, same period
    if (zoneId) {
      let roomQuery = supabase
        .from("timetable_slots")
        .select("id, geo_fence_zones:zone_id(name)")
        .eq("day_of_week", dayOfWeek)
        .eq("period_id", periodId)
        .eq("zone_id", zoneId);
      
      if (excludeSlotId) {
        roomQuery = roomQuery.neq("id", excludeSlotId);
      }

      const { data: roomSlots } = await roomQuery;
      
      if (roomSlots && roomSlots.length > 0) {
        return {
          hasClash: true,
          message: `Room clash: ${roomSlots[0].geo_fence_zones?.name || 'This room'} is already booked at this time`,
        };
      }
    }

    return { hasClash: false, message: "" };
  };

  return { checkClash };
}

export function useTimetableMutations() {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { checkClash } = useClashDetection();

  const addSlot = useMutation({
    mutationFn: async (data: {
      day_of_week: number;
      period_id: string;
      section_id: string;
      course_assignment_id: string;
      zone_id: string | null;
      start_time: string;
      end_time: string;
    }) => {
      // Check for clashes first
      const clash = await checkClash(
        data.day_of_week,
        data.period_id,
        data.course_assignment_id,
        data.zone_id
      );
      
      if (clash.hasClash) {
        throw new Error(clash.message);
      }

      const { error } = await supabase.from("timetable_slots").insert([{
        ...data,
        effective_from: new Date().toISOString().split("T")[0],
      }]);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetable-slots"] });
      toast({ title: "Success", description: "Timetable slot added" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const updateSlot = useMutation({
    mutationFn: async ({ id, ...data }: {
      id: string;
      day_of_week?: number;
      period_id?: string;
      section_id?: string;
      course_assignment_id?: string;
      zone_id?: string | null;
    }) => {
      // Check for clashes if changing period or day
      if (data.period_id && data.course_assignment_id && data.day_of_week !== undefined) {
        const clash = await checkClash(
          data.day_of_week,
          data.period_id,
          data.course_assignment_id,
          data.zone_id || null,
          id
        );
        
        if (clash.hasClash) {
          throw new Error(clash.message);
        }
      }

      const { error } = await supabase
        .from("timetable_slots")
        .update(data)
        .eq("id", id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetable-slots"] });
      toast({ title: "Success", description: "Timetable slot updated" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteSlot = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("timetable_slots").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["timetable-slots"] });
      toast({ title: "Success", description: "Slot deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  return { addSlot, updateSlot, deleteSlot };
}
