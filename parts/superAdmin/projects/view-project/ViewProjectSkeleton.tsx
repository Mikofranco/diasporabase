"use client";

import React from "react";

export function ViewProjectSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50/50 pb-20">
      <div className="container mx-auto px-3 sm:px-4 lg:px-5 py-6 max-w-6xl space-y-6">
        <nav className="flex items-center gap-2 text-sm">
          <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
          <span className="text-gray-300">/</span>
          <div className="h-4 w-48 rounded bg-gray-200 animate-pulse" />
        </nav>

        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-2 min-w-0">
            <div className="h-8 w-3/4 max-w-md rounded bg-gray-200 animate-pulse" />
            <div className="flex gap-4">
              <div className="h-4 w-40 rounded bg-gray-100 animate-pulse" />
              <div className="h-4 w-28 rounded bg-gray-100 animate-pulse" />
            </div>
          </div>
          <div className="h-10 w-28 rounded-xl bg-gray-200 animate-pulse shrink-0" />
        </div>

        <div className="space-y-5">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <div className="h-5 w-5 rounded bg-gray-200 animate-pulse" />
              <div className="h-5 w-40 rounded bg-gray-200 animate-pulse" />
            </div>
            <div className="p-5 space-y-2">
              <div className="h-3 w-full rounded bg-gray-100 animate-pulse" />
              <div className="h-3 w-full rounded bg-gray-100 animate-pulse" />
              <div className="h-3 w-5/6 rounded bg-gray-100 animate-pulse" />
              <div className="h-3 w-2/3 rounded bg-gray-100 animate-pulse" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="h-4 w-36 rounded bg-gray-200 animate-pulse" />
              </div>
              <div className="p-5 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex justify-between">
                    <div className="h-4 w-16 rounded bg-gray-100 animate-pulse" />
                    <div className="h-4 w-20 rounded bg-gray-100 animate-pulse" />
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <div className="h-4 w-40 rounded bg-gray-200 animate-pulse" />
              </div>
              <div className="p-5 space-y-4">
                <div className="flex gap-3">
                  <div className="h-5 w-5 rounded bg-gray-100 animate-pulse shrink-0" />
                  <div className="space-y-1 flex-1">
                    <div className="h-4 w-48 rounded bg-gray-100 animate-pulse" />
                    <div className="h-3 w-12 rounded bg-gray-100 animate-pulse" />
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="h-5 w-5 rounded bg-gray-100 animate-pulse shrink-0" />
                  <div className="h-4 w-36 rounded bg-gray-100 animate-pulse" />
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="h-4 w-24 rounded bg-gray-200 animate-pulse" />
              <div className="h-4 w-12 rounded bg-gray-100 animate-pulse" />
            </div>
            <div className="p-5 space-y-4">
              <div className="h-2 w-full rounded-full bg-gray-100 animate-pulse" />
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div
                    key={i}
                    className="flex items-center gap-3 py-2 px-3 rounded-lg bg-gray-50 border border-gray-100"
                  >
                    <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse shrink-0" />
                    <div className="flex-1 space-y-1">
                      <div className="h-3 w-32 rounded bg-gray-200 animate-pulse" />
                      <div className="h-3 w-40 rounded bg-gray-100 animate-pulse" />
                    </div>
                    <div className="h-3 w-16 rounded bg-gray-100 animate-pulse shrink-0" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100">
              <div className="h-4 w-32 rounded bg-gray-200 animate-pulse" />
            </div>
            <div className="p-5 flex flex-wrap gap-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-6 rounded-full bg-gray-100 animate-pulse"
                  style={{ width: `${60 + (i % 3) * 24}px` }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
          <div className="h-10 w-32 rounded-lg bg-gray-200 animate-pulse" />
          <div className="h-10 w-28 rounded-lg bg-gray-100 animate-pulse" />
        </div>
      </div>
    </div>
  );
}
