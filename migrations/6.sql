-- Adicionar novos KPIs específicos por função e turno
-- TMA se Aplica a Todos Operadores de Empilhadeira
INSERT INTO kpis (nome_kpi, funcao_kpi, turno_kpi, valor_meta_kpi, peso_kpi) VALUES
('TMA', 'Operador de Empilhadeira', 'Manhã', 95.0, 15.00),
('TMA', 'Operador de Empilhadeira', 'Tarde', 95.0, 15.00),
('TMA', 'Operador de Empilhadeira', 'Noite', 95.0, 15.00);

-- EFC se Aplica para Operadores de Empilhadeira do Turno C e Todos Ajudantes de Armazém
INSERT INTO kpis (nome_kpi, funcao_kpi, turno_kpi, valor_meta_kpi, peso_kpi) VALUES
('EFC', 'Operador de Empilhadeira', 'Noite', 90.0, 12.00),
('EFC', 'Ajudante de Armazém', 'Manhã', 90.0, 12.00),
('EFC', 'Ajudante de Armazém', 'Tarde', 90.0, 12.00),
('EFC', 'Ajudante de Armazém', 'Noite', 90.0, 12.00);

-- EFD Para Operadores de Empilhadeira do Turno B
INSERT INTO kpis (nome_kpi, funcao_kpi, turno_kpi, valor_meta_kpi, peso_kpi) VALUES
('EFD', 'Operador de Empilhadeira', 'Tarde', 85.0, 10.00);

-- Ressuprimento Para Operadores do Turno A e Ajudantes de Armazém do turno A
INSERT INTO kpis (nome_kpi, funcao_kpi, turno_kpi, valor_meta_kpi, peso_kpi) VALUES
('Ressuprimento', 'Operador de Empilhadeira', 'Manhã', 92.0, 8.00),
('Ressuprimento', 'Ajudante de Armazém', 'Manhã', 92.0, 8.00);

-- Maria Mole Ajudantes de Armazém do turno B
INSERT INTO kpis (nome_kpi, funcao_kpi, turno_kpi, valor_meta_kpi, peso_kpi) VALUES
('Maria Mole', 'Ajudante de Armazém', 'Tarde', 88.0, 6.00);