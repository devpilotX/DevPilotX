-- Migration: Add focus_keyword column to articles table
-- Run this on your live database once
ALTER TABLE articles ADD COLUMN focus_keyword VARCHAR(100) DEFAULT NULL AFTER meta_description;
