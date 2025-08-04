-- Reverter ajustes dos KPIs EFC e Ressuprimento para valores originais
-- EFC: Meta 90%, Valor R$ 12,00 (valores originais da migração 6)
UPDATE kpis SET valor_meta_kpi = 90.0, peso_kpi = 12.00 WHERE nome_kpi = 'EFC';

-- Ressuprimento: Meta 92%, Valor R$ 8,00 (valores originais da migração 6)
UPDATE kpis SET valor_meta_kpi = 92.0, peso_kpi = 8.00 WHERE nome_kpi = 'Ressuprimento';