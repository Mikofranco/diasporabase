"use client";

import React, { useState } from "react";
import Image from "next/image";
import { X, Download, Maximize2, FileText, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogClose } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { Card } from "./ui/card";
import DiasporaBaseModal from "./diasporabase-modal";

interface Document {
  url: string;
  name?: string;
  type?: string; // "image", "pdf", etc.
}

interface DocumentViewerProps {
  documents: Document[] | null | undefined;
  title?: string;
  emptyMessage?: string;
  className?: string;
}

export default function DocumentViewer({
  documents = [],
  title = "Uploaded Documents",
  emptyMessage = "No documents uploaded yet.",
  className,
}: DocumentViewerProps) {
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);

  const isImage = (url: string) => {
    return /\.(jpg|jpeg|png|gif|webp)$/i.test(url);
  };

  const isPDF = (url: string) => {
    return /\.pdf$/i.test(url);
  };

  const getFileIcon = (url: string) => {
    if (isImage(url)) return <ImageIcon className="h-6 w-6 text-blue-500" />;
    if (isPDF(url)) return <FileText className="h-6 w-6 text-red-500" />;
    return <FileText className="h-6 w-6 text-gray-500" />;
  };

  if (!documents || documents.length === 0) {
    return (
      <div className={cn("text-center py-12 text-gray-500", className)}>
        <p className="text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <Card className={cn("space-y-6 p-6", className)}>
      {title && (
        <h3 className="text-xl font-semibold text-diaspora-blue ">
          {title}
        </h3>
      )}

      {/* Grid of thumbnails */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
        {documents.map((doc, index) => (
          <div
            key={index}
            className="group relative bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-all duration-200 cursor-pointer"
            onClick={() => setSelectedDoc(doc)}
          >
            {/* Preview area */}
            <div className="aspect-[4/3] relative bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
              {isImage(doc.url) ? (
                <Image
                  src={doc.url}
                  alt={doc.name || "Document preview"}
                  fill
                  className="object-cover transition-transform duration-300 group-hover:scale-105"
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 20vw"
                />
              ) : isPDF(doc.url) ? (
                <div className="text-center p-6">
                  <FileText className="h-12 w-12 mx-auto text-red-500 mb-3" />
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    PDF Document
                  </p>
                </div>
              ) : (
                <div className="text-center p-6">
                  {getFileIcon(doc.url)}
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 truncate px-2">
                    {doc.name || "File"}
                  </p>
                </div>
              )}
            </div>

            {/* Footer info */}
            <div className="p-3">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {doc.name || `Document ${index + 1}`}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {isImage(doc.url)
                  ? "Image"
                  : isPDF(doc.url)
                  ? "PDF"
                  : "Document"}
              </p>
            </div>

            {/* Hover overlay */}
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Maximize2 className="h-8 w-8 text-white" />
            </div>
          </div>
        ))}
      </div>

      {/* Preview Modal */}
      <Dialog open={!!selectedDoc} onOpenChange={() => setSelectedDoc(null)}>
        <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 gap-0 bg-black/95 border-none">
          <div className="relative h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h4 className="text-lg font-medium text-white truncate max-w-[70%]">
                {selectedDoc?.name || "Document Preview"}
              </h4>
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-white hover:bg-white/10"
                  asChild
                >
                  <a href={selectedDoc?.url} download target="_blank">
                    <Download className="h-5 w-5" />
                  </a>
                </Button>
                <DialogClose asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-white hover:bg-white/10"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </DialogClose>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto p-4 flex items-center justify-center bg-gradient-to-b from-gray-950 to-black">
              {selectedDoc && isImage(selectedDoc.url) ? (
                <div className="relative max-h-full max-w-full">
                  <Image
                    src={selectedDoc.url}
                    alt={selectedDoc.name || "Preview"}
                    width={1200}
                    height={900}
                    className="object-contain rounded-lg shadow-2xl"
                    priority
                  />
                </div>
              ) : selectedDoc && isPDF(selectedDoc.url) ? (
                <iframe
                  src={selectedDoc.url}
                  className="w-full h-full rounded-lg shadow-2xl"
                  title={selectedDoc.name || "PDF Preview"}
                />
              ) : (
                <div className="text-center text-white">
                  <FileText className="h-24 w-24 mx-auto mb-6 opacity-70" />
                  <p className="text-xl">Preview not available for this file type</p>
                  <Button asChild className="mt-6">
                    <a href={selectedDoc?.url} download target="_blank">
                      Download File
                    </a>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}