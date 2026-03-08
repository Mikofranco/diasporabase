"use client";

import { useState, useEffect, useCallback } from "react";
import { getSkillLabelsMap, getSkillLabel as getSkillLabelUtil } from "@/lib/utils";

/**
 * Hook to load skill id → label map and get display labels for skills.
 * Use for any component that displays skill IDs to users (they should see labels).
 */
export function useSkillLabels() {
  const [labelsMap, setLabelsMap] = useState<Map<string, string> | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    getSkillLabelsMap().then((map) => {
      if (!cancelled) {
        setLabelsMap(map);
        setLoading(false);
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const getLabel = useCallback(
    (id: string) => getSkillLabelUtil(id, labelsMap),
    [labelsMap]
  );

  return { labelsMap, getLabel, loading };
}
