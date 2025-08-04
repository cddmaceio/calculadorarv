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
  
  // Launch RV states
  const [launching, setLaunching] = useState(false);
  const [launchDate, setLaunchDate] = useState('');
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  
  // History states
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
    kpis_atingidos: [],
    tarefas_validas: 0,
    atividades_multiplas: []
  });

  // Initialize launch date to today
  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setLaunchDate(today);
  }, []);

  // Fetch user history on component mount
  useEffect(() => {
    if (user?.id) {
      fetchUserHistory();
    }
  }, [user?.id]);

  // Filter history by month
  useEffect(() => {
    if (!historyMonthFilter) {
      setFilteredHistory(userHistory);
    } else {
      const filtered = userHistory.filter(item => {
        const itemDate = new Date(item.data_lancamento);
        const filterDate = new Date(historyMonthFilter + '-01');
        return itemDate.getFullYear() === filterDate.getFullYear() && 
               itemDate.getMonth() === filterDate.getMonth();
      });
      setFilteredHistory(filtered);
    }
  }, [userHistory, historyMonthFilter]);

  // Calculate history total
  useEffect(() => {
    const total = filteredHistory.reduce((sum, item) => sum + (item.remuneracao_total || 0), 0);
    setHistoryTotal(total);
  }, [filteredHistory]);

  const fetchUserHistory = async () => {
    if (!user?.id) return;
    
    try {
      const response = await fetch(`/api/base_rv/user/${user.id}`);
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      setUserHistory(data);
    } catch (err) {
      console.warn('API failed, using mock data for user history:', err);
      // Import mock data
      import('@/react-app/utils/mockApi').then(({ mockUserHistory }) => {
        setUserHistory(mockUserHistory);
      });
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
    setMultipleActivities(prev => prev.map((activity, i) => 
      i === index ? { ...activity, [field]: value } : activity
    ));
  };

  const handleInputChange = (field: keyof CalculatorInputType, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleKPIChange = (kpiName: string, checked: boolean) => {
    setSelectedKPIs(prev => 
      checked 
        ? [...prev, kpiName]
        : prev.filter(name => name !== kpiName)
    );
  };

  const handleFileUpload = async (file: File) => {
    setUploadedFile(file);
    setProcessingTasks(true);
    
    try {
      const hash = await generateFileHash(file);
      setFileHash(hash);
      
      // Check cache first
      const cachedData = FileDataCache.get(hash);
      if (cachedData) {
        setValidTasksCount(cachedData.validTasksCount);
        setValidTasksDetails(cachedData.validTasksDetails);
        setUniqueOperators(cachedData.uniqueOperators);
        setProcessingTasks(false);
        return;
      }

      const csvData = await parseCSV(file);
      const { validTasks, validTasksDetails, uniqueOperators } = calculateValidTasks(csvData, formData.funcao);
      
      setValidTasksCount(validTasks);
      setValidTasksDetails(validTasksDetails);
      setUniqueOperators(uniqueOperators);
      
      // Cache the results
      FileDataCache.set(hash, {
        validTasksCount: validTasks,
        validTasksDetails,
        uniqueOperators
      });
      
    } catch (error) {
      console.error('Error processing file:', error);
    } finally {
      setProcessingTasks(false);
    }
  };

  const fetchAvailableKPIs = async (funcao: string, turno: string) => {
    if (!funcao || !turno) return;
    
    try {
      const response = await fetch(`/api/kpis/available?funcao=${encodeURIComponent(funcao)}&turno=${encodeURIComponent(turno)}`);
      if (!response.ok) throw new Error('Failed to fetch KPIs');
      const data = await response.json();
      setAvailableKPIs(data);
    } catch (err) {
      console.warn('API failed, using mock data for available KPIs:', err);
      // Import mock data
      import('@/react-app/utils/mockApi').then(({ mockKPIs }) => {
        // Filter KPIs based on function and shift
        const filteredKPIs = mockKPIs.filter(kpi => 
          kpi.funcao === funcao && kpi.turno === turno
        );
        setAvailableKPIs(filteredKPIs);
      });
    }
  };

  const handleLaunchRV = async () => {
    if (!result || !launchDate || !user?.id) return;
    
    setLaunching(true);
    try {
      const launchData = {
        user_id: user.id,
        data_lancamento: launchDate,
        funcao: formData.funcao,
        turno: formData.turno,
        subtotal_atividades: result.subtotal_atividades,
        bonus_kpis: result.bonus_kpis || 0,
        remuneracao_total: result.remuneracao_total,
        detalhes_calculo: JSON.stringify({
          atividades: result.atividades_detalhes || [],
          kpis_atingidos: result.kpis_atingidos || [],
          produtividade_alcancada: result.produtividade_alcancada,
          nivel_atingido: result.nivel_atingido,
          tarefas_validas: result.tarefas_validas,
          valor_tarefas: result.valor_tarefas,
          input_adicional: formData.input_adicional
        })
      };

      const response = await fetch('/api/base_rv', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(launchData),
      });

      if (!response.ok) {
        throw new Error('Failed to launch RV');
      }

      setShowSuccessPopup(true);
      await fetchUserHistory();
      
    } catch (err) {
      console.error('Error launching RV:', err);
    } finally {
      setLaunching(false);
    }
  };

  const handleCalculate = async () => {
    const calculationData = {
      ...formData,
      kpis_atingidos: selectedKPIs,
      tarefas_validas: validTasksCount,
      atividades_multiplas: formData.funcao === 'Ajudante de Armazém' ? multipleActivities : []
    };
    
    await calculate(calculationData);
  };

  useEffect(() => {
    if (formData.funcao && formData.turno) {
      fetchAvailableKPIs(formData.funcao, formData.turno);
    }
  }, [formData.funcao, formData.turno]);

  useEffect(() => {
    setSelectedKPIs([]);
  }, [formData.funcao, formData.turno]);

  const isAjudanteArmazem = formData.funcao === 'Ajudante de Armazém';

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Calculator className="h-8 w-8 text-blue-600" />
              <h1 className="text-xl font-bold text-gray-900">Calculadora RV</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-5 w-5 text-gray-600" />
                <span className="text-sm text-gray-700">{user?.nome}</span>
              </div>
              {user?.is_admin && (
                <Link to="/admin">
                  <Button variant="outline" size="sm" className="text-blue-600 border-blue-300 hover:bg-blue-50">
                    <LinkIcon className="h-4 w-4 mr-2" />
                    Admin
                  </Button>
                </Link>
              )}
              <Button onClick={logout} variant="outline" size="sm" className="text-red-600 border-red-300 hover:bg-red-50">
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab('calculator')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'calculator'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Calculator className="h-4 w-4 inline mr-2" />
              Calculadora
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                activeTab === 'history'
                  ? 'bg-white text-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <TrendingUp className="h-4 w-4 inline mr-2" />
              Histórico
            </button>
          </div>

          {/* Calculator Tab */}
          {activeTab === 'calculator' && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calculator className="h-5 w-5" />
                  <span>Calculadora de Remuneração Variável</span>
                </CardTitle>
                <CardDescription>
                  Calcule sua remuneração baseada na produtividade e KPIs atingidos
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={(e) => { e.preventDefault(); handleCalculate(); }} className="space-y-6">
                  {/* Function and Shift Selection */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="funcao" className="block text-sm font-medium text-gray-700 mb-2">
                        Função
                      </label>
                      <Select
                        value={formData.funcao}
                        onValueChange={(value) => handleInputChange('funcao', value)}
                        disabled={functionsLoading}
                      >
                        <option value="">Selecione uma função</option>
                        {functions.map((func) => (
                          <option key={func} value={func}>{func}</option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <label htmlFor="turno" className="block text-sm font-medium text-gray-700 mb-2">
                        Turno
                      </label>
                      <Select
                        value={formData.turno}
                        onValueChange={(value) => handleInputChange('turno', value)}
                      >
                        <option value="Manhã">Manhã</option>
                        <option value="Tarde">Tarde</option>
                        <option value="Noite">Noite</option>
                      </Select>
                    </div>
                  </div>

                  {/* Activity Selection for non-Ajudante functions */}
                  {formData.funcao && !isAjudanteArmazem && (
                    <div>
                      <label htmlFor="nome_atividade" className="block text-sm font-medium text-gray-700 mb-2">
                        Atividade
                      </label>
                      <Select
                        value={formData.nome_atividade}
                        onValueChange={(value) => handleInputChange('nome_atividade', value)}
                        disabled={activityNamesLoading}
                      >
                        <option value="">Selecione uma atividade</option>
                        {activityNames.map((activity) => (
                          <option key={activity} value={activity}>{activity}</option>
                        ))}
                      </Select>
                    </div>
                  )}

                  {/* Multiple Activities for Ajudante de Armazém */}
                  {isAjudanteArmazem && (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h3 className="text-lg font-medium text-gray-900">Atividades Realizadas</h3>
                        <Button type="button" onClick={addActivity} variant="outline" size="sm">
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Atividade
                        </Button>
                      </div>
                      {multipleActivities.map((activity, index) => (
                        <div key={index} className="p-4 border border-gray-200 rounded-lg space-y-3">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-gray-800">Atividade {index + 1}</h4>
                            {multipleActivities.length > 1 && (
                              <Button
                                type="button"
                                onClick={() => removeActivity(index)}
                                variant="outline"
                                size="sm"
                                className="text-red-600 border-red-300 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Nome da Atividade
                              </label>
                              <Select
                                value={activity.nome_atividade}
                                onValueChange={(value) => updateActivity(index, 'nome_atividade', value)}
                                disabled={activityNamesLoading}
                              >
                                <option value="">Selecione</option>
                                {activityNames.map((name) => (
                                  <option key={name} value={name}>{name}</option>
                                ))}
                              </Select>
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Quantidade Produzida
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                value={activity.quantidade_produzida}
                                onChange={(e) => updateActivity(index, 'quantidade_produzida', parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                              />
                            </div>
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tempo (horas)
                              </label>
                              <Input
                                type="number"
                                step="0.01"
                                value={activity.tempo_horas}
                                onChange={(e) => updateActivity(index, 'tempo_horas', parseFloat(e.target.value) || 0)}
                                placeholder="0.00"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Production and Time inputs for non-Ajudante functions */}
                  {formData.funcao && !isAjudanteArmazem && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label htmlFor="quantidade_produzida" className="block text-sm font-medium text-gray-700 mb-2">
                          Quantidade Produzida
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.quantidade_produzida}
                          onChange={(e) => handleInputChange('quantidade_produzida', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                      <div>
                        <label htmlFor="tempo_horas" className="block text-sm font-medium text-gray-700 mb-2">
                          Tempo Trabalhado (horas)
                        </label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.tempo_horas}
                          onChange={(e) => handleInputChange('tempo_horas', parseFloat(e.target.value) || 0)}
                          placeholder="0.00"
                        />
                      </div>
                    </div>
                  )}

                  {/* File Upload for Conferente */}
                  {formData.funcao === 'Conferente' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Upload do Arquivo de Tarefas (CSV)
                        </label>
                        <FileUpload
                          onFileSelect={handleFileUpload}
                          accept=".csv"
                          disabled={processingTasks}
                        />
                        {processingTasks && (
                          <p className="text-sm text-blue-600 mt-2">Processando arquivo...</p>
                        )}
                        {validTasksCount > 0 && (
                          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                            <p className="text-sm text-green-800">
                              <strong>Tarefas válidas encontradas:</strong> {validTasksCount}
                            </p>
                            {uniqueOperators.length > 0 && (
                              <p className="text-xs text-green-600 mt-1">
                                Operadores únicos: {uniqueOperators.length}
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Additional Input */}
                  <div>
                    <label htmlFor="input_adicional" className="block text-sm font-medium text-gray-700 mb-2">
                      Atividades Extras (R$)
                    </label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.input_adicional}
                      onChange={(e) => handleInputChange('input_adicional', parseFloat(e.target.value) || 0)}
                      placeholder="0.00"
                    />
                  </div>

                  {/* KPIs Selection */}
                  {availableKPIs.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-lg font-medium text-gray-900">KPIs Disponíveis</h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {availableKPIs.map((kpi) => (
                          <label key={kpi.id} className="flex items-center space-x-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedKPIs.includes(kpi.nome)}
                              onChange={(e) => handleKPIChange(kpi.nome, e.target.checked)}
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{kpi.nome}</div>
                              {kpi.descricao && (
                                <div className="text-xs text-gray-500">{kpi.descricao}</div>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Calculate Button */}
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700" 
                    disabled={calculating || !formData.funcao}
                  >
                    {calculating ? 'Calculando...' : 'Calcular Remuneração'}
                  </Button>
                </form>
                
                {/* Results */}
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
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* History Tab */}
          {activeTab === 'history' && (
            <Card className="mt-6">
              <CardContent className="p-6">
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
                                  {item.data_lancamento.split('-').reverse().join('/')}
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
                                  {detalhes.atividades.map((atividade: any, atividadeIndex: number) => {
                                    const quantidade = atividade.quantidade || atividade.produtividade || 0;
                                    
                                    return (
                                      <div key={atividadeIndex} className="flex justify-between items-center text-xs bg-purple-50 px-2 py-1 rounded">
                                        <span className="text-purple-800 font-medium">{atividade.nome}</span>
                                        <div className="flex items-center space-x-2">
                                          <span className="text-purple-600">Qtd: {quantidade.toFixed(2)}</span>
                                          <span className="text-purple-800 font-semibold">
                                            R$ {(atividade.valor_total || 0).toFixed(2)}
                                          </span>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
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
