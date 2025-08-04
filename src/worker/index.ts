import { Hono } from "hono";
import { zValidator } from "@hono/zod-validator";
import { ActivitySchema, KPISchema, CalculatorInputSchema, UserSchema, LaunchSchema, LoginSchema, BaseRVSchema } from "@/shared/types";
import { cors } from 'hono/cors';

interface Env {
  DB: any;
}

const app = new Hono<{ Bindings: Env }>();

app.use('*', cors());

// Activities endpoints
app.get('/api/activities', async (c) => {
  const db = c.env.DB;
  const activities = await db.prepare('SELECT * FROM activities ORDER BY created_at DESC').all();
  return c.json(activities.results);
});

app.post('/api/activities', zValidator('json', ActivitySchema), async (c) => {
  const db = c.env.DB;
  const data = c.req.valid('json');
  
  const result = await db.prepare(`
    INSERT INTO activities (nome_atividade, nivel_atividade, valor_atividade, created_at, updated_at)
    VALUES (?, ?, ?, datetime('now'), datetime('now'))
  `).bind(data.nome_atividade, data.nivel_atividade, data.valor_atividade).run();
  
  if (result.success) {
    const activity = await db.prepare('SELECT * FROM activities WHERE id = ?').bind(result.meta.last_row_id).first();
    return c.json(activity);
  }
  
  return c.json({ error: 'Failed to create activity' }, 500);
});

app.put('/api/activities/:id', zValidator('json', ActivitySchema), async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const data = c.req.valid('json');
  
  const result = await db.prepare(`
    UPDATE activities 
    SET nome_atividade = ?, nivel_atividade = ?, valor_atividade = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(data.nome_atividade, data.nivel_atividade, data.valor_atividade, id).run();
  
  if (result.success) {
    const activity = await db.prepare('SELECT * FROM activities WHERE id = ?').bind(id).first();
    return c.json(activity);
  }
  
  return c.json({ error: 'Activity not found' }, 404);
});

app.delete('/api/activities/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  
  const result = await db.prepare('DELETE FROM activities WHERE id = ?').bind(id).run();
  
  if (result.success) {
    return c.json({ success: true });
  }
  
  return c.json({ error: 'Activity not found' }, 404);
});

// KPIs endpoints
app.get('/api/kpis', async (c) => {
  const db = c.env.DB;
  const kpis = await db.prepare('SELECT * FROM kpis ORDER BY created_at DESC').all();
  return c.json(kpis.results);
});

app.post('/api/kpis', zValidator('json', KPISchema), async (c) => {
  const db = c.env.DB;
  const data = c.req.valid('json');
  
  const result = await db.prepare(`
    INSERT INTO kpis (nome_kpi, valor_meta_kpi, peso_kpi, turno_kpi, funcao_kpi, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(data.nome_kpi, data. valor_meta_kpi, data.peso_kpi, data.turno_kpi, data.funcao_kpi).run();
  
  if (result.success) {
    const kpi = await db.prepare('SELECT * FROM kpis WHERE id = ?').bind(result.meta.last_row_id).first();
    return c.json(kpi);
  }
  
  return c.json({ error: 'Failed to create KPI' }, 500);
});

app.put('/api/kpis/:id', zValidator('json', KPISchema), async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const data = c.req.valid('json');
  
  const result = await db.prepare(`
    UPDATE kpis 
    SET nome_kpi = ?, valor_meta_kpi = ?, peso_kpi = ?, turno_kpi = ?, funcao_kpi = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(data.nome_kpi, data.valor_meta_kpi, data.peso_kpi, data.turno_kpi, data.funcao_kpi, id).run();
  
  if (result.success) {
    const kpi = await db.prepare('SELECT * FROM kpis WHERE id = ?').bind(id).first();
    return c.json(kpi);
  }
  
  return c.json({ error: 'KPI not found' }, 404);
});

app.delete('/api/kpis/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  
  const result = await db.prepare('DELETE FROM kpis WHERE id = ?').bind(id).run();
  
  if (result.success) {
    return c.json({ success: true });
  }
  
  return c.json({ error: 'KPI not found' }, 404);
});

// Get available KPIs for function/shift
app.get('/api/kpis/available', async (c) => {
  const db = c.env.DB;
  const funcao = c.req.query('funcao');
  const turno = c.req.query('turno');
  
  if (!funcao || !turno) {
    return c.json({ error: 'Função e turno são obrigatórios' }, 400);
  }
  
  const kpis = await db.prepare(`
    SELECT * FROM kpis 
    WHERE funcao_kpi = ? AND (turno_kpi = ? OR turno_kpi = 'Geral')
    ORDER BY nome_kpi
  `).bind(funcao, turno).all();
  
  return c.json(kpis.results);
});

// Function to calculate working days in a month (Monday to Saturday)
function calculateWorkingDays(month: number, year: number = new Date().getFullYear()): number {
  const daysInMonth = new Date(year, month, 0).getDate();
  let workingDays = 0;
  
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month - 1, day);
    const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
    
    // Count Monday (1) to Saturday (6), exclude Sunday (0)
    if (dayOfWeek >= 1 && dayOfWeek <= 6) {
      workingDays++;
    }
  }
  
  return workingDays;
}

// Users endpoints
app.get('/api/users', async (c) => {
  const db = c.env.DB;
  const users = await db.prepare('SELECT * FROM usuarios WHERE ativo = 1 ORDER BY nome').all();
  // Convert numeric ativo to boolean for all users
  const usersWithBooleanAtivo = users.results.map((user: any) => ({
    ...user,
    ativo: Boolean(user.ativo)
  }));
  return c.json(usersWithBooleanAtivo);
});

app.post('/api/users', zValidator('json', UserSchema), async (c) => {
  const db = c.env.DB;
  const data = c.req.valid('json');
  
  const result = await db.prepare(`
    INSERT INTO usuarios (cpf, nome, funcao, turno, perfil, ativo, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(data.cpf, data.nome, data.funcao, data.turno, data.perfil || 'Operador', data.ativo ? 1 : 0).run();
  
  if (result.success) {
    const user = await db.prepare('SELECT * FROM usuarios WHERE id = ?').bind(result.meta.last_row_id).first();
    // Convert numeric ativo to boolean
    if (user) {
      user.ativo = Boolean(user.ativo);
    }
    return c.json(user);
  }
  
  return c.json({ error: 'Failed to create user' }, 500);
});

app.put('/api/users/:id', zValidator('json', UserSchema), async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  const data = c.req.valid('json');
  
  const result = await db.prepare(`
    UPDATE usuarios 
    SET cpf = ?, nome = ?, funcao = ?, turno = ?, perfil = ?, ativo = ?, updated_at = datetime('now')
    WHERE id = ?
  `).bind(data.cpf, data.nome, data.funcao, data.turno, data.perfil || 'Operador', data.ativo ? 1 : 0, id).run();
  
  if (result.success) {
    const user = await db.prepare('SELECT * FROM usuarios WHERE id = ?').bind(id).first();
    // Convert numeric ativo to boolean
    if (user) {
      user.ativo = Boolean(user.ativo);
    }
    return c.json(user);
  }
  
  return c.json({ error: 'User not found' }, 404);
});

app.delete('/api/users/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  
  const result = await db.prepare('UPDATE usuarios SET ativo = 0 WHERE id = ?').bind(id).run();
  
  if (result.success) {
    return c.json({ success: true });
  }
  
  return c.json({ error: 'User not found' }, 404);
});

