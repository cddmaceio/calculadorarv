import { 
  TaskDataCache, 
  FileDataCache, 
  OperatorHistoryCache, 
  generateFileHash,
  type CachedTaskData,
  type CachedFileData 
} from './dataCache';

export interface TaskRow {
  Tipo: string;
  'Data Última Associação': string;
  'Data de Alteração': string;
  'Concluída Task': string;
  Usuário: string;
}

export interface TaskMeta {
  tipo: string;
  meta_segundos: number;
}

export const TASK_METAS: TaskMeta[] = [
  { tipo: 'Armazenagem (Mapa)', meta_segundos: 30 },
  { tipo: 'Carregamento AG', meta_segundos: 10 },
  { tipo: 'Carregamento Palete Fechado (AS)', meta_segundos: 10 },
  { tipo: 'Carregamento Palete Fechado (Rota)', meta_segundos: 10 },
  { tipo: 'Carregamento Palete Misto (AS)', meta_segundos: 10 },
  { tipo: 'Carregamento Palete Misto (Rota)', meta_segundos: 10 },
  { tipo: 'Movimentação de Remontagem', meta_segundos: 30 },
  { tipo: 'Movimentação Interna - Manual', meta_segundos: 30 },
  { tipo: 'Puxada Descarregamento', meta_segundos: 10 },
  { tipo: 'Ressuprimento Inteligente - Demanda', meta_segundos: 30 },
  { tipo: 'Ressuprimento Inteligente - Execução', meta_segundos: 30 },
  { tipo: 'Ressuprimento Manual', meta_segundos: 30 },
  { tipo: 'Retorno de Rota (Descarregamento)', meta_segundos: 10 },
];

export function parseDateTime(dateTimeStr: string): Date | null {
  if (!dateTimeStr || dateTimeStr.trim() === '') return null;
  
  // Formato esperado: DD/MM/YYYY HH:mm:ss
  const match = dateTimeStr.match(/(\d{2})\/(\d{2})\/(\d{4})\s+(\d{2}):(\d{2}):(\d{2})/);
  if (match) {
    const [, day, month, year, hour, minute, second] = match;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day), 
                   parseInt(hour), parseInt(minute), parseInt(second));
  }
  
  return null;
}

export interface ValidTaskDetail {
  tipo: string;
  quantidade: number;
  meta_segundos: number;
}

// Função simples para verificar se o nome do operador corresponde
function isOperatorMatch(taskOperator: string, searchOperator: string): boolean {
  if (!taskOperator || !searchOperator) return false;
  
  const taskName = taskOperator.trim().toUpperCase();
  const searchName = searchOperator.trim().toUpperCase();
  
  // Match exato ou um contém o outro
  return taskName === searchName || 
         taskName.includes(searchName) || 
         searchName.includes(taskName);
}

