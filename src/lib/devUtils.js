/**
 * Funções de Desenvolvimento - SOMENTE LOCAL
 * 
 * Este arquivo contém funções úteis para desenvolvimento local.
 * Essas funções NÃO serão incluídas no build de produção.
 * 
 * Para usar: import { devLog, devClearData, devTestFunction } from '@/lib/devUtils';
 */

// Verificar se está em desenvolvimento
const isDev = import.meta.env.DEV;

/**
 * Log de desenvolvimento - só funciona localmente
 * @param {string} label - Rótulo para o log
 * @param {any} data - Dados para logar
 * @param {string} type - Tipo de log ('log', 'warn', 'error', 'table')
 */
export const devLog = (label, data, type = 'log') => {
  if (!isDev) return; // Não faz nada em produção
  
  const styles = {
    log: 'color: #4CAF50; font-weight: bold;',
    warn: 'color: #FF9800; font-weight: bold;',
    error: 'color: #F44336; font-weight: bold;',
    info: 'color: #2196F3; font-weight: bold;',
  };
  
  const style = styles[type] || styles.log;
  
  console[type](
    `%c[DEV] ${label}`,
    style,
    data
  );
};

/**
 * Limpar dados do localStorage (apenas desenvolvimento)
 * @param {string[]} keys - Chaves para limpar (opcional, se vazio limpa tudo relacionado ao app)
 */
export const devClearData = (keys = []) => {
  if (!isDev) {
    console.warn('⚠️ devClearData só funciona em desenvolvimento local');
    return;
  }
  
  if (keys.length === 0) {
    // Limpar todas as chaves relacionadas ao app
    const appKeys = [
      'sb-hzwmacltgiyanukgvfvn-auth-token',
      'sb-hzwmacltgiyanukgvfvn-auth-token-code-verifier',
      'sidebarOpen',
      'sidebarCollapsed',
    ];
    
    appKeys.forEach(key => {
      localStorage.removeItem(key);
      devLog('Limpeza', `Removido: ${key}`, 'info');
    });
    
    // Limpar todas as chaves que começam com 'sb-'
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('sb-')) {
        localStorage.removeItem(key);
        devLog('Limpeza', `Removido: ${key}`, 'info');
      }
    });
    
    devLog('Limpeza Completa', 'Todos os dados do app foram removidos do localStorage', 'warn');
  } else {
    keys.forEach(key => {
      localStorage.removeItem(key);
      devLog('Limpeza', `Removido: ${key}`, 'info');
    });
  }
};

/**
 * Testar função de desenvolvimento
 * Exemplo de uso para testar funcionalidades
 */
export const devTestFunction = () => {
  if (!isDev) {
    console.warn('⚠️ devTestFunction só funciona em desenvolvimento local');
    return;
  }
  
  devLog('Teste', 'Função de teste executada!', 'info');
  
  // Exemplo: testar dados do contexto
  return {
    timestamp: new Date().toISOString(),
    isDev: true,
    message: 'Função de teste executada com sucesso',
  };
};

/**
 * Exibir informações do ambiente de desenvolvimento
 */
export const devShowEnv = () => {
  if (!isDev) return;
  
  devLog('Ambiente', {
    mode: import.meta.env.MODE,
    dev: import.meta.env.DEV,
    prod: import.meta.env.PROD,
    base: import.meta.env.BASE_URL,
  }, 'info');
};

/**
 * Simular dados para testes (apenas desenvolvimento)
 * @param {string} type - Tipo de dados ('store', 'evaluation', 'user')
 */
export const devMockData = (type = 'store') => {
  if (!isDev) {
    console.warn('⚠️ devMockData só funciona em desenvolvimento local');
    return null;
  }
  
  const mocks = {
    store: {
      id: 'dev-store-1',
      code: 'DEV001',
      name: 'Loja de Desenvolvimento',
      bandeira: 'ARTWALK',
      shopping: 'Shopping Dev',
      manager: 'Gerente Dev',
      supervisor: 'Supervisor Dev',
      franqueado: 'Franqueado Dev',
      estado: 'SP',
      telefone: '(11) 99999-9999',
    },
    evaluation: {
      id: 'dev-eval-1',
      storeId: 'dev-store-1',
      formId: 'dev-form-1',
      score: 85,
      pillar: 'Operacional',
      status: 'pending',
      date: new Date().toISOString(),
    },
    user: {
      id: 'dev-user-1',
      email: 'dev@test.com',
      role: 'admin',
      name: 'Usuário Dev',
    },
  };
  
  devLog('Mock Data', `Gerado mock para: ${type}`, 'info');
  return mocks[type] || null;
};

/**
 * Adicionar função global de desenvolvimento no window (apenas dev)
 * Permite acessar funções de dev pelo console do navegador
 */
if (isDev && typeof window !== 'undefined') {
  window.__DEV__ = {
    log: devLog,
    clearData: devClearData,
    test: devTestFunction,
    showEnv: devShowEnv,
    mock: devMockData,
  };
  
  console.log(
    '%c[DEV] Funções de desenvolvimento disponíveis!',
    'color: #4CAF50; font-weight: bold; font-size: 14px;',
    '\nUse window.__DEV__ no console para acessar:',
    '\n- window.__DEV__.log(label, data)',
    '\n- window.__DEV__.clearData()',
    '\n- window.__DEV__.test()',
    '\n- window.__DEV__.showEnv()',
    '\n- window.__DEV__.mock(type)'
  );
}

// Exportar verificação de ambiente
export const isDevelopment = isDev;







