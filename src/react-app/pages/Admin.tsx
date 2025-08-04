import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Settings, Calculator, ArrowLeft, Lock, Users, Activity, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/react-app/components/Card';
import { Button } from '@/react-app/components/Button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/react-app/components/Table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/react-app/components/Dialog';
import { Input } from '@/react-app/components/Input';
import { Select } from '@/react-app/components/Select';
import { Alert, AlertDescription } from '@/react-app/components/Alert';
import { useActivities, useKPIs } from '@/react-app/hooks/useApi';
import { ActivityType, KPIType } from '@/shared/types';
import UserManagement from '@/react-app/components/UserManagement';

// Login Component
function LoginForm({ onLogin }: { onLogin: () => void }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'r0n1erca55') {
      localStorage.setItem('admin_logged_in', 'true');
      onLogin();
    } else {
      setError('Senha incorreta');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50 flex items-center justify-center">
      <Card className="w-full max-w-md shadow-xl border-0 bg-white/80 backdrop-blur-sm">
        <CardHeader className="text-center">
          <div className="mx-auto h-12 w-12 rounded-lg bg-gradient-to-br from-slate-600 to-blue-600 flex items-center justify-center mb-4">
            <Lock className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-xl">Acesso Administrativo</CardTitle>
          <CardDescription>
            Digite a senha para acessar o painel administrativo
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Senha</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Digite a senha"
                required
              />
            </div>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <Button type="submit" className="w-full">
              Entrar
            </Button>
            <Link to="/">
              <Button variant="outline" className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar para RV Armazém
              </Button>
            </Link>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default function Admin() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [activeTab, setActiveTab] = useState<'activities' | 'kpis' | 'users'>('activities');

  useEffect(() => {
    const loggedIn = localStorage.getItem('admin_logged_in') === 'true';
    setIsLoggedIn(loggedIn);
  }, []);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('admin_logged_in');
    setIsLoggedIn(false);
  };

  if (!isLoggedIn) {
    return <LoginForm onLogin={handleLogin} />;
  }

  return <AdminDashboard activeTab={activeTab} setActiveTab={setActiveTab} handleLogout={handleLogout} />;
}

