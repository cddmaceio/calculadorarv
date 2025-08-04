import z from "zod";

// Activity schema
export const ActivitySchema = z.object({
  id: z.number().optional(),
  nome_atividade: z.string().min(1, "Nome da atividade é obrigatório"),
  nivel_atividade: z.string().min(1, "Nível da atividade é obrigatório"),
  valor_atividade: z.number().min(0, "Valor deve ser maior que zero"),
  produtividade_minima: z.number().min(0).optional(),
  unidade_medida: z.string().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type ActivityType = z.infer<typeof ActivitySchema>;

// KPI schema
export const KPISchema = z.object({
  id: z.number().optional(),
  nome_kpi: z.string().min(1, "Nome do KPI é obrigatório"),
  valor_meta_kpi: z.number().min(0, "Meta deve ser maior que zero"),
  peso_kpi: z.number().min(0, "Peso deve ser maior que zero"),
  turno_kpi: z.enum(["Manhã", "Tarde", "Noite", "Geral"]),
  funcao_kpi: z.string().min(1, "Função é obrigatória"),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type KPIType = z.infer<typeof KPISchema>;

// Multiple activities schema for Ajudantes de Armazém
export const MultipleActivitySchema = z.object({
  nome_atividade: z.string().min(1, "Nome da atividade é obrigatório"),
  quantidade_produzida: z.number().min(0, "Quantidade deve ser maior que zero"),
  tempo_horas: z.number().min(0.1, "Tempo deve ser maior que 0.1 horas"),
});

export type MultipleActivityType = z.infer<typeof MultipleActivitySchema>;

// Valid tasks schema for Operador de Empilhadeira
export const ValidTaskSchema = z.object({
  tipo: z.string(),
  meta_segundos: z.number(),
  tempo_execucao_segundos: z.number(),
  valida: z.boolean(),
});

export type ValidTaskType = z.infer<typeof ValidTaskSchema>;

// Calculator input schema
export const CalculatorInputSchema = z.object({
  nome_atividade: z.string().optional(),
  funcao: z.string().min(1, "Função é obrigatória"),
  turno: z.enum(["Manhã", "Tarde", "Noite"]),
  quantidade_produzida: z.number().optional(),
  tempo_horas: z.number().optional(),
  input_adicional: z.number().optional(),
  kpis_atingidos: z.array(z.string()).optional(),
  // Multiple activities for Ajudantes de Armazém
  multiple_activities: z.array(MultipleActivitySchema).optional(),
  // Valid tasks for Operador de Empilhadeira
  nome_operador: z.string().optional(),
  valid_tasks_count: z.number().optional(),
  // Month selection for KPI calculation
  mes_referencia: z.number().min(1).max(12).optional(),
});

export type CalculatorInputType = z.infer<typeof CalculatorInputSchema>;

// Calculator result schema
export const CalculatorResultSchema = z.object({
  subtotal_atividades: z.number(),
  bonus_kpis: z.number(),
  remuneracao_total: z.number(),
  kpis_atingidos: z.array(z.string()),
  produtividade_alcancada: z.number().optional(),
  nivel_atingido: z.string().optional(),
  unidade_medida: z.string().optional(),
  // Multiple activities details
  atividades_detalhes: z.array(z.object({
    nome: z.string(),
    produtividade: z.number(),
    nivel: z.string(),
    valor_total: z.number(),
    unidade: z.string(),
  })).optional(),
  // Valid tasks details
  tarefas_validas: z.number().optional(),
  valor_tarefas: z.number().optional(),
  // KPI calculation details
  mes_referencia: z.number().optional(),
  dias_uteis: z.number().optional(),
  valor_kpi_unitario: z.number().optional(),
});

export type CalculatorResultType = z.infer<typeof CalculatorResultSchema>;

// User schema
export const UserSchema = z.object({
  id: z.number().optional(),
  cpf: z.string().min(11, "CPF deve ter 11 dígitos").max(11, "CPF deve ter 11 dígitos"),
  nome: z.string().min(1, "Nome é obrigatório"),
  funcao: z.string().min(1, "Função é obrigatória"),
  turno: z.enum(["Manhã", "Tarde", "Noite"]),
  perfil: z.enum(["Operador", "Supervisor"]).default("Operador"),
  ativo: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type UserType = z.infer<typeof UserSchema>;

// Launch schema
export const LaunchSchema = z.object({
  id: z.number().optional(),
  usuario_id: z.number(),
  usuario_cpf: z.string(),
  usuario_nome: z.string(),
  
  // Calculator data
  nome_atividade: z.string().optional(),
  funcao: z.string(),
  turno: z.enum(["Manhã", "Tarde", "Noite"]),
  quantidade_produzida: z.number().optional(),
  tempo_horas: z.number().optional(),
  input_adicional: z.number().default(0),
  
  // KPIs achieved (JSON array)
  kpis_atingidos: z.array(z.string()).optional(),
  
  // Multiple activities (JSON for Ajudantes de Armazém)
  multiple_activities: z.array(MultipleActivitySchema).optional(),
  
  // Valid tasks (for Operadores de Empilhadeira)
  nome_operador: z.string().optional(),
  valid_tasks_count: z.number().optional(),
  
  // Reference month
  mes_referencia: z.number().optional(),
  
  // Calculated results
  subtotal_atividades: z.number(),
  bonus_kpis: z.number(),
  remuneracao_total: z.number(),
  produtividade_alcancada: z.number().optional(),
  nivel_atingido: z.string().optional(),
  
  // Metadata
  data_lancamento: z.string(),
  created_at: z.string().optional(),
});

export type LaunchType = z.infer<typeof LaunchSchema>;

// Login schema
export const LoginSchema = z.object({
  cpf: z.string().min(11, "CPF deve ter 11 dígitos").max(11, "CPF deve ter 11 dígitos"),
});

export type LoginType = z.infer<typeof LoginSchema>;

// Base RV schema
export const BaseRVSchema = z.object({
  id: z.number().optional(),
  usuario_id: z.number(),
  usuario_cpf: z.string(),
  usuario_nome: z.string(),
  funcao: z.string(),
  turno: z.enum(["Manhã", "Tarde", "Noite"]),
  data_lancamento: z.string(), // Date in YYYY-MM-DD format
  subtotal_atividades: z.number(),
  bonus_kpis: z.number(),
  remuneracao_total: z.number(),
  detalhes_calculo: z.string().optional(), // JSON string with calculation details
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export type BaseRVType = z.infer<typeof BaseRVSchema>;