// Login endpoint
app.post('/api/login', zValidator('json', LoginSchema), async (c) => {
  const db = c.env.DB;
  const { cpf } = c.req.valid('json');
  
  const user = await db.prepare('SELECT * FROM usuarios WHERE cpf = ? AND ativo = 1').bind(cpf).first();
  
  if (user) {
    // Convert numeric ativo to boolean
    user.ativo = Boolean(user.ativo);
    return c.json(user);
  }
  
  return c.json({ error: 'Usuário não encontrado' }, 404);
});

// Launches endpoints
app.get('/api/launches', async (c) => {
  const db = c.env.DB;
  const usuario_cpf = c.req.query('usuario_cpf');
  const limit = parseInt(c.req.query('limit') || '50');
  
  let query = 'SELECT * FROM lancamentos';
  let params: any[] = [];
  
  if (usuario_cpf) {
    query += ' WHERE usuario_cpf = ?';
    params.push(usuario_cpf);
  }
  
  query += ' ORDER BY data_lancamento DESC, created_at DESC LIMIT ?';
  params.push(limit);
  
  const launches = await db.prepare(query).bind(...params).all();
  
  // Parse JSON fields
  const parsedLaunches = launches.results.map((launch: any) => ({
    ...launch,
    kpis_atingidos: launch.kpis_atingidos ? JSON.parse(launch.kpis_atingidos) : [],
    multiple_activities: launch.multiple_activities ? JSON.parse(launch.multiple_activities) : null,
  }));
  
  return c.json(parsedLaunches);
});

