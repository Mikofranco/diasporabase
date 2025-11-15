// app/agency/analytics/page.tsx
"use client";

import { useState, useEffect } from "react";
import { format, subDays } from "date-fns";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { supabase } from "@/lib/supabase/client";
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Activity, Users, CheckCircle, TrendingUp, Info } from "lucide-react";

const filterSchema = z.object({
  timeRange: z.enum(["7d", "30d", "90d"]),
});

type FilterFormData = z.infer<typeof filterSchema>;

export default function AgencyAnalytics() {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>({});
  const [pieData, setPieData] = useState<any[]>([]);
  const [barData, setBarData] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);

  const { watch } = useForm<FilterFormData>({
    resolver: zodResolver(filterSchema),
    defaultValues: { timeRange: "30d" },
  });

  const timeRange = watch("timeRange");

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", user.email)
          .single();

        if (!profile) return;

        const agencyId = profile.id;
        const fromDate = subDays(new Date(), parseInt(timeRange));

        // Fetch Projects
        const { data: projects } = await supabase
          .from("projects")
          .select("id, title, status, created_at, volunteers_needed, volunteers_registered")
          .eq("organization_id", agencyId)
          .gte("created_at", fromDate.toISOString());

        // Fetch Volunteer Requests
        const { data: requests } = await supabase
          .from("volunteer_requests")
          .select("status")
          .eq("organization_id", agencyId)
          .gte("created_at", fromDate.toISOString());

        // Fetch Ratings
        const { data: ratings } = await supabase
          .from("project_ratings")
          .select("rating")
          .in("project_id", projects?.map(p => p.id) || []);

        // Compute Stats
        const active = projects?.filter(p => p.status === "active").length || 0;
        const completed = projects?.filter(p => p.status === "completed").length || 0;
        const pending = projects?.filter(p => p.status === "pending").length || 0;

        const totalVolunteers = projects?.reduce((sum, p) => sum + (p.volunteers_registered || 0), 0) || 0;
        const avgRating = ratings?.length ? (ratings.reduce((s, r) => s + r.rating, 0) / ratings.length).toFixed(1) : "N/A";

        const acceptanceRate = requests?.length
          ? ((requests.filter(r => r.status === "accepted").length / requests.length) * 100).toFixed(1)
          : "0";

        setStats({ totalProjects: projects?.length || 0, active, completed, pending, totalVolunteers, avgRating, acceptanceRate });

        // Pie: Project Status
        setPieData([
          { name: "Active", value: active, color: "#10b981", description: "Projects currently in progress" },
          { name: "Completed", value: completed, color: "#3b82f6", description: "Successfully finished projects" },
          { name: "Pending", value: pending, color: "#f59e0b", description: "Awaiting approval or start" },
        ]);

        // Bar: Volunteer Fill Rate
        setBarData(
          projects?.map(p => ({
            name: p.title.slice(0, 20) + (p.title.length > 20 ? "..." : ""),
            needed: p.volunteers_needed || 0,
            registered: p.volunteers_registered || 0,
            fillRate: p.volunteers_needed ? Math.round((p.volunteers_registered / p.volunteers_needed) * 100) : 0,
          })) || []
        );

        // Trend: Projects Created Over Time
        const trend = projects?.reduce((acc: any, p) => {
          const date = format(new Date(p.created_at), "MMM dd");
          acc[date] = (acc[date] || 0) + 1;
          return acc;
        }, {});

        setTrendData(Object.entries(trend || {}).map(([date, count]) => ({ date, count })));

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
            <Select value={timeRange} onValueChange={(v) => watch("timeRange", v as any)}>
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <CardTitle className="text-sm font-medium">Average Citizen Rating</CardTitle>
            <div className="h-4 w-4 text-yellow-500">★</div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgRating}</div>
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
          </CardContent>
        </Card>
      </div>

      {/* Project Creation Trend */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            Project Creation Trend
            <Info className="h-4 w-4 text-muted-foreground" />
          </CardTitle>
          <CardDescription>
            Number of new projects created over the selected time period.
          </CardDescription>
        </CardHeader>
        <CardContent>
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
                strokeWidth={3}
                dot={{ fill: "#3b82f6" }}
                name="Projects Created"
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}