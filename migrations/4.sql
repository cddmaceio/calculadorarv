
-- Atualizar as atividades com os valores de produtividade mínima corretos
UPDATE activities SET produtividade_minima = 0, unidade_medida = 'cxs/h' WHERE nome_atividade = 'Prod Repack' AND nivel_atividade = 'Nível 1 (0 cxs/h)';
UPDATE activities SET produtividade_minima = 14.2, unidade_medida = 'cxs/h' WHERE nome_atividade = 'Prod Repack' AND nivel_atividade = 'Nível 2 (14,2 cxs/h)';
UPDATE activities SET produtividade_minima = 17.8, unidade_medida = 'cxs/h' WHERE nome_atividade = 'Prod Repack' AND nivel_atividade = 'Nível 3 (17,8 cxs/h)';
UPDATE activities SET produtividade_minima = 24.75, unidade_medida = 'cxs/h' WHERE nome_atividade = 'Prod Repack' AND nivel_atividade = 'Nível 4 (24,75 cxs/h)';
UPDATE activities SET produtividade_minima = 28, unidade_medida = 'cxs/h' WHERE nome_atividade = 'Prod Repack' AND nivel_atividade = 'Nível 5 (28 cxs/h)';

UPDATE activities SET produtividade_minima = 0, unidade_medida = 'plt/h' WHERE nome_atividade = 'Prod Retrabalho' AND nivel_atividade = 'Nível 1 (0 plt/h)';
UPDATE activities SET produtividade_minima = 1.5, unidade_medida = 'plt/h' WHERE nome_atividade = 'Prod Retrabalho' AND nivel_atividade = 'Nível 2 (1,5 plt/h)';
UPDATE activities SET produtividade_minima = 3, unidade_medida = 'plt/h' WHERE nome_atividade = 'Prod Retrabalho' AND nivel_atividade = 'Nível 3 (3 plt/h)';
UPDATE activities SET produtividade_minima = 5, unidade_medida = 'plt/h' WHERE nome_atividade = 'Prod Retrabalho' AND nivel_atividade = 'Nível 4 (5 plt/h)';
UPDATE activities SET produtividade_minima = 6, unidade_medida = 'plt/h' WHERE nome_atividade = 'Prod Retrabalho' AND nivel_atividade = 'Nível 5 (6 plt/h)';

UPDATE activities SET produtividade_minima = 0, unidade_medida = 'plt/h' WHERE nome_atividade = 'Prod Amarração' AND nivel_atividade = 'Nível 1 (0 plt/h)';
UPDATE activities SET produtividade_minima = 12, unidade_medida = 'plt/h' WHERE nome_atividade = 'Prod Amarração' AND nivel_atividade = 'Nível 2 (12 plt/h)';
UPDATE activities SET produtividade_minima = 16, unidade_medida = 'plt/h' WHERE nome_atividade = 'Prod Amarração' AND nivel_atividade = 'Nível 3 (16 plt/h)';
UPDATE activities SET produtividade_minima = 18, unidade_medida = 'plt/h' WHERE nome_atividade = 'Prod Amarração' AND nivel_atividade = 'Nível 4 (18 plt/h)';
UPDATE activities SET produtividade_minima = 20, unidade_medida = 'plt/h' WHERE nome_atividade = 'Prod Amarração' AND nivel_atividade = 'Nível 5 (20 plt/h)';

UPDATE activities SET produtividade_minima = 0, unidade_medida = 'cxs/h' WHERE nome_atividade = 'Prod Devolução' AND nivel_atividade = 'Nível 1 (0 cxs/h)';
UPDATE activities SET produtividade_minima = 200, unidade_medida = 'cxs/h' WHERE nome_atividade = 'Prod Devolução' AND nivel_atividade = 'Nível 2 (200 cxs/h)';
UPDATE activities SET produtividade_minima = 500, unidade_medida = 'cxs/h' WHERE nome_atividade = 'Prod Devolução' AND nivel_atividade = 'Nível 3 (500 cxs/h)';
UPDATE activities SET produtividade_minima = 900, unidade_medida = 'cxs/h' WHERE nome_atividade = 'Prod Devolução' AND nivel_atividade = 'Nível 4 (900 cxs/h)';
UPDATE activities SET produtividade_minima = 1000, unidade_medida = 'cxs/h' WHERE nome_atividade = 'Prod Devolução' AND nivel_atividade = 'Nível 5 (1000 cxs/h)';

UPDATE activities SET produtividade_minima = 1, unidade_medida = 'plt/h' WHERE nome_atividade = 'Prod Retorno' AND nivel_atividade = 'Nível 1 (1 plt/h)';
UPDATE activities SET produtividade_minima = 3, unidade_medida = 'plt/h' WHERE nome_atividade = 'Prod Retorno' AND nivel_atividade = 'Nível 2 (3 plt/h)';
UPDATE activities SET produtividade_minima = 5, unidade_medida = 'plt/h' WHERE nome_atividade = 'Prod Retorno' AND nivel_atividade = 'Nível 3 (5 plt/h)';
UPDATE activities SET produtividade_minima = 8, unidade_medida = 'plt/h' WHERE nome_atividade = 'Prod Retorno' AND nivel_atividade = 'Nível 4 (8 plt/h)';
UPDATE activities SET produtividade_minima = 20, unidade_medida = 'plt/h' WHERE nome_atividade = 'Prod Retorno' AND nivel_atividade = 'Nível 5 (20 plt/h)';

UPDATE activities SET produtividade_minima = 0, unidade_medida = 'plt/h' WHERE nome_atividade = 'Prod Refugo' AND nivel_atividade = 'Nível 1 (0 plt/h)';
UPDATE activities SET produtividade_minima = 1.5, unidade_medida = 'plt/h' WHERE nome_atividade = 'Prod Refugo' AND nivel_atividade = 'Nível 2 (1,5 plt/h)';
UPDATE activities SET produtividade_minima = 3, unidade_medida = 'plt/h' WHERE nome_atividade = 'Prod Refugo' AND nivel_atividade = 'Nível 3 (3 plt/h)';
UPDATE activities SET produtividade_minima = 4.5, unidade_medida = 'plt/h' WHERE nome_atividade = 'Prod Refugo' AND nivel_atividade = 'Nível 4 (4,5 plt/h)';
UPDATE activities SET produtividade_minima = 6, unidade_medida = 'plt/h' WHERE nome_atividade = 'Prod Refugo' AND nivel_atividade = 'Nível 5 (6 plt/h)';

UPDATE activities SET produtividade_minima = 0, unidade_medida = 'cxs/h' WHERE nome_atividade = 'Prod Blocagem Repack' AND nivel_atividade = 'Nível 1 (0,0 cxs/h)';
UPDATE activities SET produtividade_minima = 200, unidade_medida = 'cxs/h' WHERE nome_atividade = 'Prod Blocagem Repack' AND nivel_atividade = 'Nível 2 (200,0 cxs/h)';
UPDATE activities SET produtividade_minima = 500, unidade_medida = 'cxs/h' WHERE nome_atividade = 'Prod Blocagem Repack' AND nivel_atividade = 'Nível 3 (500,0 cxs/h)';
UPDATE activities SET produtividade_minima = 900, unidade_medida = 'cxs/h' WHERE nome_atividade = 'Prod Blocagem Repack' AND nivel_atividade = 'Nível 4 (900,0 cxs/h)';
UPDATE activities SET produtividade_minima = 1000, unidade_medida = 'cxs/h' WHERE nome_atividade = 'Prod Blocagem Repack' AND nivel_atividade = 'Nível 5 (1000,0 cxs/h)';
