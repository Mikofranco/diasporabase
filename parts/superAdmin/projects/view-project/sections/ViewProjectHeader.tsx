"use client";

import React from "react";
import Link from "next/link";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Building2, Tag } from "lucide-react";
import { Project } from "../types";

interface FromAgencyBreadcrumb {
  name: string;
  listHref: string;
  viewHref: string;
}

interface ViewProjectHeaderProps {
  project: Project;
  projectsHref: string;
  fromAgency?: FromAgencyBreadcrumb | null;
}

export function ViewProjectHeader({
  project,
  projectsHref,
  fromAgency,
}: ViewProjectHeaderProps) {
  return (
    <>
      <Breadcrumb>
        <BreadcrumbList>
          {fromAgency ? (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={fromAgency.listHref}>Agencies</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={fromAgency.viewHref} className="truncate max-w-[180px] sm:max-w-xs">
                    {fromAgency.name}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium text-foreground truncate max-w-[200px] sm:max-w-md">
                  {project.title}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          ) : (
            <>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={projectsHref}>Projects</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage className="font-medium text-foreground truncate max-w-[200px] sm:max-w-md">
                  {project.title}
                </BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight">
            {project.title}
          </h1>
          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
            <div className="flex items-center gap-1.5">
              <Building2 className="h-4 w-4 shrink-0 text-gray-500" />
              <span>{project.organization_name}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Tag className="h-4 w-4 shrink-0 text-gray-500" />
              <span className="capitalize">{project.category}</span>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
