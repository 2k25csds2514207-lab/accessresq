-- ========================================================================
-- ACCESSRESQ DATABASE SCHEMA (POSTGRESQL / SUPABASE)
-- Project: AccessResQ — Navigate • Assist • Include
-- Catalyst Hack 2026 Production Schema (Full Security Audit & Hardening)
-- ========================================================================

-- Enable required cryptographic and geospatial extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS postgis;

-- ------------------------------------------------------------------------
-- 1. USERS & PROFILES (PRIVILEGED FIELDS PROTECTED)
-- is_accessibility_auditor & is_verified_helper cannot be set by normal users.
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL,
    phone TEXT,
    avatar_url TEXT,
    mobility_type TEXT CHECK (mobility_type IN ('wheelchair', 'walking_assistance', 'visually_impaired', 'hearing_impaired', 'other', 'none')),
    mobility_device TEXT,
    blood_group TEXT,
    medical_notes TEXT,
    emergency_contact_name TEXT,
    emergency_contact_relationship TEXT,
    emergency_contact_phone TEXT,
    is_accessibility_auditor BOOLEAN DEFAULT FALSE,
    is_verified_helper BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Idempotent column migrations for existing databases
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mobility_type TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS mobility_device TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS blood_group TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS medical_notes TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_relationship TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS emergency_contact_phone TEXT;

-- ------------------------------------------------------------------------
-- 2. ACCESSIBILITY PREFERENCES (STRICT PRIVATE ACCESS)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.accessibility_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    wheelchair_mode BOOLEAN DEFAULT TRUE,
    wheelchair_type TEXT DEFAULT 'manual' CHECK (wheelchair_type IN ('manual', 'electric', 'scooter')),
    avoid_stairs BOOLEAN DEFAULT TRUE,
    step_free_access BOOLEAN DEFAULT TRUE,
    prefer_ramps BOOLEAN DEFAULT TRUE,
    smooth_surfaces BOOLEAN DEFAULT TRUE,
    well_lit_routes BOOLEAN DEFAULT FALSE,
    lower_vibration BOOLEAN DEFAULT TRUE,
    max_slope_gradient NUMERIC(4,2) DEFAULT 6.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- 3. LOCATIONS & LANDMARKS (PUBLIC NAVIGATION REFERENCE)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.locations (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    short_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('university', 'mall', 'transit', 'landmark', 'hospital', 'other')),
    address TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    accessible_features TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- 4. ROUTE SEGMENTS (ACCESSIBILITY GRAPH - PUBLIC NAVIGATION REFERENCE)
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.route_segments (
    id TEXT PRIMARY KEY,
    from_node_id TEXT NOT NULL,
    to_node_id TEXT NOT NULL,
    name TEXT NOT NULL,
    distance_meters INTEGER NOT NULL,
    steps_count INTEGER DEFAULT 0,
    has_ramp BOOLEAN DEFAULT FALSE,
    ramp_slope_percent NUMERIC(4,2),
    surface TEXT NOT NULL CHECK (surface IN ('asphalt_smooth', 'paved_concrete', 'paver_tiles', 'cobblestone', 'gravel', 'broken_pavement')),
    is_well_lit BOOLEAN DEFAULT TRUE,
    vibration_level TEXT DEFAULT 'low' CHECK (vibration_level IN ('low', 'medium', 'high')),
    is_verified_accessible BOOLEAN DEFAULT FALSE,
    has_active_barrier BOOLEAN DEFAULT FALSE,
    coordinates JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- 5. COMMUNITY ACCESSIBILITY BARRIERS
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.community_barriers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL CHECK (length(trim(title)) >= 3 AND length(title) <= 150),
    description TEXT NOT NULL CHECK (length(trim(description)) >= 5 AND length(description) <= 1000),
    category TEXT NOT NULL CHECK (category IN (
        'blocked_ramp', 
        'broken_footpath', 
        'stairs_no_ramp', 
        'construction', 
        'inaccessible_entrance', 
        'broken_elevator', 
        'high_curb', 
        'other'
    )),
    severity TEXT NOT NULL DEFAULT 'moderate' CHECK (severity IN ('low', 'moderate', 'high', 'impassable')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'community_confirmed', 'verified', 'resolved')),
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    location_name TEXT NOT NULL CHECK (length(trim(location_name)) >= 2 AND length(location_name) <= 120),
    photo_url TEXT,
    reported_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    reported_by_name TEXT NOT NULL DEFAULT 'Community Contributor' CHECK (length(trim(reported_by_name)) >= 2 AND length(reported_by_name) <= 80),
    confirmations_count INTEGER NOT NULL DEFAULT 1 CHECK (confirmations_count >= 1),
    affected_route_segment_id TEXT,
    resolved_at TIMESTAMPTZ,
    resolution_note TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- 6. BARRIER CONFIRMATIONS (INTERNAL AUDIT - NO PUBLIC DIRECT ACCESS)