app.post('/api/launches', zValidator('json', LaunchSchema), async (c) => {
  const db = c.env.DB;
  const data = c.req.valid('json');
  
  const result = await db.prepare(`
    INSERT INTO lancamentos (
      usuario_id, usuario_cpf, usuario_nome, nome_atividade, funcao, turno,
      quantidade_produzida, tempo_horas, input_adicional, kpis_atingidos,
      multiple_activities, nome_operador, valid_tasks_count, mes_referencia,
      subtotal_atividades, bonus_kpis, remuneracao_total, produtividade_alcancada,
      nivel_atingido, data_lancamento, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `).bind(
    data.usuario_id,
    data.usuario_cpf,
    data.usuario_nome,
    data.nome_atividade || null,
    data.funcao,
    data.turno,
    data.quantidade_produzida || null,
    data.tempo_horas || null,
    data.input_adicional || 0,
    data.kpis_atingidos ? JSON.stringify(data.kpis_atingidos) : null,
    data.multiple_activities ? JSON.stringify(data.multiple_activities) : null,
    data.nome_operador || null,
    data.valid_tasks_count || null,
    data.mes_referencia || null,
    data.subtotal_atividades,
    data.bonus_kpis,
    data.remuneracao_total,
    data.produtividade_alcancada || null,
    data.nivel_atingido || null,
    data.data_lancamento
  ).run();
  
  if (result.success) {
    const launch = await db.prepare('SELECT * FROM lancamentos WHERE id = ?').bind(result.meta.last_row_id).first();
    return c.json(launch);
  }
  
  return c.json({ error: 'Failed to create launch' }, 500);
});

// Get user summary
app.get('/api/users/:cpf/summary', async (c) => {
  const db = c.env.DB;
  const cpf = c.req.param('cpf');
  const mes = parseInt(c.req.query('mes') || new Date().getMonth() + 1 + '');
  const ano = parseInt(c.req.query('ano') || new Date().getFullYear() + '');
  
  // Get user info
  const user = await db.prepare('SELECT * FROM usuarios WHERE cpf = ? AND ativo = 1').bind(cpf).first();
  if (!user) {
    return c.json({ error: 'Usuário não encontrado' }, 404);
  }
  
  // Convert numeric ativo to boolean
  user.ativo = Boolean(user.ativo);
  
  // Get launches for the month
  const launches = await db.prepare(`
    SELECT * FROM lancamentos 
    WHERE usuario_cpf = ? 
    AND strftime('%m', data_lancamento) = ? 
    AND strftime('%Y', data_lancamento) = ?
    ORDER BY data_lancamento DESC
  `).bind(cpf, mes.toString().padStart(2, '0'), ano.toString()).all();
  
  // Calculate totals
  const totalLaunches = launches.results.length;
  const totalRemuneracao = launches.results.reduce((sum: number, launch: any) => sum + launch.remuneracao_total, 0);
  const totalAtividades = launches.results.reduce((sum: number, launch: any) => sum + launch.subtotal_atividades, 0);
  const totalKpis = launches.results.reduce((sum: number, launch: any) => sum + launch.bonus_kpis, 0);
  
  // Count KPIs achieved
  const kpisCount: { [key: string]: number } = {};
  launches.results.forEach((launch: any) => {
    if (launch.kpis_atingidos) {
      const kpis = JSON.parse(launch.kpis_atingidos);
      kpis.forEach((kpi: string) => {
        kpisCount[kpi] = (kpisCount[kpi] || 0) + 1;
      });
    }
  });
  
  return c.json({
    user,
    mes,
    ano,
    totalLaunches,
    totalRemuneracao,
    totalAtividades,
    totalKpis,
    kpisCount,
    launches: launches.results.slice(0, 10) // Last 10 launches
  });
});

