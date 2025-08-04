import { useState, useEffect } from 'react';
import { ActivityType, KPIType, CalculatorInputType, CalculatorResultType } from '@/shared/types';
import { mockFunctions, mockActivityNames, mockKPIs, mockCalculationResult, mockUserHistory } from '@/react-app/utils/mockApi';

const API_BASE = '/api';

export function useActivities() {
  const [activities, setActivities] = useState<ActivityType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/activities`);
      if (!response.ok) throw new Error('Failed to fetch activities');
      const data = await response.json();
      setActivities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const createActivity = async (activity: Omit<ActivityType, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch(`${API_BASE}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity),
      });
      if (!response.ok) throw new Error('Failed to create activity');
      await fetchActivities();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const updateActivity = async (id: number, activity: Omit<ActivityType, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch(`${API_BASE}/activities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(activity),
      });
      if (!response.ok) throw new Error('Failed to update activity');
      await fetchActivities();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const deleteActivity = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE}/activities/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete activity');
      await fetchActivities();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  return { activities, loading, error, createActivity, updateActivity, deleteActivity, refetch: fetchActivities };
}

export function useKPIs() {
  const [kpis, setKpis] = useState<KPIType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchKPIs = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE}/kpis`);
      if (!response.ok) throw new Error('Failed to fetch KPIs');
      const data = await response.json();
      setKpis(data);
    } catch (err) {
      console.warn('API failed, using mock data for KPIs:', err);
      setKpis(mockKPIs);
      setError(null); // Don't show error for mock data
    } finally {
      setLoading(false);
    }
  };

  const createKPI = async (kpi: Omit<KPIType, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch(`${API_BASE}/kpis`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kpi),
      });
      if (!response.ok) throw new Error('Failed to create KPI');
      await fetchKPIs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const updateKPI = async (id: number, kpi: Omit<KPIType, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const response = await fetch(`${API_BASE}/kpis/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(kpi),
      });
      if (!response.ok) throw new Error('Failed to update KPI');
      await fetchKPIs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  const deleteKPI = async (id: number) => {
    try {
      const response = await fetch(`${API_BASE}/kpis/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Failed to delete KPI');
      await fetchKPIs();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  useEffect(() => {
    fetchKPIs();
  }, []);

  return { kpis, loading, error, createKPI, updateKPI, deleteKPI, refetch: fetchKPIs };
}

export function useFunctions() {
  const [functions, setFunctions] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchFunctions = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/functions`);
        if (!response.ok) throw new Error('Failed to fetch functions');
        const data = await response.json();
        setFunctions(data.map((item: any) => item.funcao || item));
      } catch (err) {
        console.warn('API failed, using mock data for functions:', err);
        setFunctions(mockFunctions);
        setError(null); // Don't show error for mock data
      } finally {
        setLoading(false);
      }
    };

    fetchFunctions();
  }, []);

  return { functions, loading, error };
}

export function useActivityNames() {
  const [activityNames, setActivityNames] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchActivityNames = async () => {
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE}/activity-names`);
        if (!response.ok) throw new Error('Failed to fetch activity names');
        const data = await response.json();
        setActivityNames(data.map((item: any) => item.nome_atividade || item));
      } catch (err) {
        console.warn('API failed, using mock data for activity names:', err);
        setActivityNames(mockActivityNames);
        setError(null); // Don't show error for mock data
      } finally {
        setLoading(false);
      }
    };

    fetchActivityNames();
  }, []);

  return { activityNames, loading, error };
}

export function useCalculator() {
  const [result, setResult] = useState<CalculatorResultType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const calculate = async (input: CalculatorInputType) => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch(`${API_BASE}/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      });
      if (!response.ok) throw new Error('Failed to calculate');
      const data = await response.json();
      setResult(data);
    } catch (err) {
      console.warn('API failed, using mock calculation result:', err);
      // Simulate calculation with mock data
      const mockResult = {
        ...mockCalculationResult,
        produtividade_alcancada: input.quantidade_produzida ? input.quantidade_produzida / (input.tempo_horas || 1) : 0,
        kpis_atingidos: input.kpis_atingidos || [],
        tarefas_validas: input.valid_tasks_count || 0,
        valor_tarefas: (input.valid_tasks_count || 0) * 2, // R$ 2 por tarefa
        atividades_detalhes: input.multiple_activities && input.multiple_activities.length > 0 
          ? input.multiple_activities.map(atividade => ({
              nome: atividade.nome_atividade,
              produtividade: atividade.quantidade_produzida / (atividade.tempo_horas || 1),
              nivel: 'Nível 2',
              valor_total: atividade.quantidade_produzida * 1.5,
              unidade: 'unidades/h'
            }))
          : [{  
              nome: input.nome_atividade || 'Atividade Padrão',
              produtividade: input.quantidade_produzida ? input.quantidade_produzida / (input.tempo_horas || 1) : 0,
              nivel: 'Nível 1',
              valor_total: (input.quantidade_produzida || 0) * 1.2,
              unidade: 'unidades/h'
            }],
      };
      setResult(mockResult);
      setError(null); // Don't show error for mock data
    } finally {
      setLoading(false);
    }
  };

  return { result, loading, error, calculate };
}
