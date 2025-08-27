// app/dashboard/admin/skillsets/page.tsx
"use client";

import React, { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown, ChevronRight, Trash2, Edit } from "lucide-react";
import { useRouter } from "next/navigation";
import { Item } from "@/app/dashboard/volunteer/profile/page";
import { getSkillsets } from "@/lib/utils";

const supabase = createClient();

interface SkillsetForm {
  id: string;
  label: string;
  parent_id: string | null;
}

export default function SkillsetManagementPage() {
  const [userRole, setUserRole] = useState<string | null>(null);
  const [skillsets, setSkillsets] = useState<Item[]>([]);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [form, setForm] = useState<SkillsetForm>({ id: "", label: "", parent_id: null });
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const router = useRouter();

  // Check user role
  useEffect(() => {
    const checkUserRole = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        toast.error("Please log in to access this page.");
        router.push("/login");
        return;
      }

      const { data, error: profileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      if (profileError) {
        toast.error("Error fetching user role.");
        router.push("/dashboard");
        return;
      }

      if (!["admin", "super_admin"].includes(data.role)) {
        toast.error("You are not authorized to access this page.");
        router.push("/dashboard");
        return;
      }

      setUserRole(data.role);
    };

    checkUserRole();
  }, [router]);

  // Fetch skillsets
  useEffect(() => {
    const fetchSkillsets = async () => {
      const skills = await getSkillsets();
      setSkillsets(skills);
    };
    fetchSkillsets();
  }, []);

  // Handle item click to toggle expansion
  const handleItemClick = (id: string) => {
    setExpanded((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Open dialog for adding new skillset
  const handleAdd = (parent_id: string | null = null) => {
    setForm({ id: "", label: "", parent_id });
    setIsEditing(false);
    setEditingId(null);
    setIsDialogOpen(true);
  };

  // Open dialog for editing existing skillset
  const handleEdit = (item: Item) => {
    setForm({ id: item.id, label: item.label, parent_id: getParentId(item.id) });
    setIsEditing(true);
    setEditingId(item.id);
    setIsDialogOpen(true);
  };

  // Get parent_id for an item (used for editing)
  const getParentId = (id: string): string | null => {
    const flatItems = skillsets.flatMap((i) => [
      i,
      ...(i.children || []),
      ...(i.children?.flatMap((c) => c.subChildren || []) || []),
    ]);
    const item = flatItems.find((i) => i.id === id);
    if (!item) return null;

    const parent = flatItems.find(
      (i) =>
        i.children?.some((child) => child.id === id) ||
        i.subChildren?.some((subChild) => subChild.id === id)
    );
    return parent ? parent.id : null;
  };

  // Handle form submission for create/edit
  const handleSubmit = async () => {
    if (!form.id || !form.label) {
      toast.error("ID and Label are required.");
      return;
    }

    // Validate ID format (lowercase, no spaces, underscores allowed)
    if (!/^[a-z0-9_]+$/.test(form.id)) {
      toast.error("ID must be lowercase, with no spaces, using letters, numbers, or underscores.");
      return;
    }

    try {
      if (isEditing) {
        // Update existing skillset
        const { error } = await supabase
          .from("skillsets")
          .update({ id: form.id, label: form.label, parent_id: form.parent_id })
          .eq("id", editingId);

        if (error) throw new Error(`Error updating skillset: ${error.message}`);
        toast.success("Skillset updated successfully!");
      } else {
        // Create new skillset
        const { error } = await supabase
          .from("skillsets")
          .insert([{ id: form.id, label: form.label, parent_id: form.parent_id }]);

        if (error) throw new Error(`Error creating skillset: ${error.message}`);
        toast.success("Skillset created successfully!");
      }

      // Refresh skillsets
      const skills = await getSkillsets();
      setSkillsets(skills);
      setIsDialogOpen(false);
      setForm({ id: "", label: "", parent_id: null });
      setIsEditing(false);
      setEditingId(null);
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    if (!confirm(`Are you sure you want to delete "${id}" and all its children?`)) return;

    try {
      const { error } = await supabase.from("skillsets").delete().eq("id", id);
      if (error) throw new Error(`Error deleting skillset: ${error.message}`);
      toast.success("Skillset deleted successfully!");

      // Refresh skillsets
      const skills = await getSkillsets();
      setSkillsets(skills);
      setExpanded((prev) => {
        const newExpanded = { ...prev };
        delete newExpanded[id];
        return newExpanded;
      });
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  // Render skillset hierarchy
  const renderSkillsets = (items: Item[], level: number = 0) => {
    return items.map((item) => (
      <div key={item.id} className="flex flex-col">
        <div
          className={`flex items-center gap-2 py-1 px-2 rounded-md transition-all duration-200 ${
            level === 0 ? "bg-white" : level === 1 ? "bg-gray-100" : "bg-gray-200"
          } hover:bg-gray-200`}
          style={{ paddingLeft: `${level * 18}px` }}
        >
          {(item.children || item.subChildren) && (
            <span
              onClick={() => handleItemClick(item.id)}
              className="cursor-pointer text-gray-600 hover:text-gray-800"
            >
              {expanded[item.id] ? (
                <ChevronDown className="h-4 w-4" />
              ) : (
                <ChevronRight className="h-4 w-4" />
              )}
            </span>
          )}
          <span className="flex-1 text-sm">{item.label} ({item.id})</span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleEdit(item)}
            className="text-blue-600 hover:text-blue-800"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(item.id)}
            className="text-red-600 hover:text-red-800"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleAdd(item.id)}
            className="text-green-600 hover:text-green-800"
          >
            Add Child
          </Button>
        </div>
        {(item.children || item.subChildren) && expanded[item.id] && (
          <div className="ml-2.5">
            {item.children && renderSkillsets(item.children, level + 1)}
            {item.children?.some((child) => child.subChildren) &&
              item.children.map(
                (child) =>
                  child.subChildren &&
                  expanded[child.id] && (
                    <div key={child.id} className="ml-2.5">
                      {renderSkillsets(child.subChildren, level + 2)}
                    </div>
                  )
              )}
            {item.subChildren && renderSkillsets(item.subChildren, level + 1)}
          </div>
        )}
      </div>
    ));
  };

  // Get all possible parent IDs for the select dropdown
  const getParentOptions = () => {
    const flatItems = skillsets.flatMap((i) => [
      i,
      ...(i.children || []),
      ...(i.children?.flatMap((c) => c.subChildren || []) || []),
    ]);//@ts-ignore
    return flatItems.filter((item) => item.children || item.subChildren || !item.parent_id); // Allow top-level and parents
  };

  if (!userRole) {
    return <div className="p-4 text-gray-500">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold">Manage Skillsets</h1>
        <Button onClick={() => handleAdd()} className="bg-blue-600 hover:bg-blue-700">
          Add New Skillset
        </Button>
      </div>
      <div className="border border-gray-200 rounded-lg p-4 max-h-[600px] overflow-y-auto">
        {skillsets.length > 0 ? (
          renderSkillsets(skillsets)
        ) : (
          <div className="text-gray-500">No skillsets found.</div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Skillset" : "Add Skillset"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="skillset-id">ID *</Label>
              <Input
                id="skillset-id"
                value={form.id}
                onChange={(e) => setForm({ ...form, id: e.target.value })}
                placeholder="e.g., front_end"
                disabled={isEditing} // Prevent changing ID when editing
                required
              />
              <p className="text-xs text-gray-500 mt-1">
                Use lowercase letters, numbers, or underscores (no spaces).
              </p>
            </div>
            <div>
              <Label htmlFor="skillset-label">Label *</Label>
              <Input
                id="skillset-label"
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder="e.g., Front-end"
                required
              />
            </div>
            <div>
              <Label htmlFor="skillset-parent">Parent</Label>
              <Select
                value={form.parent_id || "none"}
                onValueChange={(value) =>
                  setForm({ ...form, parent_id: value === "none" ? null : value })
                }
              >
                <SelectTrigger id="skillset-parent">
                  <SelectValue placeholder="Select parent (optional)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None (Top-level)</SelectItem>
                  {getParentOptions().map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.label} ({item.id})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDialogOpen(false)}
              className="hover:bg-gray-100"
            >
              Cancel
            </Button>
            <Button onClick={handleSubmit} className="bg-blue-600 hover:bg-blue-700">
              {isEditing ? "Save Changes" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}