// Componente separado para o dashboard administrativo
function AdminDashboard({ 
  activeTab, 
  setActiveTab, 
  handleLogout 
}: { 
  activeTab: 'activities' | 'kpis' | 'users';
  setActiveTab: (tab: 'activities' | 'kpis' | 'users') => void;
  handleLogout: () => void;
}) {
  // Agora os hooks são chamados apenas quando o usuário está logado
  const { activities, loading: activitiesLoading, createActivity, updateActivity, deleteActivity } = useActivities();
  const { kpis, loading: kpisLoading, createKPI, updateKPI, deleteKPI } = useKPIs();

  // Activity modal state
  const [activityDialog, setActivityDialog] = useState(false);
  const [editingActivity, setEditingActivity] = useState<ActivityType | null>(null);
  const [activityForm, setActivityForm] = useState({
    nome_atividade: '',
    nivel_atividade: '',
    valor_atividade: 0,
    produtividade_minima: 0,
    unidade_medida: '',
  });

  // KPI modal state
  const [kpiDialog, setKpiDialog] = useState(false);
  const [editingKPI, setEditingKPI] = useState<KPIType | null>(null);
  const [kpiForm, setKpiForm] = useState({
    nome_kpi: '',
    valor_meta_kpi: 0,
    peso_kpi: 0,
    turno_kpi: 'Geral' as 'Manhã' | 'Tarde' | 'Noite' | 'Geral',
    funcao_kpi: '',
  });

  // Activity handlers
  const handleActivitySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingActivity) {
      await updateActivity(editingActivity.id!, activityForm);
    } else {
      await createActivity(activityForm);
    }
    setActivityDialog(false);
    resetActivityForm();
  };

  const handleEditActivity = (activity: ActivityType) => {
    setEditingActivity(activity);
    setActivityForm({
      nome_atividade: activity.nome_atividade,
      nivel_atividade: activity.nivel_atividade,
      valor_atividade: activity.valor_atividade,
      produtividade_minima: activity.produtividade_minima || 0,
      unidade_medida: activity.unidade_medida || '',
    });
    setActivityDialog(true);
  };

  const handleDeleteActivity = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir esta atividade?')) {
      await deleteActivity(id);
    }
  };

  const resetActivityForm = () => {
    setEditingActivity(null);
    setActivityForm({
      nome_atividade: '',
      nivel_atividade: '',
      valor_atividade: 0,
      produtividade_minima: 0,
      unidade_medida: '',
    });
  };

  // KPI handlers
  const handleKPISubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingKPI) {
      await updateKPI(editingKPI.id!, kpiForm);
    } else {
      await createKPI(kpiForm);
    }
    setKpiDialog(false);
    resetKPIForm();
  };

  const handleEditKPI = (kpi: KPIType) => {
    setEditingKPI(kpi);
    setKpiForm({
      nome_kpi: kpi.nome_kpi,
      valor_meta_kpi: kpi.valor_meta_kpi,
      peso_kpi: kpi.peso_kpi,
      turno_kpi: kpi.turno_kpi,
      funcao_kpi: kpi.funcao_kpi,
    });
    setKpiDialog(true);
  };

  const handleDeleteKPI = async (id: number) => {
    if (confirm('Tem certeza que deseja excluir este KPI?')) {
      await deleteKPI(id);
    }
  };

  const resetKPIForm = () => {
    setEditingKPI(null);
    setKpiForm({
      nome_kpi: '',
      valor_meta_kpi: 0,
      peso_kpi: 0,
      turno_kpi: 'Geral',
      funcao_kpi: '',
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50">
      {/* Header */}
      <header className="border-b bg-white/70 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="outline" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Voltar
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-slate-600 to-blue-600 flex items-center justify-center">
                  <Settings className="h-5 w-5 text-white" />
                </div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-600 to-blue-600 bg-clip-text text-transparent">
                  Painel Administrativo
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Link to="/">
                <Button variant="outline" size="sm">
                  <Calculator className="h-4 w-4 mr-2" />
                  Calculadora
                </Button>
              </Link>
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleLogout}
              >
                <Lock className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <button
                onClick={() => setActiveTab('activities')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'activities'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Activity className="h-4 w-4 inline mr-2" />
                Atividades
              </button>
              <button
                onClick={() => setActiveTab('kpis')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'kpis'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <BarChart3 className="h-4 w-4 inline mr-2" />
                KPIs
              </button>
              <button
                onClick={() => setActiveTab('users')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'users'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Users className="h-4 w-4 inline mr-2" />
                Usuários
              </button>
            </nav>
          </div>
        </div>

        <div className="space-y-8">
          {/* Activities Section */}
          {activeTab === 'activities' && (
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Gerenciamento de Atividades</CardTitle>
                  <CardDescription>
                    Cadastre e gerencie as atividades que geram valor direto
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    resetActivityForm();
                    setActivityDialog(true);
                  }}
                  className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Atividade
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {activitiesLoading ? (
                <div className="text-center py-8">Carregando atividades...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome da Atividade</TableHead>
                      <TableHead>Nível</TableHead>
                      <TableHead>Valor (R$)</TableHead>
                      <TableHead>Produtividade Mín.</TableHead>
                      <TableHead>Unidade</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {activities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                          Nenhuma atividade cadastrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      activities.map((activity) => (
                        <TableRow key={activity.id}>
                          <TableCell className="font-medium">{activity.nome_atividade}</TableCell>
                          <TableCell>{activity.nivel_atividade}</TableCell>
                          <TableCell>R$ {activity.valor_atividade.toFixed(2)}</TableCell>
                          <TableCell>{activity.produtividade_minima || 0}</TableCell>
                          <TableCell>{activity.unidade_medida || 'unidades'}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditActivity(activity)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteActivity(activity.id!)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          )}

          {/* KPIs Section */}
          {activeTab === 'kpis' && (
          <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">Gerenciamento de KPIs</CardTitle>
                  <CardDescription>
                    Cadastre e gerencie os indicadores de performance
                  </CardDescription>
                </div>
                <Button
                  onClick={() => {
                    resetKPIForm();
                    setKpiDialog(true);
                  }}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Novo KPI
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {kpisLoading ? (
                <div className="text-center py-8">Carregando KPIs...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome do KPI</TableHead>
                      <TableHead>Meta</TableHead>
                      <TableHead>Peso/Bônus (R$)</TableHead>
                      <TableHead>Turno</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {kpis.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center text-gray-500 py-8">
                          Nenhum KPI cadastrado
                        </TableCell>
                      </TableRow>
                    ) : (
                      kpis.map((kpi) => (
                        <TableRow key={kpi.id}>
                          <TableCell className="font-medium">{kpi.nome_kpi}</TableCell>
                          <TableCell>{kpi.valor_meta_kpi}</TableCell>
                          <TableCell>R$ {kpi.peso_kpi.toFixed(2)}</TableCell>
                          <TableCell>{kpi.turno_kpi}</TableCell>
                          <TableCell>{kpi.funcao_kpi}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end space-x-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditKPI(kpi)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteKPI(kpi.id!)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          )}

          {/* Users Section */}
          {activeTab === 'users' && (
            <UserManagement />
          )}
        </div>
      </main>

      {/* Activity Dialog */}
      <Dialog open={activityDialog} onOpenChange={setActivityDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingActivity ? 'Editar Atividade' : 'Nova Atividade'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleActivitySubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nome da Atividade</label>
              <Input
                value={activityForm.nome_atividade}
                onChange={(e) => setActivityForm(prev => ({ ...prev, nome_atividade: e.target.value }))}
                placeholder="Ex: Separação de Pedidos"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nível da Atividade</label>
              <Input
                value={activityForm.nivel_atividade}
                onChange={(e) => setActivityForm(prev => ({ ...prev, nivel_atividade: e.target.value }))}
                placeholder="Ex: N1, N2, N3"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Valor (R$)</label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={activityForm.valor_atividade}
                onChange={(e) => setActivityForm(prev => ({ ...prev, valor_atividade: parseFloat(e.target.value) || 0 }))}
                placeholder="Ex: 0.25"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Produtividade Mínima</label>
                <Input
                  type="number"
                  step="0.1"
                  min="0"
                  value={activityForm.produtividade_minima}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, produtividade_minima: parseFloat(e.target.value) || 0 }))}
                  placeholder="Ex: 14.2"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Unidade de Medida</label>
                <Select
                  value={activityForm.unidade_medida}
                  onChange={(e) => setActivityForm(prev => ({ ...prev, unidade_medida: e.target.value }))}
                >
                  <option value="">Selecione</option>
                  <option value="cxs/h">cxs/h (Caixas por hora)</option>
                  <option value="plt/h">plt/h (Pallets por hora)</option>
                  <option value="unidades/h">unidades/h</option>
                </Select>
              </div>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setActivityDialog(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingActivity ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* KPI Dialog */}
      <Dialog open={kpiDialog} onOpenChange={setKpiDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingKPI ? 'Editar KPI' : 'Novo KPI'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleKPISubmit} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Nome do KPI</label>
              <Input
                value={kpiForm.nome_kpi}
                onChange={(e) => setKpiForm(prev => ({ ...prev, nome_kpi: e.target.value }))}
                placeholder="Ex: Produtividade na Separação"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Meta</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={kpiForm.valor_meta_kpi}
                  onChange={(e) => setKpiForm(prev => ({ ...prev, valor_meta_kpi: parseFloat(e.target.value) || 0 }))}
                  placeholder="Ex: 99.5"
                  required
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">Peso/Bônus (R$)</label>
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={kpiForm.peso_kpi}
                  onChange={(e) => setKpiForm(prev => ({ ...prev, peso_kpi: parseFloat(e.target.value) || 0 }))}
                  placeholder="Ex: 10.00"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Turno</label>
              <Select
                value={kpiForm.turno_kpi}
                onChange={(e) => setKpiForm(prev => ({ ...prev, turno_kpi: e.target.value as any }))}
              >
                <option value="Geral">Geral</option>
                <option value="Manhã">Manhã</option>
                <option value="Tarde">Tarde</option>
                <option value="Noite">Noite</option>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Função</label>
              <Input
                value={kpiForm.funcao_kpi}
                onChange={(e) => setKpiForm(prev => ({ ...prev, funcao_kpi: e.target.value }))}
                placeholder="Ex: Separador, Conferente"
                required
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setKpiDialog(false)}
              >
                Cancelar
              </Button>
              <Button type="submit">
                {editingKPI ? 'Atualizar' : 'Criar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
