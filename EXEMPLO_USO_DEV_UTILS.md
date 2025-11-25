# 🛠️ FUNÇÕES DE DESENVOLVIMENTO - GUIA DE USO

## ✅ Arquivo Criado: `src/lib/devUtils.js`

Este arquivo contém funções úteis **APENAS para desenvolvimento local**. Elas **NÃO serão incluídas no build de produção**.

---

## 📋 FUNÇÕES DISPONÍVEIS

### 1. `devLog(label, data, type)`
**Log formatado para desenvolvimento**

```javascript
import { devLog } from '@/lib/devUtils';

// Uso básico
devLog('Teste', { nome: 'João', idade: 30 });

// Com tipo específico
devLog('Aviso', 'Algo deu errado', 'warn');
devLog('Erro', error, 'error');
devLog('Info', data, 'info');
devLog('Tabela', arrayData, 'table');
```

**Exemplo no console:**
```
[DEV] Teste { nome: 'João', idade: 30 }
```

---

### 2. `devClearData(keys)`
**Limpar dados do localStorage**

```javascript
import { devClearData } from '@/lib/devUtils';

// Limpar tudo relacionado ao app
devClearData();

// Limpar chaves específicas
devClearData(['sidebarOpen', 'sidebarCollapsed']);
```

---

### 3. `devTestFunction()`
**Função de teste genérica**

```javascript
import { devTestFunction } from '@/lib/devUtils';

const result = devTestFunction();
console.log(result);
// { timestamp: '...', isDev: true, message: '...' }
```

---

### 4. `devShowEnv()`
**Mostrar informações do ambiente**

```javascript
import { devShowEnv } from '@/lib/devUtils';

devShowEnv();
// Mostra: mode, dev, prod, base URL
```

---

### 5. `devMockData(type)`
**Gerar dados mock para testes**

```javascript
import { devMockData } from '@/lib/devUtils';

const mockStore = devMockData('store');
const mockEvaluation = devMockData('evaluation');
const mockUser = devMockData('user');
```

**Tipos disponíveis:**
- `'store'` - Dados de loja
- `'evaluation'` - Dados de avaliação
- `'user'` - Dados de usuário

---

## 🎮 USO PELO CONSOLE DO NAVEGADOR

**Em desenvolvimento local, você pode usar pelo console:**

```javascript
// Abra o console do navegador (F12)
// E digite:

window.__DEV__.log('Teste', { dados: 'exemplo' });
window.__DEV__.clearData();
window.__DEV__.test();
window.__DEV__.showEnv();
window.__DEV__.mock('store');
```

---

## 📝 EXEMPLOS PRÁTICOS

### Exemplo 1: Log de dados em um componente

```javascript
import { devLog } from '@/lib/devUtils';
import { useData } from '@/contexts/DataContext';

const MyComponent = () => {
  const { stores, evaluations } = useData();
  
  useEffect(() => {
    // Só loga em desenvolvimento
    devLog('Stores', stores);
    devLog('Evaluations', evaluations);
  }, [stores, evaluations]);
  
  return <div>...</div>;
};
```

### Exemplo 2: Limpar dados ao fazer logout (dev)

```javascript
import { devClearData } from '@/lib/devUtils';

const handleLogout = () => {
  // Limpar dados de desenvolvimento
  devClearData();
  
  // Logout normal...
  signOut();
};
```

### Exemplo 3: Testar com dados mock

```javascript
import { devMockData } from '@/lib/devUtils';

const TestComponent = () => {
  const testStore = devMockData('store');
  
  // Usar dados mock apenas em desenvolvimento
  if (import.meta.env.DEV) {
    console.log('Store mock:', testStore);
  }
  
  return <div>...</div>;
};
```

---

## ⚠️ IMPORTANTE

### ✅ O que acontece em PRODUÇÃO:
- Todas as funções retornam imediatamente (não fazem nada)
- Não adicionam código ao bundle final
- Não aparecem no console
- `window.__DEV__` não existe

### ✅ O que acontece em DESENVOLVIMENTO:
- Funções funcionam normalmente
- Logs aparecem no console formatados
- `window.__DEV__` está disponível no console

---

## 🔍 VERIFICAR SE ESTÁ EM DEV

```javascript
import { isDevelopment } from '@/lib/devUtils';

if (isDevelopment) {
  // Código só para desenvolvimento
  console.log('Estamos em desenvolvimento!');
}
```

**OU:**

```javascript
if (import.meta.env.DEV) {
  // Código só para desenvolvimento
}
```

---

## 🎯 CASOS DE USO

1. **Debug de dados** - Logar estados e props
2. **Limpar cache** - Resetar localStorage durante desenvolvimento
3. **Testes rápidos** - Gerar dados mock
4. **Inspecionar ambiente** - Ver configurações
5. **Console helper** - Funções úteis no console do navegador

---

## 📦 IMPORTAÇÃO

```javascript
// Importar tudo
import { devLog, devClearData, devTestFunction, devShowEnv, devMockData, isDevelopment } from '@/lib/devUtils';

// Ou importar apenas o que precisa
import { devLog } from '@/lib/devUtils';
```

---

## ✅ PRONTO PARA USAR!

As funções já estão disponíveis. Basta importar e usar!

**Lembre-se:** Essas funções **só funcionam em desenvolvimento local**. Em produção, elas não fazem nada e não adicionam código ao bundle.







