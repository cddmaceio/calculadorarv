-- Corrigir duplicação de KPI EFC para Ajudante de Armazém
-- Remover o EFC "Geral" pois já existe específico para cada turno

DELETE FROM kpis 
WHERE nome_kpi = 'EFC' 
  AND funcao_kpi = 'Ajudante de Armazém' 
  AND turno_kpi = 'Geral';