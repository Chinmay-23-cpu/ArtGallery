-- schema.sql
-- Database schema and RLS policies for My Sketchbook

-- 1. ADMINS TABLE
-- Holds the UUIDs of authorized administrators.
CREATE TABLE IF NOT EXISTS public.admins (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security on admins
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Admins policy: Allow authenticated users to check if they are admins.
CREATE POLICY "Allow authenticated users to read admins" ON public.admins
    FOR SELECT TO authenticated USING (true);


-- 2. ARTWORKS TABLE
-- Holds the metadata for individual drawings and paintings.
CREATE TABLE IF NOT EXISTS public.artworks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    category TEXT NOT NULL, -- 'pencil', 'painting', 'studies', 'experiments'
    medium TEXT NOT NULL,
    year TEXT NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    description TEXT,
    image_url TEXT NOT NULL,
    featured BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security on artworks
ALTER TABLE public.artworks ENABLE ROW LEVEL SECURITY;

-- Policy 1: Allow public read access to anyone (anonymous and authenticated)
CREATE POLICY "Allow public read access to artworks" ON public.artworks
    FOR SELECT TO public USING (true);

-- Policy 2: Allow write access ONLY to authenticated users listed in the admins table
CREATE POLICY "Allow owner to manage artworks" ON public.artworks
    FOR ALL 
    TO authenticated 
    USING (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()))
    WITH CHECK (EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));


-- 3. STORAGE INTEGRATION & POLICIES
-- NOTE: Execute these commands after creating the 'artworks' storage bucket in Supabase storage panel.

-- Policy 1: Allow public read access to any media stored inside the 'artworks' storage bucket.
CREATE POLICY "Allow public read access to storage files" ON storage.objects
    FOR SELECT 
    TO public 
    USING (bucket_id = 'artworks');

-- Policy 2: Allow full file management ONLY to authenticated users listed in the admins table.
CREATE POLICY "Allow owner to manage storage files" ON storage.objects
    FOR ALL 
    TO authenticated 
    USING (bucket_id = 'artworks' AND EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()))
    WITH CHECK (bucket_id = 'artworks' AND EXISTS (SELECT 1 FROM public.admins WHERE user_id = auth.uid()));


-- 4. BOOTSTRAPPING USER AS OWNER (INSTRUCTIONS)
-- After signing up your email via Supabase Auth (e.g. using the command line or registering),
-- you can promote your user to Owner by running the following SQL in your Supabase Editor:
-- 
-- INSERT INTO public.admins (user_id) 
-- VALUES ('<YOUR_AUTHENTICATED_USER_UUID>');
