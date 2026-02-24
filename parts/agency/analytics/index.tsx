// app/agency/analytics/page.tsx
"use client";

import { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { getUserId } from "@/lib/utils";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Activity, Users, TrendingUp, Info, Inbox, FileText } from "lucide-react";

const DAYS_MAP = { "7d": 7, "30d": 30, "90d": 90 } as const;

type ProjectRow = {
  id: string;
  title: string;
  status: string;
  created_at: string;
  volunteers_needed: number | null;
  volunteers_registered: number | null;
};

type RequestRow = {
  id: string;
  status: string;
  created_at: string;
  project_id: string;
};

type RatingRow = { rating: number };

export default function AgencyAnalytics() {
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d">("30d");
  const [stats, setStats] = useState<{
    totalProjects?: number;
    active?: number;
    completed?: number;
    pending?: number;
    rejected?: number;
    totalVolunteers?: number;
    avgRating?: string;
    acceptanceRate?: string;
    totalApplications?: number;
  }>({});
  const [pieData, setPieData] = useState<{ name: string; value: number; color: string; description?: string }[]>([]);
  const [requestStatusPieData, setRequestStatusPieData] = useState<{ name: string; value: number; color: string }[]>([]);
  const [barData, setBarData] = useState<{ name: string; needed: number; registered: number; fillRate: number }[]>([]);
  const [applicationsPerProjectData, setApplicationsPerProjectData] = useState<{ name: string; applications: number }[]>([]);
  const [trendData, setTrendData] = useState<{ date: string; count: number }[]>([]);
  const [applicationsOverTimeData, setApplicationsOverTimeData] = useState<{ date: string; applications: number }[]>([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const { data: userId, error: userIdError } = await getUserId();
        if (userIdError || !userId) return;

        const agencyId = userId;
        const days = DAYS_MAP[timeRange];
        const fromDate = subDays(new Date(), days);

        const supabase = createClient();

        // Fetch Projects (in time range for trend; we'll also use for pie/bar)
        const { data: projectsData } = await supabase
          .from("projects")
          .select("id, title, status, created_at, volunteers_needed, volunteers_registered")
          .eq("organization_id", agencyId)
          .gte("created_at", fromDate.toISOString());
        const projects = (projectsData ?? []) as ProjectRow[];

        const projectIds = projects.map((p) => p.id);

        // Fetch Volunteer Requests (in time range) with project_id for grouping
        const { data: requestsData } = await supabase
          .from("volunteer_requests")
          .select("id, status, created_at, project_id")
          .eq("organization_id", agencyId)
          .gte("created_at", fromDate.toISOString());
        const requests = (requestsData ?? []) as RequestRow[];

        // Fetch Ratings for all agency projects (not limited by fromDate)
        const { data: ratingsData } = await supabase
          .from("project_ratings")
          .select("rating")
          .in("project_id", projectIds);
        const ratings = (ratingsData ?? []) as RatingRow[];

        // Compute project status counts (include rejected)
        const active = projects.filter((p) => p.status === "active").length;
        const completed = projects.filter((p) => p.status === "completed").length;
        const pending = projects.filter((p) => p.status === "pending").length;
        const rejected = projects.filter((p) => p.status === "rejected").length;

        const totalVolunteers = projects.reduce((sum, p) => sum + (p.volunteers_registered || 0), 0);
        const avgRating = ratings.length ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1) : "N/A";
        const totalApplications = requests.length;
        const acceptanceRate =
          requests.length ? ((requests.filter((r) => r.status === "accepted").length / requests.length) * 100).toFixed(1) : "0";

        setStats({
          totalProjects: projects.length,
          active,
          completed,
          pending,
          rejected,
          totalVolunteers,
          avgRating,
          acceptanceRate,
          totalApplications,
        });

        // Pie: Project Status (including Rejected)
        setPieData([
          { name: "Active", value: active, color: "#10b981", description: "Projects currently in progress" },
          { name: "Completed", value: completed, color: "#3b82f6", description: "Successfully finished projects" },
          { name: "Pending", value: pending, color: "#f59e0b", description: "Awaiting approval or start" },
          { name: "Rejected", value: rejected, color: "#ef4444", description: "Not approved" },
        ].filter((d) => d.value > 0));

        // Pie: Volunteer request status breakdown
        const acceptedCount = requests.filter((r) => r.status === "accepted").length;
        const declinedCount = requests.filter((r) => r.status === "declined").length;
        const pendingReqCount = requests.filter((r) => r.status === "pending").length;
        setRequestStatusPieData([
          { name: "Accepted", value: acceptedCount, color: "#10b981" },
          { name: "Declined", value: declinedCount, color: "#ef4444" },
          { name: "Pending", value: pendingReqCount, color: "#f59e0b" },
        ].filter((d) => d.value > 0));

        // Bar: Volunteer Fill Rate per project
        setBarData(
          projects.map((p) => ({
            name: p.title.length > 22 ? p.title.slice(0, 22) + "…" : p.title,
            needed: p.volunteers_needed || 0,
            registered: p.volunteers_registered || 0,
            fillRate: p.volunteers_needed ? Math.round(((p.volunteers_registered || 0) / p.volunteers_needed) * 100) : 0,
          }))
        );

        // Applications per project (top 10 by request count)
        const countByProject: Record<string, number> = {};
        requests.forEach((r) => {
          countByProject[r.project_id] = (countByProject[r.project_id] || 0) + 1;
        });
        const projectTitleById = new Map(projects.map((p) => [p.id, p.title]));
        const applicationsPerProject = Object.entries(countByProject)
          .map(([pid, count]) => {
            const title = projectTitleById.get(pid) ?? "Unknown";
            const name = typeof title === "string" && title.length > 22 ? title.slice(0, 22) + "…" : String(title);
            return { name, applications: count };
          })
          .sort((a, b) => b.applications - a.applications)
          .slice(0, 10);
        setApplicationsPerProjectData(applicationsPerProject);

        // Trend: Projects created over time (sorted by date)
        const trendByDate: Record<string, number> = {};
        projects.forEach((p) => {
          const key = format(new Date(p.created_at), "yyyy-MM-dd");
          trendByDate[key] = (trendByDate[key] || 0) + 1;
        });
        const trendSorted = Object.entries(trendByDate)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([dateKey, count]) => ({ date: format(new Date(dateKey), "MMM d"), count }));
        setTrendData(trendSorted);

        // Applications received over time (sorted by date)
        const appsByDate: Record<string, number> = {};
        requests.forEach((r) => {
          const key = format(new Date(r.created_at), "yyyy-MM-dd");
          appsByDate[key] = (appsByDate[key] || 0) + 1;
        });
        const appsOverTimeSorted = Object.entries(appsByDate)
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([dateKey, applications]) => ({ date: format(new Date(dateKey), "MMM d"), applications }));
        setApplicationsOverTimeData(appsOverTimeSorted);
      } catch (error) {
        console.error("Analytics error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [timeRange]);

  // Custom Tooltip with Description
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload[0]) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-3 border rounded-lg shadow-lg text-sm">
          <p className="font-semibold">{label}</p>
          {data.description && <p className="text-muted-foreground text-xs mt-1">{data.description}</p>}
          <p className="mt-1">
            <span className="font-medium">{payload[0].name}:</span> {payload[0].value}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Agency Analytics Dashboard</h1>
          <p className="text-muted-foreground">Understand your project impact and volunteer engagement</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="w-48">
            <Label>Time Period</Label>
            <Select value={timeRange} onValueChange={(v) => setTimeRange(v as "7d" | "30d" | "90d")}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 Days</SelectItem>
                <SelectItem value="30d">Last 30 Days</SelectItem>
                <SelectItem value="90d">Last 90 Days</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Projects</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalProjects}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" /> All projects created by your agency
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Volunteers</CardTitle>
            <Users className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalVolunteers}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" /> Currently registered across all projects
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Volunteer Acceptance Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.acceptanceRate}%</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" /> % of volunteer requests accepted
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Applications</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalApplications ?? 0}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" /> Volunteer applications in period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Average Citizen Rating</CardTitle>
            <div className="h-4 w-4 text-yellow-500">★</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgRating ?? "N/A"}</div>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <Info className="h-3 w-3" /> Based on citizen feedback
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts with Descriptions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Project Status Distribution
              <Info className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
            <CardDescription>
              Breakdown of your projects by current status. Hover slices for details.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {pieData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground text-sm">
                <FileText className="h-10 w-10 mb-2 opacity-50" />
                <p>No projects in this period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Volunteer request status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Volunteer Application Status
              <Info className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
            <CardDescription>
              How volunteer applications are distributed: accepted, declined, or pending review.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requestStatusPieData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground text-sm">
                <Inbox className="h-10 w-10 mb-2 opacity-50" />
                <p>No applications in this period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={requestStatusPieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={90}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {requestStatusPieData.map((entry, index) => (
                      <Cell key={`cell-req-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Volunteer Fill Rate per Project */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Volunteer Fill Rate
              <Info className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
            <CardDescription>
              How many volunteers you have vs. how many you need per project.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {barData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground text-sm">
                <FileText className="h-10 w-10 mb-2 opacity-50" />
                <p>No projects in this period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={barData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                  <YAxis />
                  <Tooltip
                    formatter={(value: any, name: string) => [
                      name === "fillRate" ? `${value}%` : value,
                      name === "fillRate" ? "Fill Rate" : name,
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="needed" fill="#94a3b8" name="Volunteers Needed" />
                  <Bar dataKey="registered" fill="#10b981" name="Volunteers Registered" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Applications per project (top 10) */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Applications per Project
              <Info className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
            <CardDescription>
              Top projects by number of volunteer applications received in this period.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {applicationsPerProjectData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground text-sm">
                <Inbox className="h-10 w-10 mb-2 opacity-50" />
                <p>No applications in this period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={applicationsPerProjectData} layout="vertical" margin={{ left: 20, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="applications" fill="#0ea5e9" name="Applications" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Project Creation Trend & Applications Over Time */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Project Creation Trend
              <Info className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
            <CardDescription>
              New projects created over the selected time period.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {trendData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground text-sm">
                <FileText className="h-10 w-10 mb-2 opacity-50" />
                <p>No projects created in this period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: "#3b82f6" }}
                    name="Projects Created"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Applications Received Over Time
              <Info className="h-4 w-4 text-muted-foreground" />
            </CardTitle>
            <CardDescription>
              Daily volunteer applications received in this period.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {applicationsOverTimeData.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground text-sm">
                <Inbox className="h-10 w-10 mb-2 opacity-50" />
                <p>No applications in this period</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={applicationsOverTimeData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="applications"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981" }}
                    name="Applications"
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}