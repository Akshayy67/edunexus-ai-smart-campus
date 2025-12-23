import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Plus, MapPin, Trash2, Building2, Users } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";

export default function AdminRooms() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    room_number: "",
    building: "",
    capacity: "60",
    zone_type: "classroom",
    latitude: "0",
    longitude: "0",
    radius_meters: "50",
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: rooms, isLoading } = useQuery({
    queryKey: ["admin-rooms"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("geo_fence_zones")
        .select("*")
        .order("building")
        .order("room_number");
      if (error) throw error;
      return data;
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const { error } = await supabase.from("geo_fence_zones").insert([{
        name: data.name,
        room_number: data.room_number || null,
        building: data.building || null,
        capacity: parseInt(data.capacity) || null,
        zone_type: data.zone_type,
        latitude: parseFloat(data.latitude) || 0,
        longitude: parseFloat(data.longitude) || 0,
        radius_meters: parseInt(data.radius_meters) || 50,
        is_active: true,
      }]);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rooms"] });
      queryClient.invalidateQueries({ queryKey: ["geo-zones"] });
      toast({ title: "Success", description: "Room created" });
      setIsAddDialogOpen(false);
      setFormData({
        name: "", room_number: "", building: "", capacity: "60",
        zone_type: "classroom", latitude: "0", longitude: "0", radius_meters: "50",
      });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("geo_fence_zones")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rooms"] });
      queryClient.invalidateQueries({ queryKey: ["geo-zones"] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("geo_fence_zones").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-rooms"] });
      queryClient.invalidateQueries({ queryKey: ["geo-zones"] });
      toast({ title: "Success", description: "Room deleted" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const getZoneTypeBadge = (type: string) => {
    const colors: Record<string, string> = {
      classroom: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      lab: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      auditorium: "bg-green-500/10 text-green-500 border-green-500/20",
      library: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      cafeteria: "bg-orange-500/10 text-orange-500 border-orange-500/20",
    };
    return <Badge className={colors[type] || ""}>{type}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Room Management</h1>
          <p className="text-muted-foreground mt-1">Manage classrooms, labs, and other venues</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="mr-2 h-4 w-4" />Add Room</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Add New Room</DialogTitle>
              <DialogDescription>Create a new classroom or venue</DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Room Name *</Label>
                  <Input 
                    placeholder="e.g., Lecture Hall 1"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Room Number</Label>
                  <Input 
                    placeholder="e.g., 204"
                    value={formData.room_number}
                    onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Building / Floor</Label>
                  <Input 
                    placeholder="e.g., Block A, 2nd Floor"
                    value={formData.building}
                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Capacity</Label>
                  <Input 
                    type="number"
                    placeholder="60"
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Room Type</Label>
                <Select 
                  value={formData.zone_type} 
                  onValueChange={(v) => setFormData({ ...formData, zone_type: v })}
                >
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="classroom">Classroom</SelectItem>
                    <SelectItem value="lab">Laboratory</SelectItem>
                    <SelectItem value="auditorium">Auditorium</SelectItem>
                    <SelectItem value="library">Library</SelectItem>
                    <SelectItem value="cafeteria">Cafeteria</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Latitude</Label>
                  <Input 
                    type="number"
                    step="any"
                    value={formData.latitude}
                    onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Longitude</Label>
                  <Input 
                    type="number"
                    step="any"
                    value={formData.longitude}
                    onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Radius (m)</Label>
                  <Input 
                    type="number"
                    value={formData.radius_meters}
                    onChange={(e) => setFormData({ ...formData, radius_meters: e.target.value })}
                  />
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>Cancel</Button>
              <Button 
                onClick={() => addMutation.mutate(formData)} 
                disabled={!formData.name || addMutation.isPending}
              >
                Create Room
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-muted-foreground">Loading rooms...</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>All Rooms</CardTitle>
            <CardDescription>
              {rooms?.length || 0} rooms configured
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Room</TableHead>
                  <TableHead>Building</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Capacity</TableHead>
                  <TableHead>Active</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms?.map((room: any) => (
                  <TableRow key={room.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <span className="font-medium">{room.name}</span>
                          {room.room_number && (
                            <span className="text-muted-foreground ml-2">({room.room_number})</span>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Building2 className="h-3 w-3 text-muted-foreground" />
                        <span>{room.building || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>{getZoneTypeBadge(room.zone_type)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3 text-muted-foreground" />
                        <span>{room.capacity || "-"}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Switch 
                        checked={room.is_active}
                        onCheckedChange={(checked) => 
                          toggleActive.mutate({ id: room.id, is_active: checked })
                        }
                      />
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="icon"
                        onClick={() => deleteMutation.mutate(room.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {rooms?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                      No rooms created yet. Click "Add Room" to create one.
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
