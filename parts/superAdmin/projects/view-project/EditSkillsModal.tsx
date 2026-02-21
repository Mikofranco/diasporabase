"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { CheckboxReactHookFormMultiple } from "@/components/renderedItems";
import { expertiseData } from "@/data/expertise";

interface EditSkillsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editingSkills: string[];
  onEditingSkillsChange: (skills: string[]) => void;
  onSave: () => void;
  saving: boolean;
}

export function EditSkillsModal({
  open,
  onOpenChange,
  editingSkills,
  onEditingSkillsChange,
  onSave,
  saving,
}: EditSkillsModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl w-[95vw] max-h-[90vh] rounded-xl flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
          <DialogTitle>Edit required skills</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-gray-600 px-6 pb-3 shrink-0">
          Select skills from the category list below. Only admins can edit this
          section.
        </p>
        <div className="flex-1 min-h-0 overflow-y-auto px-6 pb-4">
          {open && (
            <CheckboxReactHookFormMultiple
              key="edit-skills-modal"
              items={expertiseData}
              initialValues={editingSkills}
              onChange={(selected: string[]) => onEditingSkillsChange(selected)}
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
