// Dados fictícios para desenvolvimento
// Este arquivo contém dados mock para demonstração da plataforma
// ATENÇÃO: IDs fixos para garantir relacionamentos corretos

const generateId = () => Math.random().toString(36).substr(2, 9);

// IDs fixos para relacionamentos
const STORE_IDS = {
  CENTRO: 'store-centro-001',
  NORTE: 'store-norte-002',
  SUL: 'store-sul-003',
  LESTE: 'store-leste-004',
  OESTE: 'store-oeste-005',
  SHOPPING: 'store-shopping-006',
  PLAZA: 'store-plaza-007',
  MALL: 'store-mall-008',
};

// Lojas fictícias com dados completos
export const mockStores = [
  { id: STORE_IDS.CENTRO, name: 'Loja Centro', code: 'AF001', address: 'Rua Fictícia, 100', city: 'São Paulo', state: 'SP', supervisor: 'Supervisor A', franchisee: 'LOJAS PRÓPRIA' },
  { id: STORE_IDS.NORTE, name: 'Loja Norte', code: 'AF002', address: 'Av. Fictícia, 200', city: 'São Paulo', state: 'SP', supervisor: 'Supervisor B', franchisee: 'LOJAS PRÓPRIA' },
  { id: STORE_IDS.SUL, name: 'Loja Sul', code: 'AF003', address: 'Rua Exemplo, 300', city: 'São Paulo', state: 'SP', supervisor: 'Supervisor C', franchisee: 'LOJAS PRÓPRIA' },
  { id: STORE_IDS.LESTE, name: 'Loja Leste', code: 'AF004', address: 'Av. Demonstração, 400', city: 'São Paulo', state: 'SP', supervisor: 'Supervisor A', franchisee: 'LOJAS PRÓPRIA' },
  { id: STORE_IDS.OESTE, name: 'Loja Oeste', code: 'AF005', address: 'Rua Teste, 500', city: 'São Paulo', state: 'SP', supervisor: 'Supervisor B', franchisee: 'LOJAS PRÓPRIA' },
  { id: STORE_IDS.SHOPPING, name: 'Loja Shopping', code: 'AF006', address: 'Shopping Fictício, Loja 10', city: 'São Paulo', state: 'SP', supervisor: 'Supervisor C', franchisee: 'LOJAS PRÓPRIA' },
  { id: STORE_IDS.PLAZA, name: 'Loja Plaza', code: 'AF007', address: 'Shopping Plaza, Loja 20', city: 'São Paulo', state: 'SP', supervisor: 'Supervisor A', franchisee: 'LOJAS PRÓPRIA' },
  { id: STORE_IDS.MALL, name: 'Loja Mall', code: 'AF008', address: 'Shopping Mall, Loja 30', city: 'São Paulo', state: 'SP', supervisor: 'Supervisor B', franchisee: 'LOJAS PRÓPRIA' },
];

// Usuários fictícios (usando IDs fixos das lojas)
export const mockUsers = [
  { 
    id: 'user-admin', 
    name: 'Admin Sistema', 
    username: 'Admin Sistema',
    email: 'admin@exemplo.com', 
    role: 'admin',
    storeId: null,
    createdAt: new Date().toISOString()
  },
  { 
    id: 'user-supervisor-1', 
    name: 'Supervisor A', 
    username: 'Supervisor A',
    email: 'supervisor.a@exemplo.com', 
    role: 'supervisor',
    storeId: null,
    createdAt: new Date().toISOString()
  },
  { 
    id: 'user-supervisor-2', 
    name: 'Supervisor B', 
    username: 'Supervisor B',
    email: 'supervisor.b@exemplo.com', 
    role: 'supervisor',
    storeId: null,
    createdAt: new Date().toISOString()
  },
  { 
    id: 'user-supervisor-3', 
    name: 'Supervisor C', 
    username: 'Supervisor C',
    email: 'supervisor.c@exemplo.com', 
    role: 'supervisor',
    storeId: null,
    createdAt: new Date().toISOString()
  },
  { 
    id: 'user-loja-1', 
    name: 'Gerente Loja Centro', 
    username: 'Gerente Loja Centro',
    email: 'gerente.centro@exemplo.com', 
    role: 'loja',
    storeId: STORE_IDS.CENTRO,
    createdAt: new Date().toISOString()
  },
  { 
    id: 'user-loja-2', 
    name: 'Gerente Loja Norte', 
    username: 'Gerente Loja Norte',
    email: 'gerente.norte@exemplo.com', 
    role: 'loja',
    storeId: STORE_IDS.NORTE,
    createdAt: new Date().toISOString()
  },
];

