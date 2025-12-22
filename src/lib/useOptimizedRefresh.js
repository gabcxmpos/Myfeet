import { useEffect } from 'react';

/**
 * Hook para refresh automático otimizado para mobile
 * - Só faz refresh quando a página está visível
 * - Verifica conexão de rede antes de fazer refresh
 * - Intervalo adaptativo: mais frequente quando visível, menos quando em background
 * - Refresh imediato quando a página volta a ser visível ou quando conexão é restaurada
 * 
 * @param {Function} refreshFunction - Função a ser chamada para fazer refresh
 * @param {number} visibleInterval - Intervalo em ms quando visível (padrão: 30000)
 * @param {number} hiddenInterval - Intervalo em ms quando em background (padrão: 120000)
 */
export const useOptimizedRefresh = (refreshFunction, visibleInterval = 30000, hiddenInterval = 120000) => {
  useEffect(() => {
    if (!refreshFunction) return;

    const refreshData = () => {
      // Verificar se está online e visível
      if (!navigator.onLine) {
        console.warn('⚠️ Sem conexão de rede. Pulando refresh.');
        return;
      }

      if (document.visibilityState === 'hidden') {
        return; // Não fazer refresh se a página estiver em background
      }

      try {
        refreshFunction();
      } catch (error) {
        console.warn('Erro ao fazer refresh:', error);
      }
    };

    // Intervalo adaptativo baseado na visibilidade
    let intervalId;
    const setupInterval = () => {
      if (intervalId) clearInterval(intervalId);
      const interval = document.visibilityState === 'visible' ? visibleInterval : hiddenInterval;
      intervalId = setInterval(refreshData, interval);
    };

    // Iniciar intervalo
    setupInterval();
    
    // Atualizar quando visibilidade mudar
    const handleVisibilityChange = () => {
      setupInterval();
      // Refresh imediato ao voltar a ser visível
      if (document.visibilityState === 'visible') {
        refreshData();
      }
    };

    // Refresh quando conexão voltar
    const handleOnline = () => {
      console.log('✅ Conexão restaurada. Fazendo refresh...');
      refreshData();
    };

    const handleOffline = () => {
      console.warn('⚠️ Conexão perdida.');
    };

    // Event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    window.addEventListener('focus', refreshData); // Refresh ao focar na janela (útil para mobile)

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('focus', refreshData);
    };
  }, [refreshFunction, visibleInterval, hiddenInterval]);
};





























