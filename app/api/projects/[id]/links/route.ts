import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerActionClient } from "@/lib/supabase/server";
import { getServerAdminClient } from "@/lib/supabase/admin";
import type { ProjectLink } from "@/lib/types";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type Role = "volunteer" | "agency" | "admin" | "super_admin" | "project_manager";

function normalizeRole(role: unknown): Role | null {
  if (typeof role !== "string") return null;
  const r = role.toLowerCase();
  if (
    r === "volunteer" ||
    r === "agency" ||
    r === "admin" ||
    r === "super_admin" ||
    r === "project_manager"
  ) {
    return r;
  }
  return null;
}

function linkKey(l: ProjectLink) {
  // Prefer stable identity when available
  return [
    l.created_by ?? "",
    l.created_at ?? "",
    (l.link ?? "").trim(),
    (l.description ?? "").trim(),
  ].join("|");
}

export async function GET(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const projectId = pathname.split("/").slice(-2, -1)[0]; // .../projects/{id}/links
  if (!projectId || !UUID_REGEX.test(projectId)) {
    return NextResponse.json({ error: "Valid project id required" }, { status: 400 });
  }

  const admin = getServerAdminClient();
  const { data, error } = await admin
    .from("projects")
    .select("project_links")
    .eq("id", projectId)
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ project_links: (data?.project_links ?? []) as ProjectLink[] });
}

export async function PUT(request: NextRequest) {
  const { pathname } = new URL(request.url);
  const projectId = pathname.split("/").slice(-2, -1)[0]; // .../projects/{id}/links
  if (!projectId || !UUID_REGEX.test(projectId)) {
    return NextResponse.json({ error: "Valid project id required" }, { status: 400 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const nextLinksRaw = (body as { links?: unknown }).links;
  if (!Array.isArray(nextLinksRaw)) {
    return NextResponse.json({ error: "links array required" }, { status: 400 });
  }

  // Basic validation + sanitization
  const nextLinks: ProjectLink[] = nextLinksRaw
    .map((l) => {
      const ll = l as Partial<ProjectLink>;
      const description =
        typeof ll.description === "string" ? ll.description.trim() : "";
      const link = typeof ll.link === "string" ? ll.link.trim() : "";
      const created_by =
        typeof ll.created_by === "string" && UUID_REGEX.test(ll.created_by)
          ? ll.created_by
          : null;
      const created_at =
        typeof ll.created_at === "string" && ll.created_at.length > 0
          ? ll.created_at
          : null;
      return { description, link, created_by, created_at };
    })
    .filter((l) => l.description && l.link);

  const cookieStore = await cookies();
  const supabase = createServerActionClient(cookieStore);
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: profile, error: profileErr } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
  if (profileErr) return NextResponse.json({ error: profileErr.message }, { status: 500 });
  const role = normalizeRole(profile?.role);
  if (!role) return NextResponse.json({ error: "Unknown role" }, { status: 403 });

  const admin = getServerAdminClient();
  const { data: project, error: projErr } = await admin
    .from("projects")
    .select("id, status, organization_id, project_manager_id, project_manager_2_id, project_links")
    .eq("id", projectId)
    .single();
  if (projErr || !project) {
    return NextResponse.json({ error: projErr?.message || "Project not found" }, { status: 404 });
  }

  const status = String(project.status ?? "").toLowerCase();
  const isOrgOwner = project.organization_id === user.id;
  const isPm =
    project.project_manager_id === user.id || project.project_manager_2_id === user.id;
  const isAdminRole = role === "admin" || role === "super_admin";

  const canEditAll = isOrgOwner || isPm || isAdminRole;
  const isVolunteer = role === "volunteer";

  // Volunteers must be a member of the project to interact with links
  if (!canEditAll && isVolunteer) {
    const { data: membership } = await admin
      .from("project_volunteers")
      .select("volunteer_id")
      .eq("project_id", projectId)
      .eq("volunteer_id", user.id)
      .maybeSingle();
    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  } else if (!canEditAll && !isVolunteer) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const existingLinks = (project.project_links ?? []) as ProjectLink[];

  // Do not allow adding new links on completed projects (for everyone)
  if (status === "completed") {
    const existingKeys = new Set(existingLinks.map(linkKey));
    const hasNew = nextLinks.some((l) => !existingKeys.has(linkKey(l)));
    if (hasNew) {
      return NextResponse.json(
        { error: "Cannot add new links to a completed project" },
        { status: 400 }
      );
    }
  }

  // Enforce ownership for volunteers (edit/delete only own links)
  if (!canEditAll) {
    const existingByKey = new Map(existingLinks.map((l) => [linkKey(l), l]));
    const nextByKey = new Map(nextLinks.map((l) => [linkKey(l), l]));

    // Deletions: any existing link missing in nextLinks must be owned by user
    for (const old of existingLinks) {
      const k = linkKey(old);
      if (!nextByKey.has(k)) {
        if (!old.created_by || old.created_by !== user.id) {
          return NextResponse.json(
            { error: "You can only delete links you created" },
            { status: 403 }
          );
        }
      }
    }

    // Edits: if a link's identity is preserved by key, it’s unchanged; edits create a different key.
    // Therefore, any "new" link on non-completed projects must be created_by = user.id.
    // Also reject attempts to create links with created_by != user.id.
    for (const l of nextLinks) {
      if (l.created_by && l.created_by !== user.id) {
        return NextResponse.json(
          { error: "You can only create/update links under your own account" },
          { status: 403 }
        );
      }
    }

    // Fill in missing ownership for volunteer-created links
    for (const l of nextLinks) {
      if (!l.created_by) l.created_by = user.id;
      if (!l.created_at) l.created_at = new Date().toISOString();
    }
  } else {
    // For agency/PM/admin, if missing metadata, stamp it to keep data consistent
    for (const l of nextLinks) {
      if (!l.created_at) l.created_at = new Date().toISOString();
    }
  }

  const { error: updateErr } = await admin
    .from("projects")
    .update({ project_links: nextLinks })
    .eq("id", projectId);
  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  return NextResponse.json({ success: true, project_links: nextLinks });
}

