// components/ProjectLinksManager.tsx
'use client';

import React, { useMemo, useState } from "react";
import { Trash2, Edit2, Plus, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ProjectLink } from "@/lib/types";

interface ProjectLinksManagerProps {
  projectId: string;                     // UUID or string – must match your projects.id column type
  initialLinks: ProjectLink[];
  onLinksUpdated?: (newLinks: ProjectLink[]) => void; // optional callback after successful save
  /** Legacy: when provided, controls add/edit/delete as a single switch */
  canEdit?: boolean;
  /** Auth context (for ownership checks) */
  currentUserId?: string | null;
  /** Fine-grained permissions */
  canAdd?: boolean;
  canEditAll?: boolean;
  canEditOwn?: boolean;
}

const ProjectLinksManager: React.FC<ProjectLinksManagerProps> = ({
  projectId,
  initialLinks = [],
  onLinksUpdated,
  canEdit,
  currentUserId = null,
  canAdd,
  canEditAll,
  canEditOwn,
}) => {
  const [links, setLinks] = useState<ProjectLink[]>(initialLinks);
  const [newDescription, setNewDescription] = useState('');
  const [newLink, setNewLink] = useState('');
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editLink, setEditLink] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const permissions = useMemo(() => {
    // Back-compat: `canEdit` means "user can add/edit/delete anything"
    const legacy = typeof canEdit === "boolean" ? canEdit : undefined;
    return {
      canAdd: legacy ?? canAdd ?? true,
      canEditAll: legacy ?? canEditAll ?? true,
      canEditOwn: legacy ?? canEditOwn ?? true,
    };
  }, [canAdd, canEdit, canEditAll, canEditOwn]);

  const canMutateLinkAtIndex = (index: number) => {
    if (permissions.canEditAll) return true;
    if (!permissions.canEditOwn) return false;
    const owner = links[index]?.created_by ?? null;
    if (!owner || !currentUserId) return false;
    return owner === currentUserId;
  };

  const saveToSupabase = async (updatedLinks: ProjectLink[]) => {
    setIsSaving(true);
    setError(null);

    try {
      const res = await fetch(`/api/projects/${projectId}/links`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ links: updatedLinks }),
      });
      const json = (await res.json()) as { error?: string; project_links?: ProjectLink[] };
      if (!res.ok) {
        throw new Error(json?.error || "Failed to save links");
      }

      // Success
      if (onLinksUpdated) onLinksUpdated(json.project_links ?? updatedLinks);
    } catch (err: any) {
      setError(err.message || 'Failed to save links');
      console.error('Supabase save error:', err);
      // Optional: revert UI state here if you want strict consistency
    } finally {
      setIsSaving(false);
    }
  };

  // Add new link
  const handleAddLink = () => {
    if (!permissions.canAdd || !newDescription.trim() || !newLink.trim()) return;

    const newItem: ProjectLink = {
      description: newDescription.trim(),
      link: newLink.trim(),
      created_by: currentUserId || null,
      created_at: new Date().toISOString(),
    };
    const updated = [...links, newItem];

    setLinks(updated);
    saveToSupabase(updated);

    setNewDescription('');
    setNewLink('');
  };

  // Start editing
  const handleEditStart = (index: number) => {
    if (!canMutateLinkAtIndex(index)) return;
    setEditingIndex(index);
    setEditDescription(links[index].description);
    setEditLink(links[index].link);
  };

  // Save edited link
  const handleEditSave = (index: number) => {
    if (!editDescription.trim() || !editLink.trim()) return;
    if (!canMutateLinkAtIndex(index)) return;
    const updated = [...links];
    updated[index] = {
      ...updated[index],
      description: editDescription.trim(),
      link: editLink.trim(),
    };

    setLinks(updated);
    saveToSupabase(updated);
    setEditingIndex(null);
  };

  // Cancel edit
  const handleEditCancel = () => {
    setEditingIndex(null);
  };

  // Delete link
  const handleDelete = (index: number) => {
    if (!canMutateLinkAtIndex(index)) return;
    const updated = links.filter((_, i) => i !== index);
    setLinks(updated);
    saveToSupabase(updated);
  };

  return (
    <div className="space-y-6 p-6 border rounded-lg bg-white">
      <h3 className="text-lg font-semibold">Project Links</h3>

      {error && (
        <div className="p-3 bg-red-100 text-red-700 rounded border border-red-300">
          {error}
        </div>
      )}

      {/* List of links */}
      <div className="space-y-3 border rounded-md p-3 bg-gray-50">
        {links.length === 0 ? (
          <p className="text-gray-500 text-sm italic">No links added yet.</p>
        ) : (
          links.map((item, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-white border rounded-md shadow-sm"
            >
              {editingIndex === index && canMutateLinkAtIndex(index) ? (
                <div className="flex-1 flex gap-3">
                  <input
                    type="text"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                    placeholder="e.g. Live Demo"
                    className="flex-1 px-3 py-2 border rounded focus:outline-none "
                  />
                  <input
                    type="url"
                    value={editLink}
                    onChange={(e) => setEditLink(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-3 py-2 border rounded focus:outline-none "
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditSave(index)}
                      disabled={isSaving}
                      className="p-2 text-green-600 hover:bg-green-50 rounded disabled:opacity-50"
                      title="Save"
                    >
                      <Save size={18} />
                    </button>
                    <button
                      onClick={handleEditCancel}
                      disabled={isSaving}
                      className="p-2 text-gray-600 hover:bg-gray-100 rounded disabled:opacity-50"
                      title="Cancel"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex-1">
                    <p className="font-medium">{item.description}</p>
                    <a
                      href={item.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-diaspora-darkBlue hover:underline text-sm break-all"
                    >
                      {item.link}
                    </a>
                  </div>
                  {canMutateLinkAtIndex(index) && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditStart(index)}
                      disabled={isSaving}
                      className="p-2 text-diaspora-darkBlue hover:bg-blue-50 rounded disabled:opacity-50"
                      title="Edit"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      disabled={isSaving}
                      className="p-2 text-red-600 hover:bg-red-50 rounded disabled:opacity-50"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  )}
                </>
              )}
            </div>
          ))
        )}
      </div>

      {/* Add new */}
      {permissions.canAdd && (
        <div className="border-t pt-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              placeholder="Description (e.g. GitHub Repo)"
              className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-diaspora-darkBlue"
              disabled={isSaving}
            />
            <input
              type="url"
              value={newLink}
              onChange={(e) => setNewLink(e.target.value)}
              placeholder="https://example.com/..."
              className="flex-1 px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-diaspora-darkBlue"
              disabled={isSaving}
            />
            <Button
              onClick={handleAddLink}
              disabled={!newDescription.trim() || !newLink.trim() || isSaving}
              size={"sm"}
              className="px-4 py-2 bg-diaspora-darkBlue text-white rounded hover:bg-diaspora-darkBlueHover disabled:cursor-not-allowed flex items-center gap-2 min-w-[120px]"
            >
              <Plus size={18} />
              {isSaving ? 'Saving...' : 'Add Link'}
            </Button>
          </div>
        </div>
      )}

      {isSaving && !error && (
        <p className="text-sm text-diaspora-darkBlue mt-2">Saving to database...</p>
      )}
    </div>
  );
};

export default ProjectLinksManager;