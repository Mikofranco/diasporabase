"use client";

import { useEffect, useState } from "react";
import { getUserId } from "@/lib/utils";
import AgencyRequestFromVolunteer from "@/parts/agency/dashboard/requests";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import Link from "next/link";
import { routes } from "@/lib/routes";

export default function AgencyRequestsPage() {
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getUserId().then(({ data }) => {
      setUserId(data ?? null);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-diaspora-blue border-t-transparent" />
      </div>
    );
  }

  if (!userId) {
    return (
      <div className="container mx-auto p-6 text-center text-muted-foreground">
        Please log in to view volunteer requests.
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-8xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Volunteer Requests</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Review and respond to volunteer applications for your projects.
        </p>
      </div>

      <AgencyRequestFromVolunteer userId={userId} />
    </div>
  );
}
