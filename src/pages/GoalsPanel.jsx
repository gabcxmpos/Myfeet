import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { updateStore as updateStoreAPI } from '@/lib/supabaseService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useOptimizedRefresh } from '@/lib/useOptimizedRefresh';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Percent, Hash, Truck, Target, BarChart, Save, Upload, Download, FileText, Store, TrendingUp, Settings } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';


const GoalStoreCard = ({ store, onSelect, selected }) => {
  const getBrandClass = (bandeira) => {
    if (bandeira === 'ARTWALK') return 'border-artwalk';
    if (bandeira === 'AUTHENTIC FEET') return 'border-authentic-feet';
    if (bandeira === 'MAGICFEET') return 'border-magic-feet';
    return 'border-border';
  };

  return (
    <motion.div
      onClick={() => onSelect(store.id)}
      className={cn(
        "relative px-4 py-3 rounded-xl cursor-pointer border transition-all group",
        selected 
          ? 'border-primary bg-primary/10 shadow-md shadow-primary/10' 
          : 'border-border/50 bg-secondary/30 hover:border-primary/50 hover:bg-secondary/50',
        getBrandClass(store.bandeira)
      )}
      whileHover={{ scale: 1.02, x: 2 }}
      whileTap={{ scale: 0.98 }}
    >
      {selected && (
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-l-xl" />
      )}
      <div className="flex items-center gap-2">
        <div className={cn(
          "w-2 h-2 rounded-full transition-all",
          selected ? 'bg-primary' : 'bg-muted-foreground/30 group-hover:bg-primary/50'
        )} />
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground truncate text-sm leading-tight">{store.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{store.code}</p>
        </div>
      </div>
    </motion.div>
  );
};

const goalFields = [
    { name: 'faturamento', label: 'Faturamento', icon: DollarSign, placeholder: 'Ex: 150000' },
    { name: 'pa', label: 'P.A.', icon: Hash, placeholder: 'Ex: 2.8' },
    { name: 'ticketMedio', label: 'Ticket Médio', icon: Percent, placeholder: 'Ex: 250.50' },
    { name: 'prateleiraInfinita', label: 'Prateleira Infinita', icon: Truck, placeholder: 'Ex: 15000' },
    { name: 'conversao', label: 'Conversão (%)', icon: BarChart, placeholder: 'Ex: 15' },
];

const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00C49F'];

const useQuery = () => {
    return new URLSearchParams(useLocation().search);
}

