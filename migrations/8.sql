-- Criação das tabelas para sistema de usuários e lançamentos

-- Tabela de usuários
CREATE TABLE usuarios (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cpf TEXT UNIQUE NOT NULL,
  nome TEXT NOT NULL,
  funcao TEXT NOT NULL,
  turno TEXT NOT NULL,
  ativo BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de lançamentos
CREATE TABLE lancamentos (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  usuario_id INTEGER NOT NULL,
  usuario_cpf TEXT NOT NULL,
  usuario_nome TEXT NOT NULL,
  
  -- Dados da calculadora
  nome_atividade TEXT,
  funcao TEXT NOT NULL,
  turno TEXT NOT NULL,
  quantidade_produzida REAL,
  tempo_horas REAL,
  input_adicional REAL DEFAULT 0,
  
  -- KPIs atingidos (JSON array)
  kpis_atingidos TEXT, -- JSON array de strings
  
  -- Atividades múltiplas (JSON para Ajudantes de Armazém)
  multiple_activities TEXT, -- JSON array
  
  -- Tarefas válidas (para Operadores de Empilhadeira)
  nome_operador TEXT,
  valid_tasks_count INTEGER,
  
  -- Mês de referência
  mes_referencia INTEGER,
  
  -- Resultados calculados
  subtotal_atividades REAL NOT NULL,
  bonus_kpis REAL NOT NULL,
  remuneracao_total REAL NOT NULL,
  produtividade_alcancada REAL,
  nivel_atingido TEXT,
  
  -- Metadados
  data_lancamento DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Índices para performance
CREATE INDEX idx_lancamentos_usuario_id ON lancamentos(usuario_id);
CREATE INDEX idx_lancamentos_data ON lancamentos(data_lancamento);
CREATE INDEX idx_lancamentos_usuario_cpf ON lancamentos(usuario_cpf);
CREATE INDEX idx_usuarios_cpf ON usuarios(cpf);