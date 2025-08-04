// Mock data para desenvolvimento
export const mockFunctions = [
  'Operador de Empilhadeira',
  'Conferente',
  'Ajudante de Armazém',
  'Supervisor',
  'Analista de Logística'
];

export const mockActivityNames = [
  'Separação de Pedidos',
  'Conferência de Estoque',
  'Movimentação de Pallets',
  'Organização de Produtos',
  'Controle de Qualidade',
  'Expedição',
  'Recebimento',
  'Inventário'
];

export const mockKPIs = [
  {
    id: 1,
    nome_kpi: 'Pontualidade',
    valor_meta_kpi: 95,
    peso_kpi: 1,
    turno_kpi: 'Manhã' as const,
    funcao_kpi: 'Operador de Empilhadeira'
  },
  {
    id: 2,
    nome_kpi: 'Qualidade',
    valor_meta_kpi: 98,
    peso_kpi: 2,
    turno_kpi: 'Manhã' as const,
    funcao_kpi: 'Operador de Empilhadeira'
  },
  {
    id: 3,
    nome_kpi: 'Segurança',
    valor_meta_kpi: 100,
    peso_kpi: 3,
    turno_kpi: 'Geral' as const,
    funcao_kpi: 'Ajudante de Armazém'
  },
  {
    id: 4,
    nome_kpi: 'Produtividade',
    valor_meta_kpi: 90,
    peso_kpi: 2,
    turno_kpi: 'Tarde' as const,
    funcao_kpi: 'Operador de Empilhadeira'
  },
  {
    id: 5,
    nome_kpi: 'Organização',
    valor_meta_kpi: 85,
    peso_kpi: 1,
    turno_kpi: 'Noite' as const,
    funcao_kpi: 'Ajudante de Armazém'
  }
];

export const mockCalculationResult = {
  subtotal_atividades: 150.00,
  bonus_kpis: 50.00,
  remuneracao_total: 200.00,
  produtividade_alcancada: 85.5,
  nivel_atingido: 'Nível 2',
  unidade_medida: 'cxs/h',
  tarefas_validas: 45,
  valor_tarefas: 90.00,
  kpis_atingidos: ['Produtividade Diária', 'Pontualidade'],
  atividades_detalhes: [
    {
      nome: 'Separação de Pedidos',
      produtividade: 85.5,
      nivel: 'Nível 2',
      valor_total: 150.00,
      unidade: 'cxs/h'
    }
  ]
};

export const mockUserHistory = [
  {
    id: 1,
    data_lancamento: '2024-01-15',
    funcao: 'Operador de Empilhadeira',
    turno: 'Manhã',
    subtotal_atividades: 180.00,
    bonus_kpis: 60.00,
    remuneracao_total: 240.00,
    created_at: '2024-01-15T10:30:00Z',
    detalhes_calculo: JSON.stringify({
      atividades: [
        {
          nome: 'Movimentação de Pallets',
          produtividade: 92.3,
          nivel: 'Nível 3',
          valor_total: 180.00
        }
      ],
      kpis_atingidos: ['Produtividade Diária', 'Qualidade'],
      produtividade_alcancada: 92.3,
      nivel_atingido: 'Nível 3',
      tarefas_validas: 0,
      valor_tarefas: 0,
      input_adicional: 0
    })
  },
  {
    id: 2,
    data_lancamento: '2024-01-14',
    funcao: 'Conferente',
    turno: 'Tarde',
    subtotal_atividades: 120.00,
    bonus_kpis: 30.00,
    remuneracao_total: 150.00,
    created_at: '2024-01-14T16:45:00Z',
    detalhes_calculo: JSON.stringify({
      atividades: [
        {
          nome: 'Conferência de Estoque',
          produtividade: 78.5,
          nivel: 'Nível 2',
          valor_total: 120.00
        }
      ],
      kpis_atingidos: ['Qualidade'],
      produtividade_alcancada: 78.5,
      nivel_atingido: 'Nível 2',
      tarefas_validas: 35,
      valor_tarefas: 70.00,
      input_adicional: 0
    })
  }
];