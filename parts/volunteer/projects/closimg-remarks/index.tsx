"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ClosingRemarksProps {
  projectId: string;
  isPM: boolean;
}

export default function ClosingRemarks({ projectId, isPM }: ClosingRemarksProps) {
  const [remarks, setRemarks] = useState("");
  const [editing, setEditing] = useState(false);

  useEffect(() => {
    fetchRemarks();
  }, [projectId]);

  const fetchRemarks = async () => {
    const res = await fetch(`/api/projects/${projectId}/closing-remarks`);
    const data = await res.json();
    setRemarks(data.closing_remarks || "");
  };

  const handleSave = async () => {
    const res = await fetch(`/api/projects/${projectId}/closing-remarks`, {
      method: "POST",
      body: JSON.stringify({ closing_remarks: remarks }),
    });

    if (res.ok) {
      toast.success("Closing remarks saved!");
      setEditing(false);
      fetchRemarks();
    } else {
      toast.error("Failed to save remarks");
    }
  };

  if (!remarks && !isPM) return null;

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-bold">Project Manager Closing Remarks</h3>
      {editing ? (
        <div className="space-y-2">
          <Textarea
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            rows={6}
          />
          <div className="flex gap-2">
            <Button onClick={handleSave}>Save</Button>
            <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
          </div>
        </div>
      ) : (
        <div>
          <p>{remarks}</p>
          {isPM && (
            <Button onClick={() => setEditing(true)} variant="outline" className="mt-2">
              Edit Remarks
            </Button>
          )}
        </div>
      )}
    </div>
  );
}