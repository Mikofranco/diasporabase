"use client";

import React from "react";
import { XCircle } from "lucide-react";
import { RejectionReasonRow } from "../types";

interface RejectionReasonsSectionProps {
  rejectionReasons: RejectionReasonRow[];
}

export function RejectionReasonsSection({
  rejectionReasons,
}: RejectionReasonsSectionProps) {
  if (rejectionReasons.length === 0) return null;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-red-200/80 overflow-hidden">
      <div className="px-5 py-4 border-b border-red-100 flex items-center gap-2">
        <XCircle className="h-5 w-5 text-red-600" />
        <h3 className="font-semibold text-gray-900">
          Rejection reason{rejectionReasons.length > 1 ? "s" : ""}
        </h3>
      </div>
      <div className="p-5">
        <ul className="space-y-4">
          {rejectionReasons.map((r) => (
            <li key={r.id} className="text-sm">
              <p className="font-medium text-gray-900">{r.reason_text}</p>
              {r.internal_note?.trim() && (
                <p className="mt-1 text-gray-600 italic border-l-2 border-gray-200 pl-3">
                  Internal note: {r.internal_note}
                </p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                {new Date(r.created_at).toLocaleString()}
              </p>
              {r.rejected_by_name && (
                <p className="text-xs text-gray-600 mt-0.5">
                  Rejected by:{" "}
                  <span className="font-medium">{r.rejected_by_name}</span>
                </p>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
