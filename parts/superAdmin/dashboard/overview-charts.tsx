"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { supabase } from "@/lib/supabase/client";
import { Users, Building2, FileText } from "lucide-react";

const VOLUNTEER_COLORS = ["#10b981", "#f59e0b", "#6b7280"];
const AGENCY_COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6b7280"];
const PROJECT_COLORS: Record<string, string> = {
  active: "#3b82f6",
  pending: "#f59e0b",
  completed: "#10b981",
  cancelled: "#6b7280",
  rejected: "#ef4444",
};

type ChartSegment = { name: string; value: number; count: number; color: string };

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ name: string; payload?: { name: string; count: number } }>;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0]?.payload ?? payload[0];
  const name = item?.name ?? payload[0]?.name;
  const count = item?.count ?? payload[0]?.value;
  return (
    <div className="rounded-lg border bg-background px-3 py-2 text-sm shadow-md">
      <span className="font-medium">{name}</span>: <span className="font-semibold">{Number(count)}</span>
    </div>
  );
}

export function OverviewCharts() {
  const [loading, setLoading] = useState(true);
  const [volunteerData, setVolunteerData] = useState<ChartSegment[]>([]);
  const [agencyData, setAgencyData] = useState<ChartSegment[]>([]);
  const [projectData, setProjectData] = useState<ChartSegment[]>([]);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        // Volunteers: breakdown by onboarding / email status
        const { data: volunteers } = await supabase
          .from("profiles")
          .select("skills, email_confirmed")
          .eq("role", "volunteer");

        let fullyOnboarded = 0;
        let emailVerifiedIncomplete = 0;
        let emailNotVerified = 0;
        (volunteers || []).forEach((v: { skills?: string[] | null; email_confirmed?: boolean | null }) => {
          const confirmed = v?.email_confirmed === true;
          const hasSkills = Array.isArray(v?.skills) && v.skills.length > 0;
          if (confirmed && hasSkills) fullyOnboarded++;
          else if (confirmed && !hasSkills) emailVerifiedIncomplete++;
          else emailNotVerified++;
        });

        setVolunteerData([
          { name: "Fully Onboarded", value: fullyOnboarded, count: fullyOnboarded, color: VOLUNTEER_COLORS[0] },
          { name: "Email Verified, Onboarding Incomplete", value: emailVerifiedIncomplete, count: emailVerifiedIncomplete, color: VOLUNTEER_COLORS[1] },
          { name: "Email Not Verified", value: emailNotVerified, count: emailNotVerified, color: VOLUNTEER_COLORS[2] },
        ]);

        // Agencies: breakdown by approval / email status
        const { data: agencies } = await supabase
          .from("profiles")
          .select("is_active, contact_person_email, email_confirmed")
          .eq("role", "agency");

        let approved = 0;
        let pending = 0;
        let rejected = 0;
        let agencyEmailNotVerified = 0;
        (agencies || []).forEach((a: { is_active?: boolean; contact_person_email?: string | null; email_confirmed?: boolean | null }) => {
          const confirmed = a?.email_confirmed === true;
          const hasContact = a?.contact_person_email != null && a.contact_person_email !== "";
          if (!confirmed) {
            agencyEmailNotVerified++;
          } else if (a?.is_active === true) {
            approved++;
          } else if (hasContact) {
            pending++;
          } else {
            rejected++;
          }
        });

        setAgencyData([
          { name: "Approved", value: approved, count: approved, color: AGENCY_COLORS[0] },
          { name: "Pending", value: pending, count: pending, color: AGENCY_COLORS[1] },
          { name: "Rejected", value: rejected, count: rejected, color: AGENCY_COLORS[2] },
          { name: "Email Not Verified", value: agencyEmailNotVerified, count: agencyEmailNotVerified, color: AGENCY_COLORS[3] },
        ]);

        // Projects: count per status
        const { data: projects } = await supabase
          .from("projects")
          .select("status");

        const statusCounts: Record<string, number> = {};
        (projects || []).forEach((p: { status?: string }) => {
          const s = (p?.status || "unknown").toLowerCase();
          statusCounts[s] = (statusCounts[s] || 0) + 1;
        });

        const statusOrder = ["pending", "active", "completed", "cancelled", "rejected"];
        const projectSegments = (Object.entries(statusCounts)
          .map(([status, count]) => ({
            name: status.charAt(0).toUpperCase() + status.slice(1),
            value: count,
            count,
            color: PROJECT_COLORS[status] || "#94a3b8",
          })) as ChartSegment[])
          .sort((a, b) => {
            const ai = statusOrder.indexOf(a.name.toLowerCase());
            const bi = statusOrder.indexOf(b.name.toLowerCase());
            if (ai !== -1 && bi !== -1) return ai - bi;
            if (ai !== -1) return -1;
            if (bi !== -1) return 1;
            return a.name.localeCompare(b.name);
          });

        setProjectData(projectSegments);
      } catch (e) {
        console.error("Overview charts fetch error:", e);
        // If email_confirmed doesn't exist, volunteer/agency breakdown may fail; still try projects
        const { data: projects } = await supabase.from("projects").select("status");
        const statusCounts: Record<string, number> = {};
        (projects || []).forEach((p: { status?: string }) => {
          const s = (p?.status || "unknown").toLowerCase();
          statusCounts[s] = (statusCounts[s] || 0) + 1;
        });
        setProjectData(
          Object.entries(statusCounts).map(([status, count]) => ({
            name: status.charAt(0).toUpperCase() + status.slice(1),
            value: count,
            count,
            color: PROJECT_COLORS[status] || "#94a3b8",
          }))
        );
      } finally {
        setLoading(false);
      }
    };
    fetch();
  }, []);

  if (loading) {
    return (
      <Card className="border border-gray-200/80 shadow-sm min-w-0">
        <CardHeader className="pb-2 px-4 sm:px-6">
          <CardTitle className="text-sm sm:text-base font-semibold">Platform overview</CardTitle>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-[200px] sm:h-[220px] bg-muted/30 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  const renderDonut = (data: ChartSegment[], title: string, icon: React.ReactNode) => {
    const total = data.reduce((s, d) => s + d.count, 0);
    if (total === 0) {
      return (
        <Card className="border border-gray-200/80 shadow-sm min-h-[260px] sm:min-h-[300px] lg:min-h-[320px] flex flex-col min-w-0">
          <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2 flex-wrap">
              {icon}
              <span className="break-words">{title}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center px-4 sm:px-6 pb-4 sm:pb-6">
            <p className="text-sm text-muted-foreground text-center py-6 sm:py-8">No data yet.</p>
          </CardContent>
        </Card>
      );
    }
    return (
      <Card className="border border-gray-200/80 shadow-sm min-h-[260px] sm:min-h-[300px] lg:min-h-[320px] flex flex-col min-w-0">
        <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
          <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2 flex-wrap">
            {icon}
            <span className="break-words">{title}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 px-4 sm:px-6 pb-4 sm:pb-6">
          <div className="h-[180px] sm:h-[200px] lg:h-[220px] w-full flex-shrink-0 min-h-0">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={70}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="name"
                >
                  {data.map((_, i) => (
                    <Cell key={i} fill={data[i].color} />
                  ))}
                </Pie>
                <Tooltip content={<CustomTooltip />} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-1.5 justify-center border-t pt-2 text-xs">
            {data.map((seg) => (
              <span key={seg.name} className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: seg.color }}
                />
                <span className="text-muted-foreground truncate max-w-[140px] sm:max-w-none">{seg.name}:</span>
                <span className="font-semibold flex-shrink-0">{seg.count}</span>
              </span>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  };

  const projectsTotal = projectData.reduce((s, d) => s + d.count, 0);

  return (
    <div className="space-y-4 min-w-0">
      <div className="flex items-center gap-2">
        <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        <h2 className="text-sm sm:text-base font-semibold truncate">Platform overview</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 min-w-0">
        {renderDonut(
          volunteerData,
          "Volunteers by onboarding status",
          <Users className="h-4 w-4 text-muted-foreground" />
        )}
        {renderDonut(
          agencyData,
          "Agencies by approval status",
          <Building2 className="h-4 w-4 text-muted-foreground" />
        )}
        <Card className="border border-gray-200/80 shadow-sm min-h-[260px] sm:min-h-[300px] lg:min-h-[320px] flex flex-col min-w-0 sm:col-span-2 lg:col-span-1">
          <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
            <CardTitle className="text-xs sm:text-sm font-semibold flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              Projects by status
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 px-4 sm:px-6 pb-4 sm:pb-6">
            {projectsTotal === 0 ? (
              <div className="flex-1 flex items-center justify-center py-6 sm:py-8">
                <p className="text-sm text-muted-foreground text-center">No projects yet.</p>
              </div>
            ) : (
              <>
                <div className="h-[180px] sm:h-[200px] lg:h-[220px] w-full flex-shrink-0 min-h-0">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={projectData}
                      layout="vertical"
                      margin={{ top: 8, right: 8, left: 4, bottom: 8 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                      <YAxis type="category" dataKey="name" width={56} tick={{ fontSize: 10 }} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]} fill="#3b82f6" name="Projects">
                        {projectData.map((entry, i) => (
                          <Cell key={i} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-x-3 sm:gap-x-4 gap-y-1.5 justify-center border-t pt-2 text-xs">
                  {projectData.map((seg) => (
                    <span key={seg.name} className="flex items-center gap-1.5">
                      <span
                        className="inline-block w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: seg.color }}
                      />
                      <span className="text-muted-foreground">{seg.name}:</span>
                      <span className="font-semibold flex-shrink-0">{seg.count}</span>
                    </span>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
