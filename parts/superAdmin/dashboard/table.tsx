"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Project } from "@/lib/types";
import { routes } from "@/lib/routes";
import { ChevronRight, FileText } from "lucide-react";

interface TableProps {
  data: Project[];
  onEdit: (project: Project) => void;
  onView: (project: Project) => void;
  onRefresh: () => void;
}

const DISPLAY_LIMIT = 5;

const columns: ColumnDef<Project>[] = [
  {
    accessorKey: "title",
    header: "Project",
    cell: ({ row }) => (
      <div className="font-medium truncate max-w-[120px] sm:max-w-[180px]" title={String(row.getValue("title") ?? "")}>
        {String(row.getValue("title") ?? "—")}
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = (row.getValue("status") as string) || "";
      const statusStyles: Record<string, string> = {
        active: "bg-blue-100 text-blue-800",
        completed: "bg-gray-100 text-gray-800",
        pending: "bg-yellow-100 text-yellow-800",
        cancelled: "bg-red-100 text-red-800",
      };
      return (
        <span
          className={`capitalize px-2 py-0.5 rounded-full text-xs font-medium ${
            statusStyles[status.toLowerCase()] || "bg-gray-100 text-gray-800"
          }`}
        >
          {status || "—"}
        </span>
      );
    },
  },
  {
    id: "actions",
    header: () => null,
    cell: ({ row, table }) => {
      const project = row.original;
      return (
        <div className="flex items-center gap-1 justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-primary text-xs font-medium"
            onClick={() => (table.options.meta as any)?.onView(project)}
          >
            View
          </Button>
        </div>
      );
    },
  },
];

export function RecentApplicationsTable({ data, onEdit, onView }: TableProps) {
  const pathname = usePathname();
  const isSuperAdmin = pathname?.startsWith("/super-admin");
  const projectsHref = isSuperAdmin ? routes.superAdminProjects : routes.adminProjects;
  const displayData = React.useMemo(() => data.slice(0, DISPLAY_LIMIT), [data]);

  const table = useReactTable({
    data: displayData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    meta: { onEdit, onView },
  });

  return (
    <div className="w-full min-w-0 bg-white rounded-lg border border-gray-200/80 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-3 sm:px-4 py-3 border-b border-gray-200/80 flex-wrap sm:flex-nowrap">
        <h2 className="font-semibold text-sm sm:text-base flex items-center gap-2 min-w-0">
          <FileText className="h-4 w-4 text-muted-foreground flex-shrink-0" />
          <span className="truncate">Recent applications</span>
        </h2>
        <Button variant="ghost" size="sm" className="text-primary font-medium flex-shrink-0" asChild>
          <Link href={projectsHref}>
            View all
            <ChevronRight className="h-4 w-4 ml-0.5" />
          </Link>
        </Button>
      </div>
      <div className="overflow-x-auto -webkit-overflow-scrolling-touch">
        <Table className="min-w-[280px]">
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-muted/40 hover:bg-muted/40">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="text-xs font-medium whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(header.column.columnDef.header, header.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} className="hover:bg-muted/20">
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-2 text-xs sm:text-sm">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-20 text-center text-muted-foreground text-sm">
                  No applications yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