export function calculateValidTasks(
  tasks: TaskRow[], 
  operatorName?: string,
  fileName?: string,
  fileHash?: string
): { total: number; detalhes: ValidTaskDetail[] } {
  console.log('=== PROCESSAMENTO DE TAREFAS VÁLIDAS ===');
  console.log('Operador procurado:', operatorName);
  console.log('Total de tarefas:', tasks.length);
  
  // Listar operadores únicos encontrados no arquivo
  const uniqueOperators = [...new Set(tasks.map(t => t.Usuário?.trim()).filter(Boolean))];
  console.log('📋 Operadores únicos no arquivo:', uniqueOperators.length);
  console.log('📋 Primeiros 10 operadores:', uniqueOperators.slice(0, 10));

  if (!operatorName || tasks.length === 0) {
    return { total: 0, detalhes: [] };
  }

  // Verificar cache primeiro
  if (fileName && fileHash) {
    const cached = TaskDataCache.get(fileName, operatorName);
    if (cached && TaskDataCache.isValid(cached, fileHash)) {
      console.log('✅ Dados encontrados no cache, usando resultado armazenado');
      return { 
        total: cached.validTasksCount, 
        detalhes: cached.validTasksDetails 
      };
    }
  }

  // Salvar operador no histórico
  OperatorHistoryCache.save(operatorName);

  // Agrupar tarefas por tipo para relatório detalhado
  const tasksByType: { [tipo: string]: { valid: number; invalid: number; total: number } } = {};
  let operatorTasksCount = 0;
  let completedTasksCount = 0;
  let totalValidTasks = 0;

  // Processar todas as tarefas do operador
  for (const task of tasks) {
    // Verificar se é do operador
    if (!isOperatorMatch(task.Usuário, operatorName)) {
      continue;
    }
    
    operatorTasksCount++;
    
    if (operatorTasksCount === 1) {
      console.log('🔍 Primeira tarefa do operador encontrada:', {
        tipo: task.Tipo,
        usuario: task.Usuário,
        concluida: task['Concluída Task'],
        dataAssociacao: task['Data Última Associação'],
        dataAlteracao: task['Data de Alteração']
      });
    }
    
    // Verificar se tarefa foi concluída
    if (task['Concluída Task'] !== '1') {
      continue;
    }

    completedTasksCount++;

    // Inicializar contador do tipo se não existe
    if (!tasksByType[task.Tipo]) {
      tasksByType[task.Tipo] = { valid: 0, invalid: 0, total: 0 };
    }
    tasksByType[task.Tipo].total++;

    // Validar tarefa baseado no critério: Data de Alteração - Data Última Associação > 10 segundos
    const dataAssociacao = parseDateTime(task['Data Última Associação']);
    const dataAlteracao = parseDateTime(task['Data de Alteração']);
    
    if (!dataAssociacao || !dataAlteracao) {
      tasksByType[task.Tipo].invalid++;
      console.log(`❌ Tarefa com data inválida: ${task.Tipo} - Associação: "${task['Data Última Associação']}" - Alteração: "${task['Data de Alteração']}"`);
      continue;
    }
    
    // Calcular tempo de execução: Data de Alteração - Data Última Associação
    const tempoExecucaoMs = dataAlteracao.getTime() - dataAssociacao.getTime();
    const tempoExecucaoSegundos = tempoExecucaoMs / 1000;
    
    // Debug para as primeiras 3 tarefas
    const totalProcessed = totalValidTasks + tasksByType[task.Tipo].invalid;
    if (totalProcessed < 3) {
      console.log(`🔍 Tarefa ${totalProcessed + 1}:`, {
        tipo: task.Tipo,
        dataAssociacao: task['Data Última Associação'],
        dataAlteracao: task['Data de Alteração'],
        diferencaSegundos: tempoExecucaoSegundos.toFixed(2),
        valida: tempoExecucaoSegundos > 10 ? '✅' : '❌'
      });
    }
    
    // Critério de validação: tempo > 10 segundos
    if (tempoExecucaoSegundos > 10) {
      tasksByType[task.Tipo].valid++;
      totalValidTasks++;
      console.log(`✅ Tarefa válida: ${task.Tipo} - Tempo: ${tempoExecucaoSegundos.toFixed(2)}s`);
    } else {
      tasksByType[task.Tipo].invalid++;
      console.log(`❌ Tarefa inválida: ${task.Tipo} - Tempo: ${tempoExecucaoSegundos.toFixed(2)}s (≤ 10s)`);
    }
  }

  console.log('Tarefas do operador encontradas:', operatorTasksCount);
  console.log('Tarefas concluídas:', completedTasksCount);
  console.log('Tipos de tarefa encontrados:', Object.keys(tasksByType));

  // Criar detalhes para relatório
  const detalhes: ValidTaskDetail[] = [];
  for (const [tipo, counts] of Object.entries(tasksByType)) {
    if (counts.valid > 0) {
      detalhes.push({
        tipo: tipo,
        quantidade: counts.valid,
        meta_segundos: 10 // Critério fixo: > 10 segundos
      });
    }
    console.log(`${tipo}: ${counts.valid} válidas / ${counts.invalid} inválidas / ${counts.total} total`);
  }

  console.log('TOTAL DE TAREFAS VÁLIDAS:', totalValidTasks);
  console.log('VALOR TOTAL: R$', (totalValidTasks * 0.093).toFixed(2));

  // Salvar no cache se temos informações do arquivo
  if (fileName && fileHash) {
    const cacheData: CachedTaskData = {
      fileName,
      fileSize: tasks.length,
      fileHash,
      operatorName,
      processedAt: Date.now(),
      validTasksCount: totalValidTasks,
      validTasksDetails: detalhes,
      parsedTasks: tasks
    };
    TaskDataCache.save(cacheData);
  }

  return { total: totalValidTasks, detalhes };
}

