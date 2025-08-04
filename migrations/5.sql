
-- Inserir algumas funções exemplo para os KPIs
INSERT INTO kpis (nome_kpi, valor_meta_kpi, peso_kpi, turno_kpi, funcao_kpi, created_at, updated_at) VALUES
('Produtividade Geral', 95.0, 15.00, 'Geral', 'Operador de Logística', datetime('now'), datetime('now')),
('Acuracidade', 99.5, 10.00, 'Geral', 'Separador', datetime('now'), datetime('now')),
('Tempo de Ciclo', 8.0, 12.00, 'Manhã', 'Conferente', datetime('now'), datetime('now')),
('Qualidade', 98.0, 8.00, 'Tarde', 'Operador de Empilhadeira', datetime('now'), datetime('now'));
