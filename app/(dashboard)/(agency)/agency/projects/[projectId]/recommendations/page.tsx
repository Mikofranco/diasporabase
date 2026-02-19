import FindVolunteersPage from "@/parts/agency/projects/find-volunteers/FindVolunteersPage";
import React from "react";

interface PageProps {
  params: Promise<{ projectId: string }>;
}

export default async function AgencyProjectRecommendationsPage({ params }: PageProps) {
  const { projectId } = await params;
  return <FindVolunteersPage projectId={projectId} />;
}
