-- RPC to create a PM role request. Runs with SECURITY DEFINER so insert succeeds
-- when the caller is the project's organization. Bypasses RLS for reliable inserts.

CREATE OR REPLACE FUNCTION public.request_project_manager_role(
  p_project_id uuid,
  p_volunteer_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_pm1 uuid;
  v_pm2 uuid;
  v_on_project boolean;
  v_pending boolean;
  v_row project_manager_requests%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  -- Get project and ensure caller is the organization
  SELECT organization_id, project_manager_id, project_manager_2_id
  INTO v_org_id, v_pm1, v_pm2
  FROM projects
  WHERE id = p_project_id;

  IF v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Project not found');
  END IF;

  IF v_org_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only the project organization can send PM invitations');
  END IF;

  -- Volunteer must already be on the project
  SELECT EXISTS (
    SELECT 1 FROM project_volunteers
    WHERE project_id = p_project_id AND volunteer_id = p_volunteer_id
  ) INTO v_on_project;
  IF NOT v_on_project THEN
    RETURN jsonb_build_object('success', false, 'error', 'Volunteer must be on the project before they can be assigned as Project Manager');
  END IF;

  -- Volunteer must not already be a PM
  IF p_volunteer_id IN (v_pm1, v_pm2) THEN
    RETURN jsonb_build_object('success', false, 'error', 'This volunteer is already a Project Manager for this project');
  END IF;

  -- No existing pending request
  SELECT EXISTS (
    SELECT 1 FROM project_manager_requests
    WHERE project_id = p_project_id AND volunteer_id = p_volunteer_id AND status = 'pending'
  ) INTO v_pending;
  IF v_pending THEN
    RETURN jsonb_build_object('success', false, 'error', 'A Project Manager request is already pending for this volunteer');
  END IF;

  -- Insert (use ON CONFLICT to replace any rejected row so we can re-invite)
  INSERT INTO project_manager_requests (project_id, volunteer_id, requester_id, status)
  VALUES (p_project_id, p_volunteer_id, auth.uid(), 'pending')
  ON CONFLICT (project_id, volunteer_id)
  DO UPDATE SET requester_id = auth.uid(), status = 'pending', created_at = now()
  RETURNING * INTO v_row;

  RETURN jsonb_build_object('success', true, 'id', v_row.id);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

COMMENT ON FUNCTION public.request_project_manager_role(uuid, uuid) IS
  'Creates a PM role request. Caller must be the project organization. Volunteer must be on the project.';

GRANT EXECUTE ON FUNCTION public.request_project_manager_role(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.request_project_manager_role(uuid, uuid) TO service_role;

-- Accept PM role request (volunteer only). Updates request status and assigns PM slot on project.
CREATE OR REPLACE FUNCTION public.accept_pm_request(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req project_manager_requests%ROWTYPE;
  v_pm1 uuid;
  v_pm2 uuid;
  v_org_id uuid;
  v_project_title text;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO v_req FROM project_manager_requests WHERE id = p_request_id;
  IF v_req.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;
  IF v_req.volunteer_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'You can only accept your own request');
  END IF;
  IF v_req.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'This request has already been handled');
  END IF;

  SELECT project_manager_id, project_manager_2_id, organization_id, title
  INTO v_pm1, v_pm2, v_org_id, v_project_title
  FROM projects WHERE id = v_req.project_id;

  IF v_pm1 IS NULL THEN
    UPDATE projects SET project_manager_id = auth.uid() WHERE id = v_req.project_id;
  ELSIF v_pm2 IS NULL OR v_pm2 = auth.uid() THEN
    UPDATE projects SET project_manager_2_id = auth.uid() WHERE id = v_req.project_id;
  ELSE
    UPDATE projects SET project_manager_2_id = auth.uid() WHERE id = v_req.project_id;
  END IF;

  UPDATE project_manager_requests SET status = 'accepted' WHERE id = p_request_id;

  -- Notify the agency (allowed type so no constraint violation)
  IF v_org_id IS NOT NULL THEN
    INSERT INTO notifications (user_id, message, type, is_read, related_id)
    VALUES (
      v_org_id,
      'A volunteer accepted the Project Manager role for project: ' || COALESCE(v_project_title, ''),
      'pm_role_accepted',
      false,
      p_request_id
    );
  END IF;

  RETURN jsonb_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.accept_pm_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.accept_pm_request(uuid) TO service_role;

-- Reject PM role request (volunteer only).
CREATE OR REPLACE FUNCTION public.reject_pm_request(p_request_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_req project_manager_requests%ROWTYPE;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT * INTO v_req FROM project_manager_requests WHERE id = p_request_id;
  IF v_req.id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Request not found');
  END IF;
  IF v_req.volunteer_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'You can only reject your own request');
  END IF;
  IF v_req.status != 'pending' THEN
    RETURN jsonb_build_object('success', false, 'error', 'This request has already been handled');
  END IF;

  UPDATE project_manager_requests SET status = 'rejected' WHERE id = p_request_id;
  RETURN jsonb_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.reject_pm_request(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.reject_pm_request(uuid) TO service_role;

-- Remove a volunteer's PM role (agency/organization only). Frees the slot so another can be assigned.
CREATE OR REPLACE FUNCTION public.remove_pm_role(p_project_id uuid, p_volunteer_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org_id uuid;
  v_pm1 uuid;
  v_pm2 uuid;
BEGIN
  IF auth.uid() IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
  END IF;

  SELECT organization_id, project_manager_id, project_manager_2_id
  INTO v_org_id, v_pm1, v_pm2
  FROM projects WHERE id = p_project_id;

  IF v_org_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Project not found');
  END IF;
  IF v_org_id != auth.uid() THEN
    RETURN jsonb_build_object('success', false, 'error', 'Only the project organization can remove a PM');
  END IF;

  IF v_pm1 = p_volunteer_id THEN
    UPDATE projects SET project_manager_id = NULL WHERE id = p_project_id;
  ELSIF v_pm2 = p_volunteer_id THEN
    UPDATE projects SET project_manager_2_id = NULL WHERE id = p_project_id;
  ELSE
    RETURN jsonb_build_object('success', false, 'error', 'This volunteer is not a Project Manager for this project');
  END IF;

  RETURN jsonb_build_object('success', true);
EXCEPTION
  WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$;

GRANT EXECUTE ON FUNCTION public.remove_pm_role(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.remove_pm_role(uuid, uuid) TO service_role;
