-- Rollback: Restaurar o KPI EFC Geral para Ajudante de Armazém

INSERT INTO kpis (nome_kpi, funcao_kpi, turno_kpi, valor_meta_kpi, peso_kpi) 
VALUES ('EFC', 'Ajudante de Armazém', 'Geral', 92.0, 2.88);