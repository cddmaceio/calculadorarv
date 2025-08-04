import { useState, useEffect } from 'react';
import { Calculator, TrendingUp, Link as LinkIcon, CheckCircle, Plus, Trash2, Play, LogOut, User } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/react-app/components/Card';
import { Button } from '@/react-app/components/Button';
import { Input } from '@/react-app/components/Input';
import { Select } from '@/react-app/components/Select';
import { Alert, AlertDescription, AlertTitle } from '@/react-app/components/Alert';
import { FileUpload } from '@/react-app/components/FileUpload';
import { useActivityNames, useFunctions, useCalculator } from '@/react-app/hooks/useApi';
import { CalculatorInputType, KPIType, MultipleActivityType } from '@/shared/types';
import { parseCSV, calculateValidTasks } from '@/react-app/utils/taskProcessor';
import { FileDataCache, OperatorHistoryCache, clearAllCache, generateFileHash } from '@/react-app/utils/dataCache';
import { useUser } from '@/react-app/contexts/UserContext';

export default function Home() {
  const { user, logout } = useUser();
  const { activityNames, loading: activityNamesLoading } = useActivityNames();
  const { functions, loading: functionsLoading } = useFunctions();
  const { result, loading: calculating, error, calculate } = useCalculator();

  const [availableKPIs, setAvailableKPIs] = useState<KPIType[]>([]);
  const [selectedKPIs, setSelectedKPIs] = useState<string[]>([]);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [validTasksCount, setValidTasksCount] = useState<number>(0);
  const [validTasksDetails, setValidTasksDetails] = useState<any[]>([]);
  const [processingTasks, setProcessingTasks] = useState<boolean>(false);
  const [uniqueOperators, setUniqueOperators] = useState<string[]>([]);
  const [fileHash, setFileHash] = useState<string>('');
  const [operatorHistory, setOperatorHistory] = useState<string[]>([]);
  const [debugMode, setDebugMode] = useState<boolean>(false);
  
  // RV Launch states
  const [launchDate, setLaunchDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [launching, setLaunching] = useState<boolean>(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'calculator' | 'history'>('calculator');
  const [userHistory, setUserHistory] = useState<any[]>([]);
  const [historyMonthFilter, setHistoryMonthFilter] = useState('');
  const [filteredHistory, setFilteredHistory] = useState<any[]>([]);
  const [historyTotal, setHistoryTotal] = useState(0);

  // Multiple activities for Ajudantes de Armazém
  const [multipleActivities, setMultipleActivities] = useState<MultipleActivityType[]>([
    { nome_atividade: '', quantidade_produzida: 0, tempo_horas: 0 }
  ]);

  const [formData, setFormData] = useState<CalculatorInputType>({
    nome_atividade: '',
    funcao: '',
    turno: 'Manhã',
    quantidade_produzida: 0,
    tempo_horas: 0,
    input_adicional: 0,
    nome_operador: '',
    mes_referencia: new Date().getMonth() + 1, // Mês atual como padrão
  });

  const isAjudanteArmazem = formData.funcao === 'Ajudante de Armazém';
  const isOperadorEmpilhadeira = formData.funcao === 'Operador de Empilhadeira';

  // Available operators list - combining static list, history, and file operators
  const staticOperators = [
    'ERCILIO AUGUSTO DE SOUSA',
    'LUCAS PATRICK FERREIRA DA SILV',
    'ALMIR VICTOR ALENCAR DA ROCHA',
    'JOSE WILSON FRANKLIM PEREIRA',
    'ERIVALDO FERREIRA DA SILVA',
    'JAMERSON FRANCISCO DA SILVA',
    'ALLYSSON ARAUJO DE LIMA',
    'MURILO LUCAS DA SILVA',
    'DILSON ARLINDO DOS SANTOS',
    'Paulo Ursulino da Silva neto'
  ];
  
  // Combine all operator sources and remove duplicates
  // const availableOperators = [
  //   ...new Set([
  //     ...uniqueOperators, // Operators from uploaded file (priority)
  //     ...operatorHistory, // Recently used operators
  //     ...staticOperators  // Static fallback list
  //   ])
  // ].filter(Boolean);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.funcao) return;

    const submitData: CalculatorInputType = {
      ...formData,
      kpis_atingidos: selectedKPIs,
    };

    if (isAjudanteArmazem) {
      // Validate multiple activities
      const validActivities = multipleActivities.filter(
        act => act.nome_atividade && act.quantidade_produzida > 0 && act.tempo_horas > 0
      );
      if (validActivities.length === 0) return;
      submitData.multiple_activities = validActivities;
    } else if (isOperadorEmpilhadeira) {
      // For Operador de Empilhadeira, include valid tasks count
      submitData.valid_tasks_count = validTasksCount;
      submitData.nome_operador = formData.nome_operador;
    } else {
      // Single activity validation
      if (!formData.nome_atividade || formData.quantidade_produzida! <= 0 || formData.tempo_horas! <= 0) return;
    }

    calculate(submitData);
  };

  const handleInputChange = (field: keyof CalculatorInputType, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    
    // Reset KPIs and activities when function or shift changes
    if (field === 'funcao' || field === 'turno') {
      setSelectedKPIs([]);
      if (field === 'funcao') {
        setMultipleActivities([{ nome_atividade: '', quantidade_produzida: 0, tempo_horas: 0 }]);
        setUploadedFile(null);
        setValidTasksCount(0);
        setValidTasksDetails([]);
      }
    }
    
    // Reset valid tasks count when operator name changes
    if (field === 'nome_operador') {
      setValidTasksCount(0);
      setValidTasksDetails([]);
    }
  };

  const addActivity = () => {
    setMultipleActivities(prev => [
      ...prev,
      { nome_atividade: '', quantidade_produzida: 0, tempo_horas: 0 }
    ]);
  };

  const removeActivity = (index: number) => {
    setMultipleActivities(prev => prev.filter((_, i) => i !== index));
  };

  const updateActivity = (index: number, field: keyof MultipleActivityType, value: string | number) => {
    setMultipleActivities(prev => prev.map((act, i) => 
      i === index ? { ...act, [field]: value } : act
    ));
  };

  const handleFileUpload = async (file: File) => {
    console.log('📁 Arquivo carregado:', file.name, 'Tamanho:', (file.size / 1024).toFixed(1), 'KB');
    
    setUploadedFile(file);
    setValidTasksCount(0);
    setValidTasksDetails([]);
    setUniqueOperators([]);
    
    // Gerar hash do arquivo para verificar cache
    try {
      const content = await file.text();
      const hash = generateFileHash(content);
      setFileHash(hash);
      
      // Verificar se já temos dados parseados no cache
      const cached = FileDataCache.get(file.name);
      if (cached && FileDataCache.isValid(cached, hash)) {
        console.log('✅ Arquivo encontrado no cache, extraindo operadores...');
        const operators = [...new Set(cached.parsedTasks.map(t => t.Usuário?.trim()).filter(Boolean))];
        setUniqueOperators(operators);
        console.log('👥 Operadores disponíveis:', operators.length);
      } else {
        console.log('🔄 Arquivo não está no cache, será parseado quando necessário');
      }
    } catch (error) {
      console.error('❌ Erro ao processar arquivo:', error);
      setFileHash('');
    }
  };

  const processTaskFile = async () => {
    if (!uploadedFile || !formData.nome_operador) return;
    
    console.log('🔄 Processando tarefas para operador:', formData.nome_operador);
    setProcessingTasks(true);
    
    try {
      const content = await uploadedFile.text();
      
      // Parse CSV com cache
      const tasks = parseCSV(content, uploadedFile.name);
      
      if (tasks.length === 0) {
        alert('Nenhuma tarefa encontrada no arquivo.');
        return;
      }

      // Extrair operadores únicos se ainda não temos
      if (uniqueOperators.length === 0) {
        const operators = [...new Set(tasks.map(t => t.Usuário?.trim()).filter(Boolean))];
        setUniqueOperators(operators);
        console.log('👥 Operadores únicos encontrados:', operators.length);
      }

      // Calcular tarefas válidas com cache
      const { total, detalhes } = calculateValidTasks(
        tasks, 
        formData.nome_operador,
        uploadedFile.name,
        fileHash
      );
      
      const validTasksCount = total;
      const validTasksDetails = detalhes;
      
      setValidTasksCount(validTasksCount);
      setValidTasksDetails(validTasksDetails);
      
      // Salvar operador no histórico
      OperatorHistoryCache.addOperator(formData.nome_operador);
      
      if (validTasksCount === 0) {
        const operatorsInFile = uniqueOperators.join(', ');
        alert(`Nenhuma tarefa válida encontrada para o operador "${formData.nome_operador}".\n\nOperadores encontrados no arquivo:\n${operatorsInFile}\n\nVerifique se o nome do operador está correto.`);
      } else {
        console.log('✅ Processamento concluído:', validTasksCount, 'tarefas válidas');
      }
    } catch (error) {
      console.error('❌ Erro ao processar arquivo:', error);
      alert('Erro ao processar arquivo: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
      setValidTasksCount(0);
      setValidTasksDetails([]);
    } finally {
      setProcessingTasks(false);
    }
  };

  const handleRemoveFile = () => {
    console.log('🗑️ Removendo arquivo carregado');
    setUploadedFile(null);
    setValidTasksCount(0);
    setValidTasksDetails([]);
    setUniqueOperators([]);
    setFileHash('');
  };

  const handleClearCache = () => {
    clearAllCache();
    setValidTasksCount(0);
    setValidTasksDetails([]);
    alert('Cache limpo com sucesso! Reprocesse o arquivo para aplicar a nova lógica de validação (> 10 segundos).');
  };

  

  const fetchAvailableKPIs = async (funcao: string, turno: string) => {
    if (!funcao || !turno) return;
    
    try {
      const response = await fetch(`/api/kpis/available?funcao=${encodeURIComponent(funcao)}&turno=${encodeURIComponent(turno)}`);
      if (!response.ok) throw new Error('Failed to fetch KPIs');
      const data = await response.json();
      setAvailableKPIs(data);
    } catch (err) {
      console.error('Error fetching KPIs:', err);
      setAvailableKPIs([]);
    }
  };

  const toggleKPI = (kpiName: string) => {
    setSelectedKPIs(prev => 
      prev.includes(kpiName) 
        ? prev.filter(name => name !== kpiName)
        : [...prev, kpiName]
    );
  };

  const fetchUserHistory = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/base_rv?usuario_cpf=${user.cpf}`);
      if (response.ok) {
        const data = await response.json();
        setUserHistory(data || []);
      }
    } catch (error) {
      console.error('Erro ao buscar histórico:', error);
    }
  };

  const handleLaunchRV = async () => {
    if (!result || !user || !launchDate) return;
    
    setLaunching(true);
    
    try {
      console.log('🚀 Iniciando lançamento de RV...');
      console.log('👤 Usuário:', user);
      console.log('📊 Resultado:', result);
      console.log('📅 Data de lançamento:', launchDate);
      
      const launchData = {
        usuario_id: user.id,
        usuario_cpf: user.cpf,
        usuario_nome: user.nome,
        funcao: formData.funcao,
        turno: formData.turno,
        data_lancamento: launchDate,
        subtotal_atividades: result.subtotal_atividades,
        bonus_kpis: result.bonus_kpis,
        remuneracao_total: result.remuneracao_total,
        detalhes_calculo: JSON.stringify({
          atividades: result.atividades_detalhes || [],
          kpis_atingidos: result.kpis_atingidos || [],
          produtividade_alcancada: result.produtividade_alcancada,
          nivel_atingido: result.nivel_atingido,
          tarefas_validas: result.tarefas_validas,
          valor_tarefas: result.valor_tarefas,
          mes_referencia: result.mes_referencia,
          dias_uteis: result.dias_uteis,
          valor_kpi_unitario: result.valor_kpi_unitario,
          input_adicional: formData.input_adicional
        })
      };

      console.log('📦 Dados a serem enviados:', launchData);
      console.log('📝 JSON stringified:', JSON.stringify(launchData));

      const response = await fetch('/api/base_rv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(launchData),
      });

      console.log('📡 Response status:', response.status);
      console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));

      const responseText = await response.text();
      console.log('📄 Response text (raw):', responseText);

      if (!response.ok) {
        let errorData;
        try {
          errorData = JSON.parse(responseText);
        } catch (parseError) {
          console.error('❌ Erro ao fazer parse da resposta de erro:', parseError);
          throw new Error(`Erro HTTP ${response.status}: ${responseText}`);
        }
        throw new Error(errorData.error || 'Erro ao lançar RV');
      }

      let responseData;
      try {
        responseData = JSON.parse(responseText);
        console.log('✅ Response data parsed:', responseData);
      } catch (parseError) {
        console.error('❌ Erro ao fazer parse da resposta de sucesso:', parseError);
        throw new Error('Resposta inválida do servidor');
      }

      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 3000); // Auto-close after 3 seconds
      
      // Recarregar histórico após lançamento bem-sucedido
      fetchUserHistory();
      
    } catch (error) {
      console.error('❌ Erro ao lançar RV:', error);
      alert('Erro ao lançar RV: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    } finally {
      setLaunching(false);
    }
  };

  useEffect(() => {
    if (formData.funcao && formData.turno) {
      fetchAvailableKPIs(formData.funcao, formData.turno);
    }
  }, [formData.funcao, formData.turno]);

  // Load operator history on component mount
  useEffect(() => {
    const history = OperatorHistoryCache.getHistory();
    setOperatorHistory(history);
    if (history.length > 0) {
      console.log('📋 Histórico de operadores carregado:', history.length, 'operadores');
    }
  }, []);

  // Load user history when user changes
  useEffect(() => {
    if (user) {
      fetchUserHistory();
    }
  }, [user]);

  // Filter history by month and calculate total
  useEffect(() => {
    if (!userHistory.length) {
      setFilteredHistory([]);
      setHistoryTotal(0);
      return;
    }

    let filtered = userHistory;
    
    if (historyMonthFilter) {
      filtered = userHistory.filter(item => {
        // Use data_lancamento (launch date) instead of created_at for filtering
        if (!item.data_lancamento) {
          return false;
        }
        
        // Parse the date from the database (format: YYYY-MM-DD)
        const itemDate = new Date(item.data_lancamento + 'T00:00:00.000Z'); // Force UTC to avoid timezone issues
        
        // Parse the filter date (format: YYYY-MM)
        const [filterYear, filterMonth] = historyMonthFilter.split('-');
        const filterDate = new Date(parseInt(filterYear), parseInt(filterMonth) - 1, 1); // Month is 0-indexed
        
        // Check for invalid dates
        if (isNaN(itemDate.getTime()) || isNaN(filterDate.getTime())) {
          return false;
        }
        
        // Compare year and month (using UTC for item date to avoid timezone issues)
        return itemDate.getUTCFullYear() === filterDate.getFullYear() && 
               itemDate.getUTCMonth() === filterDate.getMonth();
      });
    }

    setFilteredHistory(filtered);
    
    // Calculate total
    const total = filtered.reduce((sum, item) => sum + (item.remuneracao_total || 0), 0);
    setHistoryTotal(total);
  }, [userHistory, historyMonthFilter]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Header */}
      <header className="border-b bg-white/70 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center">
                <Calculator className="h-5 w-5 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                LogiBonus
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              {user && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <User className="h-4 w-4" />
                  <span>{user.nome}</span>
                  <span className="text-gray-400">|</span>
                  <span>{user.cpf}</span>
                </div>
              )}
              <div className="flex items-center space-x-2">
                {user?.perfil === 'Supervisor' && (
                  <Link to="/admin">
                    <Button variant="outline" size="sm">
                      <LinkIcon className="h-4 w-4 mr-2" />
                      Painel Admin
                    </Button>
                  </Link>
                )}
                <Button variant="outline" size="sm" onClick={logout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Sair
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              RV Armazém CDD
            </h2>
            <p className="text-lg text-gray-600">
              Calcule sua remuneração diária com base na produção e KPIs atingidos
            </p>
          </div>

          {/* Calculator Form */}
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                <span>RV Armazém CDD</span>
              </CardTitle>
              <CardDescription>
                Calcule sua remuneração diária e visualize seu histórico de lançamentos
              </CardDescription>
              
              {/* Tabs */}
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg mt-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('calculator')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'calculator'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Calculator className="h-4 w-4 inline mr-2" />
                  Calculadora
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('history')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    activeTab === 'history'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <CheckCircle className="h-4 w-4 inline mr-2" />
                  Histórico ({userHistory.length})
                </button>
              </div>
            </CardHeader>
            <CardContent>
              {activeTab === 'calculator' && (
                <div>
                  <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Função</label>
                    <Select
                      value={formData.funcao}
                      onChange={(e) => handleInputChange('funcao', e.target.value)}
                      placeholder="Selecione sua função"
                      disabled={functionsLoading}
                    >
                      {functions.map((func) => (
                        <option key={func.funcao} value={func.funcao}>
                          {func.funcao}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Turno</label>
                    <Select
                      value={formData.turno}
                      onChange={(e) => handleInputChange('turno', e.target.value as any)}
                    >
                      <option value="Manhã">Manhã</option>
                      <option value="Tarde">Tarde</option>
                      <option value="Noite">Noite</option>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-gray-700">Mês de Referência</label>
                    <Select
                      value={formData.mes_referencia?.toString() || ''}
                      onChange={(e) => handleInputChange('mes_referencia', parseInt(e.target.value))}
                    >
                      <option value="1">Janeiro</option>
                      <option value="2">Fevereiro</option>
                      <option value="3">Março</option>
                      <option value="4">Abril</option>
                      <option value="5">Maio</option>
                      <option value="6">Junho</option>
                      <option value="7">Julho</option>
                      <option value="8">Agosto</option>
                      <option value="9">Setembro</option>
                      <option value="10">Outubro</option>
                      <option value="11">Novembro</option>
                      <option value="12">Dezembro</option>
                    </Select>
                  </div>
                </div>

                {/* Multiple Activities for Ajudantes de Armazém */}
                {isAjudanteArmazem && (
                  <div className="space-y-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-gray-900">Atividades Realizadas</h4>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={addActivity}
                        className="text-amber-600 border-amber-300 hover:bg-amber-100"
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Adicionar
                      </Button>
                    </div>
                    <p className="text-sm text-gray-600">Adicione todas as atividades realizadas no dia:</p>
                    
                    {multipleActivities.map((activity, index) => (
                      <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-3 p-3 bg-white rounded-lg border">
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-600">Atividade</label>
                          <Select
                            value={activity.nome_atividade}
                            onChange={(e) => updateActivity(index, 'nome_atividade', e.target.value)}
                            placeholder="Selecione"
                            disabled={activityNamesLoading}
                          >
                            {activityNames.map((act) => (
                              <option key={act.nome_atividade} value={act.nome_atividade}>
                                {act.nome_atividade}
                              </option>
                            ))}
                          </Select>
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-600">Quantidade</label>
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={activity.quantidade_produzida || ''}
                            onChange={(e) => updateActivity(index, 'quantidade_produzida', parseInt(e.target.value) || 0)}
                            placeholder="Ex: 83"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-xs font-medium text-gray-600">Tempo (h)</label>
                          <Input
                            type="number"
                            min="0.1"
                            step="0.1"
                            value={activity.tempo_horas || ''}
                            onChange={(e) => updateActivity(index, 'tempo_horas', parseFloat(e.target.value) || 0)}
                            placeholder="Ex: 3"
                          />
                        </div>
                        <div className="flex items-end">
                          {multipleActivities.length > 1 && (
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => removeActivity(index)}
                              className="w-full"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Single Activity for other functions */}
                {!isAjudanteArmazem && !isOperadorEmpilhadeira && (
                  <>
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-gray-700">Atividade Realizada</label>
                      <Select
                        value={formData.nome_atividade || ''}
                        onChange={(e) => handleInputChange('nome_atividade', e.target.value)}
                        placeholder="Selecione a atividade"
                        disabled={activityNamesLoading}
                      >
                        {activityNames.map((activity) => (
                          <option key={activity.nome_atividade} value={activity.nome_atividade}>
                            {activity.nome_atividade}
                          </option>
                        ))}
                      </Select>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Quantidade Produzida</label>
                        <Input
                          type="number"
                          min="0"
                          step="1"
                          value={formData.quantidade_produzida || ''}
                          onChange={(e) => handleInputChange('quantidade_produzida', parseInt(e.target.value) || 0)}
                          placeholder="Ex: 83"
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Tempo Trabalhado (horas)</label>
                        <Input
                          type="number"
                          min="0.1"
                          step="0.1"
                          value={formData.tempo_horas || ''}
                          onChange={(e) => handleInputChange('tempo_horas', parseFloat(e.target.value) || 0)}
                          placeholder="Ex: 3"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Valid Tasks for Operador de Empilhadeira */}
                {isOperadorEmpilhadeira && (
                  <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                    <h4 className="font-medium text-gray-900">Tarefas Válidas do Operador</h4>
                    <p className="text-sm text-gray-600">
                      Faça upload do arquivo de tarefas e informe o nome do operador para calcular as tarefas válidas:
                    </p>
                    
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Nome do Operador</label>
                        {uniqueOperators.length > 0 && (
                          <div className="text-xs text-green-600 mb-1">
                            ✅ {uniqueOperators.length} operadores encontrados no arquivo
                          </div>
                        )}
                        {operatorHistory.length > 0 && uniqueOperators.length === 0 && (
                          <div className="text-xs text-blue-600 mb-1">
                            📋 {operatorHistory.length} operadores do histórico disponíveis
                          </div>
                        )}
                        <Select
                          value={formData.nome_operador || ''}
                          onChange={(e) => handleInputChange('nome_operador', e.target.value)}
                          placeholder={
                            uniqueOperators.length > 0 
                              ? "Selecione um operador do arquivo" 
                              : "Selecione o operador"
                          }
                        >
                          {/* Operators from file (priority) */}
                          {uniqueOperators.length > 0 && (
                            <>
                              <optgroup label="📁 Operadores do Arquivo">
                                {uniqueOperators.map((operator) => (
                                  <option key={`file-${operator}`} value={operator}>
                                    {operator}
                                  </option>
                                ))}
                              </optgroup>
                            </>
                          )}
                          
                          {/* Recent operators */}
                          {operatorHistory.length > 0 && (
                            <optgroup label="📋 Operadores Recentes">
                              {operatorHistory
                                .filter(op => !uniqueOperators.includes(op))
                                .map((operator) => (
                                  <option key={`history-${operator}`} value={operator}>
                                    {operator}
                                  </option>
                                ))}
                            </optgroup>
                          )}
                          
                          {/* Static operators */}
                          {staticOperators
                            .filter(op => !uniqueOperators.includes(op) && !operatorHistory.includes(op))
                            .length > 0 && (
                            <optgroup label="👥 Outros Operadores">
                              {staticOperators
                                .filter(op => !uniqueOperators.includes(op) && !operatorHistory.includes(op))
                                .map((operator) => (
                                  <option key={`static-${operator}`} value={operator}>
                                    {operator}
                                  </option>
                                ))}
                            </optgroup>
                          )}
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-700">Arquivo de Tarefas</label>
                        <FileUpload
                          onFileUpload={handleFileUpload}
                          accept=".csv,.xlsx,.xls"
                          uploadedFileName={uploadedFile?.name}
                          onRemoveFile={handleRemoveFile}
                        />
                      </div>

                      {uploadedFile && formData.nome_operador && (
                        <div className="flex justify-center gap-3">
                          <Button
                            type="button"
                            onClick={processTaskFile}
                            disabled={processingTasks}
                            className="bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            <Play className="h-4 w-4 mr-2" />
                            {processingTasks ? 'Processando...' : 'Processar Arquivo de Tarefas'}
                          </Button>
                          <Button
                            type="button"
                            onClick={handleClearCache}
                            variant="outline"
                            className="border-orange-300 text-orange-600 hover:bg-orange-50"
                          >
                            🗑️ Limpar Cache
                          </Button>
                        </div>
                      )}

                      {validTasksCount > 0 && (
                        <div className="space-y-3">
                          <div className="p-4 bg-green-100 border border-green-300 rounded-lg">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-green-800">
                                Tarefas Válidas para {formData.nome_operador}:
                              </span>
                              <div className="flex items-center gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setDebugMode(!debugMode)}
                                  className="text-xs border-green-400 text-green-700 hover:bg-green-50"
                                >
                                  {debugMode ? '🔍 Ocultar Debug' : '🔍 Debug'}
                                </Button>
                              </div>
                            </div>
                            <div className="text-center">
                              <span className="text-3xl font-bold text-green-900">
                                {validTasksCount}
                              </span>
                              <span className="text-lg text-green-800 ml-2">tarefas</span>
                            </div>
                            <p className="text-sm text-green-700 mt-2 text-center">
                              Valor: R$ {(validTasksCount * 0.093).toFixed(2)} (R$ 0,093 por tarefa)
                            </p>
                            <p className="text-xs text-green-600 mt-1 text-center">
                              Critério: Diferença entre Data de Alteração e Data Última Associação {'>'} 10 segundos
                            </p>
                          </div>

                          {debugMode && validTasksDetails.length > 0 && (
                            <div className="bg-white border border-gray-200 rounded-lg">
                              <div className="p-3 border-b border-gray-200">
                                <h5 className="text-sm font-medium text-gray-900">🔍 Debug: Tarefas Válidas por Tipo</h5>
                              </div>
                              <div className="p-3 space-y-2">
                                {validTasksDetails.map((detail, index) => (
                                  <div key={index} className="flex justify-between items-center text-sm">
                                    <div>
                                      <span className="font-medium text-gray-900">{detail.tipo}</span>
                                      <span className="text-gray-500 ml-2">(Critério: {'>'} 10s)</span>
                                    </div>
                                    <div className="text-right">
                                      <span className="font-semibold text-purple-600">{detail.quantidade} tarefas</span>
                                      <div className="text-xs text-gray-500">
                                        R$ {(detail.quantidade * 0.093).toFixed(2)}
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Extra Activities Input */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">Atividades Extras (R$)</label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.input_adicional || ''}
                    onChange={(e) => handleInputChange('input_adicional', parseFloat(e.target.value) || 0)}
                    placeholder="Ex: 15.50"
                  />
                </div>

                {/* KPIs Section */}
                {availableKPIs.length > 0 && (
                  <div className="space-y-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-gray-900">KPIs Disponíveis para sua Função/Turno</h4>
                    <p className="text-sm text-gray-600">Selecione os KPIs que você atingiu hoje:</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {availableKPIs.map((kpi) => (
                        <div
                          key={kpi.id}
                          className={`p-3 rounded-lg border cursor-pointer transition-all ${
                            selectedKPIs.includes(kpi.nome_kpi)
                              ? 'bg-green-100 border-green-300 shadow-sm'
                              : 'bg-white border-gray-200 hover:border-blue-300'
                          }`}
                          onClick={() => toggleKPI(kpi.nome_kpi)}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="font-medium text-gray-900">{kpi.nome_kpi}</p>
                              <p className="text-sm text-gray-500">Meta: {kpi.valor_meta_kpi}% | Valor KPI Dia: R$ 2,88 ~ 3,00</p>
                            </div>
                            {selectedKPIs.includes(kpi.nome_kpi) && (
                              <CheckCircle className="h-5 w-5 text-green-600" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <Button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" 
                  disabled={calculating || !formData.funcao}
                >
                  {calculating ? 'Calculando...' : 'Calcular Remuneração'}
                </Button>
                </form>
                
                  {result && (
                <div className="mt-6 p-6 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Resultado do Cálculo</h3>
                  <div className="space-y-3">
                    
                    {/* Multiple activities details */}
                    {result.atividades_detalhes && result.atividades_detalhes.length > 0 && (
                      <div className="mb-4">
                        <h4 className="font-medium text-gray-800 mb-2">Detalhes das Atividades:</h4>
                        <div className="space-y-2">
                          {result.atividades_detalhes.map((atividade, index) => (
                            <div key={index} className="bg-white/70 p-3 rounded-lg border">
                              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                                <div>
                                  <p className="text-gray-600">Atividade:</p>
                                  <p className="font-medium">{atividade.nome}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Produtividade:</p>
                                  <p className="font-medium">{atividade.produtividade.toFixed(2)} {atividade.unidade}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Nível:</p>
                                  <p className="font-medium text-blue-600">{atividade.nivel}</p>
                                </div>
                                <div>
                                  <p className="text-gray-600">Valor:</p>
                                  <p className="font-medium text-green-600">R$ {atividade.valor_total.toFixed(2)}</p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Single activity details */}
                    {result.produtividade_alcancada && result.nivel_atingido && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="bg-white/70 p-3 rounded-lg">
                          <p className="text-sm text-gray-600">Produtividade Alcançada</p>
                          <p className="text-lg font-semibold text-purple-600">
                            {result.produtividade_alcancada.toFixed(2)} {result.unidade_medida}
                          </p>
                        </div>
                        <div className="bg-white/70 p-3 rounded-lg">
                          <p className="text-sm text-gray-600">Nível Atingido</p>
                          <p className="text-lg font-semibold text-blue-600">
                            {result.nivel_atingido}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Valid tasks details */}
                    {result.tarefas_validas !== undefined && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Tarefas Válidas ({result.tarefas_validas}):</span>
                        <span className="font-semibold text-purple-600">
                          R$ {result.valor_tarefas?.toFixed(2) || '0.00'}
                        </span>
                      </div>
                    )}

                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Valor Bruto Atividades:</span>
                      <span className="font-semibold text-purple-600">
                        R$ {(result.subtotal_atividades * 2).toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Atividades (50%):</span>
                      <span className="font-semibold text-green-600">
                        R$ {result.subtotal_atividades.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">KPIs Atingidos:</span>
                      <span className="font-semibold text-blue-600">
                        R$ {(result.bonus_kpis || 0).toFixed(2)}
                      </span>
                    </div>
                    
                    {/* KPI calculation details */}
                    {result.mes_referencia && result.dias_uteis && result.valor_kpi_unitario && (
                      <div className="bg-blue-50 p-3 rounded-lg border border-blue-200 mt-2">
                        <p className="text-sm font-medium text-blue-800 mb-2">Detalhes do Cálculo de KPI:</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                          <div>
                            <p className="text-blue-600">Mês de Referência:</p>
                            <p className="font-medium">
                              {['', 'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 
                                'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'][result.mes_referencia]}
                            </p>
                          </div>
                          <div>
                            <p className="text-blue-600">Dias Úteis (Seg-Sáb):</p>
                            <p className="font-medium">{result.dias_uteis} dias</p>
                          </div>
                          <div>
                            <p className="text-blue-600">Valor KPI Diário:</p>
                            <p className="font-medium">R$ {result.valor_kpi_unitario.toFixed(2)}</p>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-blue-600">
                           <p>Cálculo: R$ 75,00 por mês ÷ {result.dias_uteis} dias úteis = R$ {result.valor_kpi_unitario.toFixed(2)} por dia</p>
                           <p>Valor mostrado: R$ {result.valor_kpi_unitario.toFixed(2)} por KPI atingido (valor diário)</p>
                         </div>
                      </div>
                    )}
                    {formData.input_adicional && formData.input_adicional > 0 && (
                      <div className="flex justify-between items-center">
                        <span className="text-gray-700">Atividades Extras:</span>
                        <span className="font-semibold text-orange-600">
                          R$ {formData.input_adicional.toFixed(2)}
                        </span>
                      </div>
                    )}
                    <div className="border-t pt-3">
                      <div className="flex justify-between items-center">
                        <span className="text-lg font-semibold text-gray-900">Total Estimado do Dia:</span>
                        <span className="text-2xl font-bold text-gray-900">
                          R$ {result.remuneracao_total.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    {result.kpis_atingidos.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm text-gray-600 mb-2">KPIs Atingidos:</p>
                        <div className="flex flex-wrap gap-2">
                          {result.kpis_atingidos.map((kpi, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                              {kpi}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  {/* Lançar RV Section */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-purple-50 to-blue-50 rounded-lg border border-purple-200">
                    <h4 className="text-lg font-semibold text-gray-900 mb-4">Lançar RV</h4>
                    <div className="space-y-4">
                      <div>
                        <label htmlFor="data_lancamento" className="block text-sm font-medium text-gray-700 mb-2">
                          Data do Lançamento
                        </label>
                        <input
                          type="date"
                          id="data_lancamento"
                          value={launchDate}
                          onChange={(e) => setLaunchDate(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                      <Button 
                        onClick={handleLaunchRV}
                        className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                        disabled={launching || !launchDate}
                      >
                        {launching ? 'Lançando...' : 'Lançar RV'}
                      </Button>
                    </div>
                  </div>

                  {error && (
                   <Alert variant="destructive" className="mt-6">
                     <AlertTitle>Erro no Cálculo</AlertTitle>
                     <AlertDescription>{error}</AlertDescription>
                   </Alert>
                   )}
                </div>
              )}
            </div>
          )}

            {/* History Tab */}
              {activeTab === 'history' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">Histórico de Lançamentos</h3>
                    <Button
                      onClick={fetchUserHistory}
                      variant="outline"
                      size="sm"
                      className="text-blue-600 border-blue-300 hover:bg-blue-50"
                    >
                      Atualizar
                    </Button>
                  </div>
                  
                  {/* Month Filter and Total */}
                  <div className="bg-gray-50 p-4 rounded-lg border">
                    <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <label htmlFor="month-filter" className="text-sm font-medium text-gray-700">
                          Filtrar por mês:
                        </label>
                        <input
                          type="month"
                          id="month-filter"
                          value={historyMonthFilter}
                          onChange={(e) => setHistoryMonthFilter(e.target.value)}
                          className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        {historyMonthFilter && (
                          <Button
                            onClick={() => setHistoryMonthFilter('')}
                            variant="outline"
                            size="sm"
                            className="text-xs"
                          >
                            Limpar
                          </Button>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600">Total de entradas: {filteredHistory.length}</p>
                        <p className="text-lg font-bold text-green-600">
                          Total: R$ {historyTotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {filteredHistory.length === 0 ? (
                    <div className="text-center py-8">
                      <CheckCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">
                        {historyMonthFilter ? 'Nenhum lançamento encontrado para o mês selecionado' : 'Nenhum lançamento encontrado'}
                      </p>
                      <p className="text-sm text-gray-400">Seus lançamentos de RV aparecerão aqui</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredHistory.map((item, index) => {
                        let detalhes;
                        try {
                          detalhes = typeof item.detalhes_calculo === 'string' 
                            ? JSON.parse(item.detalhes_calculo) 
                            : item.detalhes_calculo;
                        } catch {
                          detalhes = {};
                        }
                        
                        return (
                          <div key={index} className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center space-x-2">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <span className="font-medium text-gray-900">
                                  {new Date(item.data_lancamento).toLocaleDateString('pt-BR')}
                                </span>
                                <span className="text-sm text-gray-500">
                                  {item.funcao} - {item.turno}
                                </span>
                              </div>
                              <span className="text-lg font-bold text-green-600">
                                R$ {(item.remuneracao_total || 0).toFixed(2)}
                              </span>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                              <div>
                                <p className="text-gray-600">Atividades</p>
                                <p className="font-medium text-purple-600">
                                  R$ {(item.subtotal_atividades || 0).toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Bônus KPIs</p>
                                <p className="font-medium text-blue-600">
                                  R$ {(item.bonus_kpis || 0).toFixed(2)}
                                </p>
                              </div>
                              <div>
                                <p className="text-gray-600">Lançado em</p>
                                <p className="font-medium text-gray-700">
                                  {new Date(item.created_at).toLocaleDateString('pt-BR')} às {new Date(item.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                            
                            {detalhes.kpis_atingidos && detalhes.kpis_atingidos.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs text-gray-600 mb-1">KPIs Atingidos:</p>
                                <div className="flex flex-wrap gap-1">
                                  {detalhes.kpis_atingidos.map((kpi: string, kpiIndex: number) => (
                                    <span key={kpiIndex} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                      {kpi}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                            
                            {/* Atividades Lançadas */}
                            {detalhes.atividades && detalhes.atividades.length > 0 && (
                              <div className="mt-3">
                                <p className="text-xs text-gray-600 mb-2">Atividades Lançadas:</p>
                                <div className="space-y-1">
                                  {detalhes.atividades.map((atividade: any, atividadeIndex: number) => (
                                    <div key={atividadeIndex} className="flex justify-between items-center text-xs bg-purple-50 px-2 py-1 rounded">
                                      <span className="text-purple-800 font-medium">{atividade.nome}</span>
                                      <div className="flex items-center space-x-2">
                                        <span className="text-purple-600">Qtd: {atividade.quantidade || 0}</span>
                                        <span className="text-purple-800 font-semibold">
                                          R$ {((atividade.quantidade || 0) * (atividade.valor_unitario || 0)).toFixed(2)}
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Success Popup */}
      {showSuccessPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4 shadow-xl">
            <div className="flex items-center space-x-3 mb-4">
              <div className="flex-shrink-0">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <div>
                <h3 className="text-lg font-medium text-gray-900">Sucesso!</h3>
                <p className="text-sm text-gray-600">RV lançado com sucesso</p>
              </div>
            </div>
            <div className="flex justify-end space-x-3">
              <Button
                onClick={() => setShowSuccessPopup(false)}
                variant="outline"
                size="sm"
              >
                Fechar
              </Button>
              <Button
                onClick={() => {
                  setShowSuccessPopup(false);
                  setActiveTab('history');
                }}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
              >
                Ver Histórico
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
