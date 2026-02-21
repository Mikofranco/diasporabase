"use client";

import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
  VisibilityState,
} from "@tanstack/react-table";
import { ArrowUpDown, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Project } from "@/lib/types";
import { getProjectStatusStyle } from "../../projects/filters";
import CreateProjectForm from "../../create-project";

interface TableProps {
  data: Project[];
  onEdit: (project: Project) => void;
  onView: (project: Project) => void;
  onRefresh: () => void; 
}

export const columns: ColumnDef<Project>[] = [
  {
    accessorKey: "title",
    header: "Project Name",
    cell: ({ row }) => <div className="capitalize">{row.getValue("title")}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = (row.getValue("status") as string) || "";
      const { label, className } = getProjectStatusStyle(status);
      return (
        <Badge variant="outline" className={className}>
          {label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Category
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div className="lowercase ml-4">{row.getValue("category")}</div>
    ),
  },
  {
    accessorKey: "start_date", 
    header: () => <div className="">Start Date</div>,
    cell: ({ row }) => {
      const dateStr = row.getValue("start_date") as string;
      const date = new Date(dateStr);
      const formatted = new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "2-digit",
      }).format(date);
      return <div className=" font-medium text-gray-500">{formatted}</div>;
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right mr-6">Actions</div>,
    cell: ({ row, table }) => {
      const project = row.original;
      return (
        <div className="flex items-center gap-2 justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="text-sky-600 hover:text-sky-700 hover:bg-sky-50 font-medium"
            onClick={() => (table.options.meta as any)?.onView(project)}
            aria-label={`View project ${project.title}`}
          >
            View
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-slate-600 hover:text-slate-800 hover:bg-slate-100 font-medium"
            onClick={() => (table.options.meta as any)?.onEdit(project)}
            aria-label={`Edit project ${project.title}`}
          >
            Edit
          </Button>
        </div>
      );
    },
  },
];

export function RecentProjectsTable({ data, onEdit, onView, onRefresh }: TableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [showCreateForm, setShowCreateForm] = React.useState<boolean>(false);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    meta: {
      onEdit,
      onView,
      onRefresh, // Pass refresh callback
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  const handleCreateProjectClick = () => {
    setShowCreateForm(true);
  };

  const handleFormClose = () => {
    setShowCreateForm(false);
  };

  const handleProjectCreated = (newProject: Project) => {
    setShowCreateForm(false);//@ts-ignore
    table.options.meta?.onRefresh(); // Refresh parent data
  };

  return (
    <div className="w-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-slate-900">Recent Projects</h2>
        <Button
          className="bg-diaspora-blue hover:bg-diaspora-blue/90 font-medium"
          onClick={handleCreateProjectClick}
        >
          <Plus className="h-4 w-4 mr-2" /> Add New Project
        </Button>
      </div>
      {showCreateForm && (
        <CreateProjectForm
          onClose={handleFormClose}
          onProjectCreated={handleProjectCreated}
        />
      )}
      <div className="overflow-hidden rounded-lg border border-slate-200">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-slate-50 border-b border-slate-200">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    className="text-slate-700 font-medium text-xs uppercase tracking-wider"
                  >
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
                <TableRow
                  key={row.id}
                  className="border-b border-slate-100 hover:bg-slate-50/70 transition-colors"
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-slate-500">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end gap-2 py-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}