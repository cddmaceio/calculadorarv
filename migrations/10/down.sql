-- Rollback Migration 10: Remove perfil field from usuarios table

-- Drop the index first
DROP INDEX IF EXISTS idx_usuarios_perfil;

-- Remove the perfil column
ALTER TABLE usuarios DROP COLUMN perfil;