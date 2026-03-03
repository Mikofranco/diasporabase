-- =============================================================================
-- PROJECT RECOMMENDATION SYSTEM FOR VOLUNTEERS
-- =============================================================================
-- Schema audit (verified against codebase):
--
-- PROFILES (volunteers):
--   - skills: text[]
--   - volunteer_countries: text[]
--   - volunteer_states: text[]
--   - volunteer_lgas: text[]
--   - residence_country, residence_state (fallback location)
--   - focus_areas: text[] (agencies; volunteers may have it in DB)
--
-- PROJECTS:
--   - id, title, description, organization_id, organization_name
--   - location: jsonb {country, state, lga}
--   - country, state, lga: denormalized text columns
--   - required_skills: text[]
--   - category: text
--   - status: text ('active','completed','pending','cancelled')
--   - created_at: timestamptz
--
-- EXCLUSIONS:
--   - project_volunteers(volunteer_id, project_id) - already enrolled
--   - volunteer_requests(volunteer_id, project_id, status) - applied (exclude pending/accepted)
-- =============================================================================

-- Performance indexes for recommendation queries
CREATE INDEX IF NOT EXISTS idx_projects_status ON public.projects(status);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON public.projects(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_projects_required_skills ON public.projects USING GIN(required_skills);
CREATE INDEX IF NOT EXISTS idx_projects_country ON public.projects(country);
CREATE INDEX IF NOT EXISTS idx_projects_state ON public.projects(state);
CREATE INDEX IF NOT EXISTS idx_projects_lga ON public.projects(lga);

-- RPC: Get personalized project recommendations for a volunteer
CREATE OR REPLACE FUNCTION public.get_recommended_projects(p_volunteer_id uuid)
RETURNS TABLE (
  project_id uuid,
  title text,
  description text,
  location_country text,
  location_state text,
  location_lga text,
  required_skills text[],
  category text,
  organization_name text,
  start_date date,
  end_date date,
  volunteers_needed int,
  volunteers_registered int,
  score int,
  created_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_skills text[];
  v_countries text[];
  v_states text[];
  v_lgas text[];
  v_residence_country text;
  v_residence_state text;
  v_focus_areas text[];
BEGIN
  -- Fetch volunteer profile
  SELECT
    COALESCE(pr.skills, ARRAY[]::text[]),
    COALESCE(pr.volunteer_countries, ARRAY[]::text[]),
    COALESCE(pr.volunteer_states, ARRAY[]::text[]),
    COALESCE(pr.volunteer_lgas, ARRAY[]::text[]),
    pr.residence_country,
    pr.residence_state,
    COALESCE(pr.focus_areas, ARRAY[]::text[])
  INTO v_skills, v_countries, v_states, v_lgas, v_residence_country, v_residence_state, v_focus_areas
  FROM profiles pr
  WHERE pr.id = p_volunteer_id;

  -- Handle null profile (new user)
  v_skills := COALESCE(v_skills, ARRAY[]::text[]);
  v_countries := COALESCE(v_countries, ARRAY[]::text[]);
  v_states := COALESCE(v_states, ARRAY[]::text[]);
  v_lgas := COALESCE(v_lgas, ARRAY[]::text[]);
  v_focus_areas := COALESCE(v_focus_areas, ARRAY[]::text[]);

  RETURN QUERY
  WITH excluded_projects AS (
    SELECT pv.project_id
    FROM project_volunteers pv
    WHERE pv.volunteer_id = p_volunteer_id
    UNION
    SELECT vr.project_id
    FROM volunteer_requests vr
    WHERE vr.volunteer_id = p_volunteer_id
      AND vr.status IN ('pending', 'accepted')
  ),
  scored AS (
    SELECT
      p.id,
      p.title,
      p.description,
      p.country AS loc_country,
      p.state AS loc_state,
      p.lga AS loc_lga,
      p.required_skills,
      p.category,
      p.organization_name,
      p.start_date,
      p.end_date,
      p.volunteers_needed,
      p.volunteers_registered,
      p.created_at,
      -- Location score (40pts): match LGA > state > country; fallback to residence
      (
        CASE
          WHEN p.lga IS NOT NULL AND p.lga = ANY(v_lgas) THEN 40
          WHEN p.state IS NOT NULL AND (
            p.state = ANY(v_states)
            OR (p.state = 'FC' AND 'Abuja (FCT)' = ANY(v_states))
            OR (p.state = 'LA' AND 'Lagos' = ANY(v_states))
            OR (p.state = 'AB' AND 'Abia' = ANY(v_states))
            OR (p.state = 'AD' AND 'Adamawa' = ANY(v_states))
            OR (p.state = 'AK' AND 'Akwa Ibom' = ANY(v_states))
            OR (p.state = 'AN' AND 'Anambra' = ANY(v_states))
            OR (p.state = 'BA' AND 'Bauchi' = ANY(v_states))
            OR (p.state = 'BY' AND 'Bayelsa' = ANY(v_states))
            OR (p.state = 'BE' AND 'Benue' = ANY(v_states))
            OR (p.state = 'BO' AND 'Borno' = ANY(v_states))
            OR (p.state = 'CR' AND 'Cross River' = ANY(v_states))
            OR (p.state = 'DE' AND 'Delta' = ANY(v_states))
            OR (p.state = 'EB' AND 'Ebonyi' = ANY(v_states))
            OR (p.state = 'ED' AND 'Edo' = ANY(v_states))
            OR (p.state = 'EK' AND 'Ekiti' = ANY(v_states))
            OR (p.state = 'EN' AND 'Enugu' = ANY(v_states))
            OR (p.state = 'GO' AND 'Gombe' = ANY(v_states))
            OR (p.state = 'IM' AND 'Imo' = ANY(v_states))
            OR (p.state = 'JI' AND 'Jigawa' = ANY(v_states))
            OR (p.state = 'KD' AND 'Kaduna' = ANY(v_states))
            OR (p.state = 'KN' AND 'Kano' = ANY(v_states))
            OR (p.state = 'KT' AND 'Katsina' = ANY(v_states))
            OR (p.state = 'KE' AND 'Kebbi' = ANY(v_states))
            OR (p.state = 'KO' AND 'Kogi' = ANY(v_states))
            OR (p.state = 'KW' AND 'Kwara' = ANY(v_states))
            OR (p.state = 'NA' AND 'Nasarawa' = ANY(v_states))
            OR (p.state = 'NI' AND 'Niger' = ANY(v_states))
            OR (p.state = 'OG' AND 'Ogun' = ANY(v_states))
            OR (p.state = 'ON' AND 'Ondo' = ANY(v_states))
            OR (p.state = 'OS' AND 'Osun' = ANY(v_states))
            OR (p.state = 'OY' AND 'Oyo' = ANY(v_states))
            OR (p.state = 'PL' AND 'Plateau' = ANY(v_states))
            OR (p.state = 'RI' AND 'Rivers' = ANY(v_states))
            OR (p.state = 'SO' AND 'Sokoto' = ANY(v_states))
            OR (p.state = 'TA' AND 'Taraba' = ANY(v_states))
            OR (p.state = 'YO' AND 'Yobe' = ANY(v_states))
            OR (p.state = 'ZA' AND 'Zamfara' = ANY(v_states))
          ) THEN 40
          WHEN (p.country = ANY(v_countries)
            OR (p.country = 'NG' AND 'Nigeria' = ANY(v_countries))) THEN 40
          WHEN array_length(v_countries, 1) IS NULL
            AND v_residence_country IS NOT NULL
            AND (p.country = v_residence_country OR (p.country = 'NG' AND v_residence_country = 'Nigeria')) THEN 40
          WHEN array_length(v_states, 1) IS NULL
            AND v_residence_state IS NOT NULL
            AND p.state IS NOT NULL
            AND p.state = v_residence_state THEN 40
          ELSE 0
        END
      )::int AS loc_score,
      -- Skills score (30pts): proportional overlap
      (
        CASE
          WHEN p.required_skills IS NULL OR array_length(p.required_skills, 1) IS NULL THEN 0
          WHEN NOT (p.required_skills && v_skills) THEN 0
          ELSE LEAST(30, (
            (SELECT count(*)::float FROM unnest(p.required_skills) AS rs
             WHERE rs = ANY(v_skills))
            / NULLIF(array_length(p.required_skills, 1), 0) * 30
          )::int)
        END
      )::int AS skill_score,
      -- Interest/category match (20pts): focus_areas or category
      (
        CASE
          WHEN p.category = ANY(v_focus_areas) THEN 20
          ELSE 0
        END
      )::int AS interest_score,
      -- Recency bonus (10pts): created within 30 days
      (
        CASE WHEN p.created_at > NOW() - INTERVAL '30 days' THEN 10 ELSE 0 END
      )::int AS recency_score
    FROM projects p
    WHERE p.status = 'active'
      AND p.id NOT IN (SELECT ep.project_id FROM excluded_projects ep)
  )
  SELECT
    s.id,
    s.title,
    s.description,
    s.loc_country,
    s.loc_state,
    s.loc_lga,
    s.required_skills,
    s.category,
    s.organization_name,
    s.start_date,
    s.end_date,
    s.volunteers_needed,
    s.volunteers_registered,
    (s.loc_score + s.skill_score + s.interest_score + s.recency_score)::int,
    s.created_at
  FROM scored s
  ORDER BY (s.loc_score + s.skill_score + s.interest_score + s.recency_score) DESC
  LIMIT 10;
END;
$$;

COMMENT ON FUNCTION public.get_recommended_projects(uuid) IS
  'Returns top 10 personalized project recommendations for a volunteer based on location (40pts), skills (30pts), interests (20pts), and recency (10pts). Excludes projects already joined or with pending/accepted applications.';
