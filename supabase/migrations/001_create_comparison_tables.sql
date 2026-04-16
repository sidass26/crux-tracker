-- Migration: Create aggregate page type comparison tables
-- Run this in the Supabase SQL Editor

-- Page type grouping (e.g., "City Pages", "Collection Pages")
CREATE TABLE page_types (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Brand within a page type (e.g., "Headout" under "City Pages")
CREATE TABLE page_type_brands (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_type_id UUID NOT NULL REFERENCES page_types(id) ON DELETE CASCADE,
  brand_name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Individual URLs under a brand
CREATE TABLE page_type_urls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_type_brand_id UUID NOT NULL REFERENCES page_type_brands(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Snapshots for comparison URLs (separate from keyword-group crux_snapshots)
CREATE TABLE comparison_snapshots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  page_type_url_id UUID NOT NULL REFERENCES page_type_urls(id) ON DELETE CASCADE,
  form_factor TEXT NOT NULL CHECK (form_factor IN ('PHONE', 'DESKTOP')),
  fetched_at TIMESTAMPTZ DEFAULT now(),
  raw_json JSONB NOT NULL
);

-- Index for fast lookup of latest snapshot per URL+form_factor
CREATE INDEX idx_comparison_snapshots_url_ff
  ON comparison_snapshots(page_type_url_id, form_factor, fetched_at DESC);
