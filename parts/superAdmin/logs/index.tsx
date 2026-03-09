"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollText, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { routes } from "@/lib/routes";
import { format } from "date-fns";

export interface SystemLogRow {
  id: string;
  created_at: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  details: Record<string, unknown> | null;
  actor_id: string | null;
  actor_email: string | null;
  actor_role: string | null;
  meta: Record<string, unknown> | null;
}

const ENTITY_OPTIONS = [
  { value: "all", label: "All entities" },
  { value: "project", label: "Project" },
  { value: "profile", label: "Profile" },
  { value: "application", label: "Application" },
  { value: "agency", label: "Agency" },
  { value: "admin", label: "Admin" },
] as const;

const PAGE_SIZE = 50;

export default function SuperAdminLogs() {
  const router = useRouter();
  const [logs, setLogs] = useState<SystemLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [roleChecked, setRoleChecked] = useState(false);
  const [entityFilter, setEntityFilter] = useState<string>("all");
  const [refreshing, setRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const supabase = createClient();

    const checkRoleAndFetch = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.replace(routes.login);
        return;
      }
      const { data: profile, error } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (error || !profile || profile.role !== "super_admin") {
        toast.error("Access denied. Super admin only.");
        router.replace(routes.superAdminDashboard);
        return;
      }
      setRoleChecked(true);
    };

    checkRoleAndFetch();
  }, [router]);

  useEffect(() => {
    if (!roleChecked) return;

    const supabase = createClient();

    const fetchLogs = async () => {
      setRefreshing(true);
      let q = supabase
        .from("system_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(PAGE_SIZE);

      if (entityFilter !== "all") {
        q = q.eq("entity_type", entityFilter);
      }

      const { data, error } = await q;

      if (error) {
        toast.error("Failed to load logs: " + error.message);
        setLogs([]);
      } else {
        setLogs((data as SystemLogRow[]) ?? []);
      }
      setLoading(false);
      setRefreshing(false);
    };

    fetchLogs();
  }, [roleChecked, entityFilter, refreshKey]);

  if (!roleChecked) {
    return (
      <div className="container mx-auto p-6">
        <Skeleton className="h-10 w-48 mb-4" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <ScrollText className="h-10 w-10 text-gray-700" />
          <h1 className="text-2xl font-semibold text-gray-900">System Logs</h1>
        </div>
        <p className="text-sm text-gray-500">
          Activity across projects, profiles, applications, and admin actions.
        </p>
      </div>

      <Card className="rounded-xl border bg-card shadow-sm">
        <CardHeader className="pb-3">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle className="text-lg">Activity log</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={entityFilter} onValueChange={setEntityFilter}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Entity type" />
                </SelectTrigger>
                <SelectContent>
                  {ENTITY_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <button
                type="button"
                onClick={() => {
                  setRefreshKey((k) => k + 1);
                }}
                disabled={refreshing}
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
              >
                <RefreshCw className={refreshing ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
              </button>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Showing up to {PAGE_SIZE} most recent entries
            {entityFilter !== "all" ? ` (entity: ${entityFilter})` : ""}.
          </p>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y p-4 space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded" />
              ))}
            </div>
          ) : logs.length === 0 ? (
            <div className="p-8 text-center text-sm text-gray-500">
              No log entries yet. Events will appear here as admins and the system perform actions.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40">
                    <TableHead className="w-[160px]">Time</TableHead>
                    <TableHead className="w-[140px]">Action</TableHead>
                    <TableHead className="w-[100px]">Entity</TableHead>
                    <TableHead className="w-[120px]">Entity ID</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead className="max-w-[240px]">Details</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((row) => (
                    <TableRow key={row.id}>
                      <TableCell className="text-muted-foreground text-sm whitespace-nowrap">
                        {format(new Date(row.created_at), "MMM d, yyyy HH:mm")}
                      </TableCell>
                      <TableCell className="font-medium">{row.action}</TableCell>
                      <TableCell>{row.entity_type}</TableCell>
                      <TableCell className="font-mono text-xs truncate max-w-[120px]" title={row.entity_id ?? ""}>
                        {row.entity_id ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm">
                        {row.actor_email ?? row.actor_role ?? "—"}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground max-w-[240px] truncate" title={row.details ? JSON.stringify(row.details) : ""}>
                        {row.details ? (
                          typeof row.details === "object" ? (
                            JSON.stringify(row.details).slice(0, 80) + (JSON.stringify(row.details).length > 80 ? "…" : "")
                          ) : (
                            String(row.details)
                          )
                        ) : (
                          "—"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