// Tarefas do checklist diário
export const mockDailyTasks = [
  { id: 'task-1', text: 'Abertura Operacional', sector: 'ADMINISTRATIVO' },
  { id: 'task-2', text: 'Limpeza da loja', sector: 'AMBIENTACAO' },
  { id: 'task-3', text: 'Five Minutes - KPIs', sector: 'ADMINISTRATIVO' },
  { id: 'task-4', text: 'Pedidos SFS - Manhã', sector: 'OUTROS' },
  { id: 'task-5', text: 'Caixa dia anterior e Depósito', sector: 'ADMINISTRATIVO' },
  { id: 'task-6', text: 'Relatório de Performance KPIs', sector: 'ADMINISTRATIVO' },
  { id: 'task-7', text: 'Relatório de Performance Produto', sector: 'PRODUTO' },
  { id: 'task-8', text: 'Acompanhamento Planilha Chegada de Pedidos', sector: 'ADMINISTRATIVO' },
  { id: 'task-9', text: 'Ativações CRM', sector: 'DIGITAL' },
  { id: 'task-10', text: 'Organização de Loja Operacional durante dia', sector: 'AMBIENTACAO' },
  { id: 'task-11', text: 'Organização de Loja Visual Merchandising', sector: 'AMBIENTACAO' },
  { id: 'task-12', text: 'Pedidos SFS - Tarde', sector: 'OUTROS' },
  { id: 'task-13', text: 'Jornada de atendimento', sector: 'PESSOAS' },
  { id: 'task-14', text: 'Pedidos Digital Haass noite', sector: 'DIGITAL' },
  { id: 'task-15', text: 'Pedidos Digital Haass fechamento', sector: 'DIGITAL' },
  { id: 'task-16', text: 'Virtual Gate', sector: 'DIGITAL' },
  { id: 'task-17', text: 'Perdas e Danos', sector: 'ADMINISTRATIVO' },
  { id: 'task-18', text: 'Tom Ticket', sector: 'ADMINISTRATIVO' },
  { id: 'task-19', text: 'SLA/NPS Digital', sector: 'DIGITAL' },
];

// Tarefas gerenciais
export const mockGerencialTasks = [
  { id: 'ger-1', text: 'Reunião de equipe', sector: 'PESSOAS' },
  { id: 'ger-2', text: 'Análise de vendas', sector: 'ADMINISTRATIVO' },
  { id: 'ger-3', text: 'Planejamento semanal', sector: 'ADMINISTRATIVO' },
  { id: 'ger-4', text: 'Avaliação de estoque', sector: 'PRODUTO' },
  { id: 'ger-5', text: 'Treinamento de equipe', sector: 'PESSOAS' },
];

// Checklists fictícios (algumas tarefas completas)
const generateChecklist = (storeId) => {
  const tasks = {};
  const gerencialTasks = {};
  
  // Completar algumas tarefas aleatoriamente (mas de forma consistente)
  const seed = storeId.charCodeAt(storeId.length - 1); // Usar último caractere do ID como seed
  
  mockDailyTasks.forEach((task, index) => {
    // Usar seed para tornar determinístico
    if ((seed + index) % 3 !== 0) { // ~67% completas
      tasks[task.id] = true;
    }
  });
  
  mockGerencialTasks.forEach((task, index) => {
    if ((seed + index) % 2 === 0) { // ~50% completas
      gerencialTasks[task.id] = true;
    }
  });
  
  return { tasks, gerencialTasks };
};

export const mockChecklists = mockStores.reduce((acc, store) => {
  acc[store.id] = generateChecklist(store.id);
  return acc;
}, {});

// Histórico de checklists (últimos 7 dias)
export const generateMockChecklistHistory = (storeId, days = 7) => {
  const history = [];
  const today = new Date();
  
  for (let i = 0; i < days; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const tasks = {};
    const gerencialTasks = {};
    
    // Completar algumas tarefas aleatoriamente (completude varia por dia)
    const completionRate = 0.5 + (Math.random() * 0.4); // Entre 50% e 90%
    
    mockDailyTasks.forEach((task) => {
      if (Math.random() < completionRate) {
        tasks[task.id] = true;
      }
    });
    
    mockGerencialTasks.forEach((task) => {
      if (Math.random() < completionRate) {
        gerencialTasks[task.id] = true;
      }
    });
    
    history.push({
      date: dateStr,
      store_id: storeId,
      tasks,
      gerencialTasks,
      is_audited: i === 0 ? false : Math.random() > 0.5, // Hoje não auditado, outros dias aleatório
    });
  }
  
  return history;
};

// Formulários fictícios
export const mockForms = [
  {
    id: generateId(),
    title: 'Avaliação de Loja',
    description: 'Formulário de avaliação geral da loja',
    questions: [
      { id: 'q1', text: 'Como você avalia o atendimento?', type: 'satisfaction' },
      { id: 'q2', text: 'A loja está organizada?', type: 'multiple-choice', options: [
        { text: 'Sim', value: 10 },
        { text: 'Parcialmente', value: 5 },
        { text: 'Não', value: 0 }
      ]},
      { id: 'q3', text: 'Observações gerais', type: 'text' },
    ],
    createdAt: new Date().toISOString()
  },
];