const GoalsPanel = () => {
  const { stores, updateStore, fetchData } = useData();
  const { toast } = useToast();
  const query = useQuery();
  const [selectedStore, setSelectedStore] = useState('');
  const [filters, setFilters] = useState({ supervisor: 'all', franqueado: 'all', bandeira: 'all' });
  const [goals, setGoals] = useState({});
  const [weights, setWeights] = useState({});
  const [goalMonth, setGoalMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef(null);

  // Refresh automático otimizado para mobile
  useOptimizedRefresh(fetchData);

  const supervisors = useMemo(() => [...new Set(stores.map(s => s.supervisor))], [stores]);
  const franqueados = useMemo(() => [...new Set(stores.map(s => s.franqueado))], [stores]);
  const bandeiras = useMemo(() => [...new Set(stores.map(s => s.bandeira))], [stores]);

  const filteredStores = useMemo(() => {
    return stores.filter(store => 
      (filters.supervisor === 'all' || store.supervisor === filters.supervisor) &&
      (filters.franqueado === 'all' || store.franqueado === filters.franqueado) &&
      (filters.bandeira === 'all' || store.bandeira === filters.bandeira)
    );
  }, [stores, filters]);

  const handleStoreSelect = useCallback((storeId) => {
    setSelectedStore(storeId);
    const store = stores.find(s => s.id === storeId);
    if (store) {
      // Carregar metas do mês selecionado usando JSONB (goals[goalMonth])
      const storeGoals = store.goals || {};
      const monthGoals = typeof storeGoals === 'object' && !Array.isArray(storeGoals) 
        ? (storeGoals[goalMonth] || { faturamento: 0, pa: 0, ticketMedio: 0, prateleiraInfinita: 0, conversao: 0 })
        : { faturamento: 0, pa: 0, ticketMedio: 0, prateleiraInfinita: 0, conversao: 0 };
      
      // Carregar pesos do mês selecionado usando JSONB (weights[goalMonth])
      const storeWeights = store.weights || {};
      const monthWeights = typeof storeWeights === 'object' && !Array.isArray(storeWeights)
        ? (storeWeights[goalMonth] || { faturamento: 20, pa: 20, ticketMedio: 20, prateleiraInfinita: 20, conversao: 20 })
        : { faturamento: 20, pa: 20, ticketMedio: 20, prateleiraInfinita: 20, conversao: 20 };
      
      setGoals(monthGoals);
      setWeights(monthWeights);
    }
  }, [stores, goalMonth]);
  
  useEffect(() => {
    const storeIdFromQuery = query.get('storeId');
    if (storeIdFromQuery && stores.find(s => s.id === storeIdFromQuery)) {
        handleStoreSelect(storeIdFromQuery);
    } else if (filteredStores.length > 0 && !selectedStore) {
      handleStoreSelect(filteredStores[0].id);
    } else if (filteredStores.length > 0 && !filteredStores.find(s => s.id === selectedStore)) {
      handleStoreSelect(filteredStores[0].id);
    } else if (filteredStores.length === 0) {
      setSelectedStore('');
      setGoals({});
      setWeights({});
    }
  }, [filteredStores, selectedStore, handleStoreSelect, query, stores]);
  
  const handleFilterChange = (filterName, value) => {
    setFilters(prev => ({...prev, [filterName]: value}));
  };

  const handleGoalChange = (e) => {
    const { name, value } = e.target;
    setGoals(prev => ({ ...prev, [name]: parseFloat(value) || 0 }));
  };

  const handleWeightChange = (key, newValue) => {
    const oldValue = weights[key];
    const diff = newValue - oldValue;
    
    let otherKeys = goalFields.map(f => f.name).filter(k => k !== key);
    let totalOtherWeights = otherKeys.reduce((sum, k) => sum + weights[k], 0);

    let newWeights = { ...weights, [key]: newValue };

    if (totalOtherWeights > 0) {
        otherKeys.forEach(k => {
            const proportion = weights[k] / totalOtherWeights;
            newWeights[k] = Math.max(0, weights[k] - diff * proportion);
        });
    }
    
    const currentTotal = Object.values(newWeights).reduce((sum, w) => sum + w, 0);
    const roundingError = 100 - currentTotal;
    
    if (Math.abs(roundingError) > 0.01) {
        let keyToAdjust = otherKeys.sort((a, b) => newWeights[b] - newWeights[a])[0] || key;
        if (keyToAdjust === key && otherKeys.length > 0) {
            keyToAdjust = otherKeys[0];
        }
        if(newWeights[keyToAdjust] + roundingError >= 0) {
            newWeights[keyToAdjust] += roundingError;
        }
    }
    
    const finalTotal = Object.values(newWeights).reduce((sum, w) => sum + w, 0);
    if (Math.round(finalTotal) !== 100) {
        const lastKey = goalFields[goalFields.length - 1].name;
        if (lastKey !== key) {
            newWeights[lastKey] = Math.max(0, newWeights[lastKey] + (100 - finalTotal));
        }
    }

    const finalRoundedWeights = {};
    Object.keys(newWeights).forEach(k => {
        finalRoundedWeights[k] = Math.round(newWeights[k]);
    });
    const roundedTotal = Object.values(finalRoundedWeights).reduce((sum, w) => sum + w, 0);
    if(roundedTotal !== 100) {
        const diff = 100 - roundedTotal;
        const keyToAdjust = goalFields.map(f => f.name).sort((a,b) => finalRoundedWeights[b] - finalRoundedWeights[a])[0];
        finalRoundedWeights[keyToAdjust] += diff;
    }

    setWeights(finalRoundedWeights);
  };

  const handleSaveGoals = async () => {
    if (!selectedStore) return;
    
    const store = stores.find(s => s.id === selectedStore);
    if (!store) return;
    
    // Atualizar goals usando JSONB (goals[goalMonth])
    const currentGoals = store.goals || {};
    const updatedGoals = {
      ...(typeof currentGoals === 'object' && !Array.isArray(currentGoals) ? currentGoals : {}),
      [goalMonth]: goals
    };
    
    await updateStore(selectedStore, { goals: updatedGoals });
    toast({ title: 'Sucesso!', description: `Metas da loja salvas para ${goalMonth}.` });
  };

  const handleSaveAll = async (e) => {
    e.preventDefault();
    if (!selectedStore) {
      toast({ title: 'Erro', description: 'Por favor, selecione uma loja.', variant: 'destructive' });
      return;
    }
    const totalWeight = Object.values(weights).reduce((sum, w) => sum + w, 0);
    if (Math.round(totalWeight) !== 100) {
      toast({ title: 'Erro de Validação', description: `A soma dos pesos deve ser 100%. Atualmente é ${totalWeight.toFixed(0)}%.`, variant: 'destructive' });
      return;
    }
    
    const store = stores.find(s => s.id === selectedStore);
    if (!store) return;
    
    // Atualizar goals usando JSONB (goals[goalMonth])
    const currentGoals = store.goals || {};
    const updatedGoals = {
      ...(typeof currentGoals === 'object' && !Array.isArray(currentGoals) ? currentGoals : {}),
      [goalMonth]: goals
    };
    
    // Atualizar weights usando JSONB (weights[goalMonth])
    const currentWeights = store.weights || {};
    const updatedWeights = {
      ...(typeof currentWeights === 'object' && !Array.isArray(currentWeights) ? currentWeights : {}),
      [goalMonth]: weights
    };
    
    await updateStore(selectedStore, { 
      goals: updatedGoals,
      weights: updatedWeights
    });
    toast({ title: 'Sucesso!', description: `Metas e pesos da loja atualizados para ${goalMonth}.` });
  };

  // Função para gerar template CSV
  const generateCSVTemplate = () => {
    const headers = [
      'codigo_loja',
      'mes_ano',
      'faturamento',
      'pa',
      'ticketMedio',
      'prateleiraInfinita',
      'conversao'
    ];
    
    // Exemplos com diferentes formatos: formato brasileiro, valor vazio, zerado
    // IMPORTANTE: codigo_loja é obrigatório, mes_ano é opcional (se vazio, usa o mês selecionado no formulário)
    // Valores de metas podem estar vazios ou zerados
    const currentMonth = goalMonth; // Usar o mês atual selecionado como exemplo
    const exampleRows = [
      ['af013', currentMonth, 'R$ 150.000,00', '2,8', '250,50', '15000', '15'],
      ['af015', currentMonth, '180000', '3.0', 'R$ 280,00', '', '18'],
      ['af017', '', 'R$ 200.000,50', '3,2', '300', '0', '20'] // Exemplo sem mês (usará o mês do formulário)
    ];
    
    const csvContent = [
      headers.join(','),
      ...exampleRows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'template_metas.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast({ 
      title: 'Template baixado!', 
      description: 'Preencha o arquivo com os dados das lojas. A coluna "mes_ano" é opcional (formato YYYY-MM). Se vazia, usará o mês selecionado no formulário. Aceita valores formatados (R$, pontos, vírgulas) e células vazias. Os pesos serão fixos em 20% cada.' 
    });
  };

  // Função para limpar e converter valores numéricos (remove R$, pontos, vírgulas)
  const cleanNumericValue = (value) => {
    if (!value || value === '' || value.trim() === '') {
      return 0;
    }
    
    // Remove R$, espaços e converte para string
    let cleaned = String(value).trim().toUpperCase();
    
    // Remove R$ e outros símbolos de moeda
    cleaned = cleaned.replace(/R\$\s*/g, '');
    
    // Remove espaços
    cleaned = cleaned.replace(/\s/g, '');
    
    // Se não tem nada, retorna 0
    if (!cleaned || cleaned === '' || cleaned === '-') {
      return 0;
    }
    
    // Se tem apenas números e pontos/ vírgulas, processa
    // Formato brasileiro: 150.000,50 ou 150000,50 ou 150000.50
    // Detecta se tem vírgula (formato brasileiro) ou ponto (formato americano)
    if (cleaned.includes(',') && !cleaned.includes('.')) {
      // Formato brasileiro: 150000,50 -> 150000.50
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes('.') && cleaned.includes(',')) {
      // Formato misto: 150.000,50 -> 150000.50 (última vírgula vira ponto decimal)
      const parts = cleaned.split(',');
      if (parts.length === 2) {
        cleaned = parts[0].replace(/\./g, '') + '.' + parts[1];
      } else {
        // Múltiplas vírgulas, assume que vírgula é decimal
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      }
    } else {
      // Remove pontos que podem ser separadores de milhar
      // Se tem ponto mas não parece ser decimal (menos de 3 dígitos após), remove
      if (cleaned.includes('.')) {
        const lastDotIndex = cleaned.lastIndexOf('.');
        const afterDot = cleaned.substring(lastDotIndex + 1);
        if (afterDot.length > 2) {
          // Ponto é separador de milhar
          cleaned = cleaned.replace(/\./g, '');
        }
        // Senão, ponto é decimal, mantém
      }
    }
    
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Função para processar CSV
  const parseCSV = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV deve ter pelo menos uma linha de cabeçalho e uma linha de dados.');
    }
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    // Verificar se os cabeçalhos necessários existem
    const requiredHeaders = ['codigo_loja', 'faturamento', 'pa', 'ticketmedio', 'prateleinfinita', 'conversao'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Cabeçalhos obrigatórios faltando: ${missingHeaders.join(', ')}`);
    }
    
    // mes_ano é opcional - se não existir, será usado o mês selecionado no formulário
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      headers.forEach((header, index) => {
        const value = values[index] || '';
        // Para codigo_loja, mantém como string (pode estar vazio mas precisa validar depois)
        // Para valores numéricos, aplica limpeza
        if (header === 'codigo_loja') {
          row[header] = value;
        } else {
          // Permite valores vazios ou zerados - será processado como 0
          row[header] = value;
        }
      });
      data.push(row);
    }
    
    return data;
  };

  // Função para fazer upload e processar CSV
  const handleCSVUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    if (!file.name.endsWith('.csv')) {
      toast({ 
        title: 'Erro', 
        description: 'Por favor, selecione um arquivo CSV.', 
        variant: 'destructive' 
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      const text = await file.text();
      const csvData = parseCSV(text);
      
      if (csvData.length === 0) {
        throw new Error('Nenhum dado encontrado no CSV.');
      }
      
      let successCount = 0;
      let errorCount = 0;
      const errors = [];
      
      // Processar cada linha do CSV
      for (const row of csvData) {
        const codigoLoja = row.codigo_loja || row['codigo_loja'];
        if (!codigoLoja) {
          errors.push(`Linha ${csvData.indexOf(row) + 2}: Código da loja não fornecido`);
          errorCount++;
          continue;
        }
        
        // Buscar a loja pelo código
        const store = stores.find(s => s.code?.toLowerCase() === codigoLoja.toLowerCase());
        if (!store) {
          errors.push(`Linha ${csvData.indexOf(row) + 2}: Loja com código "${codigoLoja}" não encontrada`);
          errorCount++;
          continue;
        }
        
        // Preparar metas - aceita valores vazios, zerados ou formatados (R$, pontos, vírgulas)
        const goals = {
          faturamento: cleanNumericValue(row.faturamento),
          pa: cleanNumericValue(row.pa),
          ticketMedio: cleanNumericValue(row.ticketmedio),
          prateleiraInfinita: cleanNumericValue(row.prateleinfinita),
          conversao: cleanNumericValue(row.conversao)
        };
        
        // Pesos fixos em 20% para cada meta (conforme solicitado)
        const weights = {
          faturamento: 20,
          pa: 20,
          ticketMedio: 20,
          prateleiraInfinita: 20,
          conversao: 20
        };
        
        // Usar o mês do CSV se disponível, senão usar o mês selecionado no formulário
        const rowMonth = row.mes_ano || row['mes_ano'] || '';
        // Validar formato do mês (YYYY-MM)
        let targetMonth = goalMonth; // Padrão: mês do formulário
        if (rowMonth && rowMonth.trim() !== '') {
          const monthRegex = /^\d{4}-\d{2}$/;
          if (monthRegex.test(rowMonth.trim())) {
            targetMonth = rowMonth.trim();
          } else {
            errors.push(`Linha ${csvData.indexOf(row) + 2}: Formato de mês inválido "${rowMonth}". Use YYYY-MM (ex: 2024-01). Usando mês do formulário.`);
          }
        }
        
        try {
          // Atualizar a loja usando JSONB (goals[targetMonth] e weights[targetMonth])
          const currentGoals = store.goals || {};
          const updatedGoals = {
            ...(typeof currentGoals === 'object' && !Array.isArray(currentGoals) ? currentGoals : {}),
            [targetMonth]: goals
          };
          
          const currentWeights = store.weights || {};
          const updatedWeights = {
            ...(typeof currentWeights === 'object' && !Array.isArray(currentWeights) ? currentWeights : {}),
            [targetMonth]: weights
          };
          
          await updateStoreAPI(store.id, { 
            goals: updatedGoals,
            weights: updatedWeights
          });
          successCount++;
        } catch (error) {
          errors.push(`Linha ${csvData.indexOf(row) + 2}: Erro ao atualizar loja "${codigoLoja}": ${error.message || 'Erro desconhecido'}`);
          errorCount++;
        }
      }
      
      // Recarregar dados se houver sucesso
      if (successCount > 0) {
        // Aguardar um pouco antes de recarregar para garantir que todas as atualizações foram processadas
        setTimeout(() => {
          fetchData();
        }, 500);
        
        toast({ 
          title: 'Upload concluído!', 
          description: `${successCount} loja(s) atualizada(s) com sucesso.${errorCount > 0 ? ` ${errorCount} erro(s) encontrado(s).` : ''}`,
          variant: errorCount > 0 ? 'default' : 'default'
        });
      }
      
      if (errors.length > 0) {
        console.error('Erros no upload:', errors);
        // Mostrar erros detalhados no console ou em um alerta
        if (errors.length <= 10) {
          toast({
            title: 'Erros encontrados',
            description: errors.join('; '),
            variant: 'destructive',
            duration: 10000
          });
        } else {
          toast({
            title: 'Muitos erros',
            description: `${errors.length} erros encontrados. Verifique o console para detalhes.`,
            variant: 'destructive',
            duration: 10000
          });
        }
      }
      
      // Limpar input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
    } catch (error) {
      toast({ 
        title: 'Erro ao processar CSV', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const pieData = goalFields.map(field => ({
    name: field.label,
    value: weights[field.name] || 0
  }));

  const totalWeight = Object.values(weights).reduce((s, w) => s + (w || 0), 0);

  return (
    <>
      <Helmet>
        <title>Definir Metas - MYFEET Painel PPAD</title>
      </Helmet>
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Metas de Performance</h1>
            <p className="text-muted-foreground mt-1">Selecione uma loja e defina suas metas e pesos.</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="space-y-1">
              <Label htmlFor="csvMonth" className="text-xs text-muted-foreground">Mês padrão CSV</Label>
              <Input
                id="csvMonth"
                type="month"
                value={goalMonth}
                onChange={(e) => setGoalMonth(e.target.value)}
                min="2020-01"
                className="w-36 bg-secondary h-9 text-sm"
                title="Mês que será usado quando a coluna mes_ano estiver vazia no CSV"
              />
            </div>
            <Button 
              type="button" 
              onClick={generateCSVTemplate} 
              variant="outline" 
              className="gap-2"
              title="Baixar template CSV para importação em massa"
            >
              <Download className="w-4 h-4" /> Baixar Template
            </Button>
            <Button 
              type="button" 
              onClick={() => fileInputRef.current?.click()} 
              variant="outline" 
              className="gap-2"
              disabled={isUploading}
              title="Fazer upload de CSV com múltiplas metas"
            >
              <Upload className="w-4 h-4" /> {isUploading ? 'Processando...' : 'Importar CSV'}
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCSVUpload}
              style={{ display: 'none' }}
            />
          </div>
          <div className="flex items-center gap-2">
            <Select onValueChange={(val) => handleFilterChange('bandeira', val)} value={filters.bandeira}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Bandeira" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todas</SelectItem>{bandeiras.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <Select onValueChange={(val) => handleFilterChange('supervisor', val)} value={filters.supervisor}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Supervisor" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos</SelectItem>{supervisors.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
            </Select>
            <Select onValueChange={(val) => handleFilterChange('franqueado', val)} value={filters.franqueado}>
              <SelectTrigger className="w-40"><SelectValue placeholder="Franqueado" /></SelectTrigger>
              <SelectContent><SelectItem value="all">Todos</SelectItem>{franqueados.map(f => <SelectItem key={f} value={f}>{f}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        {/* Layout de duas colunas: Lojas à esquerda, Formulário à direita */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Coluna Esquerda: Lista de Lojas */}
          <div className="lg:col-span-1">
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-card rounded-2xl border border-border/50 shadow-sm h-full"
            >
              <div className="p-5 border-b border-border/50 bg-gradient-to-r from-primary/5 to-transparent">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Store className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-base font-semibold text-foreground">Lojas</h2>
                    <p className="text-xs text-muted-foreground">{filteredStores.length} disponível{filteredStores.length !== 1 ? 'eis' : ''}</p>
                  </div>
                </div>
              </div>
              <div className="p-4 space-y-2 max-h-[calc(100vh-200px)] md:max-h-[calc(100vh-280px)] overflow-y-auto overscroll-contain">
                {filteredStores.map(store => (
                  <GoalStoreCard key={store.id} store={store} onSelect={handleStoreSelect} selected={selectedStore === store.id} />
                ))}
              </div>
            </motion.div>
          </div>

          {/* Coluna Direita: Formulário de Metas e Pesos */}
          <div className="lg:col-span-4">
            {selectedStore ? (
              <motion.form
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                onSubmit={handleSaveAll}
                className="space-y-6"
              >
                {/* Header Card */}
                <div className="bg-card rounded-2xl border border-border/50 shadow-sm p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-gradient-to-br from-primary/20 to-primary/5 rounded-xl">
                        <TrendingUp className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h2 className="text-xl font-bold text-foreground">Metas de Performance</h2>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {stores.find(s => s.id === selectedStore)?.name || 'Loja selecionada'}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2 bg-secondary/50 px-3 py-2 rounded-lg">
                        <Label htmlFor="goalMonth" className="text-sm text-muted-foreground whitespace-nowrap">Período:</Label>
                        <Input
                          id="goalMonth"
                          type="month"
                          value={goalMonth}
                          min="2020-01"
                          onChange={(e) => {
                            setGoalMonth(e.target.value);
                            const store = stores.find(s => s.id === selectedStore);
                            if (store) {
                              // Carregar metas usando JSONB (goals[goalMonth])
                              const storeGoals = store.goals || {};
                              const newMonthGoals = typeof storeGoals === 'object' && !Array.isArray(storeGoals)
                                ? (storeGoals[e.target.value] || { faturamento: 0, pa: 0, ticketMedio: 0, prateleiraInfinita: 0, conversao: 0 })
                                : { faturamento: 0, pa: 0, ticketMedio: 0, prateleiraInfinita: 0, conversao: 0 };
                              
                              // Carregar pesos usando JSONB (weights[goalMonth])
                              const storeWeights = store.weights || {};
                              const newMonthWeights = typeof storeWeights === 'object' && !Array.isArray(storeWeights)
                                ? (storeWeights[e.target.value] || { faturamento: 20, pa: 20, ticketMedio: 20, prateleiraInfinita: 20, conversao: 20 })
                                : { faturamento: 20, pa: 20, ticketMedio: 20, prateleiraInfinita: 20, conversao: 20 };
                              
                              setGoals(newMonthGoals);
                              setWeights(newMonthWeights);
                            }
                          }}
                          className="w-36 bg-background border-0 h-9 text-sm font-medium"
                        />
                      </div>
                      <Button type="button" onClick={handleSaveGoals} variant="outline" className="gap-2 h-9">
                        <Save className="w-4 h-4" /> Salvar Metas
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Grid de Metas e Pesos - Layout Equilibrado */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Card de Metas - Metade da largura */}
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                    className="bg-card rounded-2xl border border-border/50 shadow-sm p-6"
                  >
                    <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <Target className="w-5 h-5 text-primary" />
                      </div>
                      <h3 className="text-lg font-semibold text-foreground">Metas de Performance</h3>
                    </div>
                    <div className="space-y-4">
                      {goalFields.map((field, index) => (
                        <motion.div 
                          key={field.name} 
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.2 + index * 0.05 }}
                          className="space-y-2"
                        >
                          <Label htmlFor={field.name} className="flex items-center gap-2 text-sm font-medium text-foreground">
                            <field.icon className="w-4 h-4 text-primary" />
                            <span>{field.label}</span>
                          </Label>
                          <Input 
                            id={field.name} 
                            name={field.name} 
                            type="number" 
                            step="any" 
                            value={goals[field.name] || ''} 
                            onChange={handleGoalChange} 
                            placeholder={field.placeholder} 
                            className="h-11 text-sm bg-secondary/30 border-border/50 focus:border-primary/50" 
                          />
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Card de Pesos e Gráfico - Metade da largura */}
                  <motion.div 
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card rounded-2xl border border-border/50 shadow-sm p-6 flex flex-col"
                  >
                    <div className="flex items-center justify-between mb-6 pb-4 border-b border-border/50">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Settings className="w-5 h-5 text-primary" />
                        </div>
                        <h3 className="text-lg font-semibold text-foreground">Distribuição de Pesos</h3>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-2 bg-secondary/30 rounded-lg">
                        <span className="text-sm text-muted-foreground">Total:</span>
                        <span className={cn(
                          "text-base font-bold",
                          Math.round(totalWeight) === 100 ? 'text-green-400' : 'text-red-400'
                        )}>
                          {totalWeight.toFixed(0)}%
                        </span>
                      </div>
                    </div>
                    
                    {/* Layout vertical: Sliders acima, Gráfico abaixo */}
                    <div className="flex-1 flex flex-col gap-6">
                      {/* Sliders de peso */}
                      <div className="space-y-4">
                        {goalFields.map((field, index) => (
                          <motion.div 
                            key={`weight-${field.name}`} 
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.3 + index * 0.05 }}
                            className="space-y-2"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <field.icon className="w-4 h-4 text-muted-foreground" />
                                <Label htmlFor={`weight-${field.name}`} className="text-sm font-medium text-foreground">
                                  {field.label}
                                </Label>
                              </div>
                              <div className="flex items-center gap-1.5 min-w-[70px] justify-end">
                                <Input 
                                  type="number" 
                                  value={weights[field.name] || 0} 
                                  onChange={(e) => handleWeightChange(field.name, parseInt(e.target.value) || 0)} 
                                  className="w-14 h-8 text-center text-sm font-semibold bg-secondary/30 border-border/50" 
                                />
                                <span className="text-sm font-bold text-primary">%</span>
                              </div>
                            </div>
                            <Slider
                              id={`weight-${field.name}`}
                              name={field.name}
                              min={0}
                              max={100}
                              step={1}
                              value={[weights[field.name] || 0]}
                              onValueChange={(value) => handleWeightChange(field.name, value[0])}
                              className="w-full"
                            />
                          </motion.div>
                        ))}
                      </div>
                      
                      {/* Gráfico - Centralizado abaixo dos sliders */}
                      <div className="flex-1 flex items-center justify-center min-h-[280px] pt-4 border-t border-border/30">
                        <div className="w-full h-full max-w-xs">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie 
                                data={pieData} 
                                cx="50%" 
                                cy="50%" 
                                labelLine={false} 
                                outerRadius={90} 
                                innerRadius={35}
                                fill="#8884d8" 
                                dataKey="value" 
                                nameKey="name"
                                paddingAngle={2}
                              >
                                {pieData.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                              </Pie>
                              <Legend 
                                wrapperStyle={{ fontSize: '11px', paddingTop: '15px' }} 
                                iconSize={10}
                                formatter={(value) => <span className="text-xs">{value}</span>}
                              />
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>

                {/* Botão de Salvar */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <Button 
                    type="submit" 
                    className="w-full bg-gradient-to-r from-primary via-primary to-blue-600 hover:from-primary/90 hover:to-blue-600/90 text-primary-foreground gap-2 h-12 text-base font-semibold shadow-lg shadow-primary/20"
                  >
                    <Save className="w-5 h-5" />
                    Salvar Todas as Alterações
                  </Button>
                </motion.div>
              </motion.form>
            ) : (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-card rounded-2xl border border-border/50 shadow-sm p-16 text-center"
              >
                <div className="max-w-md mx-auto">
                  <div className="p-4 bg-primary/10 rounded-2xl w-fit mx-auto mb-6">
                    <Target className="w-12 h-12 text-primary/60" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">Selecione uma loja</h3>
                  <p className="text-muted-foreground">Escolha uma loja na lista ao lado para começar a definir metas e pesos de performance.</p>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default GoalsPanel;