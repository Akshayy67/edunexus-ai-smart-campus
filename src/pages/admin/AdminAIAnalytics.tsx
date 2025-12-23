import { useState, useEffect } from "react";
import { 
  Brain, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  BookOpen, 
  GraduationCap,
  RefreshCw,
  BarChart3,
  PieChart
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { AIInsightsPanel } from "@/components/ai/AIInsightsPanel";
import { useAIInsights } from "@/hooks/useAIInsights";

interface RiskDistribution {
  low: number;
  moderate: number;
  high: number;
  critical: number;
}

interface SubjectDifficulty {
  course_id: string;
  course_name?: string;
  difficulty_score: number;
  class_average: number;
  failure_rate: number;
  sample_size: number;
}

interface FacultyGradingProfile {
  faculty_id: string;
  faculty_name?: string;
  avg_marks_given: number;
  strictness_index: number;
  grading_consistency: number;
  sample_size: number;
}

export default function AdminAIAnalytics() {
  const { insights, alerts, loading: insightsLoading, generateInsights, acknowledgeAlert, markInsightRead } = useAIInsights("admin");
  
  const [riskDistribution, setRiskDistribution] = useState<RiskDistribution>({ low: 0, moderate: 0, high: 0, critical: 0 });
  const [subjectDifficulties, setSubjectDifficulties] = useState<SubjectDifficulty[]>([]);
  const [gradingProfiles, setGradingProfiles] = useState<FacultyGradingProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  async function fetchAnalytics() {
    try {
      setLoading(true);

      // Fetch risk distribution
      const { data: riskScores } = await supabase
        .from("ai_risk_scores")
        .select("risk_category");

      const distribution: RiskDistribution = { low: 0, moderate: 0, high: 0, critical: 0 };
      for (const score of riskScores || []) {
        distribution[score.risk_category as keyof RiskDistribution]++;
      }
      setRiskDistribution(distribution);

      // Fetch subject difficulties with course names
      const { data: difficulties } = await supabase
        .from("ai_subject_difficulty")
        .select("course_id, difficulty_score, class_average, failure_rate, sample_size")
        .order("difficulty_score", { ascending: false })
        .limit(10);

      if (difficulties?.length) {
        const courseIds = difficulties.map(d => d.course_id);
        const { data: courses } = await supabase
          .from("courses")
          .select("id, name")
          .in("id", courseIds);

        const courseMap = new Map(courses?.map(c => [c.id, c.name]));
        setSubjectDifficulties(difficulties.map(d => ({
          ...d,
          course_name: courseMap.get(d.course_id) || "Unknown Course"
        })));
      }

      // Fetch faculty grading profiles
      const { data: profiles } = await supabase
        .from("ai_faculty_grading_profile")
        .select("faculty_id, avg_marks_given, strictness_index, grading_consistency, sample_size")
        .order("strictness_index", { ascending: false })
        .limit(10);

      if (profiles?.length) {
        const facultyIds = profiles.map(p => p.faculty_id);
        const { data: faculty } = await supabase
          .from("faculty")
          .select("id, first_name, last_name")
          .in("id", facultyIds);

        const facultyMap = new Map(faculty?.map(f => [f.id, `${f.first_name} ${f.last_name}`]));
        setGradingProfiles(profiles.map(p => ({
          ...p,
          faculty_name: facultyMap.get(p.faculty_id) || "Unknown Faculty"
        })));
      }

    } catch (error) {
      console.error("Error fetching analytics:", error);
      toast.error("Failed to fetch analytics data");
    } finally {
      setLoading(false);
    }
  }

  async function runFeatureEngineering() {
    try {
      setRefreshing(true);
      toast.info("Running AI feature engineering...");

      // Calculate subject difficulties
      await supabase.functions.invoke("ai-feature-engineering", {
        body: { action: "calculate_subject_difficulty" }
      });

      // Calculate faculty grading profiles
      await supabase.functions.invoke("ai-feature-engineering", {
        body: { action: "calculate_faculty_grading_profile" }
      });

      toast.success("Feature engineering complete");
      await fetchAnalytics();
    } catch (error) {
      console.error("Error running feature engineering:", error);
      toast.error("Failed to run feature engineering");
    } finally {
      setRefreshing(false);
    }
  }

  const totalStudents = Object.values(riskDistribution).reduce((a, b) => a + b, 0);
  const atRiskCount = riskDistribution.high + riskDistribution.critical;
  const atRiskPercentage = totalStudents > 0 ? (atRiskCount / totalStudents) * 100 : 0;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-8 w-8 text-primary" />
            AI Analytics
          </h1>
          <p className="text-muted-foreground mt-1">
            Institution-wide AI-powered insights and risk analysis
          </p>
        </div>
        <Button onClick={runFeatureEngineering} disabled={refreshing}>
          <RefreshCw className={cn("mr-2 h-4 w-4", refreshing && "animate-spin")} />
          Refresh Analysis
        </Button>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Analyzed</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalStudents}</div>
            <p className="text-xs text-muted-foreground">Students with risk scores</p>
          </CardContent>
        </Card>

        <Card className={cn(atRiskPercentage > 20 && "border-destructive/50")}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">At Risk</CardTitle>
            <AlertTriangle className={cn("h-4 w-4", atRiskPercentage > 20 ? "text-destructive" : "text-muted-foreground")} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{atRiskCount}</div>
            <p className="text-xs text-muted-foreground">
              {atRiskPercentage.toFixed(1)}% of students
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Subjects Analyzed</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{subjectDifficulties.length}</div>
            <p className="text-xs text-muted-foreground">With difficulty scores</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Faculty Profiles</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{gradingProfiles.length}</div>
            <p className="text-xs text-muted-foreground">Grading patterns analyzed</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="risk" className="space-y-4">
            <TabsList>
              <TabsTrigger value="risk">
                <PieChart className="h-4 w-4 mr-2" />
                Risk Distribution
              </TabsTrigger>
              <TabsTrigger value="subjects">
                <BookOpen className="h-4 w-4 mr-2" />
                Subject Difficulty
              </TabsTrigger>
              <TabsTrigger value="grading">
                <BarChart3 className="h-4 w-4 mr-2" />
                Grading Patterns
              </TabsTrigger>
            </TabsList>

            <TabsContent value="risk">
              <Card>
                <CardHeader>
                  <CardTitle>Student Risk Distribution</CardTitle>
                  <CardDescription>Overview of academic risk levels across the institution</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-4">
                      {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                      ))}
                    </div>
                  ) : totalStudents === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertTriangle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No risk scores calculated yet</p>
                      <Button variant="outline" className="mt-4" onClick={runFeatureEngineering}>
                        Run Analysis
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <RiskBar 
                        label="Low Risk" 
                        count={riskDistribution.low} 
                        total={totalStudents} 
                        color="bg-green-500" 
                      />
                      <RiskBar 
                        label="Moderate Risk" 
                        count={riskDistribution.moderate} 
                        total={totalStudents} 
                        color="bg-amber-500" 
                      />
                      <RiskBar 
                        label="High Risk" 
                        count={riskDistribution.high} 
                        total={totalStudents} 
                        color="bg-orange-500" 
                      />
                      <RiskBar 
                        label="Critical Risk" 
                        count={riskDistribution.critical} 
                        total={totalStudents} 
                        color="bg-destructive" 
                      />
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subjects">
              <Card>
                <CardHeader>
                  <CardTitle>Subject Difficulty Analysis</CardTitle>
                  <CardDescription>Subjects ranked by difficulty score (higher = harder)</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                      ))}
                    </div>
                  ) : subjectDifficulties.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No subject analysis available</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {subjectDifficulties.map((subject, index) => (
                        <div key={subject.course_id} className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-muted-foreground">#{index + 1}</span>
                              <span className="font-medium">{subject.course_name}</span>
                            </div>
                            <Badge variant={subject.failure_rate > 0.3 ? "destructive" : "secondary"}>
                              {(subject.failure_rate * 100).toFixed(0)}% failure
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground text-xs">Difficulty</p>
                              <p className="font-medium">{subject.difficulty_score?.toFixed(1) || "N/A"}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Class Avg</p>
                              <p className="font-medium">{subject.class_average?.toFixed(1) || "N/A"}%</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Sample Size</p>
                              <p className="font-medium">{subject.sample_size || 0}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="grading">
              <Card>
                <CardHeader>
                  <CardTitle>Faculty Grading Patterns</CardTitle>
                  <CardDescription>Analysis of grading strictness and consistency</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="space-y-3">
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="h-16 bg-muted animate-pulse rounded" />
                      ))}
                    </div>
                  ) : gradingProfiles.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <GraduationCap className="h-12 w-12 mx-auto mb-2 opacity-50" />
                      <p>No grading profiles available</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {gradingProfiles.map((profile) => (
                        <div key={profile.faculty_id} className="p-3 rounded-lg bg-muted/50">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium">{profile.faculty_name}</span>
                            <Badge variant="outline">
                              {profile.sample_size} graded
                            </Badge>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <p className="text-muted-foreground text-xs mb-1">Strictness</p>
                              <Progress 
                                value={(profile.strictness_index || 0) * 100} 
                                className="h-2"
                              />
                              <p className="text-xs mt-1">{((profile.strictness_index || 0) * 100).toFixed(0)}%</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs mb-1">Consistency</p>
                              <Progress 
                                value={(profile.grading_consistency || 0) * 100} 
                                className="h-2"
                              />
                              <p className="text-xs mt-1">{((profile.grading_consistency || 0) * 100).toFixed(0)}%</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground text-xs">Avg Marks</p>
                              <p className="font-medium">{profile.avg_marks_given?.toFixed(1) || "N/A"}%</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Column: AI Insights */}
        <div>
          <AIInsightsPanel
            insights={insights}
            alerts={alerts}
            riskScore={null}
            loading={insightsLoading}
            onRefresh={generateInsights}
            onAcknowledgeAlert={acknowledgeAlert}
            onMarkRead={markInsightRead}
            userType="admin"
          />
        </div>
      </div>
    </div>
  );
}

function RiskBar({ label, count, total, color }: { label: string; count: number; total: number; color: string }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-sm">
        <span>{label}</span>
        <span className="font-medium">{count} ({percentage.toFixed(1)}%)</span>
      </div>
      <div className="h-3 bg-muted rounded-full overflow-hidden">
        <div 
          className={cn("h-full rounded-full transition-all", color)} 
          style={{ width: `${percentage}%` }} 
        />
      </div>
    </div>
  );
}
