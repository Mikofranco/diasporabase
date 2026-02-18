"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Loader2,
  Mail,
  RefreshCw,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import { toast } from "sonner";

const EMAIL_REGEX =
  /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(String(email).trim()) && email.length <= 255;
}

type Row = {
  user_id: string;
  email: string;
  registration_date: string;
  attempt_count: number;
  last_attempt_at: string | null;
  status: string;
  error_message: string | null;
  link_id: string;
  expires_at: string;
};

export default function AdminEmailConfirmationsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchRows = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      params.set("sort", "registration_date");
      params.set("order", sortOrder);
      const res = await fetch(`/api/admin/email-confirmations?${params}`);
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setRows(data.rows ?? []);
    } catch {
      toast.error("Failed to load email confirmations");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, sortOrder]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  const handleResend = async (userId: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/email-confirmations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend", userId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Resend failed");
      const result = data.results?.[0];
      if (result?.success) {
        toast.success(`Email resent to user`);
      } else {
        toast.error(result?.error || "Resend failed");
      }
      fetchRows();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Resend failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleMarkInvalid = async (userId: string, email: string) => {
    if (!confirm("Mark this user's email as invalid? They will need to re-register or contact support.")) return;
    setActionLoading(userId);
    try {
      const res = await fetch("/api/admin/email-confirmations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_invalid", userId, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      toast.success("Marked as invalid");
      fetchRows();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleBulkResend = async () => {
    const ids = Array.from(selectedIds);
    if (!ids.length) {
      toast.error("Select at least one user");
      return;
    }
    setBulkLoading(true);
    try {
      const res = await fetch("/api/admin/email-confirmations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "resend", userIds: ids }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Bulk resend failed");
      const results = data.results ?? [];
      const ok = results.filter((r: { success: boolean }) => r.success).length;
      const fail = results.length - ok;
      if (fail === 0) toast.success(`Resent to ${ok} user(s)`);
      else toast.warning(`Sent: ${ok}, Failed: ${fail}`);
      setSelectedIds(new Set());
      fetchRows();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Bulk resend failed");
    } finally {
      setBulkLoading(false);
    }
  };

  const toggleSort = () => {
    setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === rows.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(rows.map((r) => r.user_id)));
    }
  };

  const toggleSelect = (userId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(userId)) next.delete(userId);
      else next.add(userId);
      return next;
    });
  };

  return (
    <div className="space-y-6 p-4">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email confirmations
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="icon" onClick={() => fetchRows()} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </Button>
            {selectedIds.size > 0 && (
              <Button
                onClick={handleBulkResend}
                disabled={bulkLoading}
                className="bg-[#0ea5e9] hover:bg-[#0284c7]"
              >
                {bulkLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  `Resend (${selectedIds.size})`
                )}
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : rows.length === 0 ? (
            <p className="py-8 text-center text-muted-foreground">
              No unconfirmed users found.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <Checkbox
                      checked={rows.length > 0 && selectedIds.size === rows.length}
                      onCheckedChange={toggleSelectAll}
                      aria-label="Select all"
                    />
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="-ml-3 h-8"
                      onClick={toggleSort}
                    >
                      Registration date
                      {sortOrder === "desc" ? (
                        <ArrowDown className="ml-1 h-4 w-4" />
                      ) : (
                        <ArrowUp className="ml-1 h-4 w-4" />
                      )}
                    </Button>
                  </TableHead>
                  <TableHead>Attempts</TableHead>
                  <TableHead>Last attempt</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.user_id}>
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.has(row.user_id)}
                        onCheckedChange={() => toggleSelect(row.user_id)}
                        aria-label={`Select ${row.email}`}
                      />
                    </TableCell>
                    <TableCell>
                      <span className={!isValidEmail(row.email) ? "text-destructive" : ""}>
                        {row.email || "—"}
                      </span>
                    </TableCell>
                    <TableCell>
                      {row.registration_date
                        ? new Date(row.registration_date).toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell>{row.attempt_count ?? 0}</TableCell>
                    <TableCell>
                      {row.last_attempt_at
                        ? new Date(row.last_attempt_at).toLocaleString()
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          row.status === "failed"
                            ? "text-destructive"
                            : row.status === "invalid_email"
                              ? "text-amber-600"
                              : ""
                        }
                      >
                        {row.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={actionLoading === row.user_id}
                          onClick={() => handleResend(row.user_id)}
                        >
                          {actionLoading === row.user_id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            "Resend"
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-amber-600 hover:text-amber-700"
                          disabled={actionLoading === row.user_id}
                          onClick={() => handleMarkInvalid(row.user_id, row.email)}
                        >
                          Mark invalid
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