// Avaliações fictícias
export const generateMockEvaluations = () => {
  const evaluations = [];
  
  mockStores.forEach((store, storeIndex) => {
    mockForms.forEach((form) => {
      // Criar algumas avaliações por loja (algumas pendentes, algumas aprovadas)
      const numEvaluations = storeIndex < 3 ? 4 : storeIndex < 5 ? 2 : 1; // Primeiras lojas têm mais avaliações pendentes
      
      for (let i = 0; i < numEvaluations; i++) {
        const answers = {};
        form.questions.forEach((q) => {
          if (q.type === 'satisfaction') {
            answers[q.id] = Math.floor(Math.random() * 5) + 1;
          } else if (q.type === 'multiple-choice') {
            answers[q.id] = q.options[Math.floor(Math.random() * q.options.length)].text;
          } else {
            answers[q.id] = `Resposta fictícia ${i + 1}`;
          }
        });
        
        // Calcular score
        let score = 0;
        let maxScore = 0;
        form.questions.forEach((q) => {
          if (q.type === 'satisfaction') {
            score += answers[q.id] * 2;
            maxScore += 10;
          } else if (q.type === 'multiple-choice') {
            const option = q.options.find(opt => opt.text === answers[q.id]);
            score += option?.value || 0;
            maxScore += 10;
          }
        });
        
        const finalScore = maxScore > 0 ? Math.round((score / maxScore) * 100) : 0;
        
        // Primeiras avaliações são pendentes, outras aprovadas
        const status = i < numEvaluations - 1 ? 'pending' : 'approved';
        
        evaluations.push({
          id: `eval-${store.id}-${i}`,
          formId: form.id,
          form_id: form.id,
          storeId: store.id,
          store_id: store.id,
          userId: mockUsers[storeIndex % mockUsers.length].id,
          user_id: mockUsers[storeIndex % mockUsers.length].id,
          answers,
          score: finalScore,
          status: status,
          createdAt: new Date(Date.now() - i * 86400000).toISOString(),
          created_at: new Date(Date.now() - i * 86400000).toISOString(),
        });
      }
    });
  });
  
  return evaluations;
};

// Colaboradores fictícios
export const mockCollaborators = mockStores.flatMap((store, index) => [
  {
    id: `collab-${store.id}-1`,
    name: `Colaborador ${store.name} 1`,
    email: `colaborador${index + 1}.1@exemplo.com`,
    storeId: store.id,
    store_id: store.id,
    role: 'colaborador',
    createdAt: new Date().toISOString(),
    created_at: new Date().toISOString()
  },
  {
    id: `collab-${store.id}-2`,
    name: `Colaborador ${store.name} 2`,
    email: `colaborador${index + 1}.2@exemplo.com`,
    storeId: store.id,
    store_id: store.id,
    role: 'colaborador',
    createdAt: new Date().toISOString(),
    created_at: new Date().toISOString()
  }
]);

// Feedbacks fictícios
export const generateMockFeedbacks = () => {
  return mockStores.map((store, index) => ({
    id: generateId(),
    storeId: store.id,
    userId: mockUsers[index % mockUsers.length].id,
    message: `Feedback fictício da ${store.name}`,
    type: ['sugestao', 'reclamacao', 'elogio'][index % 3],
    createdAt: new Date(Date.now() - index * 86400000).toISOString(),
  }));
};

// Configurações fictícias
export const mockSettings = {
  patent_settings: { bronze: 0, prata: 70, ouro: 85, platina: 95 },
  chave_content: { initialContent: 'Conteúdo fictício da chave' },
  menu_visibility: {
    dashboard: true,
    checklist: true,
    evaluations: true,
    stores: true,
    users: true,
    patrimony: true,
  },
  job_roles: [
    { id: generateId(), name: 'Gerente', description: 'Gerente de loja' },
    { id: generateId(), name: 'Vendedor', description: 'Vendedor' },
    { id: generateId(), name: 'Caixa', description: 'Operador de caixa' },
  ],
  daily_tasks: mockDailyTasks,
  gerencial_tasks: mockGerencialTasks,
};

export const mockMenuVisibility = {
  dashboard: true,
  checklist: true,
  evaluations: true,
  stores: true,
  users: true,
  patrimony: true,
};

export const mockJobRoles = [
  { id: generateId(), name: 'Gerente', description: 'Gerente de loja' },
  { id: generateId(), name: 'Vendedor', description: 'Vendedor' },
  { id: generateId(), name: 'Caixa', description: 'Operador de caixa' },
  { id: generateId(), name: 'Supervisor', description: 'Supervisor de loja' },
  { id: generateId(), name: 'Estoquista', description: 'Responsável pelo estoque' },
];

// Exportar tudo como objeto para facilitar acesso
export default {
  mockStores,
  mockUsers,
  mockDailyTasks,
  mockGerencialTasks,
  mockChecklists,
  generateMockChecklistHistory,
  mockForms,
  generateMockEvaluations,
  mockCollaborators,
  generateMockFeedbacks,
  mockSettings,
  mockMenuVisibility,
  mockJobRoles,
};