// Calculator endpoint
app.post('/api/calculate', zValidator('json', CalculatorInputSchema), async (c) => {
  const db = c.env.DB;
  const { 
    nome_atividade, 
    funcao, 
    turno, 
    quantidade_produzida, 
    tempo_horas, 
    input_adicional, 
    kpis_atingidos,
    multiple_activities,
    valid_tasks_count,
    mes_referencia
  } = c.req.valid('json');
  
  let subtotal_atividades = 0;
  let atividades_detalhes: any[] = [];
  let produtividade_alcancada: number | undefined;
  let nivel_atingido: string | undefined;
  let unidade_medida: string | undefined;
  let tarefas_validas: number | undefined;
  let valor_tarefas: number | undefined;

  // Handle multiple activities for Ajudantes de Armazém
  if (funcao === 'Ajudante de Armazém' && multiple_activities && multiple_activities.length > 0) {
    for (const activity of multiple_activities) {
      const produtividade = activity.quantidade_produzida / activity.tempo_horas;
      
      // Get activities for this activity name, ordered by produtividade_minima descending
      const activities = await db.prepare(`
        SELECT * FROM activities 
        WHERE nome_atividade = ? 
        ORDER BY produtividade_minima DESC
      `).bind(activity.nome_atividade).all();
      
      if (activities.results && activities.results.length > 0) {
        // Find the appropriate level based on productivity
        let selectedActivity = null;
        for (const act of activities.results as any[]) {
          if (produtividade >= act.produtividade_minima) {
            selectedActivity = act;
            break;
          }
        }
        
        // If no level achieved, use the lowest level
        if (!selectedActivity) {
          selectedActivity = activities.results[activities.results.length - 1] as any;
        }
        
        // Calculate value for this activity (applying 50% rule: atividades/2)
        const valor_bruto = activity.quantidade_produzida * selectedActivity.valor_atividade;
        const valor_final = valor_bruto / 2;
        subtotal_atividades += valor_final;
        
        atividades_detalhes.push({
          nome: activity.nome_atividade,
          produtividade: produtividade,
          nivel: selectedActivity.nivel_atividade,
          valor_total: valor_final,
          unidade: selectedActivity.unidade_medida || 'unidades'
        });
      }
    }
  }
  // Handle valid tasks for Operador de Empilhadeira
  else if (funcao === 'Operador de Empilhadeira' && valid_tasks_count !== undefined) {
    tarefas_validas = valid_tasks_count;
    valor_tarefas = valid_tasks_count * 0.093; // R$ 0,093 per valid task
    subtotal_atividades = valor_tarefas / 2; // Apply 50% rule
  }
  // Handle single activity for other functions
  else if (nome_atividade && quantidade_produzida && tempo_horas) {
    // Calculate productivity (quantity per hour)
    produtividade_alcancada = quantidade_produzida / tempo_horas;
    
    // Get activities for this activity name, ordered by produtividade_minima descending
    const activities = await db.prepare(`
      SELECT * FROM activities 
      WHERE nome_atividade = ? 
      ORDER BY produtividade_minima DESC
    `).bind(nome_atividade).all();
    
    if (!activities.results || activities.results.length === 0) {
      return c.json({ error: 'Atividade não encontrada' }, 404);
    }
    
    // Find the appropriate level based on productivity
    let selectedActivity = null;
    for (const activity of activities.results as any[]) {
      if (produtividade_alcancada >= activity.produtividade_minima) {
        selectedActivity = activity;
        break;
      }
    }
    
    // If no level achieved, use the lowest level
    if (!selectedActivity) {
      selectedActivity = activities.results[activities.results.length - 1] as any;
    }
    
    // Calculate subtotal from activities (applying 50% rule: atividades/2)
    const valor_bruto_atividades = quantidade_produzida * selectedActivity.valor_atividade;
    subtotal_atividades = valor_bruto_atividades / 2;
    
    nivel_atingido = selectedActivity.nivel_atividade;
    unidade_medida = selectedActivity.unidade_medida;
  }
  
  // Get applicable KPIs and calculate bonus
  let bonus_kpis = 0;
  const kpis_atingidos_resultado: string[] = [];
  
  if (kpis_atingidos && kpis_atingidos.length > 0) {
    const kpis = await db.prepare(`
      SELECT * FROM kpis 
      WHERE funcao_kpi = ? AND (turno_kpi = ? OR turno_kpi = 'Geral') AND nome_kpi IN (${kpis_atingidos.map(() => '?').join(',')})
    `).bind(funcao, turno, ...kpis_atingidos).all();
    

    
    for (const kpi of kpis.results as any[]) {
        // Each KPI has a daily value based on working days
        // Base: 25% of R$ 300 = R$ 75.00 per month per KPI
        // Daily value: R$ 75.00 / working_days_of_month
        const currentMonth = mes_referencia || new Date().getMonth() + 1;
        const workingDays = calculateWorkingDays(currentMonth);
        const dailyKpiValue = 75 / workingDays; // Daily value per KPI
        
        bonus_kpis += dailyKpiValue;
        kpis_atingidos_resultado.push(kpi.nome_kpi);
      }
  }
  
  // Final calculation: atividades/2 + kpi1 + kpi2 + extras
  const atividades_extras = input_adicional || 0;
  const remuneracao_total = subtotal_atividades + bonus_kpis + atividades_extras;
  
  // Calculate KPI details for display
  const currentMonth = mes_referencia || new Date().getMonth() + 1;
  const workingDays = calculateWorkingDays(currentMonth);
  const dailyKpiValue = 75 / workingDays; // Daily value per KPI
  
  const result: any = {
    subtotal_atividades,
    bonus_kpis,
    remuneracao_total,
    kpis_atingidos: kpis_atingidos_resultado,
    // KPI calculation details
    mes_referencia: currentMonth,
    dias_uteis: workingDays,
    valor_kpi_unitario: dailyKpiValue, // Daily value per KPI
  };

  // Add optional fields only if they exist
  if (produtividade_alcancada !== undefined) result.produtividade_alcancada = produtividade_alcancada;
  if (nivel_atingido !== undefined) result.nivel_atingido = nivel_atingido;
  if (unidade_medida !== undefined) result.unidade_medida = unidade_medida;
  if (atividades_detalhes.length > 0) result.atividades_detalhes = atividades_detalhes;
  if (tarefas_validas !== undefined) result.tarefas_validas = tarefas_validas;
  if (valor_tarefas !== undefined) result.valor_tarefas = valor_tarefas;
  
  return c.json(result);
});

