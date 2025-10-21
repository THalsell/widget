-- ========================================
-- Authentication System Migration
-- Run this in Supabase SQL Editor
-- ========================================

-- Create users table
CREATE TABLE IF NOT EXISTS "users" (
    "id" TEXT NOT NULL PRIMARY KEY,  -- Matches Supabase Auth user ID
    "email" TEXT NOT NULL UNIQUE,
    "name" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create organizations table
CREATE TABLE IF NOT EXISTS "organizations" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL UNIQUE,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create user_organizations join table
CREATE TABLE IF NOT EXISTS "user_organizations" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'admin',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "user_organizations_userId_fkey" FOREIGN KEY ("userId")
        REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_organizations_organizationId_fkey" FOREIGN KEY ("organizationId")
        REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "user_organizations_userId_organizationId_key" UNIQUE ("userId", "organizationId")
);

-- Add organizationId to widget_configs
ALTER TABLE "widget_configs"
ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

-- Add foreign key constraint for organizationId
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints
        WHERE constraint_name = 'widget_configs_organizationId_fkey'
    ) THEN
        ALTER TABLE "widget_configs"
        ADD CONSTRAINT "widget_configs_organizationId_fkey"
        FOREIGN KEY ("organizationId")
        REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

-- Create indexes
CREATE INDEX IF NOT EXISTS "organizations_slug_idx" ON "organizations"("slug");
CREATE INDEX IF NOT EXISTS "user_organizations_userId_idx" ON "user_organizations"("userId");
CREATE INDEX IF NOT EXISTS "user_organizations_organizationId_idx" ON "user_organizations"("organizationId");
CREATE INDEX IF NOT EXISTS "widget_configs_organizationId_idx" ON "widget_configs"("organizationId");

-- ========================================
-- Migration complete!
-- ========================================
