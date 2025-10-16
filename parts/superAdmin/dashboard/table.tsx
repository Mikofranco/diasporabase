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
import { ArrowUpDown, Eye, Pencil, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Project } from "@/lib/types";

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
    accessorKey: "contact_person_first_name",
    header: "Contact Details",
    cell: ({ row }) => (
      <div className="capitalize">
        <div>
          {row.getValue("contact_person_first_name")}{" "}
          {row.getValue("contact_person_last_name")}
        </div>
        <div className="text-sm text-gray-500">
          {row.getValue("contact_person_email")}
        </div>
      </div>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      const statusStyles: Record<string, string> = {
        active: "bg-blue-100 text-blue-800",
        completed: "bg-gray-100 text-gray-800",
        pending: "bg-yellow-100 text-yellow-800",
        cancelled: "bg-red-100 text-red-800",
      };
      return (
        <div
          className={`capitalize px-2 py-1 rounded-full text-sm font-medium text-center ${
            statusStyles[status.toLowerCase()] || "bg-gray-100 text-gray-800"
          }`}
        >
          {status}
        </div>
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
    header: () => <div>Start Date</div>,
    cell: ({ row }) => {
      const dateStr = row.getValue("start_date") as string;
      const date = new Date(dateStr);
      const formatted = new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "2-digit",
      }).format(date);
      return <div className="font-medium text-gray-500">{formatted}</div>;
    },
  },
  {
    id: "actions",
    header: () => <div className="text-right mr-6">Actions</div>,
    cell: ({ row, table }) => {
      const project = row.original;
      return (
        <div className="flex items-center gap-1 justify-end">
          <Button
            variant="ghost"
            className="text-[#0284C7] font-medium"//@ts-ignore
            onClick={() => table.options.meta?.onView(project)}
            aria-label={`View project ${project.title}`}
          >
            View
          </Button>
          <Button
            variant="ghost"
            className="text-gray-500 font-medium"//@ts-ignore
            onClick={() => table.options.meta?.onEdit(project)}
            aria-label={`Edit project ${project.title}`}
          >
            Edit
          </Button>
        </div>
      );
    },
  },
];

export function RecentApplicationsTable({ data, onEdit, onView, onRefresh }: TableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [showCreateForm, setShowCreateForm] = React.useState<boolean>(false);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});
  const [searchTerm, setSearchTerm] = React.useState("");

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
      onRefresh,
    },
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
    initialState: {
      pagination: {
        pageSize: 5,
      },
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
    table.options.meta?.onRefresh();
  };

  React.useEffect(() => {
    table.getColumn("title")?.setFilterValue(searchTerm);
  }, [searchTerm, table]);

  return (
    <div className="w-full bg-white p-4 rounded-lg shadow-sm border">
      <div className="flex items-center py-4 justify-between gap-4 flex-wrap">
        <h2 className="font-semibold text-xl">Recent Applications</h2>
        <div className="flex items-center gap-4">
          <Input
            placeholder="Search by project name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-sm"
          />
          <Select
            onValueChange={(value) =>
              table.getColumn("status")?.setFilterValue(value === "all" ? "" : value)
            }
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="accepted">Accepted</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="bg-blue-50">
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
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
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <div className="space-x-2">
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
    </div>
  );
}