
-- Inserir todas as atividades baseadas na tabela fornecida
INSERT INTO activities (nome_atividade, nivel_atividade, valor_atividade, created_at, updated_at) VALUES

-- Prod Repack cxs/h
('Prod Repack', 'Nível 1 (0 cxs/h)', 0.05, datetime('now'), datetime('now')),
('Prod Repack', 'Nível 2 (14,2 cxs/h)', 0.08, datetime('now'), datetime('now')),
('Prod Repack', 'Nível 3 (17,8 cxs/h)', 0.10, datetime('now'), datetime('now')),
('Prod Repack', 'Nível 4 (24,75 cxs/h)', 0.12, datetime('now'), datetime('now')),
('Prod Repack', 'Nível 5 (28 cxs/h)', 0.13, datetime('now'), datetime('now')),

-- Prod Retrabalho plt/h
('Prod Retrabalho', 'Nível 1 (0 plt/h)', 0.10, datetime('now'), datetime('now')),
('Prod Retrabalho', 'Nível 2 (1,5 plt/h)', 0.15, datetime('now'), datetime('now')),
('Prod Retrabalho', 'Nível 3 (3 plt/h)', 0.20, datetime('now'), datetime('now')),
('Prod Retrabalho', 'Nível 4 (5 plt/h)', 0.25, datetime('now'), datetime('now')),
('Prod Retrabalho', 'Nível 5 (6 plt/h)', 0.35, datetime('now'), datetime('now')),

-- Prod Amarração plt/h
('Prod Amarração', 'Nível 1 (0 plt/h)', 0.20, datetime('now'), datetime('now')),
('Prod Amarração', 'Nível 2 (12 plt/h)', 0.24, datetime('now'), datetime('now')),
('Prod Amarração', 'Nível 3 (16 plt/h)', 0.35, datetime('now'), datetime('now')),
('Prod Amarração', 'Nível 4 (18 plt/h)', 0.40, datetime('now'), datetime('now')),
('Prod Amarração', 'Nível 5 (20 plt/h)', 0.50, datetime('now'), datetime('now')),

-- Prod Devolução cxs/h
('Prod Devolução', 'Nível 1 (0 cxs/h)', 0.010, datetime('now'), datetime('now')),
('Prod Devolução', 'Nível 2 (200 cxs/h)', 0.009, datetime('now'), datetime('now')),
('Prod Devolução', 'Nível 3 (500 cxs/h)', 0.004, datetime('now'), datetime('now')),
('Prod Devolução', 'Nível 4 (900 cxs/h)', 0.005, datetime('now'), datetime('now')),
('Prod Devolução', 'Nível 5 (1000 cxs/h)', 0.010, datetime('now'), datetime('now')),

-- Prod Retorno plt/h
('Prod Retorno', 'Nível 1 (1 plt/h)', 0.05, datetime('now'), datetime('now')),
('Prod Retorno', 'Nível 2 (3 plt/h)', 0.10, datetime('now'), datetime('now')),
('Prod Retorno', 'Nível 3 (5 plt/h)', 0.14, datetime('now'), datetime('now')),
('Prod Retorno', 'Nível 4 (8 plt/h)', 0.15, datetime('now'), datetime('now')),
('Prod Retorno', 'Nível 5 (20 plt/h)', 0.16, datetime('now'), datetime('now')),

-- Prod Refugo plt/h
('Prod Refugo', 'Nível 1 (0 plt/h)', 0.75, datetime('now'), datetime('now')),
('Prod Refugo', 'Nível 2 (1,5 plt/h)', 0.75, datetime('now'), datetime('now')),
('Prod Refugo', 'Nível 3 (3 plt/h)', 0.75, datetime('now'), datetime('now')),
('Prod Refugo', 'Nível 4 (4,5 plt/h)', 0.75, datetime('now'), datetime('now')),
('Prod Refugo', 'Nível 5 (6 plt/h)', 0.75, datetime('now'), datetime('now')),

-- Prod Blocagem Repack cxs/h
('Prod Blocagem Repack', 'Nível 1 (0,0 cxs/h)', 0.0100, datetime('now'), datetime('now')),
('Prod Blocagem Repack', 'Nível 2 (200,0 cxs/h)', 0.0500, datetime('now'), datetime('now')),
('Prod Blocagem Repack', 'Nível 3 (500,0 cxs/h)', 0.0600, datetime('now'), datetime('now')),
('Prod Blocagem Repack', 'Nível 4 (900,0 cxs/h)', 0.0700, datetime('now'), datetime('now')),
('Prod Blocagem Repack', 'Nível 5 (1000,0 cxs/h)', 0.0800, datetime('now'), datetime('now'));
