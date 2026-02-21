"use client";

import React from "react";
import { FileText } from "lucide-react";
import DocumentViewer from "@/components/document-viewer";
import { Project } from "../types";

interface SupportingDocumentsSectionProps {
  project: Project;
}

export function SupportingDocumentsSection({
  project,
}: SupportingDocumentsSectionProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200/80 overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
        <FileText className="h-5 w-5 text-diaspora-blue" />
        <h3 className="font-semibold text-gray-900">Supporting Documents</h3>
      </div>
      <div className="p-5">
        <DocumentViewer
          documents={(project.documents || []).map((d) => ({
            url: d.url,
            name: d.title,
          }))}
          title=""
          emptyMessage="No documents uploaded yet."
          className="shadow-none border-0 p-0 bg-transparent min-h-0"
        />
      </div>
    </div>
  );
}
