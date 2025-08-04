-- Migration 9: Create base_rv table for RV launches
CREATE TABLE IF NOT EXISTS base_rv (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  usuario_cpf TEXT NOT NULL,
  usuario_nome TEXT NOT NULL,
  funcao TEXT NOT NULL,
  turno TEXT NOT NULL,
  data_lancamento DATE NOT NULL,
  subtotal_atividades REAL NOT NULL DEFAULT 0,
  bonus_kpis REAL NOT NULL DEFAULT 0,
  remuneracao_total REAL NOT NULL DEFAULT 0,
  detalhes_calculo TEXT, -- JSON with calculation details
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_base_rv_usuario_cpf ON base_rv(usuario_cpf);
CREATE INDEX IF NOT EXISTS idx_base_rv_data_lancamento ON base_rv(data_lancamento);
CREATE INDEX IF NOT EXISTS idx_base_rv_usuario_data ON base_rv(usuario_cpf, data_lancamento);