import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useLocation } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DollarSign, Percent, Hash, Truck, Target, BarChart, Save, Upload, Download } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';
import { updateStore as updateStoreAPI } from '@/lib/supabaseService';


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
        "bg-card p-4 rounded-lg cursor-pointer border-2 transition-all",
        selected ? 'border-primary shadow-lg' : 'border-border hover:border-primary/50',
        getBrandClass(store.bandeira)
      )}
      whileHover={{ y: -5 }}
    >
      <p className="font-semibold text-foreground truncate">{store.name}</p>
      <p className="text-sm text-muted-foreground">{store.code}</p>
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
  const [selectedMonth, setSelectedMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [isUploadingGoals, setIsUploadingGoals] = useState(false);
  const goalsFileInputRef = useRef(null);

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
      // Ler metas do mês selecionado
      const storeGoals = store.goals || {};
      const goalsForMonth = typeof storeGoals === 'object' && !Array.isArray(storeGoals)
        ? (storeGoals[selectedMonth] || {})
        : (storeGoals || {});
      
      setGoals(goalsForMonth.faturamento !== undefined ? goalsForMonth : { faturamento: 0, pa: 0, ticketMedio: 0, prateleiraInfinita: 0, conversao: 0 });
      setWeights(store.weights || { faturamento: 20, pa: 20, ticketMedio: 20, prateleiraInfinita: 20, conversao: 20 });
    }
  }, [stores, selectedMonth]);
  
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

  // Recarregar metas quando o mês mudar
  useEffect(() => {
    if (selectedStore) {
      handleStoreSelect(selectedStore);
    }
  }, [selectedMonth]);
  
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
    try {
      const store = stores.find(s => s.id === selectedStore);
      if (!store) return;
      
      // Preservar metas de outros meses e atualizar apenas o mês selecionado
      const currentGoals = store.goals || {};
      const updatedGoals = typeof currentGoals === 'object' && !Array.isArray(currentGoals)
        ? { ...currentGoals, [selectedMonth]: goals }
        : { [selectedMonth]: goals };
      
      await updateStoreAPI(selectedStore, { goals: updatedGoals });
      toast({ title: 'Sucesso!', description: 'Metas da loja salvas.' });
      setTimeout(() => {
        fetchData();
      }, 500);
    } catch (error) {
      toast({ title: 'Erro', description: error.message || 'Erro ao salvar metas.', variant: 'destructive' });
    }
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
    try {
      const store = stores.find(s => s.id === selectedStore);
      if (!store) return;
      
      // Preservar metas de outros meses e atualizar apenas o mês selecionado
      const currentGoals = store.goals || {};
      const updatedGoals = typeof currentGoals === 'object' && !Array.isArray(currentGoals)
        ? { ...currentGoals, [selectedMonth]: goals }
        : { [selectedMonth]: goals };
      
      await updateStoreAPI(selectedStore, { goals: updatedGoals, weights });
      toast({ title: 'Sucesso!', description: 'Metas e pesos da loja atualizados.' });
      setTimeout(() => {
        fetchData();
      }, 500);
    } catch (error) {
      toast({ title: 'Erro', description: error.message || 'Erro ao salvar metas.', variant: 'destructive' });
    }
  };

  // Função para limpar e converter valores numéricos
  const cleanNumericValue = (value) => {
    if (!value || value === '' || value.trim() === '') {
      return 0;
    }
    
    let cleaned = String(value).trim().toUpperCase();
    cleaned = cleaned.replace(/R\$\s*/g, '');
    cleaned = cleaned.replace(/\s/g, '');
    
    if (!cleaned || cleaned === '' || cleaned === '-') {
      return 0;
    }
    
    if (cleaned.includes(',') && !cleaned.includes('.')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes('.') && cleaned.includes(',')) {
      const parts = cleaned.split(',');
      if (parts.length === 2) {
        cleaned = parts[0].replace(/\./g, '') + '.' + parts[1];
      } else {
        cleaned = cleaned.replace(/\./g, '').replace(',', '.');
      }
    } else {
      if (cleaned.includes('.')) {
        const lastDotIndex = cleaned.lastIndexOf('.');
        const afterDot = cleaned.substring(lastDotIndex + 1);
        if (afterDot.length > 2) {
          cleaned = cleaned.replace(/\./g, '');
        }
      }
    }
    
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  };

  // Função para gerar template CSV de metas
  const generateGoalsCSVTemplate = () => {
    const headers = [
      'codigo_loja',
      'mes_ano',
      'faturamento',
      'pa',
      'ticketMedio',
      'prateleiraInfinita',
      'conversao'
    ];
    
    const exampleRows = [
      ['af013', selectedMonth, 'R$ 150.000,00', '2,8', '250,50', '15000', '15'],
      ['af015', selectedMonth, '180000', '3.0', 'R$ 280,00', '', '18'],
      ['af017', '', 'R$ 200.000,50', '3,2', '300', '0', '20']
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
      description: 'Preencha o arquivo com as metas das lojas. A coluna "mes_ano" é opcional (formato YYYY-MM). Se vazia, usará o mês selecionado no formulário.' 
    });
  };

  // Função para processar CSV de metas
  const parseGoalsCSV = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length < 2) {
      throw new Error('CSV deve ter pelo menos uma linha de cabeçalho e uma linha de dados.');
    }
    
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    const requiredHeaders = ['codigo_loja', 'faturamento', 'pa', 'ticketmedio', 'prateleinfinita', 'conversao'];
    const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
    if (missingHeaders.length > 0) {
      throw new Error(`Cabeçalhos obrigatórios faltando: ${missingHeaders.join(', ')}`);
    }
    
    const data = [];
    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim());
      const row = {};
      headers.forEach((header, index) => {
        const value = values[index] || '';
        if (header === 'codigo_loja' || header === 'mes_ano') {
          row[header] = value;
        } else {
          row[header] = value;
        }
      });
      data.push(row);
    }
    
    return data;
  };

  // Função para fazer upload e processar CSV de metas
  const handleCSVUploadGoals = async (event) => {
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
    
    setIsUploadingGoals(true);
    
    try {
      const text = await file.text();
      const csvData = parseGoalsCSV(text);
      
      if (csvData.length === 0) {
        throw new Error('Nenhum dado encontrado no CSV.');
      }
      
      let successCount = 0;
      let errorCount = 0;
      const errors = [];
      
      for (const row of csvData) {
        const codigoLoja = row.codigo_loja || row['codigo_loja'];
        if (!codigoLoja) {
          errors.push(`Linha ${csvData.indexOf(row) + 2}: Código da loja não fornecido`);
          errorCount++;
          continue;
        }
        
        const store = stores.find(s => s.code?.toLowerCase() === codigoLoja.toLowerCase());
        if (!store) {
          errors.push(`Linha ${csvData.indexOf(row) + 2}: Loja com código "${codigoLoja}" não encontrada`);
          errorCount++;
          continue;
        }
        
        const goalsData = {
          faturamento: cleanNumericValue(row.faturamento),
          pa: cleanNumericValue(row.pa),
          ticketMedio: cleanNumericValue(row.ticketmedio),
          prateleiraInfinita: cleanNumericValue(row.prateleinfinita),
          conversao: cleanNumericValue(row.conversao)
        };
        
        const rowMonth = row.mes_ano || row['mes_ano'] || '';
        let targetMonth = selectedMonth;
        if (rowMonth && rowMonth.trim() !== '') {
          const monthRegex = /^\d{4}-\d{2}$/;
          if (monthRegex.test(rowMonth.trim())) {
            targetMonth = rowMonth.trim();
          } else {
            errors.push(`Linha ${csvData.indexOf(row) + 2}: Formato de mês inválido "${rowMonth}". Use YYYY-MM (ex: 2024-01). Usando mês do formulário.`);
          }
        }
        
        try {
          // Preservar metas de outros meses
          const currentGoals = store.goals || {};
          const updatedGoals = typeof currentGoals === 'object' && !Array.isArray(currentGoals)
            ? { ...currentGoals, [targetMonth]: goalsData }
            : { [targetMonth]: goalsData };
          
          await updateStoreAPI(store.id, { 
            goals: updatedGoals
          });
          successCount++;
        } catch (error) {
          errors.push(`Linha ${csvData.indexOf(row) + 2}: Erro ao atualizar loja "${codigoLoja}": ${error.message || 'Erro desconhecido'}`);
          errorCount++;
        }
      }
      
      if (successCount > 0) {
        setTimeout(() => {
          fetchData();
        }, 500);
        
        toast({ 
          title: 'Upload concluído!', 
          description: `${successCount} loja(s) atualizada(s) com sucesso.${errorCount > 0 ? ` ${errorCount} erro(s) encontrado(s).` : ''}`,
        });
      }
      
      if (errors.length > 0) {
        console.error('Erros no upload:', errors);
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
      
      if (goalsFileInputRef.current) {
        goalsFileInputRef.current.value = '';
      }
      
    } catch (error) {
      toast({ 
        title: 'Erro ao processar CSV', 
        description: error.message, 
        variant: 'destructive' 
      });
    } finally {
      setIsUploadingGoals(false);
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
          <div className="flex items-center gap-2 flex-wrap">
            <div className="space-y-1">
              <Label htmlFor="goalsMonth" className="text-xs text-muted-foreground">Mês das Metas</Label>
              <Input
                id="goalsMonth"
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                min="2020-01"
                className="w-36 bg-secondary h-9 text-sm"
              />
            </div>
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
            <Button 
              type="button" 
              onClick={generateGoalsCSVTemplate} 
              variant="outline" 
              className="gap-2"
              title="Baixar template CSV para importação de metas em massa"
            >
              <Download className="w-4 h-4" /> Template Metas
            </Button>
            <Button 
              type="button" 
              onClick={() => goalsFileInputRef.current?.click()} 
              variant="outline" 
              className="gap-2"
              disabled={isUploadingGoals}
              title="Fazer upload de CSV com múltiplas metas"
            >
              <Upload className="w-4 h-4" /> {isUploadingGoals ? 'Processando...' : 'Importar Metas'}
            </Button>
            <input
              ref={goalsFileInputRef}
              type="file"
              accept=".csv"
              onChange={handleCSVUploadGoals}
              style={{ display: 'none' }}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 max-h-48 overflow-y-auto pr-2">
            {filteredStores.map(store => (
              <GoalStoreCard key={store.id} store={store} onSelect={handleStoreSelect} selected={selectedStore === store.id} />
            ))}
        </div>

        {selectedStore && (
          <motion.form
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSaveAll}
            className="bg-card rounded-xl shadow-lg border border-border p-8 space-y-8 mt-6"
          >
            <div>
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-semibold text-foreground flex items-center gap-2"><Target /> Metas da Loja</h2>
                  <p className="text-sm text-muted-foreground mt-1">Mês: {new Date(selectedMonth + '-01').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</p>
                </div>
                <Button type="button" onClick={handleSaveGoals} variant="outline" size="sm" className="gap-2">
                  <Save className="w-4 h-4" /> Salvar Metas
                </Button>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 mt-4">
                {goalFields.map(field => (
                  <div key={field.name} className="space-y-2">
                    <Label htmlFor={field.name} className="flex items-center gap-2 text-muted-foreground"><field.icon className="w-4 h-4" />{field.label}</Label>
                    <Input id={field.name} name={field.name} type="number" step="any" value={goals[field.name] || ''} onChange={handleGoalChange} placeholder={field.placeholder} />
                  </div>
                ))}
              </div>
            </div>
            
            <div>
              <h2 className="text-xl font-semibold text-foreground">Termômetro de Peso Interativo</h2>
              <p className="text-muted-foreground text-sm">Ajuste o peso de cada indicador. A soma é sempre 100%.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-4 items-center">
                <div className="space-y-6">
                  {goalFields.map(field => (
                    <div key={`weight-${field.name}`} className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor={`weight-${field.name}`} className="col-span-1 text-muted-foreground">{field.label}</Label>
                      <Slider
                        id={`weight-${field.name}`}
                        name={field.name}
                        min={0}
                        max={100}
                        step={1}
                        value={[weights[field.name] || 0]}
                        onValueChange={(value) => handleWeightChange(field.name, value[0])}
                        className="col-span-2"
                      />
                      <div className="col-span-1 flex items-center justify-end gap-2">
                        <Input type="number" value={weights[field.name] || 0} onChange={(e) => handleWeightChange(field.name, parseInt(e.target.value) || 0)} className="w-20 h-8 text-center" />
                        <span className="font-bold text-primary">%</span>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" labelLine={false} outerRadius={120} fill="#8884d8" dataKey="value" nameKey="name">
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="text-right mt-4 font-bold text-lg">Total: <span className={Math.round(totalWeight) === 100 ? 'text-green-400' : 'text-red-400'}>{totalWeight.toFixed(0)}%</span></div>
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-blue-500 text-primary-foreground gap-2">
              <Save className="w-4 h-4" />
              Salvar Todas as Alterações
            </Button>
          </motion.form>
        )}
      </div>
    </>
  );
};

export default GoalsPanel;