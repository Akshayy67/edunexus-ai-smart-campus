import { useState } from "react";
import { Settings2, Clock, MapPin, Save } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function AdminAttendanceRules() {
  const { toast } = useToast();
  const [rules, setRules] = useState({
    lateThresholdMinutes: 15,
    absentThresholdMinutes: 30,
    minAttendancePercentage: 75,
    geoFenceRequired: true,
    qrCodeValiditySeconds: 60,
    allowManualMarking: true,
    requireLocationVerification: true,
    allowLateSubmission: false,
  });

  const handleSave = () => {
    toast({ title: "Success", description: "Attendance rules saved successfully" });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Attendance Rules</h1>
          <p className="text-muted-foreground mt-1">Configure institution-wide attendance policies</p>
        </div>
        <Button onClick={handleSave}><Save className="mr-2 h-4 w-4" />Save Changes</Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Clock className="h-5 w-5" />Time Thresholds</CardTitle>
            <CardDescription>Configure attendance timing rules</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Late Threshold (minutes)</Label>
              <Input type="number" value={rules.lateThresholdMinutes} onChange={(e) => setRules({ ...rules, lateThresholdMinutes: parseInt(e.target.value) })} />
              <p className="text-xs text-muted-foreground">Students arriving after this time will be marked as late</p>
            </div>
            <div className="space-y-2">
              <Label>Absent Threshold (minutes)</Label>
              <Input type="number" value={rules.absentThresholdMinutes} onChange={(e) => setRules({ ...rules, absentThresholdMinutes: parseInt(e.target.value) })} />
              <p className="text-xs text-muted-foreground">Students not checked in after this time will be marked absent</p>
            </div>
            <div className="space-y-2">
              <Label>QR Code Validity (seconds)</Label>
              <Input type="number" value={rules.qrCodeValiditySeconds} onChange={(e) => setRules({ ...rules, qrCodeValiditySeconds: parseInt(e.target.value) })} />
              <p className="text-xs text-muted-foreground">How long each QR code remains valid for scanning</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" />Location Settings</CardTitle>
            <CardDescription>Configure geo-fence requirements</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Require Geo-fence</Label>
                <p className="text-xs text-muted-foreground">Students must be within the classroom zone</p>
              </div>
              <Switch checked={rules.geoFenceRequired} onCheckedChange={(v) => setRules({ ...rules, geoFenceRequired: v })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Location Verification</Label>
                <p className="text-xs text-muted-foreground">Verify student location during check-in</p>
              </div>
              <Switch checked={rules.requireLocationVerification} onCheckedChange={(v) => setRules({ ...rules, requireLocationVerification: v })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5" />General Settings</CardTitle>
            <CardDescription>Other attendance configurations</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Minimum Attendance Percentage</Label>
              <Input type="number" min="0" max="100" value={rules.minAttendancePercentage} onChange={(e) => setRules({ ...rules, minAttendancePercentage: parseInt(e.target.value) })} />
              <p className="text-xs text-muted-foreground">Required attendance for exam eligibility</p>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Allow Manual Marking</Label>
                <p className="text-xs text-muted-foreground">Faculty can manually mark attendance</p>
              </div>
              <Switch checked={rules.allowManualMarking} onCheckedChange={(v) => setRules({ ...rules, allowManualMarking: v })} />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Allow Late Submission</Label>
                <p className="text-xs text-muted-foreground">Allow attendance marking after session ends</p>
              </div>
              <Switch checked={rules.allowLateSubmission} onCheckedChange={(v) => setRules({ ...rules, allowLateSubmission: v })} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
