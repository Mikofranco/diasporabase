"use client";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="min-h-[60vh] bg-muted/30 overflow-x-hidden">
      <div className="px-4 py-4 sm:px-5 sm:py-5 md:px-6 md:py-6 lg:px-8 lg:py-8 space-y-6 sm:space-y-7 lg:space-y-8">
        {/* Header */}
        <header className="border-b border-gray-200/80 pb-4 sm:pb-6">
          <Skeleton className="h-8 w-56 sm:h-9 sm:w-72" />
          <Skeleton className="h-4 w-72 mt-2 max-w-full" />
        </header>

        {/* Overview cards */}
        <section>
          <Skeleton className="h-4 w-20 mb-3 sm:mb-4" />
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4 lg:gap-6 min-w-0">
            {[1, 2, 3].map((i) => (
              <Card key={i} className="border border-gray-200/80 shadow-sm overflow-hidden">
                <CardContent className="p-4 sm:p-5 md:p-6 lg:p-7">
                  <div className="flex items-center justify-between gap-3 sm:gap-5">
                    <div className="flex flex-col gap-2 min-w-0 flex-1">
                      <Skeleton className="h-8 w-12 sm:h-9 sm:w-14" />
                      <Skeleton className="h-4 w-24 sm:w-28" />
                    </div>
                    <Skeleton className="h-12 w-12 sm:h-14 sm:w-14 lg:h-16 lg:w-16 rounded-lg sm:rounded-xl flex-shrink-0" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Platform overview + Quick actions */}
        <section className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-5">
          <div className="lg:col-span-3 space-y-4 min-w-0">
            <div className="flex items-center gap-2">
              <Skeleton className="h-4 w-4 rounded" />
              <Skeleton className="h-4 w-36" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 min-w-0">
              {[1, 2, 3].map((i) => (
                <Card key={i} className="border border-gray-200/80 shadow-sm min-w-0">
                  <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
                    <Skeleton className="h-4 w-3/4" />
                  </CardHeader>
                  <CardContent className="px-4 sm:px-6 pb-4 sm:pb-6">
                    <Skeleton className="h-[180px] sm:h-[200px] lg:h-[220px] w-full rounded-lg" />
                    <div className="flex flex-wrap gap-2 mt-3 pt-3 border-t">
                      {[1, 2, 3].map((j) => (
                        <Skeleton key={j} className="h-4 w-16" />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
          <Card className="border border-gray-200/80 shadow-sm min-w-0">
            <CardHeader className="pb-2 px-4 sm:px-6 pt-4 sm:pt-6">
              <Skeleton className="h-4 w-28" />
            </CardHeader>
            <CardContent className="space-y-1 px-4 sm:px-6 pb-4 sm:pb-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-10 w-full rounded-lg" />
              ))}
            </CardContent>
          </Card>
        </section>

        {/* Recent activity tables */}
        <section className="min-w-0">
          <Skeleton className="h-4 w-24 mb-3 sm:mb-4" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-5 min-w-0">
            {[1, 2].map((i) => (
              <Card key={i} className="border border-gray-200/80 shadow-sm min-w-0 overflow-hidden">
                <CardHeader className="pb-2 px-3 sm:px-6 pt-4 sm:pt-6">
                  <div className="flex items-center justify-between gap-2">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-8 w-16 rounded" />
                  </div>
                </CardHeader>
                <CardContent className="px-3 sm:px-6 pb-4 sm:pb-6">
                  <div className="space-y-2">
                    <Skeleton className="h-9 w-full rounded" />
                    {[1, 2, 3, 4, 5].map((j) => (
                      <Skeleton key={j} className="h-12 w-full rounded" />
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
