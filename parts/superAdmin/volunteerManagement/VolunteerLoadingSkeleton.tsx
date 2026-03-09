"use client";

import React from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const SKELETON_ROW_COUNT = 10;

function Skeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded-md bg-gray-200 ${className ?? ""}`}
      aria-hidden
    />
  );
}

export function VolunteerLoadingSkeleton() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Page header */}
      <div>
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 mt-2" />
      </div>

      {/* Filters bar */}
      <div className="rounded-xl border border-gray-200 bg-white shadow-sm p-4 sm:p-5 animate-pulse">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[1fr_140px_1fr_auto] gap-4 lg:gap-3 items-end">
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-40" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-14" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
          <div className="space-y-1.5">
            <Skeleton className="h-3 w-12" />
            <Skeleton className="h-9 w-full rounded-lg" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-9 w-20 rounded-lg" />
            <Skeleton className="h-9 w-28 rounded-lg" />
          </div>
        </div>
        <Skeleton className="h-3 w-32 mt-4 pt-3" />
      </div>

      {/* Table card */}
      <Card className="shadow-sm border border-gray-200 overflow-hidden">
        <CardHeader className="border-b bg-gray-50/50">
          <div className="flex flex-row items-center justify-between gap-4">
            <Skeleton className="h-6 w-36" />
            <Skeleton className="h-4 w-24" />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100/80 border-b hover:bg-gray-100/80">
                  <TableHead className="text-gray-400 font-medium">Name</TableHead>
                  <TableHead className="text-gray-400 font-medium">Email</TableHead>
                  <TableHead className="text-gray-400 font-medium">Status</TableHead>
                  <TableHead className="text-gray-400 font-medium">Skills</TableHead>
                  <TableHead className="text-gray-400 font-medium">Projects</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Array.from({ length: SKELETON_ROW_COUNT }).map((_, i) => (
                  <TableRow key={i} className="border-b last:border-0">
                    <TableCell>
                      <Skeleton className="h-5 w-32" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-5 w-44" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-6 w-16 rounded-full" />
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <Skeleton className="h-5 w-14 rounded-md" />
                        <Skeleton className="h-5 w-20 rounded-md" />
                        <Skeleton className="h-5 w-16 rounded-md" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-1.5">
                        <Skeleton className="h-5 w-24 rounded-md" />
                        <Skeleton className="h-5 w-20 rounded-md" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {/* Pagination bar skeleton */}
          <div className="border-t px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-44" />
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-14" />
                <Skeleton className="h-8 w-[70px] rounded-lg" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-8 w-24 rounded-lg" />
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-8 w-16 rounded-lg" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/** Skeleton for the table only (e.g. when refetching with filters/pagination). */
export function VolunteerTableSkeleton() {
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow className="bg-gray-100/80 border-b hover:bg-gray-100/80">
            <TableHead className="text-gray-400 font-medium">Name</TableHead>
            <TableHead className="text-gray-400 font-medium">Email</TableHead>
            <TableHead className="text-gray-400 font-medium">Status</TableHead>
            <TableHead className="text-gray-400 font-medium">Skills</TableHead>
            <TableHead className="text-gray-400 font-medium">Projects</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 8 }).map((_, i) => (
            <TableRow key={i} className="border-b last:border-0">
              <TableCell>
                <Skeleton className="h-5 w-32" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-44" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-6 w-16 rounded-full" />
              </TableCell>
              <TableCell>
                <div className="flex gap-1.5">
                  <Skeleton className="h-5 w-14 rounded-md" />
                  <Skeleton className="h-5 w-20 rounded-md" />
                </div>
              </TableCell>
              <TableCell>
                <div className="flex gap-1.5">
                  <Skeleton className="h-5 w-24 rounded-md" />
                  <Skeleton className="h-5 w-20 rounded-md" />
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
