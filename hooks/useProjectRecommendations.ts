"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

const STALE_TIME_MS = 5 * 60 * 1000; // 5 minutes

export interface RecommendedProject {
  project_id: string;
  title: string;
  description: string | null;
  location_country: string | null;
  location_state: string | null;
  location_lga: string | null;
  required_skills: string[] | null;
  category: string;
  organization_name: string | null;
  start_date: string | null;
  end_date: string | null;
  volunteers_needed: number | null;
  volunteers_registered: number | null;
  score: number;
  created_at: string | null;
}

export interface UseProjectRecommendationsResult {
  recommendations: RecommendedProject[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useProjectRecommendations(userId: string | null): UseProjectRecommendationsResult {
  const [recommendations, setRecommendations] = useState<RecommendedProject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const lastFetchedAtRef = useRef<number | null>(null);

  const fetchRecommendations = useCallback(async (forceRefresh = false) => {
    if (!userId) {
      setRecommendations([]);
      setIsLoading(false);
      setError(null);
      return;
    }

    const now = Date.now();
    if (!forceRefresh && lastFetchedAtRef.current !== null && now - lastFetchedAtRef.current < STALE_TIME_MS) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const supabase = createClient();
      const { data, error: rpcError } = await supabase.rpc("get_recommended_projects", {
        p_volunteer_id: userId,
      });

      if (rpcError) {
        setError(rpcError.message);
        setRecommendations([]);
        return;
      }

      setRecommendations((data ?? []) as RecommendedProject[]);
      lastFetchedAtRef.current = Date.now();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load recommendations");
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchRecommendations();
  }, [userId]);

  return {
    recommendations,
    isLoading,
    error,
    refetch: () => fetchRecommendations(true),
  };
}
