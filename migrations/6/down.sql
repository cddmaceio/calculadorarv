-- Remover os KPIs adicionados na migração 6
DELETE FROM kpis WHERE nome_kpi IN ('TMA', 'EFC', 'EFD', 'Ressuprimento', 'Maria Mole');