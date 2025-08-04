
-- Adicionar campos para armazenar os limites de produtividade para cada atividade
ALTER TABLE activities ADD COLUMN produtividade_minima REAL DEFAULT 0;
ALTER TABLE activities ADD COLUMN unidade_medida TEXT DEFAULT 'unidades';