-- Direct SELECT and direct INSERT are revoked from public/anon.
-- Insertions occur exclusively via the secure confirm_barrier_safely RPC.
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.barrier_confirmations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barrier_id UUID NOT NULL REFERENCES public.community_barriers(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    client_identifier TEXT, -- anonymous client device or session token
    confirmed_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT chk_voter_identified CHECK (user_id IS NOT NULL OR client_identifier IS NOT NULL),
    CONSTRAINT unique_user_barrier_confirmation UNIQUE (barrier_id, user_id),
    CONSTRAINT unique_client_barrier_confirmation UNIQUE (barrier_id, client_identifier)
);

-- ------------------------------------------------------------------------
-- 7. ROADSIDE RESCUE PROVIDERS (BASE TABLE - PROTECTED DRIVER PII)
-- Driver name, driver phone and vehicle plate are not exposed to the public.
-- Public clients query the active_rescue_providers_public view instead.
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rescue_providers (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    company_name TEXT NOT NULL,
    rating NUMERIC(3,2) DEFAULT 4.80,
    review_count INTEGER DEFAULT 0,
    services TEXT[] NOT NULL,
    dispatch_phone TEXT NOT NULL,
    driver_name TEXT NOT NULL,
    driver_phone TEXT,
    vehicle_plate TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    has_wheelchair_hoist_lift BOOLEAN DEFAULT FALSE,
    has_ramp_equipment BOOLEAN DEFAULT TRUE,
    is_mobility_certified BOOLEAN DEFAULT FALSE,
    is_verified_partner BOOLEAN DEFAULT FALSE,
    bio TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- 8. ROADSIDE ASSISTANCE DISPATCH REQUESTS (CONFIDENTIAL / PRIVATE)
-- Users cannot assign providers or advance dispatch status themselves.
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.rescue_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    service_type TEXT NOT NULL CHECK (service_type IN ('flat_tyre', 'battery_jump', 'towing', 'basic_repair', 'wav_assistance')),
    vehicle_type TEXT NOT NULL CHECK (vehicle_type IN ('manual_wheelchair', 'power_wheelchair', 'mobility_scooter', 'accessible_van', 'standard_car')),
    location_name TEXT NOT NULL,
    latitude DOUBLE PRECISION NOT NULL CHECK (latitude BETWEEN -90 AND 90),
    longitude DOUBLE PRECISION NOT NULL CHECK (longitude BETWEEN -180 AND 180),
    has_wheelchair_hoist_required BOOLEAN DEFAULT FALSE,
    user_name TEXT NOT NULL,
    user_phone TEXT NOT NULL,
    urgency TEXT DEFAULT 'standard' CHECK (urgency IN ('critical', 'standard', 'scheduled')),
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'searching' CHECK (status IN ('searching', 'assigned', 'in_transit', 'arrived', 'completed', 'cancelled')),
    matched_provider_id TEXT REFERENCES public.rescue_providers(id) ON DELETE SET NULL,
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- 9. VERIFICATION & AUDIT LOG (RESTRICTED AUDIT TRAIL - NO PII)
-- Stores role descriptions and predefined system reasons only.
-- ------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.verification_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    barrier_id UUID REFERENCES public.community_barriers(id) ON DELETE CASCADE,
    previous_status TEXT NOT NULL,
    new_status TEXT NOT NULL,
    changed_by_role TEXT NOT NULL,
    reason TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ------------------------------------------------------------------------
-- PERFORMANCE & INTEGRITY INDEXES
-- ------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_barriers_status ON public.community_barriers(status);
CREATE INDEX IF NOT EXISTS idx_barriers_category ON public.community_barriers(category);
CREATE INDEX IF NOT EXISTS idx_barriers_coords ON public.community_barriers(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_barriers_created ON public.community_barriers(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_confirmations_barrier ON public.barrier_confirmations(barrier_id);
CREATE INDEX IF NOT EXISTS idx_confirmations_client ON public.barrier_confirmations(barrier_id, client_identifier);
CREATE INDEX IF NOT EXISTS idx_rescue_providers_active ON public.rescue_providers(is_active);
CREATE INDEX IF NOT EXISTS idx_rescue_requests_user ON public.rescue_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_rescue_requests_status ON public.rescue_requests(status);

-- ========================================================================
-- SECURITY: PUBLIC VIEW FOR ACTIVE RESCUE PROVIDERS
-- Strictly masks individual driver phone numbers, driver names and vehicle plates.
-- ========================================================================
CREATE OR REPLACE VIEW public.active_rescue_providers_public AS
SELECT 
    id,
    name,
    company_name,
    rating,
    review_count,
    services,
    dispatch_phone,
    latitude,
    longitude,
    has_wheelchair_hoist_lift,
    has_ramp_equipment,
    is_mobility_certified,
    is_verified_partner,
    bio,
    is_active,
    created_at
FROM public.rescue_providers
WHERE is_active = TRUE;

-- ========================================================================
-- HELPER: SAFE PUBLIC RESOLUTION DESCRIPTION MAPPER
-- Maps user-typed or auditor-typed notes to sanitized, safe public text.
-- Never exposes arbitrary free-text, private contact info or spam publicly.
-- ========================================================================
CREATE OR REPLACE FUNCTION public.map_safe_resolution_description(
    p_input_note TEXT,
    p_category TEXT
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
    v_clean TEXT;
BEGIN
    v_clean := lower(COALESCE(trim(p_input_note), ''));
    
    IF v_clean LIKE '%ramp%' OR p_category = 'blocked_ramp' THEN 
        RETURN 'Ramp cleared and unobstructed for wheelchair access.';
    ELSIF v_clean LIKE '%elevator%' OR v_clean LIKE '%lift%' OR p_category = 'broken_elevator' THEN 
        RETURN 'Elevator / lift restored to service and verified operable.';
    ELSIF v_clean LIKE '%curb%' OR p_category = 'high_curb' THEN 
        RETURN 'Curb cut repaired and leveled for step-free access.';
    ELSIF v_clean LIKE '%footpath%' OR v_clean LIKE '%pavement%' OR p_category = 'broken_footpath' THEN 
        RETURN 'Footpath surface repaired and cleared of obstacles.';
    ELSIF v_clean LIKE '%construction%' OR p_category = 'construction' THEN 
        RETURN 'Construction obstacle removed and accessible passage reopened.';
    ELSIF p_category = 'stairs_no_ramp' THEN
        RETURN 'Alternative step-free ramp / accessible path provided.';
    ELSIF p_category = 'inaccessible_entrance' THEN
        RETURN 'Accessible entrance enabled with step-free automated access.';
    ELSE 
        RETURN 'Obstacle cleared and verified accessible by mobility authority.';
    END IF;
END;
$$;

-- ========================================================================
-- SECURITY: PROTECT PRIVILEGED PROFILE FIELDS (AUDITOR / VERIFIED HELPER)
-- Normal authenticated users cannot self-assign auditor or helper status.
-- Only trusted backend processes (service_role) can alter privileged fields.
-- ========================================================================
CREATE OR REPLACE FUNCTION public.protect_profile_privileged_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_role TEXT;
BEGIN
    v_role := COALESCE(auth.jwt() ->> 'role', current_setting('request.jwt.claim.role', true));
    
    -- Trusted service_role backend can set or modify any flag
    IF v_role = 'service_role' THEN
        RETURN NEW;
    END IF;

    -- Standard authenticated callers cannot self-assign privileged status
    IF TG_OP = 'INSERT' THEN
        NEW.is_accessibility_auditor := FALSE;
        NEW.is_verified_helper := FALSE;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.is_accessibility_auditor IS DISTINCT FROM OLD.is_accessibility_auditor THEN
            RAISE EXCEPTION 'Unauthorized: is_accessibility_auditor can only be modified by a system administrator.';
        END IF;

        IF NEW.is_verified_helper IS DISTINCT FROM OLD.is_verified_helper THEN
            RAISE EXCEPTION 'Unauthorized: is_verified_helper can only be modified by a system administrator.';
        END IF;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_protect_profile_privileged_fields ON public.profiles;
CREATE TRIGGER trg_protect_profile_privileged_fields
    BEFORE INSERT OR UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.protect_profile_privileged_fields();

-- ========================================================================
-- SECURITY: BEFORE INSERT SANITIZATION FOR COMMUNITY BARRIERS
-- Forces status=pending, count=1, resolved_at=NULL, resolution_note=NULL.
-- Prevents spoofing reported_by_user_id and trims user input.
-- ========================================================================
CREATE OR REPLACE FUNCTION public.sanitize_barrier_insert()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- 1. Strictly enforce initial status and verification state
    NEW.status := 'pending';
    NEW.confirmations_count := 1;
    NEW.resolved_at := NULL;
    NEW.resolution_note := NULL;
    NEW.created_at := NOW();
    NEW.updated_at := NOW();

    -- 2. Prevent user_id spoofing
    IF auth.uid() IS NOT NULL THEN
        NEW.reported_by_user_id := auth.uid();
    ELSE
        NEW.reported_by_user_id := NULL;
    END IF;

    -- 3. Validate user-controlled text
    NEW.title := TRIM(NEW.title);
    NEW.description := TRIM(NEW.description);
    NEW.location_name := TRIM(NEW.location_name);
    NEW.reported_by_name := COALESCE(NULLIF(TRIM(NEW.reported_by_name), ''), 'Community Contributor');

    IF length(NEW.title) < 3 OR length(NEW.title) > 150 THEN
        RAISE EXCEPTION 'Barrier title must be between 3 and 150 characters.';
    END IF;

    IF length(NEW.description) < 5 OR length(NEW.description) > 1000 THEN
        RAISE EXCEPTION 'Barrier description must be between 5 and 1000 characters.';
    END IF;

    IF length(NEW.location_name) < 2 OR length(NEW.location_name) > 120 THEN
        RAISE EXCEPTION 'Location name must be between 2 and 120 characters.';
    END IF;

    IF length(NEW.reported_by_name) < 2 OR length(NEW.reported_by_name) > 80 THEN
        NEW.reported_by_name := 'Community Contributor';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sanitize_barrier_insert ON public.community_barriers;
CREATE TRIGGER trg_sanitize_barrier_insert
    BEFORE INSERT ON public.community_barriers
    FOR EACH ROW
    EXECUTE FUNCTION public.sanitize_barrier_insert();

-- ========================================================================
-- SECURITY: BEFORE UPDATE TRANSITION TRIGGER FOR COMMUNITY BARRIERS
-- Enforces field immutability, coordinates lock, and valid state transitions.
-- Enforces safe public description mapping on EVERY resolution path.
-- ========================================================================
CREATE OR REPLACE FUNCTION public.validate_barrier_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
    -- 1. Prevent modification of immutable primary identifiers and coordinates
    IF NEW.id != OLD.id THEN
        RAISE EXCEPTION 'Barrier ID cannot be altered.';
    END IF;

    IF NEW.created_at != OLD.created_at THEN
        NEW.created_at := OLD.created_at;
    END IF;

    IF NEW.latitude != OLD.latitude OR NEW.longitude != OLD.longitude THEN
        RAISE EXCEPTION 'Barrier coordinates cannot be altered after submission.';
    END IF;

    IF NEW.category != OLD.category THEN
        RAISE EXCEPTION 'Barrier category cannot be altered after submission.';
    END IF;

    IF NEW.reported_by_name != OLD.reported_by_name THEN
        NEW.reported_by_name := OLD.reported_by_name;
    END IF;

    IF NEW.reported_by_user_id IS DISTINCT FROM OLD.reported_by_user_id THEN
        NEW.reported_by_user_id := OLD.reported_by_user_id;
    END IF;

    -- 2. Once a barrier is marked resolved, it cannot be edited or reopened
    IF OLD.status = 'resolved' THEN
        RAISE EXCEPTION 'A resolved accessibility barrier cannot be modified.';
    END IF;

    -- 3. Handle Resolution Flow: enforce safe public description mapping on EVERY resolution path
    IF NEW.status = 'resolved' THEN
        IF NEW.resolution_note IS NULL OR length(trim(NEW.resolution_note)) < 3 THEN
            RAISE EXCEPTION 'A valid resolution note of at least 3 characters is required.';
        END IF;

        -- Enforce safe public description mapping
        NEW.resolution_note := public.map_safe_resolution_description(NEW.resolution_note, NEW.category);
        NEW.resolved_at := COALESCE(NEW.resolved_at, NOW());
        NEW.confirmations_count := OLD.confirmations_count;
        NEW.updated_at := NOW();
        RETURN NEW;
    END IF;

    -- 4. Handle Confirmation (+1 Upvote) Flow
    IF NEW.confirmations_count != OLD.confirmations_count THEN
        IF NEW.confirmations_count != OLD.confirmations_count + 1 THEN
            RAISE EXCEPTION 'Confirmations can only be incremented by 1 per verified traveler.';
        END IF;

        IF OLD.status = 'pending' AND NEW.confirmations_count >= 3 THEN
            NEW.status := 'community_confirmed';
        ELSE
            NEW.status := OLD.status;
        END IF;

        NEW.resolved_at := NULL;
        NEW.resolution_note := NULL;
        NEW.updated_at := NOW();
        RETURN NEW;
    END IF;

    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_barrier_update ON public.community_barriers;
CREATE TRIGGER trg_validate_barrier_update
    BEFORE UPDATE ON public.community_barriers
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_barrier_update();

-- ========================================================================
-- SECURITY: BEFORE UPDATE TRIGGER FOR RESCUE REQUESTS
-- Users cannot assign providers or advance dispatch status.
-- Users may only cancel their own pending/assigned requests.
-- ========================================================================
CREATE OR REPLACE FUNCTION public.validate_rescue_request_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_role TEXT;
BEGIN
    v_role := COALESCE(auth.jwt() ->> 'role', current_setting('request.jwt.claim.role', true));
    
    -- Trusted service_role backend has full dispatch privileges
    IF v_role = 'service_role' THEN
        NEW.updated_at := NOW();
        RETURN NEW;
    END IF;

    -- Prevent altering primary identifiers and requester ownership
    IF NEW.id != OLD.id THEN
        RAISE EXCEPTION 'Request ID cannot be altered.';
    END IF;

    IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
        RAISE EXCEPTION 'Requester user ID cannot be altered.';
    END IF;

    IF NEW.requested_at != OLD.requested_at THEN
        NEW.requested_at := OLD.requested_at;
    END IF;

    -- For standard authenticated requesters:
    IF auth.uid() IS NOT NULL AND auth.uid() = OLD.user_id THEN
        -- Requesters CANNOT assign providers or change matched provider
        IF NEW.matched_provider_id IS DISTINCT FROM OLD.matched_provider_id THEN
            RAISE EXCEPTION 'Unauthorized: Provider assignment can only be performed by dispatch authority.';
        END IF;

        -- Requesters can only transition status to 'cancelled' from 'searching' or 'assigned'
        IF NEW.status IS DISTINCT FROM OLD.status THEN
            IF NEW.status = 'cancelled' AND OLD.status IN ('searching', 'assigned') THEN
                NEW.updated_at := NOW();
                RETURN NEW;
            ELSE
                RAISE EXCEPTION 'Unauthorized: Users may only cancel active requests, not advance dispatch status.';
            END IF;
        END IF;

        NEW.updated_at := NOW();
        RETURN NEW;
    END IF;

    RAISE EXCEPTION 'Unauthorized modification of rescue dispatch request.';
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_rescue_request_update ON public.rescue_requests;
CREATE TRIGGER trg_validate_rescue_request_update
    BEFORE UPDATE ON public.rescue_requests
    FOR EACH ROW
    EXECUTE FUNCTION public.validate_rescue_request_update();

-- ========================================================================
-- SECURITY: STORED PROCEDURE FOR SAFE ATOMIC CONFIRMATION (RPC)
-- Handles concurrency row-locking (FOR UPDATE), duplicate prevention,
-- and automatic verification status threshold updates.
-- ========================================================================
CREATE OR REPLACE FUNCTION public.confirm_barrier_safely(
    p_barrier_id UUID,
    p_client_identifier TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_user_id UUID;
    v_client_id TEXT;
    v_barrier RECORD;
    v_new_count INTEGER;
    v_new_status TEXT;
BEGIN
    -- 1. Identify voter (authenticated user ID or anonymous client identifier)
    v_user_id := auth.uid();
    v_client_id := NULLIF(TRIM(p_client_identifier), '');

    IF v_user_id IS NULL AND v_client_id IS NULL THEN
        RAISE EXCEPTION 'A valid client identifier or user authentication is required to confirm a barrier.';
    END IF;

    -- 2. Concurrency Safety: Row lock specific barrier
    SELECT * INTO v_barrier 
    FROM public.community_barriers 
    WHERE id = p_barrier_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Barrier not found with ID %', p_barrier_id;
    END IF;

    IF v_barrier.status = 'resolved' THEN
        RAISE EXCEPTION 'Cannot confirm an already resolved barrier.';
    END IF;

    -- 3. Duplicate Vote Prevention
    IF v_user_id IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM public.barrier_confirmations 
            WHERE barrier_id = p_barrier_id AND user_id = v_user_id
        ) THEN
            RAISE EXCEPTION 'You have already confirmed this barrier.';
        END IF;

        BEGIN
            INSERT INTO public.barrier_confirmations (barrier_id, user_id, client_identifier)
            VALUES (p_barrier_id, v_user_id, v_client_id);
        EXCEPTION WHEN unique_violation THEN
            RAISE EXCEPTION 'You have already confirmed this barrier.';
        END;
    ELSE
        IF EXISTS (
            SELECT 1 FROM public.barrier_confirmations 
            WHERE barrier_id = p_barrier_id AND client_identifier = v_client_id
        ) THEN
            RAISE EXCEPTION 'This device/browser has already confirmed this barrier.';
        END IF;

        BEGIN
            INSERT INTO public.barrier_confirmations (barrier_id, client_identifier)
            VALUES (p_barrier_id, v_client_id);
        EXCEPTION WHEN unique_violation THEN
            RAISE EXCEPTION 'This device/browser has already confirmed this barrier.';
        END;
    END IF;

    -- 4. Calculate incremented count and threshold progression
    v_new_count := v_barrier.confirmations_count + 1;
    v_new_status := v_barrier.status;
    IF v_barrier.status = 'pending' AND v_new_count >= 3 THEN
        v_new_status := 'community_confirmed';
    END IF;

    UPDATE public.community_barriers
    SET 
        confirmations_count = v_new_count,
        status = v_new_status,
        updated_at = NOW()
    WHERE id = p_barrier_id;

    RETURN jsonb_build_object(
        'success', true,
        'barrier_id', p_barrier_id,
        'confirmations_count', v_new_count,
        'status', v_new_status
    );
END;
$$;

-- ========================================================================
-- SECURITY: AUTHORIZED RESOLUTION PROCEDURE (BACKEND / AUDITOR ONLY)
-- Evaluates backend service_role first (where auth.uid() is null), then
-- verified accessibility auditor credentials. Blocks anonymous clients.
-- Populates a safe predefined public resolution description to prevent
-- arbitrary or uncurated text from entering publicly readable tables.
-- ========================================================================
CREATE OR REPLACE FUNCTION public.resolve_barrier_safely(
    p_barrier_id UUID,
    p_resolution_note TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_is_authorized BOOLEAN := FALSE;
    v_role TEXT;
    v_barrier RECORD;
    v_clean_note TEXT;
    v_safe_public_description TEXT;
BEGIN
    -- 1. Authorization: Check backend service_role first (auth.uid() is null for service_role)
    v_role := COALESCE(auth.jwt() ->> 'role', current_setting('request.jwt.claim.role', true));
    
    IF v_role = 'service_role' THEN
        v_is_authorized := TRUE;
    ELSIF auth.uid() IS NOT NULL THEN
        -- Check if authenticated user holds auditor authorization
        SELECT is_accessibility_auditor INTO v_is_authorized
        FROM public.profiles
        WHERE id = auth.uid();
    END IF;

    IF COALESCE(v_is_authorized, FALSE) = FALSE THEN
        RAISE EXCEPTION 'Unauthorized: Only certified accessibility auditors or authorized backend services can resolve reports.';
    END IF;

    -- 2. Validate note length
    v_clean_note := TRIM(p_resolution_note);
    IF v_clean_note IS NULL OR length(v_clean_note) < 3 THEN
        RAISE EXCEPTION 'A resolution note of at least 3 characters is required.';
    END IF;

    -- 3. Row lock barrier
    SELECT * INTO v_barrier 
    FROM public.community_barriers 
    WHERE id = p_barrier_id 
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Barrier not found with ID %', p_barrier_id;
    END IF;

    IF v_barrier.status = 'resolved' THEN
        RAISE EXCEPTION 'Barrier is already marked as resolved.';
    END IF;

    -- 4. Map free-text input to a safe, verified, professional public description
    v_safe_public_description := public.map_safe_resolution_description(v_clean_note, v_barrier.category);

    -- 5. Atomic resolution update
    UPDATE public.community_barriers
    SET 
        status = 'resolved',
        resolved_at = NOW(),
        resolution_note = v_safe_public_description,
        updated_at = NOW()
    WHERE id = p_barrier_id;

    RETURN jsonb_build_object(
        'success', true,
        'barrier_id', p_barrier_id,
        'status', 'resolved',
        'resolved_at', NOW(),
        'resolution_note', v_safe_public_description
    );
END;
$$;

-- ========================================================================
-- AUDIT TRAIL: AUTOMATIC STATUS CHANGE LOGGING TRIGGER
-- Accurately labels actor: 'Community Consensus' for confirmation thresholds,
-- and 'Accessibility Auditor' for authorized resolutions.
-- Never exposes raw user text, phone numbers, or emails in the audit table.
-- ========================================================================
CREATE OR REPLACE FUNCTION public.log_barrier_status_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
    v_actor_role TEXT;
    v_safe_reason TEXT;
    v_jwt_role TEXT;
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        v_jwt_role := COALESCE(auth.jwt() ->> 'role', current_setting('request.jwt.claim.role', true));

        -- Accurately categorize actor based on action context
        IF NEW.status = 'community_confirmed' THEN
            -- Transition caused by travelers confirming obstacle (+1 upvotes)
            v_actor_role := 'Community Consensus';
            v_safe_reason := 'Verification threshold reached (3+ verified confirmations)';
        ELSIF NEW.status = 'resolved' THEN
            -- Transition executed by authorized auditor or backend service role
            IF v_jwt_role = 'service_role' THEN
                v_actor_role := 'System Administrator';
            ELSE
                v_actor_role := 'Accessibility Auditor';
            END IF;
            v_safe_reason := 'Obstacle cleared and marked resolved by authorized authority';
        ELSIF NEW.status = 'verified' THEN
            v_actor_role := 'Municipal Authority';
            v_safe_reason := 'Official municipality or transit authority audit completed';
        ELSE
            v_actor_role := 'System Dispatcher';
            v_safe_reason := 'Status transition verified';
        END IF;

        INSERT INTO public.verification_logs (
            barrier_id,
            previous_status,
            new_status,
            changed_by_role,
            reason
        ) VALUES (
            NEW.id,
            OLD.status,
            NEW.status,
            v_actor_role,
            v_safe_reason
        );
    END IF;
    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_log_barrier_status_change ON public.community_barriers;
CREATE TRIGGER trg_log_barrier_status_change
    AFTER UPDATE ON public.community_barriers
    FOR EACH ROW
    WHEN (OLD.status IS DISTINCT FROM NEW.status)
    EXECUTE FUNCTION public.log_barrier_status_change();

-- ========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR EVERY TABLE
-- ========================================================================

-- Enable RLS across all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.accessibility_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.route_segments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_barriers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barrier_confirmations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rescue_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rescue_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------
-- 1. PROFILES POLICIES (Private Access Only — No Public Leaks)
-- ------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own profile only" ON public.profiles;
CREATE POLICY "Users can view own profile only"
ON public.profiles FOR SELECT
USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles FOR UPDATE
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- ------------------------------------------------------------------------
-- 2. ACCESSIBILITY PREFERENCES POLICIES (Private Access Only)
-- ------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own preferences" ON public.accessibility_preferences;
CREATE POLICY "Users can view own preferences"
ON public.accessibility_preferences FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own preferences" ON public.accessibility_preferences;
CREATE POLICY "Users can insert own preferences"
ON public.accessibility_preferences FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own preferences" ON public.accessibility_preferences;
CREATE POLICY "Users can update own preferences"
ON public.accessibility_preferences FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ------------------------------------------------------------------------
-- 3. LOCATIONS & ROUTE SEGMENTS (Public Read Navigation Reference)
-- ------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read locations" ON public.locations;
CREATE POLICY "Public read locations"
ON public.locations FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Public read route segments" ON public.route_segments;
CREATE POLICY "Public read route segments"
ON public.route_segments FOR SELECT
USING (true);

-- ------------------------------------------------------------------------
-- 4. COMMUNITY BARRIERS POLICIES
-- Public Read: YES
-- Public Insert: YES (with validation & spoofing prevention)
-- Direct Public Update: NO (Must use confirm_barrier_safely RPC)
-- ------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read community barriers" ON public.community_barriers;
DROP POLICY IF EXISTS "Public read community barriers" ON public.community_barriers;
CREATE POLICY "Public read community barriers"
ON public.community_barriers FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Allow public insert community barriers" ON public.community_barriers;
DROP POLICY IF EXISTS "Public insert community barriers" ON public.community_barriers;
CREATE POLICY "Public insert community barriers"
ON public.community_barriers FOR INSERT
WITH CHECK (
    status = 'pending'
    AND confirmations_count = 1
    AND resolved_at IS NULL
    AND resolution_note IS NULL
    AND (
        (auth.uid() IS NULL AND reported_by_user_id IS NULL)
        OR (auth.uid() IS NOT NULL AND (reported_by_user_id IS NULL OR reported_by_user_id = auth.uid()))
    )
    AND length(trim(title)) >= 3 AND length(title) <= 150
    AND length(trim(description)) >= 5 AND length(description) <= 1000
    AND length(trim(location_name)) >= 2 AND length(location_name) <= 120
    AND latitude BETWEEN -90 AND 90
    AND longitude BETWEEN -180 AND 180
);

-- Direct UPDATE on community_barriers is strictly restricted to verified accessibility auditors
DROP POLICY IF EXISTS "Allow public update community barriers" ON public.community_barriers;
DROP POLICY IF EXISTS "Controlled update on active community barriers" ON public.community_barriers;
DROP POLICY IF EXISTS "Auditors can update barriers" ON public.community_barriers;
CREATE POLICY "Auditors can update barriers"
ON public.community_barriers FOR UPDATE
USING (
    auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_accessibility_auditor = TRUE
    )
)
WITH CHECK (
    auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_accessibility_auditor = TRUE
    )
);

-- ------------------------------------------------------------------------
-- 5. BARRIER CONFIRMATIONS POLICIES
-- Direct public SELECT and direct public INSERT are revoked.
-- Internal table used by confirm_barrier_safely RPC only.
-- ------------------------------------------------------------------------
DROP POLICY IF EXISTS "Allow public read barrier confirmations" ON public.barrier_confirmations;
DROP POLICY IF EXISTS "Public read barrier confirmations" ON public.barrier_confirmations;
DROP POLICY IF EXISTS "Allow public insert barrier confirmations" ON public.barrier_confirmations;
DROP POLICY IF EXISTS "Public insert barrier confirmations" ON public.barrier_confirmations;

-- ------------------------------------------------------------------------
-- 6. RESCUE PROVIDERS POLICIES (Base Table Driver Details Protected)
-- Direct base table access restricted: public queries should use active_rescue_providers_public.
-- Authenticated users view driver details only for active matched requests.
-- ------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read rescue providers" ON public.rescue_providers;
DROP POLICY IF EXISTS "Public read active rescue providers only" ON public.rescue_providers;
DROP POLICY IF EXISTS "Assigned users can view provider driver details" ON public.rescue_providers;

CREATE POLICY "Assigned users can view provider driver details"
ON public.rescue_providers FOR SELECT
USING (
    auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.rescue_requests 
        WHERE matched_provider_id = rescue_providers.id 
        AND user_id = auth.uid()
        AND status IN ('assigned', 'in_transit', 'arrived')
    )
);

-- ------------------------------------------------------------------------
-- 7. RESCUE REQUESTS POLICIES (Confidential - Protects Phone Numbers & Status)
-- Requesters can only cancel their own active requests; cannot advance dispatch status.
-- ------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can view own rescue requests" ON public.rescue_requests;
CREATE POLICY "Users can view own rescue requests"
ON public.rescue_requests FOR SELECT
USING (
    (auth.uid() IS NOT NULL AND auth.uid() = user_id)
);

DROP POLICY IF EXISTS "Allow submitting rescue request" ON public.rescue_requests;
CREATE POLICY "Allow submitting rescue request"
ON public.rescue_requests FOR INSERT
WITH CHECK (
    (
        (auth.uid() IS NULL AND user_id IS NULL)
        OR (auth.uid() IS NOT NULL AND user_id = auth.uid())
    )
    AND user_phone IS NOT NULL
    AND length(trim(user_phone)) >= 7
    AND status = 'searching'
    AND matched_provider_id IS NULL
);

DROP POLICY IF EXISTS "Users can update own rescue request" ON public.rescue_requests;
DROP POLICY IF EXISTS "Users can only update own cancellable rescue request" ON public.rescue_requests;
CREATE POLICY "Users can only update own cancellable rescue request"
ON public.rescue_requests FOR UPDATE
USING (
    auth.uid() IS NOT NULL 
    AND auth.uid() = user_id 
    AND status IN ('searching', 'assigned')
)
WITH CHECK (
    auth.uid() IS NOT NULL 
    AND auth.uid() = user_id
);

-- ------------------------------------------------------------------------
-- 8. VERIFICATION LOGS POLICIES (Auditors Only — No Public Exposure)
-- ------------------------------------------------------------------------
DROP POLICY IF EXISTS "Public read verification logs" ON public.verification_logs;
DROP POLICY IF EXISTS "Auditors can view verification logs" ON public.verification_logs;

CREATE POLICY "Auditors can view verification logs"
ON public.verification_logs FOR SELECT
USING (
    auth.uid() IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND is_accessibility_auditor = TRUE
    )
);

-- ========================================================================
-- DEFENSE-IN-DEPTH: EXPLICIT GRANT AND REVOKE PERMISSIONS
-- Ensures table-level SQL privileges match RLS restrictions across roles.
-- ========================================================================

-- 1. Baseline: Revoke all public default privileges
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, public;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA public FROM anon, public;

-- 2. Reference Tables & Public Views
GRANT SELECT ON TABLE public.locations TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.route_segments TO anon, authenticated, service_role;
GRANT SELECT ON TABLE public.active_rescue_providers_public TO anon, authenticated, service_role;

-- 3. Community Barriers
GRANT SELECT, INSERT ON TABLE public.community_barriers TO anon, authenticated, service_role;
GRANT UPDATE ON TABLE public.community_barriers TO authenticated, service_role;

-- 4. Barrier Confirmations: Revoked from anon and authenticated. Internal use via RPC.
REVOKE ALL ON TABLE public.barrier_confirmations FROM anon, authenticated, public;
GRANT SELECT, INSERT ON TABLE public.barrier_confirmations TO service_role;

-- 5. Rescue Providers (Base Table): Direct table access revoked from anon
REVOKE ALL ON TABLE public.rescue_providers FROM anon, public;
GRANT SELECT ON TABLE public.rescue_providers TO authenticated, service_role;

-- 6. Rescue Requests
GRANT INSERT ON TABLE public.rescue_requests TO anon, authenticated, service_role;
GRANT SELECT, UPDATE ON TABLE public.rescue_requests TO authenticated, service_role;

-- 7. Profiles & Preferences
-- Standard authenticated users can edit profile info, but CANNOT update is_accessibility_auditor or is_verified_helper
REVOKE ALL ON TABLE public.profiles FROM anon, public;
GRANT SELECT ON TABLE public.profiles TO authenticated;
GRANT INSERT (
    id, email, full_name, phone, avatar_url,
    mobility_type, mobility_device, blood_group, medical_notes,
    emergency_contact_name, emergency_contact_relationship, emergency_contact_phone
) ON TABLE public.profiles TO authenticated;
GRANT UPDATE (
    full_name, phone, avatar_url,
    mobility_type, mobility_device, blood_group, medical_notes,
    emergency_contact_name, emergency_contact_relationship, emergency_contact_phone
) ON TABLE public.profiles TO authenticated;
GRANT ALL ON TABLE public.profiles TO service_role;

GRANT SELECT, INSERT, UPDATE ON TABLE public.accessibility_preferences TO authenticated, service_role;

-- 8. Verification Logs: Revoked from anon and public
REVOKE ALL ON TABLE public.verification_logs FROM anon, public;
GRANT SELECT ON TABLE public.verification_logs TO authenticated, service_role;

-- 9. Stored Procedures (RPCs)
GRANT EXECUTE ON FUNCTION public.map_safe_resolution_description(TEXT, TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.confirm_barrier_safely(UUID, TEXT) TO anon, authenticated, service_role;
REVOKE EXECUTE ON FUNCTION public.resolve_barrier_safely(UUID, TEXT) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.resolve_barrier_safely(UUID, TEXT) TO authenticated, service_role;
