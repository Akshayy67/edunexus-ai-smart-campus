import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { User, Mail, Phone, Building, Briefcase, Save } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface FacultyProfile {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  employee_id: string;
  designation: string | null;
  department_id: string | null;
  profile_image_url: string | null;
  status: string | null;
}

interface Department {
  id: string;
  name: string;
}

export default function FacultyProfile() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<FacultyProfile | null>(null);
  const [department, setDepartment] = useState<Department | null>(null);
  const [formData, setFormData] = useState({
    phone: "",
  });

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    try {
      const { data: facultyData, error: facultyError } = await supabase
        .from("faculty")
        .select("*")
        .eq("user_id", user?.id)
        .single();

      if (facultyError) throw facultyError;
      setProfile(facultyData);
      setFormData({ phone: facultyData.phone || "" });

      if (facultyData.department_id) {
        const { data: deptData } = await supabase
          .from("departments")
          .select("id, name")
          .eq("id", facultyData.department_id)
          .single();
        setDepartment(deptData);
      }
    } catch (error) {
      console.error("Error fetching profile:", error);
      toast({
        title: "Error",
        description: "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from("faculty")
        .update({ phone: formData.phone })
        .eq("id", profile.id);

      if (error) throw error;

      setProfile({ ...profile, phone: formData.phone });
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully",
      });
    } catch (error) {
      console.error("Error updating profile:", error);
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
        <p className="text-muted-foreground">Profile not found</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Profile</h1>
        <p className="text-muted-foreground">Manage your personal information</p>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Card */}
        <Card className="md:col-span-1">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center">
              <Avatar className="h-24 w-24 mb-4">
                <AvatarImage src={profile.profile_image_url || undefined} />
                <AvatarFallback className="text-2xl">
                  {profile.first_name[0]}{profile.last_name[0]}
                </AvatarFallback>
              </Avatar>
              <h2 className="text-xl font-semibold text-foreground">
                {profile.first_name} {profile.last_name}
              </h2>
              <p className="text-muted-foreground">{profile.designation || "Faculty"}</p>
              <Badge className="mt-2" variant={profile.status === "active" ? "default" : "secondary"}>
                {profile.status || "Active"}
              </Badge>
            </div>
          </CardContent>
        </Card>

        {/* Details Card */}
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
            <CardDescription>Your faculty details and contact information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <User className="h-4 w-4" />
                  Employee ID
                </Label>
                <Input value={profile.employee_id} disabled />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Briefcase className="h-4 w-4" />
                  Designation
                </Label>
                <Input value={profile.designation || "N/A"} disabled />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="h-4 w-4" />
                  Email
                </Label>
                <Input value={profile.email} disabled />
              </div>
              <div className="space-y-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="h-4 w-4" />
                  Phone
                </Label>
                <Input
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label className="flex items-center gap-2 text-muted-foreground">
                  <Building className="h-4 w-4" />
                  Department
                </Label>
                <Input value={department?.name || "Not Assigned"} disabled />
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
