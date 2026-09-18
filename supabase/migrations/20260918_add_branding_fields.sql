-- Supabase Database Migration for App Branding & Customization
-- Version: 20260918_add_branding_fields.sql

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS app_name TEXT,
ADD COLUMN IF NOT EXISTS app_subtitle TEXT,
ADD COLUMN IF NOT EXISTS app_logo TEXT,
ADD COLUMN IF NOT EXISTS accent_color TEXT;
