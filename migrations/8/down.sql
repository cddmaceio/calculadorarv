-- Rollback da migração 8 - Remove tabelas de usuários e lançamentos

DROP INDEX IF EXISTS idx_usuarios_cpf;
DROP INDEX IF EXISTS idx_lancamentos_usuario_cpf;
DROP INDEX IF EXISTS idx_lancamentos_data;
DROP INDEX IF EXISTS idx_lancamentos_usuario_id;

DROP TABLE IF EXISTS lancamentos;
DROP TABLE IF EXISTS usuarios;