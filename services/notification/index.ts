import { supabase } from "@/lib/supabase/client";
import type { SupabaseClient } from "@supabase/supabase-js";

type NotificationType =
  | "request_status_change"
  | "project_approval"
  | "new_agency"
  | "new_project"
  | "volunteer_request_send"
  | "volunteer_request_to_join_project"
  | "agency_account_created"
  | "tagged_in_comment";

interface CreateNotificationParams {
  userId: string;
  message: string;
  type: NotificationType;
  relatedId?: string; // Optional, e.g., request ID or comment ID
  projectId?: string; // Optional
}

export async function createNotification(
  params: CreateNotificationParams
) {
  const { userId, message, type, relatedId, projectId } = params;
  console.log("Creating notification with params:", params);

  // Validate type (matches your CHECK constraint)
  const validTypes = [
    "request_status_change",
    "project_approval",
    "new_agency",
    "new_project",
    "volunteer_request_send",
    "volunteer_request_to_join_project",
    "agency_account_created",
    "tagged_in_comment",
  ];

  if (!validTypes.includes(type)) {
    throw new Error(`Invalid notification type: ${type}`);
  }

  const { data, error } = await supabase
    .from("notifications")
    .insert({
      user_id: userId,
      message,
      type,
      related_id: relatedId,
      project_id: projectId,
      // is_read defaults to false, created_at defaults to now()
    })
    .select()
    .single();

  if (error) {
    console.error("Failed to create notification:", error);
    throw new Error("Failed to create notification");
  }

  return data;
}
