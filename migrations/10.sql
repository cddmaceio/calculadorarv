-- Migration 10: Add perfil field to usuarios table
-- This migration adds a perfil field to distinguish between regular users and supervisors

ALTER TABLE usuarios ADD COLUMN perfil TEXT DEFAULT 'Operador' CHECK (perfil IN ('Operador', 'Supervisor'));

-- Update existing users to have 'Operador' profile by default
UPDATE usuarios SET perfil = 'Operador' WHERE perfil IS NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_usuarios_perfil ON usuarios(perfil);