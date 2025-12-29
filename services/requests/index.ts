import { supabase } from "@/lib/supabase/client";
import { useSendMail } from "../mail";

export async function createVolunteerRequest({
  projectId,
  volunteerId,
  organizationId,
}: {
  projectId: string;
  volunteerId: string;
  organizationId?: string | null;
}) {
  if (!projectId || !volunteerId) {
    throw new Error("projectId and volunteerId are required");
  }

  const requestData = {
    project_id: projectId,
    volunteer_id: volunteerId,
    organization_id: organizationId ?? null, 
    status: "pending" as const, 
  };

  const { data, error } = await supabase
    .from("volunteer_requests")
    .insert([requestData])
    .select() 
    .single(); 

  if (error) {
    console.error("Error creating volunteer request:", error);
    throw error;
  }

  return { data, error: null };
}


export async function createAgencyRequest({
  projectId,
  volunteerId,
  requesterId, // This is the agency profile ID making the request
}: {
  projectId: string;
  volunteerId: string;
  requesterId: string;
}) {
  if (!projectId || !volunteerId || !requesterId) {
    throw new Error("projectId, volunteerId, and requesterId are required");
  }

  // Fetch project, volunteer, and requester (agency) details
  const [
    { data: project, error: projectError },
    { data: volunteer, error: volunteerError },
    { data: requester, error: requesterError },
  ] = await Promise.all([
    supabase.from("projects").select("title, organization_name").eq("id", projectId).single(),
    supabase.from("profiles").select("full_name, email").eq("id", volunteerId).single(),
    supabase.from("profiles").select("full_name, organization_name, contact_person_email").eq("id", requesterId).single(),
  ]);

  if (projectError || !project) {
    console.error("Error fetching project:", projectError);
    throw new Error("Project not found");
  }

  if (volunteerError || !volunteer || !volunteer.email) {
    console.error("Error fetching volunteer:", volunteerError);
    throw new Error("Volunteer profile or email not found");
  }

  if (requesterError || !requester) {
    console.error("Error fetching requester (agency):", requesterError);
    throw new Error("Agency profile not found");
  }

  // Create the agency request
  const requestData = {
    project_id: projectId,
    volunteer_id: volunteerId,
    requester_id: requesterId,
    status: "pending" as const,
  };

  const { data: request, error: requestError } = await supabase
    .from("agency_requests")
    .insert([requestData])
    .select()
    .single();

  if (requestError || !request) {
    console.error("Error creating agency request:", requestError);
    throw requestError || new Error("Failed to create agency request");
  }

  // Send invitation email to volunteer
  const volunteerDashboardUrl = `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/volunteer/requests`;

  const html = `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background-color: #f9fafb;">
      <div style="text-align: center; margin-bottom: 20px;">
        <h1 style="color: #1a73e8; font-size: 28px; margin: 0; font-weight: 700;">DiasporaBase</h1>
        <p style="color: #4b5563; font-size: 18px; margin: 8px 0 0;">Project Invitation</p>
      </div>
      
      <p style="color: #374151; margin: 24px 0; font-size: 16px;">
        Hi <strong>${volunteer.full_name || "there"}</strong>,
      </p>
      
      <p style="color: #374151; margin: 16px 0; font-size: 16px;">
        Great news! <strong>${requester.full_name || requester.organization_name || "An agency representative"}</strong> from <strong>${requester.organization_name || "a partner agency"}</strong> has personally invited you to join their project:
      </p>
      
      <div style="background: #eff6ff; padding: 20px; border-radius: 12px; margin: 24px 0; border-left: 5px solid #1a73e8; text-align: center;">
        <p style="color: #1e40af; font-size: 22px; font-weight: 700; margin: 0;">
          "${project.title}"
        </p>
      </div>
      
      <p style="color: #374151; margin: 24px 0; font-size: 16px; text-align: center;">
        Click the button below to view the project and accept or decline the invitation.
      </p>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="${volunteerDashboardUrl}" style="background: #1a73e8; color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; font-size: 16px;">
          View in Dashboard
        </a>
      </div>
      
      <hr style="margin: 32px 0; border: none; border-top: 1px solid #e5e7eb;" />
      
      <p style="font-size: 13px; color: #6b7280; text-align: center;">
        If you did not expect this invitation, you can safely ignore this email.
      </p>
      
      <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 24px;">
        &copy; ${new Date().getFullYear()} DiasporaBase. All rights reserved.
      </p>
    </div>
  `;

  try {
    await useSendMail({
      to: volunteer.email,
      subject: `You've Been Invited to Join "${project.title}" on DiasporaBase`,
      html,
    });
  } catch (emailError) {
    console.error("Failed to send invitation email:", emailError);
    // Don't fail the whole request if email fails
  }

  return { data: request, error: null };
}

export async function checkIfVolunteerHasRequested({
  projectId,
  volunteerId,
}: {
  projectId: string;
  volunteerId: string;
}) {
  const { data, error } = await supabase
    .from("volunteer_requests")
    .select("id")
    .eq("project_id", projectId)
    .eq("volunteer_id", volunteerId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error checking volunteer request:", error);
    throw error;
  }

  return { hasRequested: !!data };
}

export async function checkIfAgencyHasRequested({
  projectId,
  volunteerId,
  requesterId,
}: {
  projectId: string;
  volunteerId: string;
  requesterId: string;
}) {
  const { data, error } = await supabase
    .from("agency_requests")
    .select("id")
    .eq("project_id", projectId)
    .eq("volunteer_id", volunteerId)
    .eq("requester_id", requesterId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error checking agency request:", error);
    throw error;
  }

  return { hasRequested: !!data };
}