export function parseCSV(csvContent: string, fileName?: string): TaskRow[] {
  console.log('=== PARSING CSV ===');
  
  const lines = csvContent.split('\n').filter(line => line.trim());
  if (lines.length < 2) {
    console.log('Arquivo vazio ou inválido');
    return [];
  }

  // Gerar hash do conteúdo para cache
  const fileHash = generateFileHash(csvContent);
  
  // Verificar cache primeiro
  if (fileName) {
    const cached = FileDataCache.get(fileName);
    if (cached && FileDataCache.isValid(cached, fileHash)) {
      console.log('✅ Arquivo encontrado no cache, usando dados parseados armazenados');
      console.log('Tarefas do cache:', cached.parsedTasks.length);
      return cached.parsedTasks;
    }
  }

  console.log('📄 Parseando arquivo CSV...');
  console.log('Total de linhas:', lines.length);
  
  // Usar primeira linha como header de referência
  const headerLine = lines[0];
  console.log('Header:', headerLine.substring(0, 200) + (headerLine.length > 200 ? '...' : ''));

  // Encontrar posições dos campos obrigatórios
  const requiredFields = ['Tipo', 'Data Última Associação', 'Data de Alteração', 'Concluída Task', 'Usuário'];
  const fieldPositions: { [field: string]: number } = {};
  
  for (const field of requiredFields) {
    const pos = headerLine.indexOf(field);
    if (pos !== -1) {
      fieldPositions[field] = pos;
    }
  }

  console.log('Posições dos campos:', fieldPositions);

  // Se não encontrou todos os campos, tentar parsing por separador
  if (Object.keys(fieldPositions).length < requiredFields.length) {
    console.log('Tentando parsing por separador...');
    const tasks = parseCSVBySeparator(lines);
    
    // Salvar no cache se o parsing foi bem-sucedido
    if (fileName && tasks.length > 0) {
      const cacheData: CachedFileData = {
        fileName,
        fileSize: tasks.length,
        fileHash,
        parsedAt: Date.now(),
        parsedTasks: tasks
      };
      FileDataCache.save(cacheData);
    }
    
    return tasks;
  }

  // Parsing por posição
  const tasks: TaskRow[] = [];
  const sortedFields = Object.entries(fieldPositions).sort((a, b) => a[1] - b[1]);
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    const task: any = {};
    
    for (let j = 0; j < sortedFields.length; j++) {
      const [fieldName, startPos] = sortedFields[j];
      const endPos = j < sortedFields.length - 1 ? sortedFields[j + 1][1] : line.length;
      
      let value = line.substring(startPos, endPos).trim();
      // Remover header se apareceu na linha
      if (value.startsWith(fieldName)) {
        value = value.substring(fieldName.length).trim();
      }
      
      task[fieldName] = value;
    }

    // Validar se tem dados mínimos
    if (task['Tipo'] && task['Usuário'] && task['Usuário'].trim() !== '') {
      tasks.push(task as TaskRow);
    }
  }

  console.log('✅ Tarefas parseadas:', tasks.length);
  if (tasks.length > 0) {
    console.log('Primeira tarefa:', tasks[0]);
    const operators = [...new Set(tasks.map(t => t.Usuário?.trim()).filter(Boolean))];
    console.log('Operadores encontrados:', operators.slice(0, 10), operators.length > 10 ? `... e mais ${operators.length - 10}` : '');
    
    // Salvar no cache
    if (fileName) {
      const cacheData: CachedFileData = {
        fileName,
        fileSize: tasks.length,
        fileHash,
        parsedAt: Date.now(),
        parsedTasks: tasks
      };
      FileDataCache.save(cacheData);
    }
  }

  return tasks;
}

function parseCSVBySeparator(lines: string[]): TaskRow[] {
  console.log('🔍 Tentando parsing por separador...');
  
  const separators = [';', '\t', ','];
  let bestSeparator = '';
  let maxFields = 0;
  
  // Encontrar o melhor separador
  for (const sep of separators) {
    const fields = lines[0].split(sep);
    if (fields.length > maxFields) {
      maxFields = fields.length;
      bestSeparator = sep;
    }
  }
  
  if (!bestSeparator) {
    // Tentar separar por múltiplos espaços
    console.log('🔍 Tentando separar por espaços...');
    const spaceHeaders = lines[0].split(/\s{2,}/);
    if (spaceHeaders.length > 1) {
      bestSeparator = /\s{2,}/ as any;
    }
  }
  
  console.log('📋 Separador escolhido:', typeof bestSeparator === 'object' ? 'múltiplos espaços' : bestSeparator);
  
  if (!bestSeparator) {
    console.log('❌ Nenhum separador válido encontrado');
    return [];
  }
  
  const headers = typeof bestSeparator === 'string' 
    ? lines[0].split(bestSeparator) 
    : lines[0].split(bestSeparator);
    
  console.log('📋 Headers encontrados:', headers.length, 'campos');
  console.log('📋 Primeiros headers:', headers.slice(0, 5).map(h => h.trim()));
  
  const tasks: TaskRow[] = [];
  let validTasks = 0;
  let invalidTasks = 0;
  
  for (let i = 1; i < lines.length; i++) {
    const values = typeof bestSeparator === 'string' 
      ? lines[i].split(bestSeparator) 
      : lines[i].split(bestSeparator);
      
    const task: any = {};
    
    for (let j = 0; j < headers.length && j < values.length; j++) {
      const header = headers[j].trim();
      const value = values[j].trim();
      task[header] = value;
    }
    
    // Validar se tem dados mínimos
    if (task['Tipo'] && task['Usuário'] && task['Usuário'].trim() !== '') {
      tasks.push(task as TaskRow);
      validTasks++;
    } else {
      invalidTasks++;
    }
  }
  
  console.log('✅ Tarefas parseadas por separador:', validTasks);
  if (invalidTasks > 0) {
    console.log('⚠️ Tarefas inválidas ignoradas:', invalidTasks);
  }
  
  return tasks;
}
