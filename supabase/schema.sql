-- Supabase Schema for Redline (AI Resume Coach)
-- Enable uuid-ossp or pgcrypto if needed
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. Resumes table
CREATE TABLE IF NOT EXISTS public.resumes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    file_name TEXT NOT NULL,
    file_url TEXT,
    raw_text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Scans table
CREATE TABLE IF NOT EXISTS public.scans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    resume_id UUID REFERENCES public.resumes(id) ON DELETE CASCADE,
    job_title TEXT,
    job_description TEXT,
    ats_score SMALLINT NOT NULL,
    score_breakdown JSONB NOT NULL DEFAULT '{}'::jsonb,
    keywords JSONB NOT NULL DEFAULT '[]'::jsonb,
    section_checks JSONB NOT NULL DEFAULT '[]'::jsonb,
    line_issues JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Cover Letters table
CREATE TABLE IF NOT EXISTS public.cover_letters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
    job_description TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 4. Mock Interviews table
CREATE TABLE IF NOT EXISTS public.mock_interviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    resume_id UUID REFERENCES public.resumes(id) ON DELETE SET NULL,
    questions JSONB NOT NULL DEFAULT '[]'::jsonb,
    responses JSONB DEFAULT '[]'::jsonb,
    score SMALLINT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_resumes_user_id ON public.resumes(user_id);
CREATE INDEX IF NOT EXISTS idx_scans_resume_id ON public.scans(resume_id);
CREATE INDEX IF NOT EXISTS idx_cover_letters_user_id ON public.cover_letters(user_id);
CREATE INDEX IF NOT EXISTS idx_mock_interviews_user_id ON public.mock_interviews(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE public.resumes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cover_letters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mock_interviews ENABLE ROW LEVEL SECURITY;

-- Permissive policies allowing guest/public creation and reading (as well as authenticated user access)
-- Resumes: allow read/write for own user_id OR guest records (where user_id IS NULL)
CREATE POLICY "Allow public insert to resumes"
    ON public.resumes FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow select on resumes"
    ON public.resumes FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL OR auth.uid() IS NULL);

-- Scans: allow insert and select
CREATE POLICY "Allow public insert to scans"
    ON public.scans FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public select on scans"
    ON public.scans FOR SELECT
    USING (true);

-- Cover Letters: allow insert and select
CREATE POLICY "Allow public insert to cover_letters"
    ON public.cover_letters FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow select on cover_letters"
    ON public.cover_letters FOR SELECT
    USING (auth.uid() = user_id OR user_id IS NULL OR auth.uid() IS NULL);

-- Mock Interviews: allow insert, select, and update
CREATE POLICY "Allow public insert to mock_interviews"
    ON public.mock_interviews FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Allow public select on mock_interviews"
    ON public.mock_interviews FOR SELECT
    USING (true);

CREATE POLICY "Allow public update on mock_interviews"
    ON public.mock_interviews FOR UPDATE
    USING (true)
    WITH CHECK (true);