// Get unique functions from KPIs
app.get('/api/functions', async (c) => {
  const db = c.env.DB;
  const functions = await db.prepare('SELECT DISTINCT funcao_kpi as funcao FROM kpis ORDER BY funcao_kpi').all();
  return c.json(functions.results);
});

// Get unique activity names
app.get('/api/activity-names', async (c) => {
  const db = c.env.DB;
  const activityNames = await db.prepare('SELECT DISTINCT nome_atividade FROM activities ORDER BY nome_atividade').all();
  return c.json(activityNames.results);
});

// Base RV endpoints
app.get('/api/base_rv', async (c) => {
  const db = c.env.DB;
  const usuario_cpf = c.req.query('usuario_cpf');
  const mes = c.req.query('mes');
  const ano = c.req.query('ano');
  const limit = parseInt(c.req.query('limit') || '50');
  
  let query = 'SELECT * FROM base_rv';
  let params: any[] = [];
  const conditions: string[] = [];
  
  if (usuario_cpf) {
    conditions.push('usuario_cpf = ?');
    params.push(usuario_cpf);
  }
  
  if (mes && ano) {
    conditions.push("strftime('%m', data_lancamento) = ? AND strftime('%Y', data_lancamento) = ?");
    params.push(mes.padStart(2, '0'), ano);
  }
  
  if (conditions.length > 0) {
    query += ' WHERE ' + conditions.join(' AND ');
  }
  
  query += ' ORDER BY data_lancamento DESC, created_at DESC LIMIT ?';
  params.push(limit);
  
  const baseRVs = await db.prepare(query).bind(...params).all();
  
  // Parse JSON fields
  const parsedBaseRVs = baseRVs.results.map((baseRV: any) => ({
    ...baseRV,
    detalhes_calculo: baseRV.detalhes_calculo ? JSON.parse(baseRV.detalhes_calculo) : null,
  }));
  
  return c.json(parsedBaseRVs);
});

app.post('/api/base_rv', zValidator('json', BaseRVSchema), async (c) => {
  const db = c.env.DB;
  const data = c.req.valid('json');
  
  // Check if there's already a launch for this user on this date
  const existing = await db.prepare(`
    SELECT id FROM base_rv 
    WHERE usuario_cpf = ? AND data_lancamento = ?
  `).bind(data.usuario_cpf, data.data_lancamento).first();
  
  if (existing) {
    return c.json({ error: 'Já existe um lançamento para este usuário nesta data' }, 400);
  }
  
  const result = await db.prepare(`
    INSERT INTO base_rv (
      usuario_id, usuario_cpf, usuario_nome, funcao, turno,
      data_lancamento, subtotal_atividades, bonus_kpis, remuneracao_total,
      detalhes_calculo, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
  `).bind(
    data.usuario_id,
    data.usuario_cpf,
    data.usuario_nome,
    data.funcao,
    data.turno,
    data.data_lancamento,
    data.subtotal_atividades,
    data.bonus_kpis,
    data.remuneracao_total,
    data.detalhes_calculo || null
  ).run();
  
  if (result.success) {
    const baseRV = await db.prepare('SELECT * FROM base_rv WHERE id = ?').bind(result.meta.last_row_id).first();
    return c.json(baseRV);
  }
  
  return c.json({ error: 'Failed to create base RV' }, 500);
});

app.delete('/api/base_rv/:id', async (c) => {
  const db = c.env.DB;
  const id = c.req.param('id');
  
  const result = await db.prepare('DELETE FROM base_rv WHERE id = ?').bind(id).run();
  
  if (result.success) {
    return c.json({ success: true });
  }
  
  return c.json({ error: 'Base RV not found' }, 404);
});

export default app;
