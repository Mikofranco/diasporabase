"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { createClient } from "@/lib/supabase/client";
import { routes } from "@/lib/routes";
import { Building2, ChevronRight, Clock, Mail } from "lucide-react";

const supabase = createClient();

export interface PendingAgencyRow {
  id: string;
  organization_name: string;
  contact_person_first_name: string;
  contact_person_last_name: string;
  contact_person_email: string;
  created_at: string;
}

export function PendingAgenciesSection() {
  const [agencies, setAgencies] = useState<PendingAgencyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const pathname = usePathname();
  const isSuperAdmin = pathname?.startsWith("/super-admin");
  const agenciesHref = isSuperAdmin ? routes.superAdminAgencies : routes.adminAgencies;
  const viewAgencyHref = (id: string) =>
    isSuperAdmin ? routes.superAdminViewAgency(id) : routes.adminViewAgency(id);

  useEffect(() => {
    const fetchPendingAgencies = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select(
          "id, organization_name, contact_person_first_name, contact_person_last_name, contact_person_email, created_at"
        )
        .eq("role", "agency")
        .neq("is_active", true)
        .not("contact_person_email", "is", null)
        .order("created_at", { ascending: false })
        .limit(10);

      if (!error) {
        setAgencies(data ?? []);
      }
      setLoading(false);
    };
    fetchPendingAgencies();
  }, []);

  if (loading && agencies.length === 0) {
    return (
      <Card className="border border-gray-200/80 shadow-sm h-full min-h-[220px] sm:min-h-[260px] flex flex-col min-w-0">
        <CardHeader className="pb-2 px-3 sm:px-6 pt-4 sm:pt-6">
          <div className="flex items-center justify-between gap-2">
            <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2 min-w-0">
              <Building2 className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              <span className="truncate">Pending agency approvals</span>
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="flex-1 px-3 sm:px-6 pb-4 sm:pb-6">
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 bg-muted/50 rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border border-gray-200/80 shadow-sm h-full min-h-[220px] sm:min-h-[260px] flex flex-col min-w-0">
      <CardHeader className="pb-2 px-3 sm:px-6 pt-4 sm:pt-6">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <CardTitle className="text-sm sm:text-base font-semibold flex items-center gap-2 min-w-0">
            <Building2 className={`h-4 w-4 flex-shrink-0 ${agencies.length > 0 ? "text-amber-600" : "text-muted-foreground"}`} />
            <span className="truncate">Pending agency approvals</span>
            {agencies.length > 0 && (
              <span className="text-xs sm:text-sm font-normal text-muted-foreground flex-shrink-0">
                ({agencies.length} awaiting)
              </span>
            )}
          </CardTitle>
          <Button variant="ghost" size="sm" className="text-primary font-medium flex-shrink-0" asChild>
            <Link href={agenciesHref}>
              View all
              <ChevronRight className="h-4 w-4 ml-0.5" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col px-3 sm:px-6 pb-4 sm:pb-6 min-w-0">
        {agencies.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">No pending agencies.</p>
        ) : (
          <div className="rounded-md border border-gray-200/80 overflow-x-auto flex-1 min-h-0 -webkit-overflow-scrolling-touch">
            <Table className="min-w-[320px]">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="font-medium text-xs whitespace-nowrap">Organization</TableHead>
                  <TableHead className="font-medium text-xs whitespace-nowrap">Contact</TableHead>
                  <TableHead className="font-medium text-xs whitespace-nowrap">Submitted</TableHead>
                  <TableHead className="w-[70px] text-right font-medium text-xs whitespace-nowrap">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {agencies.slice(0, 5).map((agency) => (
                  <TableRow
                    key={agency.id}
                    className="hover:bg-muted/30 transition-colors"
                  >
                    <TableCell className="font-medium text-xs sm:text-sm py-2">
                      <span className="truncate max-w-[100px] sm:max-w-[140px] block" title={agency.organization_name || ""}>
                        {agency.organization_name || "—"}
                      </span>
                    </TableCell>
                    <TableCell className="py-2">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-xs truncate max-w-[90px] sm:max-w-[120px]">
                          {agency.contact_person_first_name} {agency.contact_person_last_name}
                        </span>
                        <a
                          href={`mailto:${agency.contact_person_email}`}
                          className="text-xs text-primary hover:underline truncate max-w-[90px] sm:max-w-[120px] block"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Mail className="h-3 w-3 inline mr-0.5 flex-shrink-0" />
                          {agency.contact_person_email}
                        </a>
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-xs py-2 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 shrink-0" />
                        {new Date(agency.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        })}
                      </div>
                    </TableCell>
                    <TableCell className="text-right py-2 whitespace-nowrap">
                      <Button variant="ghost" size="sm" className="h-7 text-primary text-xs flex-shrink-0" asChild>
                        <Link href={viewAgencyHref(agency.id)}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
