-- Rollback Migration 9: Drop base_rv table
DROP INDEX IF EXISTS idx_base_rv_usuario_data;
DROP INDEX IF EXISTS idx_base_rv_data_lancamento;
DROP INDEX IF EXISTS idx_base_rv_usuario_cpf;
DROP TABLE IF EXISTS base_rv;