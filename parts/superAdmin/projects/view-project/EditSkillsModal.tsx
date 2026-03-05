"use client";

import React, { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import SkillsSelector, {
  type SelectedSkillsData,
  type SkillsSelectorHandle,
} from "@/components/skill-selector";
import { expertiseData } from "@/data/expertise";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface EditSkillsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSkills: string[];
  onEditingSkillsChange: (skills: string[]) => void;
  onSave: () => void;
  saving: boolean;
}

// Resolve either an id or a label to the canonical id used in expertiseData.
// This lets us pre-select skills even if older projects stored human labels.
function resolveToCanonicalId(value: string): string | null {
  for (const cat of expertiseData) {
    if (cat.id === value || cat.label === value) return cat.id;
    for (const sub of cat.children) {
      if (sub.id === value || sub.label === value) return sub.id;
      for (const skill of sub.subChildren) {
        if (skill.id === value || skill.label === value) return skill.id;
      }
    }
  }
  return null;
}

// True if id is a leaf skill (appears in some sub.subChildren)
function isLeafId(id: string): boolean {
  for (const cat of expertiseData) {
    for (const sub of cat.children) {
      if (sub.subChildren.some((s) => s.id === id)) return true;
    }
  }
  return false;
}

// Resolve id (category, subcategory, or skill) to label from expertiseData
function getLabelForSkillId(value: string): string {
  // Prefer matching by canonical id, but also support old stored labels.
  const id = resolveToCanonicalId(value) ?? value;
  for (const cat of expertiseData) {
    if (cat.id === id) return cat.label;
    for (const sub of cat.children) {
      if (sub.id === id) return sub.label;
      for (const skill of sub.subChildren) {
        if (skill.id === id) return skill.label;
      }
    }
  }
  // Fallback: show whatever was stored.
  return value;
}

// True if the value corresponds to a leaf skill in expertiseData
function isLeafSkill(value: string): boolean {
  const id = resolveToCanonicalId(value) ?? value;
  return isLeafId(id);
}

// Convert flat list of ids/labels into SelectedSkillsData for syncing the selector.
// For edit mode we ONLY seed leaf skills so we don't auto-select all siblings
// in a subcategory or entire categories.
function flatIdsToSelectedData(flatValues: string[]): SelectedSkillsData {
  const selectedCategories: string[] = [];
  const selectedSubCategories: string[] = [];
  const selectedSkills: string[] = [];

  for (const raw of flatValues) {
    const id = resolveToCanonicalId(raw) ?? raw;
    if (isLeafId(id)) {
      selectedSkills.push(id);
    }
  }

  return {
    selectedCategories,
    selectedSubCategories,
    selectedSkills,
  };
}

export function EditSkillsModal({
  open,
  onOpenChange,
  editingSkills,
  onEditingSkillsChange,
  onSave,
  saving,
}: EditSkillsModalProps) {
  const selectorRef = useRef<SkillsSelectorHandle>(null);
  const initializingRef = useRef(true);

  // When the modal opens, sync the selector once with the current editingSkills.
  // Guard with initializingRef so onSelectionChange during this phase is ignored.
  useEffect(() => {
    if (!open) return;
    const data = flatIdsToSelectedData(editingSkills || []);
    initializingRef.current = true;
    // Defer until after the selector has mounted and the ref is set
    queueMicrotask(() => {
      if (selectorRef.current) {
        selectorRef.current.setSelected(data);
      }
      initializingRef.current = false;
    });
  }, [open]);

  // For the summary chips, prefer leaf skills; if none, fall back to raw values
  const displayedSkills = (() => {
    const leaf = (editingSkills || []).filter(isLeafSkill);
    return leaf.length > 0 ? leaf : editingSkills || [];
  })();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl w-[95vw] max-h-[90vh] rounded-xl flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle>Edit required skills</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 px-6 pb-3 shrink-0">
          Select the skills needed for this project. Only admins can edit this
          section.
        </p>

        {/* Selected skills summary (leaf skills preferred) */}
        {displayedSkills.length > 0 && (
          <div className="px-6 pb-3 shrink-0">
            <p className="text-xs font-medium text-gray-700 mb-1">
              Selected skills ({displayedSkills.length})
            </p>
            <div className="flex flex-wrap gap-1.5">
              {displayedSkills.map((id, index) => (
                <Badge
                  key={`${id}-${index}`}
                  variant="secondary"
                  className="text-gray-800 text-[11px] pl-2 pr-1 py-0.5 rounded-full gap-1 inline-flex items-center"
                >
                  <span>{getLabelForSkillId(id)}</span>
                  <button
                    type="button"
                    onClick={() => {
                      const next = (editingSkills || []).filter(
                        (value) => value !== id
                      );
                      onEditingSkillsChange(next);
                      // Keep selector in sync with removals initiated from the chips
                      const data = flatIdsToSelectedData(next);
                      queueMicrotask(() => {
                        selectorRef.current?.setSelected(data);
                      });
                    }}
                    className="rounded-full p-0.5 hover:bg-gray-300/80 focus:outline-none focus:ring-1 focus:ring-gray-400"
                    aria-label={`Remove ${getLabelForSkillId(id)}`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4">
          {open && (
            <SkillsSelector
              ref={selectorRef}
              onSelectionChange={(data: SelectedSkillsData) => {
                if (initializingRef.current) return;
                const allSelected = [
                  ...data.selectedCategories,
                  ...data.selectedSubCategories,
                  ...data.selectedSkills,
                ];
                onEditingSkillsChange(allSelected);
              }}
            />
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0 px-6 py-4 border-t border-gray-100 shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="rounded-lg"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={onSave}
            disabled={saving}
            className="rounded-lg bg-diaspora-blue hover:bg-diaspora-blue/90"
          >
            {saving ? "Saving…" : "Save skills"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

