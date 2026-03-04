-- =============================================================================
-- VOLUNTEER RECOMMENDATION SYSTEM FOR AGENCIES
-- =============================================================================
-- When an agency views a project's recommendations page, suggest volunteers
-- who match the project's required skills and location.
--
-- PROFILES (volunteers): skills, volunteer_countries, volunteer_states, volunteer_lgas,
--   residence_country, residence_state, average_rating, profile_picture
-- PROJECTS: required_skills, country, state, lga, location
-- EXCLUSIONS: project_volunteers (already on project), agency_requests (already invited)
-- volunteer_requests: volunteer applied - we still show them (with "Awaiting approval" in UI)
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_skills ON public.profiles USING GIN(skills) WHERE role = 'volunteer';

-- Drop existing function first (required when changing return type)
DROP FUNCTION IF EXISTS public.get_recommended_volunteers(uuid, uuid);

-- RPC: Get recommended volunteers for a project (agency view)
CREATE OR REPLACE FUNCTION public.get_recommended_volunteers(
  p_project_id uuid,
  p_requester_id uuid
)
RETURNS TABLE (
  volunteer_id uuid,
  full_name text,
  email text,
  skills text[],
  availability text,
  experience text,
  anonymous boolean,
  residence_country text,
  residence_state text,
  volunteer_countries text[],
  volunteer_states text[],
  volunteer_lgas text[],
  average_rating real,
  profile_picture text,
  score integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_required_skills text[];
  v_country text;
  v_state text;
  v_lga text;
  v_state_name text;
BEGIN
  -- Fetch project details
  SELECT
    COALESCE(p.required_skills, ARRAY[]::text[]),
    p.country,
    p.state,
    p.lga
  INTO v_required_skills, v_country, v_state, v_lga
  FROM projects p
  WHERE p.id = p_project_id;

  v_required_skills := COALESCE(v_required_skills, ARRAY[]::text[]);

  -- Map state code to full name for matching (Nigeria)
  v_state_name := CASE v_state
    WHEN 'FC' THEN 'Abuja (FCT)'
    WHEN 'LA' THEN 'Lagos'
    WHEN 'AB' THEN 'Abia'
    WHEN 'AD' THEN 'Adamawa'
    WHEN 'AK' THEN 'Akwa Ibom'
    WHEN 'AN' THEN 'Anambra'
    WHEN 'BA' THEN 'Bauchi'
    WHEN 'BY' THEN 'Bayelsa'
    WHEN 'BE' THEN 'Benue'
    WHEN 'BO' THEN 'Borno'
    WHEN 'CR' THEN 'Cross River'
    WHEN 'DE' THEN 'Delta'
    WHEN 'EB' THEN 'Ebonyi'
    WHEN 'ED' THEN 'Edo'
    WHEN 'EK' THEN 'Ekiti'
    WHEN 'EN' THEN 'Enugu'
    WHEN 'GO' THEN 'Gombe'
    WHEN 'IM' THEN 'Imo'
    WHEN 'JI' THEN 'Jigawa'
    WHEN 'KD' THEN 'Kaduna'
    WHEN 'KN' THEN 'Kano'
    WHEN 'KT' THEN 'Katsina'
    WHEN 'KE' THEN 'Kebbi'
    WHEN 'KO' THEN 'Kogi'
    WHEN 'KW' THEN 'Kwara'
    WHEN 'NA' THEN 'Nasarawa'
    WHEN 'NI' THEN 'Niger'
    WHEN 'OG' THEN 'Ogun'
    WHEN 'ON' THEN 'Ondo'
    WHEN 'OS' THEN 'Osun'
    WHEN 'OY' THEN 'Oyo'
    WHEN 'PL' THEN 'Plateau'
    WHEN 'RI' THEN 'Rivers'
    WHEN 'SO' THEN 'Sokoto'
    WHEN 'TA' THEN 'Taraba'
    WHEN 'YO' THEN 'Yobe'
    WHEN 'ZA' THEN 'Zamfara'
    ELSE v_state
  END;

  RETURN QUERY
  WITH excluded_volunteers AS (
    SELECT pv.volunteer_id
    FROM project_volunteers pv
    WHERE pv.project_id = p_project_id
    UNION
    SELECT ar.volunteer_id
    FROM agency_requests ar
    WHERE ar.project_id = p_project_id
      AND ar.requester_id = p_requester_id
      AND ar.status IN ('pending', 'accepted')
  ),
  scored AS (
    SELECT
      pr.id AS vid,
      pr.full_name AS full_name,
      pr.email AS email,
      COALESCE(pr.skills, ARRAY[]::text[]) AS skills,
      pr.availability AS availability,
      pr.experience AS experience,
      COALESCE(pr.anonymous, false) AS anonymous,
      pr.residence_country AS residence_country,
      pr.residence_state AS residence_state,
      COALESCE(pr.volunteer_countries, ARRAY[]::text[]) AS volunteer_countries,
      COALESCE(pr.volunteer_states, ARRAY[]::text[]) AS volunteer_states,
      COALESCE(pr.volunteer_lgas, ARRAY[]::text[]) AS volunteer_lgas,
      COALESCE(pr.average_rating, 0)::real AS average_rating,
      pr.profile_picture AS profile_picture,
      -- Location score (40pts)
      (
        CASE
          WHEN v_lga IS NOT NULL AND v_lga = ANY(COALESCE(pr.volunteer_lgas, ARRAY[]::text[])) THEN 40
          WHEN v_state_name IS NOT NULL AND v_state_name = ANY(COALESCE(pr.volunteer_states, ARRAY[]::text[])) THEN 40
          WHEN (v_country = ANY(COALESCE(pr.volunteer_countries, ARRAY[]::text[]))
            OR (v_country = 'NG' AND 'Nigeria' = ANY(COALESCE(pr.volunteer_countries, ARRAY[]::text[])))) THEN 40
          WHEN array_length(COALESCE(pr.volunteer_countries, ARRAY[]::text[]), 1) IS NULL
            AND pr.residence_country IS NOT NULL
            AND (v_country = pr.residence_country OR (v_country = 'NG' AND pr.residence_country = 'Nigeria')) THEN 40
          ELSE 0
        END
      )::int AS loc_score,
      -- Skills score (60pts) - proportional overlap
      (
        CASE
          WHEN array_length(v_required_skills, 1) IS NULL OR array_length(v_required_skills, 1) = 0 THEN 30
          WHEN NOT (v_required_skills && COALESCE(pr.skills, ARRAY[]::text[])) THEN 0
          ELSE LEAST(60, (
            (SELECT count(*)::float FROM unnest(v_required_skills) AS rs
             WHERE rs = ANY(COALESCE(pr.skills, ARRAY[]::text[])))
            / NULLIF(array_length(v_required_skills, 1), 0) * 60
          )::int)
        END
      )::int AS skill_score
    FROM profiles pr
    WHERE pr.role = 'volunteer'
      AND pr.id IS NOT NULL
      AND pr.id NOT IN (SELECT ev.volunteer_id FROM excluded_volunteers ev)
  )
  SELECT
    s.vid::uuid,
    s.full_name::text,
    s.email::text,
    s.skills::text[],
    s.availability::text,
    s.experience::text,
    s.anonymous::boolean,
    s.residence_country::text,
    s.residence_state::text,
    s.volunteer_countries::text[],
    s.volunteer_states::text[],
    s.volunteer_lgas::text[],
    s.average_rating::real,
    s.profile_picture::text,
    (COALESCE(s.loc_score, 0) + COALESCE(s.skill_score, 0))::integer
  FROM scored s
  ORDER BY (COALESCE(s.loc_score, 0) + COALESCE(s.skill_score, 0)) DESC
  LIMIT 20;
END;
$$;

COMMENT ON FUNCTION public.get_recommended_volunteers(uuid, uuid) IS
  'Returns recommended volunteers for a project based on skills (60pts) and location (40pts). Excludes volunteers already on project or with pending/accepted agency request from this requester.';
