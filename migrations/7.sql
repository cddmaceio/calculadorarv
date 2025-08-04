-- Ajustar valores e metas dos KPIs EFC e Ressuprimento
-- EFC: Meta 92%, Valor R$ 2,88
UPDATE kpis SET valor_meta_kpi = 92.0, peso_kpi = 2.88 WHERE nome_kpi = 'EFC';

-- Ressuprimento: Meta 100%, Valor R$ 3,00
UPDATE kpis SET valor_meta_kpi = 100.0, peso_kpi = 3.00 WHERE nome_kpi = 'Ressuprimento';