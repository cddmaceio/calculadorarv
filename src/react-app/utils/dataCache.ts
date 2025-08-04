import { TaskRow, ValidTaskDetail } from './taskProcessor';

export interface CachedTaskData {
  fileName: string;
  fileSize: number;
  fileHash: string;
  operatorName: string;
  processedAt: number;
  validTasksCount: number;
  validTasksDetails: ValidTaskDetail[];
  parsedTasks: TaskRow[];
}

export interface CachedFileData {
  fileName: string;
  fileSize: number;
  fileHash: string;
  parsedAt: number;
  parsedTasks: TaskRow[];
}

const CACHE_KEYS = {
  TASK_DATA: 'calculadora_task_data',
  FILE_DATA: 'calculadora_file_data',
  OPERATOR_HISTORY: 'calculadora_operator_history'
} as const;

// Gerar hash simples do conteúdo do arquivo
export function generateFileHash(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash).toString(36);
}

// Cache para dados de tarefas processadas
export class TaskDataCache {
  static clear(): void {
    try {
      localStorage.removeItem(CACHE_KEYS.TASK_DATA);
      console.log('🗑️ Cache de dados de tarefas limpo');
    } catch (error) {
      console.error('❌ Erro ao limpar cache de dados de tarefas:', error);
    }
  }

  static save(data: CachedTaskData): void {
    try {
      const existingData = this.getAll();
      const key = `${data.fileName}_${data.operatorName}`;
      existingData[key] = data;
      
      localStorage.setItem(CACHE_KEYS.TASK_DATA, JSON.stringify(existingData));
      console.log('✅ Dados de tarefas salvos no cache:', key);
    } catch (error) {
      console.error('❌ Erro ao salvar dados de tarefas no cache:', error);
    }
  }

  static get(fileName: string, operatorName: string): CachedTaskData | null {
    try {
      const key = `${fileName}_${operatorName}`;
      const allData = this.getAll();
      return allData[key] || null;
    } catch (error) {
      console.error('❌ Erro ao recuperar dados de tarefas do cache:', error);
      return null;
    }
  }

  static getAll(): Record<string, CachedTaskData> {
    try {
      const data = localStorage.getItem(CACHE_KEYS.TASK_DATA);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('❌ Erro ao recuperar todos os dados de tarefas:', error);
      return {};
    }
  }

  static isValid(cached: CachedTaskData, currentFileHash: string): boolean {
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000; // 24 horas em ms
    
    return (
      cached.fileHash === currentFileHash &&
      (now - cached.processedAt) < oneDay
    );
  }
}

// Cache para arquivos parseados
export class FileDataCache {
  static save(data: CachedFileData): void {
    try {
      const existingData = this.getAll();
      existingData[data.fileName] = data;
      
      localStorage.setItem(CACHE_KEYS.FILE_DATA, JSON.stringify(existingData));
      console.log('✅ Arquivo parseado salvo no cache:', data.fileName);
    } catch (error) {
      console.error('❌ Erro ao salvar arquivo no cache:', error);
    }
  }

  static get(fileName: string): CachedFileData | null {
    try {
      const allData = this.getAll();
      return allData[fileName] || null;
    } catch (error) {
      console.error('❌ Erro ao recuperar arquivo do cache:', error);
      return null;
    }
  }

  static getAll(): Record<string, CachedFileData> {
    try {
      const data = localStorage.getItem(CACHE_KEYS.FILE_DATA);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('❌ Erro ao recuperar todos os arquivos:', error);
      return {};
    }
  }

  static clear(): void {
    try {
      localStorage.removeItem(CACHE_KEYS.FILE_DATA);
      console.log('🗑️ Cache de arquivos limpo');
    } catch (error) {
      console.error('❌ Erro ao limpar cache de arquivos:', error);
    }
  }

  static isValid(cached: CachedFileData, currentFileHash: string): boolean {
    const now = Date.now();
    const oneWeek = 7 * 24 * 60 * 60 * 1000; // 7 dias em ms
    
    return (
      cached.fileHash === currentFileHash &&
      (now - cached.parsedAt) < oneWeek
    );
  }
}

// Histórico de operadores
export class OperatorHistoryCache {
  static addOperator(operatorName: string): void {
    try {
      const history = this.getHistory();
      const filtered = history.filter(name => name !== operatorName);
      const newHistory = [operatorName, ...filtered].slice(0, 10); // Manter apenas os 10 mais recentes
      
      localStorage.setItem(CACHE_KEYS.OPERATOR_HISTORY, JSON.stringify(newHistory));
      console.log('✅ Operador adicionado ao histórico:', operatorName);
    } catch (error) {
      console.error('❌ Erro ao salvar histórico de operadores:', error);
    }
  }

  static save(operatorName: string): void {
    this.addOperator(operatorName);
  }

  static getHistory(): string[] {
    try {
      const data = localStorage.getItem(CACHE_KEYS.OPERATOR_HISTORY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('❌ Erro ao recuperar histórico de operadores:', error);
      return [];
    }
  }

  static getAll(): string[] {
    return this.getHistory();
  }

  static clear(): void {
    try {
      localStorage.removeItem(CACHE_KEYS.OPERATOR_HISTORY);
      console.log('🗑️ Histórico de operadores limpo');
    } catch (error) {
      console.error('❌ Erro ao limpar histórico de operadores:', error);
    }
  }
}

// Utilitário para limpar todo o cache
export function clearAllCache(): void {
  TaskDataCache.clear();
  FileDataCache.clear();
  OperatorHistoryCache.clear();
  console.log('🗑️ Todo o cache foi limpo');
}

// Utilitário para obter estatísticas do cache
export function getCacheStats(): {
  taskDataCount: number;
  fileDataCount: number;
  operatorHistoryCount: number;
  totalSize: string;
} {
  const taskData = TaskDataCache.getAll();
  const fileData = FileDataCache.getAll();
  const operatorHistory = OperatorHistoryCache.getAll();
  
  // Calcular tamanho aproximado
  const taskDataSize = JSON.stringify(taskData).length;
  const fileDataSize = JSON.stringify(fileData).length;
  const operatorHistorySize = JSON.stringify(operatorHistory).length;
  const totalBytes = taskDataSize + fileDataSize + operatorHistorySize;
  
  const totalSize = totalBytes > 1024 * 1024 
    ? `${(totalBytes / (1024 * 1024)).toFixed(2)} MB`
    : totalBytes > 1024 
    ? `${(totalBytes / 1024).toFixed(2)} KB`
    : `${totalBytes} bytes`;

  return {
    taskDataCount: Object.keys(taskData).length,
    fileDataCount: Object.keys(fileData).length,
    operatorHistoryCount: operatorHistory.length,
    totalSize
  };
}