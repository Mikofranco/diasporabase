"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TooltipProvider } from "@/components/ui/tooltip";
import { UserCheck, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { routes } from "@/lib/routes";
import { useFindVolunteers } from "./useFindVolunteers";
import { FindVolunteersSearchCard } from "./FindVolunteersSearchCard";
import { VolunteerCard } from "./VolunteerCard";
import { SendRequestDialog } from "./SendRequestDialog";

interface FindVolunteersPageProps {
  projectId: string;
}

function FindVolunteersPageSkeleton() {
  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-7xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm">
        <Skeleton className="h-4 w-16 rounded" />
        <Skeleton className="h-3 w-3 rounded-full shrink-0" />
        <Skeleton className="h-4 w-28 rounded" />
        <Skeleton className="h-3 w-3 rounded-full shrink-0" />
        <Skeleton className="h-4 w-24 rounded" />
      </div>

      {/* Header: title + subtitle + back button */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1.5">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-9 w-32 rounded-md shrink-0" />
      </div>

      {/* Search card */}
      <Card className="border border-border">
        <CardContent className="pt-6">
          <div className="space-y-2 mb-4">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="space-y-1.5">
                <Skeleton className="h-3 w-12" />
                <Skeleton className="h-9 w-full rounded-md" />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-24 rounded-md" />
            <Skeleton className="h-9 w-40 rounded-md" />
          </div>
        </CardContent>
      </Card>

      {/* Volunteer count line */}
      <div className="flex items-center gap-2">
        <Skeleton className="h-4 w-4 rounded shrink-0" />
        <Skeleton className="h-4 w-28" />
      </div>

      {/* Volunteer cards grid – match real card layout */}
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="overflow-hidden border border-border">
            <CardContent className="p-5 flex-1">
              <div className="flex items-start gap-3 mb-4">
                <Skeleton className="h-12 w-12 rounded-full shrink-0" />
                <div className="min-w-0 flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-full max-w-[180px]" />
                </div>
              </div>
              <div className="mb-4">
                <Skeleton className="h-3 w-10 mb-1.5" />
                <div className="flex flex-wrap gap-1.5">
                  <Skeleton className="h-5 w-14 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                  <Skeleton className="h-5 w-20 rounded-full" />
                </div>
              </div>
              <div className="flex items-center gap-2 mb-3">
                <Skeleton className="h-4 w-4 shrink-0 rounded" />
                <Skeleton className="h-4 w-24" />
              </div>
              <div className="flex items-center gap-1.5">
                <Skeleton className="h-4 w-4 shrink-0 rounded" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-3 w-6" />
              </div>
            </CardContent>
            <div className="border-t border-border bg-muted/50 p-4">
              <Skeleton className="h-9 w-full rounded-md" />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function FindVolunteersPage({ projectId }: FindVolunteersPageProps) {
  const router = useRouter();
  const {
    project,
    volunteers,
    loading,
    error,
    volunteersNeeded,
    volunteersRegistered,
    searchName,
    setSearchName,
    searchSkills,
    setSearchSkills,
    searchMinRating,
    setSearchMinRating,
    searchLocation,
    setSearchLocation,
    searching,
    isRequestDialogOpen,
    selectedVolunteer,
    fetchRecommendations,
    runSearch,
    handleSendRequest,
    clearSearchAndRefresh,
    openRequestDialog,
    closeRequestDialog,
  } = useFindVolunteers(projectId);

  if (loading && !project) {
    return <FindVolunteersPageSkeleton />;
  }

  if (error && !project) {
    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6 text-red-600 text-center">
            <p className="font-medium">{error}</p>
            <Button
              variant="outline"
              className="mt-4"
              onClick={() => router.push(routes.agencyViewProject(projectId))}
            >
              Back to project
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const projectTitle = project?.title ?? "Project";

  return (
    <TooltipProvider>
      <div
        className={cn(
          "container mx-auto p-4 sm:p-6 max-w-7xl space-y-6",
          isRequestDialogOpen && "blur-sm"
        )}
      >
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={routes.agencyProjects}>Projects</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link
                  href={routes.agencyViewProject(projectId)}
                  className="truncate max-w-[180px] sm:max-w-xs inline-block"
                >
                  {projectTitle}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium text-foreground">
                Find volunteers
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              Find volunteers
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {volunteersRegistered} / {volunteersNeeded} slots filled
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href={routes.agencyViewProject(projectId)}>
              <ArrowLeft className="h-4 w-4 mr-1.5" />
              Back to project
            </Link>
          </Button>
        </div>

        <FindVolunteersSearchCard
          searchName={searchName}
          setSearchName={setSearchName}
          searchSkills={searchSkills}
          setSearchSkills={setSearchSkills}
          searchMinRating={searchMinRating}
          setSearchMinRating={setSearchMinRating}
          searchLocation={searchLocation}
          setSearchLocation={setSearchLocation}
          searching={searching}
          onSearch={runSearch}
          onShowRecommendations={clearSearchAndRefresh}
        />

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <UserCheck className="h-4 w-4" />
          <span>
            {volunteers.length} volunteer{volunteers.length !== 1 ? "s" : ""}{" "}
            shown
          </span>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        {volunteers.length === 0 ? (
          <Card className="border-dashed border-2">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <p className="text-lg font-medium text-gray-900">
                No volunteers found
              </p>
              <p className="text-sm text-gray-500 mt-1">
                Try adjusting your search or view recommendations again.
              </p>
              <Button
                variant="outline"
                className="mt-4"
                onClick={fetchRecommendations}
              >
                Show recommendations
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {volunteers.map((volunteer) => (
              <VolunteerCard
                key={volunteer.volunteer_id}
                volunteer={volunteer}
                volunteersRegistered={volunteersRegistered}
                volunteersNeeded={volunteersNeeded}
                onOpenRequestDialog={openRequestDialog}
              />
            ))}
          </div>
        )}

        <SendRequestDialog
          open={isRequestDialogOpen}
          onOpenChange={closeRequestDialog}
          selectedVolunteer={selectedVolunteer}
          onConfirm={handleSendRequest}
        />
      </div>
    </TooltipProvider>
  );
}
