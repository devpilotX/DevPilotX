-- Migration: Expand thumbnail column to support SVG data URIs
-- Run this once on your live database.
ALTER TABLE articles MODIFY COLUMN thumbnail TEXT DEFAULT NULL;
