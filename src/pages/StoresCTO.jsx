import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { updateStore as updateStoreAPI, fetchStores } from '@/lib/supabaseService';
import { Store, Calculator, DollarSign, Percent, Ruler, Building2, Save, Search, Calendar, Edit, Plus, Trash2, Settings, FileSpreadsheet, BarChart3, TrendingUp } from 'lucide-react';
import { useOptimizedRefresh } from '@/lib/useOptimizedRefresh';
import { filterStoresByUserType } from '@/lib/storeTypeHelper';
import { useNavigate } from 'react-router-dom';
import { format, eachMonthOfInterval, startOfYear, endOfYear, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const StoresCTO = () => {
  const { stores, fetchData } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [dashboardYear, setDashboardYear] = useState(new Date().getFullYear().toString());
  const [dashboardMonth, setDashboardMonth] = useState('all');
  const [periodStart, setPeriodStart] = useState(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return firstDay.toISOString().split('T')[0]; // YYYY-MM-DD
  });
  const [periodEnd, setPeriodEnd] = useState(() => {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD
  });
  const [usePeriodFilter, setUsePeriodFilter] = useState(false);

  useOptimizedRefresh(fetchData);

  // Filtrar lojas por tipo e busca
  const filteredStores = useMemo(() => {
    let filtered = filterStoresByUserType(stores, user?.role, user?.storeId);
    
    if (searchTerm) {
      filtered = filtered.filter(store =>
        store.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        store.code?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    return filtered;
  }, [stores, user?.role, user?.storeId, searchTerm]);

  // Gerar meses do ano atual
  const getCurrentYearMonths = () => {
    const now = new Date();
    const year = now.getFullYear();
    const start = startOfYear(new Date(year, 0, 1));
    const end = endOfYear(new Date(year, 11, 31));
    return eachMonthOfInterval({ start, end });
  };

  return (
    <>
      <Helmet>
        <title>CTO - MYFEET</title>
      </Helmet>
      <div className="container mx-auto p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <Calculator className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">CTO - Custo Total de Ocupação</h1>
              <p className="text-muted-foreground">Gestão completa de CTO das lojas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => navigate('/stores-cto-analytics')}
              className="gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Análise Mensal
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/stores-cto-register')}
              className="gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              Livro de Registro
            </Button>
          </div>
        </motion.div>

        {/* Busca */}
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="Buscar loja por nome ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Abas */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="dashboard" className="gap-2">
              <BarChart3 className="w-4 h-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="basic-info" className="gap-2">
              <Settings className="w-4 h-4" />
              Informações Básicas
            </TabsTrigger>
            <TabsTrigger value="sales" className="gap-2">
              <DollarSign className="w-4 h-4" />
              Registro de Vendas
            </TabsTrigger>
            <TabsTrigger value="cto-monthly" className="gap-2">
              <Calculator className="w-4 h-4" />
              CTO Mensal
            </TabsTrigger>
          </TabsList>

          {/* Aba 0: Dashboard CTO */}
          <TabsContent value="dashboard" className="mt-6">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2 flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-primary" />
                    Dashboard CTO
                  </h2>
                  <p className="text-muted-foreground">Visão geral do CTO (Custo Total de Ocupação) das lojas.</p>
                </div>
                
                {/* Filtros */}
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="dashboard-year" className="text-sm text-muted-foreground whitespace-nowrap">Ano:</Label>
                      <Select value={dashboardYear} onValueChange={setDashboardYear} disabled={usePeriodFilter}>
                        <SelectTrigger id="dashboard-year" className="w-[120px] bg-secondary">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Array.from({ length: 5 }, (_, i) => {
                            const year = new Date().getFullYear() - i;
                            return (
                              <SelectItem key={year} value={year.toString()}>
                                {year}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex items-center gap-2">
                      <Label htmlFor="dashboard-month" className="text-sm text-muted-foreground whitespace-nowrap">Mês:</Label>
                      <Select value={dashboardMonth} onValueChange={setDashboardMonth} disabled={usePeriodFilter}>
                        <SelectTrigger id="dashboard-month" className="w-[180px] bg-secondary">
                          <SelectValue placeholder="Todos os meses" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Todos os meses</SelectItem>
                          {Array.from({ length: 12 }, (_, i) => {
                            const month = i + 1;
                            const monthKey = `${dashboardYear}-${String(month).padStart(2, '0')}`;
                            const monthDate = new Date(parseInt(dashboardYear), i, 1);
                            return (
                              <SelectItem key={monthKey} value={monthKey}>
                                {format(monthDate, 'MMMM yyyy', { locale: ptBR })}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        id="use-period-filter"
                        checked={usePeriodFilter}
                        onChange={(e) => setUsePeriodFilter(e.target.checked)}
                        className="w-4 h-4"
                      />
                      <Label htmlFor="use-period-filter" className="text-sm text-muted-foreground whitespace-nowrap cursor-pointer">
                        Usar período personalizado
                      </Label>
                    </div>
                  </div>

                  {usePeriodFilter && (
                    <div className="flex items-center gap-3 flex-wrap">
                      <div className="flex items-center gap-2">
                        <Label htmlFor="period-start" className="text-sm text-muted-foreground whitespace-nowrap">Data Início:</Label>
                        <Input
                          id="period-start"
                          type="date"
                          value={periodStart}
                          onChange={(e) => setPeriodStart(e.target.value)}
                          className="w-[150px] bg-secondary"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor="period-end" className="text-sm text-muted-foreground whitespace-nowrap">Data Fim:</Label>
                        <Input
                          id="period-end"
                          type="date"
                          value={periodEnd}
                          onChange={(e) => setPeriodEnd(e.target.value)}
                          className="w-[150px] bg-secondary"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {(() => {
                const selectedYear = parseInt(dashboardYear);
                const selectedMonth = dashboardMonth === 'all' ? null : dashboardMonth;
                
                // Calcular estatísticas de CTO
                let totalFaturamento = 0;
                let totalCTOBoleto = 0;
                let totalCTOTotal = 0;
                let lojasComCTO = 0;
                let lojasAcima12 = 0;
                let lojasEntre10e12 = 0;
                let lojasAbaixo10 = 0;
                
                // Custos: Esperado vs Pago
                let totalAMMEsperado = 0;
                let totalAMMPago = 0;
                let totalFPPEsperado = 0;
                let totalFPPPago = 0;
                let totalCondEsperado = 0;
                let totalCondPago = 0;
                let totalCTOEsperado = 0;
                let totalCTOPago = 0;
                
                // Custos gerais
                let totalComplementar = 0;
                let totalValoresAdicionais = 0;
                
                // Determinar meses a processar
                let monthsToProcess = [];
                
                if (usePeriodFilter && periodStart && periodEnd) {
                  // Filtrar por período personalizado
                  const startDate = new Date(periodStart);
                  const endDate = new Date(periodEnd);
                  const currentDate = new Date(startDate);
                  
                  while (currentDate <= endDate) {
                    const year = currentDate.getFullYear();
                    const month = currentDate.getMonth() + 1;
                    const monthKey = `${year}-${String(month).padStart(2, '0')}`;
                    monthsToProcess.push(monthKey);
                    
                    // Avançar para o próximo mês
                    currentDate.setMonth(currentDate.getMonth() + 1);
                    currentDate.setDate(1); // Primeiro dia do mês
                  }
                } else if (selectedMonth) {
                  // Mês específico selecionado
                  monthsToProcess = [selectedMonth];
                } else {
                  // Todos os meses do ano
                  monthsToProcess = Array.from({ length: 12 }, (_, i) => {
                    const month = i + 1;
                    return `${selectedYear}-${String(month).padStart(2, '0')}`;
                  });
                }
                
                filteredStores.forEach(store => {
                  const ctoData = store.cto_data || {};
                  const monthlySales = ctoData.monthlySales || {};
                  const monthlyBills = ctoData.monthlyBills || {};
                  const basicInfo = ctoData.basicInfo || {};
                  const yearBasicInfo = basicInfo[selectedYear.toString()] || {};
                  
                  // Valores esperados do ano (ou campos antigos para compatibilidade)
                  const aluguelMin = yearBasicInfo.aluguelMin || parseFloat(ctoData.aluguelMin) || 0;
                  const expectedFPP = yearBasicInfo.fundoParticipacao || 0;
                  const expectedCond = yearBasicInfo.condominio || 0;
                  
                  let storeFaturamento = 0;
                  let storeCTOBoleto = 0;
                  let storeCTOTotal = 0;
                  let hasData = false;
                  
                  monthsToProcess.forEach(monthKey => {
                    // Obter vendas (suportando estrutura antiga e nova)
                    const salesData = monthlySales[monthKey];
                    let salesFisico = 0;
                    let salesDigital = 0;
                    if (salesData) {
                      if (typeof salesData === 'object' && salesData !== null) {
                        // Nova estrutura: objeto com fisico e digital
                        salesFisico = parseFloat(salesData.fisico || 0);
                        salesDigital = parseFloat(salesData.digital || 0);
                      } else {
                        // Estrutura antiga
                        salesFisico = parseFloat(salesData || 0);
                        salesDigital = 0;
                      }
                    }
                    
                    const bills = monthlyBills[monthKey] || {};
                    const includeDigital = bills.includeDigital || false;
                    
                    // Vendas totais: sempre físico + digital (se botão ativo)
                    const sales = salesFisico + (includeDigital ? salesDigital : 0);
                    
                    const amm = parseFloat(bills.amm || 0);
                    const ammDiscount = parseFloat(bills.ammDiscount || 0);
                    const ammFinal = Math.max(0, amm - ammDiscount);
                    const fpp = parseFloat(bills.fpp || 0);
                    const cond = parseFloat(bills.cond || 0);
                    const ctoBoleto = ammFinal + fpp + cond;
                    
                    const additionalCosts = (bills.additionalCosts || [])
                      .filter(c => c.value && parseFloat(c.value) > 0)
                      .reduce((sum, c) => sum + parseFloat(c.value || 0), 0);
                    
                    const ctoTotal = ctoBoleto + additionalCosts;
                    
                    // Calcular valores esperados para este mês
                    const monthDate = new Date(monthKey + '-01');
                    const isDecember = monthDate.getMonth() === 11;
                    const expectedAMM = isDecember ? aluguelMin * 2 : aluguelMin;
                    // CTO Total Esperado deve incluir custos adicionais também
                    const expectedCTO = expectedAMM + expectedFPP + expectedCond + additionalCosts;
                    
                    // Calcular valor complementar (baseado nas vendas totais)
                    const aluguelPercentual = yearBasicInfo.aluguelPercentual || parseFloat(ctoData.aluguelPercentual) || 0;
                    const pe = aluguelPercentual > 0 ? aluguelMin / (aluguelPercentual / 100) : 0;
                    const diferencaVendas = sales > pe ? sales - pe : 0;
                    const valorComplementar = diferencaVendas > 0 && aluguelPercentual > 0 
                      ? diferencaVendas * (aluguelPercentual / 100) 
                      : 0;
                    
                    // Acumular valores esperados e pagos
                    totalAMMEsperado += expectedAMM;
                    totalAMMPago += ammFinal;
                    totalFPPEsperado += expectedFPP;
                    totalFPPPago += fpp;
                    totalCondEsperado += expectedCond;
                    totalCondPago += cond;
                    totalCTOEsperado += expectedCTO;
                    // CTO Total Pago deve incluir custos adicionais também
                    totalCTOPago += ctoTotal;
                    totalComplementar += valorComplementar;
                    totalValoresAdicionais += additionalCosts;
                    
                    if (sales > 0 && ctoBoleto > 0) {
                      storeFaturamento += sales;
                      storeCTOBoleto += ctoBoleto;
                      storeCTOTotal += ctoTotal;
                      hasData = true;
                    }
                  });
                  
                  if (hasData) {
                    const percentualCTO = storeFaturamento > 0 && storeCTOBoleto > 0
                      ? (storeCTOBoleto / storeFaturamento) * 100
                      : 0;
                    
                    totalFaturamento += storeFaturamento;
                    totalCTOBoleto += storeCTOBoleto;
                    totalCTOTotal += storeCTOTotal;
                    lojasComCTO++;
                    
                    if (percentualCTO > 12) lojasAcima12++;
                    else if (percentualCTO >= 10) lojasEntre10e12++;
                    else lojasAbaixo10++;
                  }
                });
                
                // Calcular diferenças
                const diffAMM = totalAMMPago - totalAMMEsperado;
                const diffFPP = totalFPPPago - totalFPPEsperado;
                const diffCond = totalCondPago - totalCondEsperado;
                const diffCTO = totalCTOPago - totalCTOEsperado;
                
                // Custo total geral
                const custoTotalGeral = totalAMMPago + totalFPPPago + totalComplementar + totalValoresAdicionais;
                
                const percentualMedio = totalFaturamento > 0 && totalCTOBoleto > 0
                  ? (totalCTOBoleto / totalFaturamento) * 100
                  : 0;
                
                return (
                  <>
                    {/* Cards de Resumo */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Percentual CTO Médio</span>
                            <BarChart3 className="w-5 h-5 text-blue-500" />
                          </div>
                          <p className={`text-2xl font-bold ${
                            percentualMedio > 12 
                              ? 'text-red-500' 
                              : percentualMedio >= 10 
                              ? 'text-yellow-500' 
                              : percentualMedio > 0
                              ? 'text-green-500'
                              : 'text-foreground'
                          }`}>
                            {percentualMedio > 0 ? `${percentualMedio.toFixed(2)}%` : '-'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {lojasComCTO} loja(s) com dados
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Faturamento Mensal</span>
                            <DollarSign className="w-5 h-5 text-green-500" />
                          </div>
                          <p className="text-2xl font-bold text-foreground">
                            {totalFaturamento > 0 
                              ? `R$ ${totalFaturamento.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                              : '-'
                            }
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {selectedMonth 
                              ? format(new Date(selectedMonth + '-01'), 'MMMM yyyy', { locale: ptBR })
                              : `${selectedYear} (Anual)`
                            }
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">CTO Total Mensal</span>
                            <Calculator className="w-5 h-5 text-orange-500" />
                          </div>
                          <p className="text-2xl font-bold text-foreground">
                            {totalCTOTotal > 0 
                              ? `R$ ${totalCTOTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                              : '-'
                            }
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            CTO do Boleto + Adicionais
                          </p>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Status das Lojas</span>
                            <Percent className="w-5 h-5 text-primary" />
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-green-500">✓ Abaixo de 10%</span>
                              <span className="font-semibold">{lojasAbaixo10}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-yellow-500">⚡ 10-12%</span>
                              <span className="font-semibold">{lojasEntre10e12}</span>
                            </div>
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-red-500">⚠ Acima de 12%</span>
                              <span className="font-semibold">{lojasAcima12}</span>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Seção de Custos Gerais */}
                    {(totalAMMPago > 0 || totalFPPPago > 0 || totalComplementar > 0 || totalValoresAdicionais > 0) && (
                      <Card className="border-2 border-primary/30">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-primary" />
                            Custos Gerais
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                            {/* AMM */}
                            <div className="space-y-2 p-4 bg-secondary/50 rounded-lg">
                              <div className="text-sm font-semibold text-foreground mb-2">AMM</div>
                              <div className="text-2xl font-bold text-blue-400">
                                R$ {totalAMMPago.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              <div className="text-xs text-muted-foreground">Aluguel Mínimo Mensal</div>
                            </div>

                            {/* FPP */}
                            <div className="space-y-2 p-4 bg-secondary/50 rounded-lg">
                              <div className="text-sm font-semibold text-foreground mb-2">FPP</div>
                              <div className="text-2xl font-bold text-blue-400">
                                R$ {totalFPPPago.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              <div className="text-xs text-muted-foreground">Fundo de Promoção</div>
                            </div>

                            {/* Complementar */}
                            <div className="space-y-2 p-4 bg-secondary/50 rounded-lg">
                              <div className="text-sm font-semibold text-foreground mb-2">Complementar</div>
                              <div className="text-2xl font-bold text-purple-400">
                                R$ {totalComplementar.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              <div className="text-xs text-muted-foreground">Valor Complementar</div>
                            </div>

                            {/* Valores Adicionais */}
                            <div className="space-y-2 p-4 bg-secondary/50 rounded-lg">
                              <div className="text-sm font-semibold text-foreground mb-2">Outros</div>
                              <div className="text-2xl font-bold text-orange-400">
                                R$ {totalValoresAdicionais.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                              <div className="text-xs text-muted-foreground">Valores Adicionais</div>
                            </div>
                          </div>

                          {/* Total Geral */}
                          <div className="pt-4 border-t border-border">
                            <div className="flex items-center justify-between p-4 bg-primary/10 rounded-lg">
                              <div className="text-lg font-semibold text-foreground">Custo Total Geral:</div>
                              <div className="text-3xl font-bold text-primary">
                                R$ {custoTotalGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-2 text-center">
                              AMM + FPP + Complementar + Valores Adicionais
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Seção de Custos: Esperado vs Pago */}
                    {(totalAMMEsperado > 0 || totalAMMPago > 0) && (
                      <Card className="border-2 border-primary/30">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-primary" />
                            Análise de Custos: Esperado vs Pago
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {/* AMM */}
                            <div className="space-y-2 p-4 bg-secondary/50 rounded-lg">
                              <div className="text-sm font-semibold text-foreground mb-3">AMM (Aluguel Mínimo Mensal)</div>
                              <div className="space-y-2">
                                <div>
                                  <div className="text-xs text-muted-foreground">Esperado:</div>
                                  <div className="text-lg font-bold text-green-400">
                                    R$ {totalAMMEsperado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Pago:</div>
                                  <div className="text-lg font-bold text-blue-400">
                                    R$ {totalAMMPago.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                </div>
                                <div className="pt-2 border-t border-border">
                                  <div className="text-xs text-muted-foreground">Diferença:</div>
                                  <div className={`text-lg font-bold ${
                                    Math.abs(diffAMM) < 0.01 
                                      ? 'text-green-500' 
                                      : diffAMM > 0 
                                      ? 'text-orange-500' 
                                      : 'text-blue-500'
                                  }`}>
                                    {Math.abs(diffAMM) < 0.01 
                                      ? 'R$ 0,00' 
                                      : diffAMM > 0 
                                      ? `+R$ ${Math.abs(diffAMM).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                      : `-R$ ${Math.abs(diffAMM).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    }
                                  </div>
                                  {Math.abs(diffAMM) >= 0.01 && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {diffAMM > 0 ? 'Pagaram a mais' : 'Pagaram a menos'}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* FPP */}
                            <div className="space-y-2 p-4 bg-secondary/50 rounded-lg">
                              <div className="text-sm font-semibold text-foreground mb-3">FPP (Fundo de Promoção)</div>
                              <div className="space-y-2">
                                <div>
                                  <div className="text-xs text-muted-foreground">Esperado:</div>
                                  <div className="text-lg font-bold text-green-400">
                                    R$ {totalFPPEsperado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Pago:</div>
                                  <div className="text-lg font-bold text-blue-400">
                                    R$ {totalFPPPago.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                </div>
                                <div className="pt-2 border-t border-border">
                                  <div className="text-xs text-muted-foreground">Diferença:</div>
                                  <div className={`text-lg font-bold ${
                                    Math.abs(diffFPP) < 0.01 
                                      ? 'text-green-500' 
                                      : diffFPP > 0 
                                      ? 'text-orange-500' 
                                      : 'text-blue-500'
                                  }`}>
                                    {Math.abs(diffFPP) < 0.01 
                                      ? 'R$ 0,00' 
                                      : diffFPP > 0 
                                      ? `+R$ ${Math.abs(diffFPP).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                      : `-R$ ${Math.abs(diffFPP).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    }
                                  </div>
                                  {Math.abs(diffFPP) >= 0.01 && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {diffFPP > 0 ? 'Pagaram a mais' : 'Pagaram a menos'}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Condomínio */}
                            <div className="space-y-2 p-4 bg-secondary/50 rounded-lg">
                              <div className="text-sm font-semibold text-foreground mb-3">Condomínio</div>
                              <div className="space-y-2">
                                <div>
                                  <div className="text-xs text-muted-foreground">Esperado:</div>
                                  <div className="text-lg font-bold text-green-400">
                                    R$ {totalCondEsperado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Pago:</div>
                                  <div className="text-lg font-bold text-blue-400">
                                    R$ {totalCondPago.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                </div>
                                <div className="pt-2 border-t border-border">
                                  <div className="text-xs text-muted-foreground">Diferença:</div>
                                  <div className={`text-lg font-bold ${
                                    Math.abs(diffCond) < 0.01 
                                      ? 'text-green-500' 
                                      : diffCond > 0 
                                      ? 'text-orange-500' 
                                      : 'text-blue-500'
                                  }`}>
                                    {Math.abs(diffCond) < 0.01 
                                      ? 'R$ 0,00' 
                                      : diffCond > 0 
                                      ? `+R$ ${Math.abs(diffCond).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                      : `-R$ ${Math.abs(diffCond).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    }
                                  </div>
                                  {Math.abs(diffCond) >= 0.01 && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {diffCond > 0 ? 'Pagaram a mais' : 'Pagaram a menos'}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* CTO Total */}
                            <div className="space-y-2 p-4 bg-secondary/50 rounded-lg border-2 border-primary/30">
                              <div className="text-sm font-semibold text-foreground mb-3">CTO Total (Boleto)</div>
                              <div className="space-y-2">
                                <div>
                                  <div className="text-xs text-muted-foreground">Esperado:</div>
                                  <div className="text-lg font-bold text-green-400">
                                    R$ {totalCTOEsperado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                </div>
                                <div>
                                  <div className="text-xs text-muted-foreground">Pago:</div>
                                  <div className="text-lg font-bold text-blue-400">
                                    R$ {totalCTOPago.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </div>
                                </div>
                                <div className="pt-2 border-t border-border">
                                  <div className="text-xs text-muted-foreground">Diferença:</div>
                                  <div className={`text-lg font-bold ${
                                    Math.abs(diffCTO) < 0.01 
                                      ? 'text-green-500' 
                                      : diffCTO > 0 
                                      ? 'text-orange-500' 
                                      : 'text-blue-500'
                                  }`}>
                                    {Math.abs(diffCTO) < 0.01 
                                      ? 'R$ 0,00' 
                                      : diffCTO > 0 
                                      ? `+R$ ${Math.abs(diffCTO).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                      : `-R$ ${Math.abs(diffCTO).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                    }
                                  </div>
                                  {Math.abs(diffCTO) >= 0.01 && (
                                    <div className="text-xs text-muted-foreground mt-1">
                                      {diffCTO > 0 ? 'Pagaram a mais' : 'Pagaram a menos'}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Lista de Lojas com CTO */}
                    {lojasComCTO > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="w-5 h-5" />
                            Lojas com CTO Registrado
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {filteredStores
                              .map(store => {
                                const ctoData = store.cto_data || {};
                                const monthlySales = ctoData.monthlySales || {};
                                const monthlyBills = ctoData.monthlyBills || {};
                                const basicInfo = ctoData.basicInfo || {};
                                const yearBasicInfo = basicInfo[selectedYear.toString()] || {};
                                
                                // Valores esperados do ano
                                const aluguelMin = yearBasicInfo.aluguelMin || parseFloat(ctoData.aluguelMin) || 0;
                                const expectedFPP = yearBasicInfo.fundoParticipacao || 0;
                                const expectedCond = yearBasicInfo.condominio || 0;
                                
                                let totalSales = 0;
                                let totalCTOBoleto = 0;
                                let totalAMMEsperado = 0;
                                let totalAMMPago = 0;
                                let totalFPPEsperado = 0;
                                let totalFPPPago = 0;
                                let totalCondEsperado = 0;
                                let totalCondPago = 0;
                                let totalComplementar = 0;
                                let totalValoresAdicionais = 0;
                                
                                monthsToProcess.forEach(monthKey => {
                                  // Obter vendas (suportando estrutura antiga e nova)
                                  const salesData = monthlySales[monthKey];
                                  let salesFisico = 0;
                                  let salesDigital = 0;
                                  if (salesData) {
                                    if (typeof salesData === 'object' && salesData !== null) {
                                      // Nova estrutura: objeto com fisico e digital
                                      salesFisico = parseFloat(salesData.fisico || 0);
                                      salesDigital = parseFloat(salesData.digital || 0);
                                    } else {
                                      // Estrutura antiga
                                      salesFisico = parseFloat(salesData || 0);
                                      salesDigital = 0;
                                    }
                                  }
                                  
                                  const bills = monthlyBills[monthKey] || {};
                                  const includeDigital = bills.includeDigital || false;
                                  
                                  // Vendas totais: sempre físico + digital (se botão ativo)
                                  const sales = salesFisico + (includeDigital ? salesDigital : 0);
                                  
                                  const amm = parseFloat(bills.amm || 0);
                                  const ammDiscount = parseFloat(bills.ammDiscount || 0);
                                  const ammFinal = Math.max(0, amm - ammDiscount);
                                  const fpp = parseFloat(bills.fpp || 0);
                                  const cond = parseFloat(bills.cond || 0);
                                  const ctoBoleto = ammFinal + fpp + cond;
                                  
                                  const additionalCosts = (bills.additionalCosts || [])
                                    .filter(c => c.value && parseFloat(c.value) > 0)
                                    .reduce((sum, c) => sum + parseFloat(c.value || 0), 0);
                                  
                                  // Calcular valores esperados para este mês
                                  const monthDate = new Date(monthKey + '-01');
                                  const isDecember = monthDate.getMonth() === 11;
                                  const expectedAMM = isDecember ? aluguelMin * 2 : aluguelMin;
                                  
                                  // Calcular valor complementar (baseado nas vendas totais)
                                  const aluguelPercentual = yearBasicInfo.aluguelPercentual || parseFloat(ctoData.aluguelPercentual) || 0;
                                  const pe = aluguelPercentual > 0 ? aluguelMin / (aluguelPercentual / 100) : 0;
                                  const diferencaVendas = sales > pe ? sales - pe : 0;
                                  const valorComplementar = diferencaVendas > 0 && aluguelPercentual > 0 
                                    ? diferencaVendas * (aluguelPercentual / 100) 
                                    : 0;
                                  
                                  totalAMMEsperado += expectedAMM;
                                  totalAMMPago += ammFinal;
                                  totalFPPEsperado += expectedFPP;
                                  totalFPPPago += fpp;
                                  totalCondEsperado += expectedCond;
                                  totalCondPago += cond;
                                  totalComplementar += valorComplementar;
                                  totalValoresAdicionais += additionalCosts;
                                  
                                  if (sales > 0 && ctoBoleto > 0) {
                                    totalSales += sales;
                                    totalCTOBoleto += ctoBoleto;
                                  }
                                });
                                
                                const percentualCTO = totalSales > 0 && totalCTOBoleto > 0 
                                  ? (totalCTOBoleto / totalSales) * 100 
                                  : 0;
                                
                                if (totalSales === 0 || totalCTOBoleto === 0) return null;
                                
                                const totalCTOEsperado = totalAMMEsperado + totalFPPEsperado + totalCondEsperado;
                                const diffCTO = totalCTOBoleto - totalCTOEsperado;
                                
                                return (
                                  <div key={store.id} className="p-4 bg-secondary/50 rounded-lg border border-border/50">
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2">
                                        <span className="font-medium text-foreground">{store.name}</span>
                                        {store.code && (
                                          <span className="text-xs text-muted-foreground">({store.code})</span>
                                        )}
                                      </div>
                                      <span className={`text-lg font-bold ${
                                        percentualCTO > 12 
                                          ? 'text-red-500' 
                                          : percentualCTO >= 10 
                                          ? 'text-yellow-500' 
                                          : percentualCTO > 0
                                          ? 'text-green-500'
                                          : 'text-muted-foreground'
                                      }`}>
                                        {percentualCTO > 0 ? `${percentualCTO.toFixed(2)}%` : '-'}
                                      </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-3 border-t border-border/50">
                                      <div className="space-y-2">
                                        <div className="text-xs font-semibold text-muted-foreground mb-2">Vendas e CTO</div>
                                        <div className="flex items-center justify-between text-xs">
                                          <span className="text-muted-foreground">Vendas:</span>
                                          <span className="font-semibold text-green-400">
                                            R$ {totalSales.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between text-xs">
                                          <span className="text-muted-foreground">CTO Pago:</span>
                                          <span className="font-semibold text-blue-400">
                                            R$ {totalCTOBoleto.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                          </span>
                                        </div>
                                      </div>
                                      
                                      <div className="space-y-2">
                                        <div className="text-xs font-semibold text-muted-foreground mb-2">Custos: Esperado vs Pago</div>
                                        {totalCTOEsperado > 0 ? (
                                          <>
                                            <div className="flex items-center justify-between text-xs">
                                              <span className="text-muted-foreground">CTO Esperado:</span>
                                              <span className="font-semibold text-green-400">
                                                R$ {totalCTOEsperado.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                              </span>
                                            </div>
                                            <div className="flex items-center justify-between text-xs">
                                              <span className="text-muted-foreground">Diferença:</span>
                                              <span className={`font-semibold ${
                                                Math.abs(diffCTO) < 0.01 
                                                  ? 'text-green-500' 
                                                  : diffCTO > 0 
                                                  ? 'text-orange-500' 
                                                  : 'text-blue-500'
                                              }`}>
                                                {Math.abs(diffCTO) < 0.01 
                                                  ? 'R$ 0' 
                                                  : diffCTO > 0 
                                                  ? `+R$ ${Math.abs(diffCTO).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                                                  : `-R$ ${Math.abs(diffCTO).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
                                                }
                                              </span>
                                            </div>
                                          </>
                                        ) : (
                                          <div className="text-xs text-muted-foreground">
                                            Sem informações básicas cadastradas
                                          </div>
                                        )}
                                      </div>
                                    </div>

                                    {/* Custos Gerais por Loja */}
                                    {(totalAMMPago > 0 || totalFPPPago > 0 || totalComplementar > 0 || totalValoresAdicionais > 0) && (
                                      <div className="mt-3 pt-3 border-t border-border/50">
                                        <div className="text-xs font-semibold text-muted-foreground mb-2">Custos Gerais</div>
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                          <div>
                                            <div className="text-muted-foreground">AMM:</div>
                                            <div className="font-semibold text-blue-400">
                                              R$ {totalAMMPago.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </div>
                                          </div>
                                          <div>
                                            <div className="text-muted-foreground">FPP:</div>
                                            <div className="font-semibold text-blue-400">
                                              R$ {totalFPPPago.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </div>
                                          </div>
                                          <div>
                                            <div className="text-muted-foreground">Complementar:</div>
                                            <div className="font-semibold text-purple-400">
                                              R$ {totalComplementar.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </div>
                                          </div>
                                          <div>
                                            <div className="text-muted-foreground">Outros:</div>
                                            <div className="font-semibold text-orange-400">
                                              R$ {totalValoresAdicionais.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </div>
                                          </div>
                                        </div>
                                        <div className="mt-2 pt-2 border-t border-border/30">
                                          <div className="flex items-center justify-between text-xs">
                                            <span className="text-muted-foreground font-semibold">Total Geral:</span>
                                            <span className="font-bold text-primary">
                                              R$ {(totalAMMPago + totalFPPPago + totalComplementar + totalValoresAdicionais).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
                                            </span>
                                          </div>
                                        </div>
                                      </div>
                                    )}
                                  </div>
                                );
                              })
                              .filter(Boolean)}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </>
                );
              })()}
            </div>
          </TabsContent>

          {/* Aba 1: Informações Básicas */}
          <TabsContent value="basic-info" className="mt-6">
            <BasicInfoTab stores={filteredStores} fetchData={fetchData} />
          </TabsContent>

          {/* Aba 2: Registro de Vendas */}
          <TabsContent value="sales" className="mt-6">
            <SalesRegistrationTab stores={filteredStores} fetchData={fetchData} />
          </TabsContent>

          {/* Aba 3: CTO Mensal */}
          <TabsContent value="cto-monthly" className="mt-6">
            <CTOMonthlyTab stores={filteredStores} fetchData={fetchData} />
          </TabsContent>
        </Tabs>
      </div>
    </>
  );
};

// Componente: Informações Básicas
const BasicInfoTab = ({ stores, fetchData }) => {
  const { toast } = useToast();
  const [selectedStore, setSelectedStore] = useState(null);
  const [saving, setSaving] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [ctoData, setCtoData] = useState({
    m2: '',
    aluguelMin: '',
    aluguelPercentual: '',
    condominio: '',
    fundoParticipacao: '',
  });

  // Gerar lista de anos (ano atual e próximos 2 anos)
  const getAvailableYears = () => {
    const currentYear = new Date().getFullYear();
    return [
      (currentYear - 1).toString(),
      currentYear.toString(),
      (currentYear + 1).toString(),
      (currentYear + 2).toString(),
    ];
  };

  const loadStoreData = (store) => {
    const ctoInfo = store.cto_data || {};
    const basicInfo = ctoInfo.basicInfo || {};
    const yearData = basicInfo[selectedYear] || {};
    
    setCtoData({
      m2: yearData.m2 !== undefined && yearData.m2 !== null ? String(yearData.m2) : '',
      aluguelMin: yearData.aluguelMin !== undefined && yearData.aluguelMin !== null ? String(yearData.aluguelMin) : '',
      aluguelPercentual: yearData.aluguelPercentual !== undefined && yearData.aluguelPercentual !== null ? String(yearData.aluguelPercentual) : '',
      condominio: yearData.condominio !== undefined && yearData.condominio !== null ? String(yearData.condominio) : '',
      fundoParticipacao: yearData.fundoParticipacao !== undefined && yearData.fundoParticipacao !== null ? String(yearData.fundoParticipacao) : '',
    });
    setSelectedStore(store);
  };

  // Recarregar dados quando o ano mudar
  useEffect(() => {
    if (selectedStore) {
      loadStoreData(selectedStore);
    }
  }, [selectedYear]);

  const handleSave = async () => {
    if (!selectedStore) {
      toast({
        title: 'Erro',
        description: 'Selecione uma loja para salvar.',
        variant: 'destructive'
      });
      return;
    }

    if (!ctoData.m2 || parseFloat(ctoData.m2) <= 0) {
      toast({
        title: 'Erro',
        description: 'Informe o m² da loja.',
        variant: 'destructive'
      });
      return;
    }

    if (!ctoData.aluguelMin || parseFloat(ctoData.aluguelMin) <= 0) {
      toast({
        title: 'Erro',
        description: 'Informe o Aluguel Mínimo.',
        variant: 'destructive'
      });
      return;
    }

    if (!ctoData.aluguelPercentual || parseFloat(ctoData.aluguelPercentual) <= 0) {
      toast({
        title: 'Erro',
        description: 'Informe o Aluguel Percentual.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);

      const currentCTOData = selectedStore.cto_data || {};
      const currentBasicInfo = currentCTOData.basicInfo || {};
      
      // Salvar informações básicas por ano
      const basicInfoToSave = {
        ...currentBasicInfo,
        [selectedYear]: {
          m2: parseFloat(ctoData.m2),
          aluguelMin: parseFloat(ctoData.aluguelMin),
          aluguelPercentual: parseFloat(ctoData.aluguelPercentual),
          condominio: ctoData.condominio ? parseFloat(ctoData.condominio) : 0,
          fundoParticipacao: ctoData.fundoParticipacao ? parseFloat(ctoData.fundoParticipacao) : 0,
        }
      };
      
      const ctoDataToSave = {
        ...currentCTOData, // Preservar TUDO que já existe
        basicInfo: basicInfoToSave,
        // Manter compatibilidade: também salvar nos campos antigos para o ano atual
        // (para não quebrar código existente que ainda usa os campos diretos)
        ...(selectedYear === new Date().getFullYear().toString() ? {
          m2: parseFloat(ctoData.m2),
          aluguelMin: parseFloat(ctoData.aluguelMin),
          aluguelPercentual: parseFloat(ctoData.aluguelPercentual),
        } : {}),
        // Garantir que monthlyBills e monthlySales sejam preservados
        monthlyBills: currentCTOData.monthlyBills || {},
        monthlySales: currentCTOData.monthlySales || {},
        updated_at: new Date().toISOString()
      };

      console.log('💾 [BasicInfoTab] Salvando:', {
        storeId: selectedStore.id,
        ctoDataToSave,
        storeName: selectedStore.name
      });

      const result = await updateStoreAPI(selectedStore.id, {
        cto_data: ctoDataToSave
      });

      console.log('✅ [BasicInfoTab] Resultado do update:', result);

      // Verificar se os dados foram realmente salvos
      await new Promise(resolve => setTimeout(resolve, 500)); // Aguardar processamento
      
      const updatedStores = await fetchStores();
      const updatedStore = updatedStores.find(s => s.id === selectedStore.id);
      
      console.log('🔄 [BasicInfoTab] Loja atualizada do servidor:', {
        found: !!updatedStore,
        hasCtoData: !!updatedStore?.cto_data,
        ctoData: updatedStore?.cto_data,
        basicInfo: updatedStore?.cto_data?.basicInfo,
        yearData: updatedStore?.cto_data?.basicInfo?.[selectedYear]
      });

      const savedYearData = updatedStore?.cto_data?.basicInfo?.[selectedYear];
      if (!updatedStore || !updatedStore.cto_data || !savedYearData ||
          savedYearData.m2 !== basicInfoToSave[selectedYear].m2 ||
          savedYearData.aluguelMin !== basicInfoToSave[selectedYear].aluguelMin ||
          savedYearData.aluguelPercentual !== basicInfoToSave[selectedYear].aluguelPercentual) {
        console.error('❌ [BasicInfoTab] DADOS NÃO FORAM SALVOS CORRETAMENTE!');
        toast({
          title: 'Erro',
          description: 'Os dados não foram salvos corretamente. Verifique as permissões no Supabase.',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Sucesso!',
        description: 'Informações básicas salvas com sucesso.'
      });

      await fetchData();
      
      if (updatedStore) {
        loadStoreData(updatedStore);
      }
    } catch (error) {
      console.error('Erro ao salvar informações básicas:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar informações básicas.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Informações Básicas das Lojas
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Selecione a Loja</Label>
              <Select value={selectedStore?.id || ''} onValueChange={(id) => {
                const store = stores.find(s => s.id === id);
                if (store) loadStoreData(store);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma loja" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map(store => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name} ({store.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Selecione o Ano</Label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o ano" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableYears().map(year => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedStore && (
            <div className="space-y-4 pt-4 border-t">
              <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                <p className="text-sm text-blue-400 mb-2">
                  <strong>Dados Fixos por Ano - Raramente Alterados</strong>
                </p>
                <p className="text-xs text-muted-foreground">
                  Estes campos são configurações fixas da loja que podem mudar na virada de ano. As informações são salvas por ano para permitir alterações anuais.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="m2" className="flex items-center gap-2">
                    <Ruler className="w-4 h-4" />
                    m² *
                  </Label>
                  <Input
                    id="m2"
                    type="number"
                    step="0.01"
                    value={ctoData.m2}
                    onChange={(e) => setCtoData({ ...ctoData, m2: e.target.value })}
                    placeholder="Ex: 150.50"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aluguelMin" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Aluguel Mín. (R$) *
                  </Label>
                  <Input
                    id="aluguelMin"
                    type="number"
                    step="0.01"
                    value={ctoData.aluguelMin}
                    onChange={(e) => setCtoData({ ...ctoData, aluguelMin: e.target.value })}
                    placeholder="Ex: 15000.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="aluguelPercentual" className="flex items-center gap-2">
                    <Percent className="w-4 h-4" />
                    Aluguel Percentual (%) *
                  </Label>
                  <Input
                    id="aluguelPercentual"
                    type="number"
                    step="0.01"
                    value={ctoData.aluguelPercentual}
                    onChange={(e) => setCtoData({ ...ctoData, aluguelPercentual: e.target.value })}
                    placeholder="Ex: 12.5"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="condominio" className="flex items-center gap-2">
                    <Building2 className="w-4 h-4" />
                    Condomínio (R$)
                  </Label>
                  <Input
                    id="condominio"
                    type="number"
                    step="0.01"
                    value={ctoData.condominio}
                    onChange={(e) => setCtoData({ ...ctoData, condominio: e.target.value })}
                    placeholder="Ex: 500.00"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fundoParticipacao" className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4" />
                    Fundo de Promoção (FPP) (R$)
                  </Label>
                  <Input
                    id="fundoParticipacao"
                    type="number"
                    step="0.01"
                    value={ctoData.fundoParticipacao}
                    onChange={(e) => setCtoData({ ...ctoData, fundoParticipacao: e.target.value })}
                    placeholder="Ex: 300.00"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setSelectedStore(null);
                  setCtoData({ m2: '', aluguelMin: '', aluguelPercentual: '', condominio: '', fundoParticipacao: '' });
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? 'Salvando...' : `Salvar Informações Básicas ${selectedYear}`}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Componente: Registro de Vendas
const SalesRegistrationTab = ({ stores, fetchData }) => {
  const { toast } = useToast();
  const [selectedStore, setSelectedStore] = useState(null);
  const [saving, setSaving] = useState(false);
  const [monthlySales, setMonthlySales] = useState({});
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const months = useMemo(() => {
    const start = startOfYear(new Date(selectedYear, 0, 1));
    const end = endOfYear(new Date(selectedYear, 11, 31));
    return eachMonthOfInterval({ start, end });
  }, [selectedYear]);

  const loadStoreSales = (store) => {
    const ctoInfo = store.cto_data || {};
    const salesData = ctoInfo.monthlySales || {};
    
    // Converter estrutura antiga (apenas número) para nova estrutura (objeto com fisico e digital)
    const convertedSales = {};
    Object.keys(salesData).forEach(key => {
      if (typeof salesData[key] === 'object' && salesData[key] !== null) {
        // Já está na nova estrutura
        convertedSales[key] = {
          fisico: salesData[key].fisico || salesData[key].fisico === 0 ? salesData[key].fisico : '',
          digital: salesData[key].digital || salesData[key].digital === 0 ? salesData[key].digital : '',
        };
      } else {
        // Estrutura antiga: migrar para novo formato
        convertedSales[key] = {
          fisico: salesData[key] || '',
          digital: '',
        };
      }
    });
    
    setMonthlySales(convertedSales);
    setSelectedStore(store);
  };

  const handleUpdateSales = (monthKey, type, value) => {
    setMonthlySales({
      ...monthlySales,
      [monthKey]: {
        ...(monthlySales[monthKey] || { fisico: '', digital: '' }),
        [type]: value
      }
    });
  };

  const handleSave = async () => {
    if (!selectedStore) {
      toast({
        title: 'Erro',
        description: 'Selecione uma loja para salvar.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);

      const currentCTOData = selectedStore.cto_data || {};
      
      const ctoDataToSave = {
        ...currentCTOData, // Preservar TUDO
        monthlySales: {
          ...(currentCTOData.monthlySales || {}),
          ...monthlySales
        },
        updated_at: new Date().toISOString()
      };

      console.log('💾 [SalesRegistrationTab] Salvando vendas:', {
        storeId: selectedStore.id,
        monthlySales: ctoDataToSave.monthlySales,
        storeName: selectedStore.name
      });

      const result = await updateStoreAPI(selectedStore.id, {
        cto_data: ctoDataToSave
      });

      console.log('✅ [SalesRegistrationTab] Resultado do update:', result);

      // Verificar se os dados foram realmente salvos
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedStores = await fetchStores();
      const updatedStore = updatedStores.find(s => s.id === selectedStore.id);
      
      console.log('🔄 [SalesRegistrationTab] Loja atualizada do servidor:', {
        found: !!updatedStore,
        hasMonthlySales: !!updatedStore?.cto_data?.monthlySales,
        monthlySales: updatedStore?.cto_data?.monthlySales
      });

      if (!updatedStore || !updatedStore.cto_data?.monthlySales) {
        console.error('❌ [SalesRegistrationTab] DADOS NÃO FORAM SALVOS CORRETAMENTE!');
        toast({
          title: 'Erro',
          description: 'Os dados não foram salvos corretamente. Verifique as permissões no Supabase.',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Sucesso!',
        description: 'Vendas mensais salvas com sucesso.'
      });

      await fetchData();
      
      if (updatedStore) {
        loadStoreSales(updatedStore);
      }
    } catch (error) {
      console.error('Erro ao salvar vendas:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar vendas.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="w-5 h-5" />
            Registro de Vendas Mensais
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label>Selecione a Loja</Label>
              <Select value={selectedStore?.id || ''} onValueChange={(id) => {
                const store = stores.find(s => s.id === id);
                if (store) loadStoreSales(store);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma loja" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map(store => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name} ({store.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Ano</Label>
              <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[2023, 2024, 2025, 2026, 2027].map(year => (
                    <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedStore && (
            <div className="space-y-4 pt-4 border-t">
              <p className="text-sm text-muted-foreground">
                Registre as vendas mensais da loja separadas por tipo. O faturamento físico sempre conta para o cálculo do CTO. O faturamento digital é opcional e pode ser incluído através de um botão no registro CTO mensal.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {months.map(month => {
                  const monthKey = format(month, 'yyyy-MM');
                  const monthLabel = format(month, 'MMMM yyyy', { locale: ptBR });
                  const salesData = monthlySales[monthKey] || { fisico: '', digital: '' };
                  return (
                    <div key={monthKey} className="space-y-3 p-4 border rounded-lg bg-secondary/30">
                      <Label className="text-base font-semibold">{monthLabel}</Label>
                      <div className="space-y-2">
                        <div className="space-y-1">
                          <Label htmlFor={`sales-fisico-${monthKey}`} className="text-sm text-muted-foreground">
                            Faturamento Físico (R$)
                          </Label>
                          <Input
                            id={`sales-fisico-${monthKey}`}
                            type="number"
                            step="0.01"
                            value={salesData.fisico || ''}
                            onChange={(e) => handleUpdateSales(monthKey, 'fisico', e.target.value)}
                            placeholder="Ex: 150000.00"
                            className="bg-background"
                          />
                        </div>
                        <div className="space-y-1">
                          <Label htmlFor={`sales-digital-${monthKey}`} className="text-sm text-muted-foreground">
                            Faturamento Digital (R$) <span className="text-xs">(opcional)</span>
                          </Label>
                          <Input
                            id={`sales-digital-${monthKey}`}
                            type="number"
                            step="0.01"
                            value={salesData.digital || ''}
                            onChange={(e) => handleUpdateSales(monthKey, 'digital', e.target.value)}
                            placeholder="Ex: 50000.00"
                            className="bg-background"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setSelectedStore(null);
                  setMonthlySales({});
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? 'Salvando...' : 'Salvar Vendas'}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

// Componente: CTO Mensal
const CTOMonthlyTab = ({ stores, fetchData }) => {
  const { toast } = useToast();
  const [selectedStore, setSelectedStore] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [saving, setSaving] = useState(false);
  const [monthlyBills, setMonthlyBills] = useState({});

  // Gerar meses disponíveis (últimos 12 meses + próximos 2 meses)
  const getAvailableMonths = () => {
    const months = [];
    const now = new Date();
    // Adicionar últimos 12 meses
    for (let i = 0; i < 12; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = format(date, 'MMMM yyyy', { locale: ptBR });
      months.push({ key: monthKey, label: monthLabel, date });
    }
    // Adicionar próximos 2 meses
    for (let i = 1; i <= 2; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthLabel = format(date, 'MMMM yyyy', { locale: ptBR });
      months.push({ key: monthKey, label: monthLabel, date });
    }
    return months.reverse(); // Mais recente primeiro
  };

  const loadStoreBills = (store) => {
    const ctoInfo = store.cto_data || {};
    setMonthlyBills(ctoInfo.monthlyBills || {});
    setSelectedStore(store);
    
    // Definir mês atual como padrão
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    setSelectedMonth(currentMonth);
  };

  const getCurrentMonthBills = () => {
    if (!selectedMonth) return { amm: '', fpp: '', cond: '', ammDiscount: '', paidValue: '', additionalCosts: [], includeDigital: false };
    return monthlyBills[selectedMonth] || { amm: '', fpp: '', cond: '', ammDiscount: '', paidValue: '', additionalCosts: [], includeDigital: false };
  };

  const handleUpdateMonthBills = (field, value) => {
    if (!selectedMonth) return;
    setMonthlyBills({
      ...monthlyBills,
      [selectedMonth]: {
        ...getCurrentMonthBills(),
        [field]: value
      }
    });
  };

  const handleAddAdditionalCost = () => {
    if (!selectedMonth) {
      toast({
        title: 'Atenção',
        description: 'Selecione um mês primeiro.',
        variant: 'destructive'
      });
      return;
    }
    const currentBills = getCurrentMonthBills();
    const newCost = {
      id: Date.now().toString(),
      description: '',
      value: ''
    };
    handleUpdateMonthBills('additionalCosts', [...(currentBills.additionalCosts || []), newCost]);
  };

  const handleUpdateAdditionalCost = (costId, field, value) => {
    if (!selectedMonth) return;
    const currentBills = getCurrentMonthBills();
    const updatedCosts = (currentBills.additionalCosts || []).map(cost =>
      cost.id === costId ? { ...cost, [field]: value } : cost
    );
    handleUpdateMonthBills('additionalCosts', updatedCosts);
  };

  const handleRemoveAdditionalCost = (costId) => {
    if (!selectedMonth) return;
    const currentBills = getCurrentMonthBills();
    const updatedCosts = (currentBills.additionalCosts || []).filter(cost => cost.id !== costId);
    handleUpdateMonthBills('additionalCosts', updatedCosts);
  };

  const handleSave = async () => {
    if (!selectedStore || !selectedMonth) {
      toast({
        title: 'Erro',
        description: 'Selecione uma loja e um mês para salvar.',
        variant: 'destructive'
      });
      return;
    }

    try {
      setSaving(true);

      const currentCTOData = selectedStore.cto_data || {};
      
      const ctoDataToSave = {
        ...currentCTOData, // Preservar TUDO
        monthlyBills: {
          ...(currentCTOData.monthlyBills || {}),
          ...monthlyBills
        },
        updated_at: new Date().toISOString()
      };

      console.log('💾 [CTOMonthlyTab] Salvando boletos:', {
        storeId: selectedStore.id,
        month: selectedMonth,
        monthlyBills: ctoDataToSave.monthlyBills,
        storeName: selectedStore.name
      });

      const result = await updateStoreAPI(selectedStore.id, {
        cto_data: ctoDataToSave
      });

      console.log('✅ [CTOMonthlyTab] Resultado do update:', result);

      // Verificar se os dados foram realmente salvos
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const updatedStores = await fetchStores();
      const updatedStore = updatedStores.find(s => s.id === selectedStore.id);
      
      console.log('🔄 [CTOMonthlyTab] Loja atualizada do servidor:', {
        found: !!updatedStore,
        hasMonthlyBills: !!updatedStore?.cto_data?.monthlyBills,
        monthlyBills: updatedStore?.cto_data?.monthlyBills,
        selectedMonthData: updatedStore?.cto_data?.monthlyBills?.[selectedMonth]
      });

      if (!updatedStore || !updatedStore.cto_data?.monthlyBills || 
          !updatedStore.cto_data.monthlyBills[selectedMonth]) {
        console.error('❌ [CTOMonthlyTab] DADOS NÃO FORAM SALVOS CORRETAMENTE!');
        toast({
          title: 'Erro',
          description: 'Os dados não foram salvos corretamente. Verifique as permissões no Supabase.',
          variant: 'destructive'
        });
        return;
      }

      toast({
        title: 'Sucesso!',
        description: 'Boletos do mês salvos com sucesso.'
      });

      await fetchData();
      
      if (updatedStore) {
        loadStoreBills(updatedStore);
      }
    } catch (error) {
      console.error('Erro ao salvar boletos:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar boletos.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  // Obter informações básicas do ano do mês selecionado
  const getBasicInfoForMonth = () => {
    if (!selectedStore || !selectedMonth) return null;
    
    const ctoInfo = selectedStore.cto_data || {};
    const basicInfo = ctoInfo.basicInfo || {};
    
    // Extrair ano do mês selecionado (formato: "2024-12")
    const monthYear = selectedMonth.split('-')[0];
    
    // Buscar informações básicas do ano do mês
    const yearData = basicInfo[monthYear];
    
    // Se não encontrar no formato novo, tentar campos antigos (compatibilidade)
    if (!yearData) {
      return {
        m2: ctoInfo.m2 || 0,
        aluguelMin: ctoInfo.aluguelMin || 0,
        aluguelPercentual: ctoInfo.aluguelPercentual || 0,
        condominio: 0,
        fundoParticipacao: 0,
      };
    }
    
    return {
      m2: yearData.m2 || 0,
      aluguelMin: yearData.aluguelMin || 0,
      aluguelPercentual: yearData.aluguelPercentual || 0,
      condominio: yearData.condominio || 0,
      fundoParticipacao: yearData.fundoParticipacao || 0,
    };
  };

  // Calcular valores esperados baseado nas informações básicas
  const calculateExpectedValues = () => {
    const basicInfo = getBasicInfoForMonth();
    if (!basicInfo || !selectedMonth) return null;
    
    const monthDate = getAvailableMonths().find(m => m.key === selectedMonth)?.date;
    const isDecember = monthDate && monthDate.getMonth() === 11;
    
    // AMM esperado: aluguel mínimo (ou dobro em dezembro)
    const expectedAMM = isDecember ? basicInfo.aluguelMin * 2 : basicInfo.aluguelMin;
    
    // FPP esperado: fundo de promoção das informações básicas
    const expectedFPP = basicInfo.fundoParticipacao || 0;
    
    // Condomínio esperado: condomínio das informações básicas
    const expectedCond = basicInfo.condominio || 0;
    
    // CTO esperado base (sem considerar complementar)
    const expectedCTOBase = expectedAMM + expectedFPP + expectedCond;
    
    return {
      expectedAMM,
      expectedFPP,
      expectedCond,
      expectedCTOBase,
      basicInfo
    };
  };

  // Calcular valores do mês selecionado
  const calculateMonthData = () => {
    if (!selectedStore || !selectedMonth) return null;

    const ctoInfo = selectedStore.cto_data || {};
    const monthlySales = ctoInfo.monthlySales || {};
    const currentBills = getCurrentMonthBills();
    const includeDigital = currentBills.includeDigital || false;
    
    // Obter vendas do mês (suportando estrutura antiga e nova)
    let salesFisico = 0;
    let salesDigital = 0;
    
    const salesData = monthlySales[selectedMonth];
    if (salesData) {
      if (typeof salesData === 'object' && salesData !== null) {
        // Nova estrutura: objeto com fisico e digital
        salesFisico = parseFloat(salesData.fisico || 0);
        salesDigital = parseFloat(salesData.digital || 0);
      } else {
        // Estrutura antiga: apenas número (considerar como físico)
        salesFisico = parseFloat(salesData || 0);
        salesDigital = 0;
      }
    }
    
    // Vendas totais: sempre físico + digital (se botão ativo)
    const sales = salesFisico + (includeDigital ? salesDigital : 0);
    
    const amm = parseFloat(currentBills.amm || 0);
    const ammDiscount = parseFloat(currentBills.ammDiscount || 0);
    const ammFinal = Math.max(0, amm - ammDiscount);
    const fpp = parseFloat(currentBills.fpp || 0);
    const cond = parseFloat(currentBills.cond || 0);
    const ctoBoleto = ammFinal + fpp + cond;
    
    const additionalCosts = (currentBills.additionalCosts || [])
      .filter(c => c.value && parseFloat(c.value) > 0)
      .reduce((sum, c) => sum + parseFloat(c.value || 0), 0);
    
    const ctoTotal = ctoBoleto + additionalCosts;
    const percentualCTO = ctoBoleto > 0 && sales > 0 ? (ctoBoleto / sales) * 100 : 0;
    const paidValue = parseFloat(currentBills.paidValue || 0);
    
    const basicInfo = getBasicInfoForMonth() || {};
    const aluguelMin = basicInfo.aluguelMin || 0;
    const aluguelPercentual = basicInfo.aluguelPercentual || 0;
    const pe = aluguelPercentual > 0 ? aluguelMin / (aluguelPercentual / 100) : 0;
    
    // Valores esperados
    const expectedValues = calculateExpectedValues();
    
    // Cálculo do Valor Complementar: (Vendas - PE) × Aluguel Percentual
    const diferencaVendas = sales > pe ? sales - pe : 0;
    const valorComplementarCalculado = diferencaVendas > 0 && aluguelPercentual > 0 
      ? diferencaVendas * (aluguelPercentual / 100) 
      : 0;
    
    // Diferença entre o valor calculado e o valor pago
    const diferencaValor = paidValue > 0 ? valorComplementarCalculado - paidValue : 0;
    
    const lucro = sales - ctoTotal;
    const margem = sales > 0 ? ((sales - ctoTotal) / sales) * 100 : 0;

    // Comparações com valores esperados
    const ammDiff = expectedValues ? Math.abs(ammFinal - expectedValues.expectedAMM) : 0;
    const fppDiff = expectedValues ? Math.abs(fpp - expectedValues.expectedFPP) : 0;
    const condDiff = expectedValues ? Math.abs(cond - expectedValues.expectedCond) : 0;
    
    const ammOk = !expectedValues || ammDiff === 0;
    const fppOk = !expectedValues || fppDiff === 0;
    const condOk = !expectedValues || condDiff === 0;

    return {
      sales,
      amm,
      ammDiscount,
      ammFinal,
      fpp,
      cond,
      ctoBoleto,
      additionalCosts,
      ctoTotal,
      percentualCTO,
      paidValue,
      diferencaValor,
      valorComplementarCalculado,
      diferencaVendas,
      pe,
      aluguelPercentual,
      lucro,
      margem,
      acimaPE: sales >= pe,
      // Valores esperados e comparações
      expectedValues: expectedValues || null,
      ammDiff,
      fppDiff,
      condDiff,
      ammOk,
      fppOk,
      condOk,
      // Vendas separadas
      salesFisico,
      salesDigital,
      includeDigital,
    };
  };

  const monthData = calculateMonthData();

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calculator className="w-5 h-5" />
            CTO Mensal - Registro de Boletos
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Selecione a Loja</Label>
              <Select value={selectedStore?.id || ''} onValueChange={(id) => {
                const store = stores.find(s => s.id === id);
                if (store) loadStoreBills(store);
              }}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma loja" />
                </SelectTrigger>
                <SelectContent>
                  {stores.map(store => (
                    <SelectItem key={store.id} value={store.id}>
                      {store.name} ({store.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Selecione o Mês</Label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um mês" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableMonths().map(month => (
                    <SelectItem key={month.key} value={month.key}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedStore && selectedMonth && (
            <div className="space-y-6 pt-4 border-t">
              {/* Informações da Loja e Valores Esperados */}
              {(() => {
                const basicInfo = getBasicInfoForMonth();
                const expectedValues = calculateExpectedValues();
                const monthYear = selectedMonth.split('-')[0];
                
                if (!basicInfo || !basicInfo.aluguelMin || !basicInfo.aluguelPercentual) {
                  return (
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                      <p className="text-sm text-yellow-400">
                        ⚠️ Esta loja ainda não tem informações básicas cadastradas para o ano {monthYear}. 
                        Vá para a aba "Informações Básicas" para cadastrar.
                      </p>
                    </div>
                  );
                }

                return (
                  <div className="bg-secondary/50 p-4 rounded-lg space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">m²:</span>
                        <span className="ml-2 font-semibold">{basicInfo.m2}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Aluguel Mín.:</span>
                        <span className="ml-2 font-semibold">
                          R$ {parseFloat(basicInfo.aluguelMin || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Aluguel %:</span>
                        <span className="ml-2 font-semibold">{basicInfo.aluguelPercentual}%</span>
                      </div>
                    </div>
                    
                    {expectedValues && (
                      <div className="border-t pt-4">
                        <p className="text-sm font-semibold mb-2 text-green-400">Valores Esperados (Ano {monthYear}):</p>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">AMM Esperado:</span>
                            <span className="ml-2 font-semibold text-green-400">
                              R$ {expectedValues.expectedAMM.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">FPP Esperado:</span>
                            <span className="ml-2 font-semibold text-green-400">
                              R$ {expectedValues.expectedFPP.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Condomínio Esperado:</span>
                            <span className="ml-2 font-semibold text-green-400">
                              R$ {expectedValues.expectedCond.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Vendas do Mês */}
              {(() => {
                const ctoInfo = selectedStore.cto_data || {};
                const monthlySales = ctoInfo.monthlySales || {};
                const salesData = monthlySales[selectedMonth];
                
                let salesFisico = 0;
                let salesDigital = 0;
                
                if (salesData) {
                  if (typeof salesData === 'object' && salesData !== null) {
                    salesFisico = parseFloat(salesData.fisico || 0);
                    salesDigital = parseFloat(salesData.digital || 0);
                  } else {
                    salesFisico = parseFloat(salesData || 0);
                    salesDigital = 0;
                  }
                }
                
                const currentBills = getCurrentMonthBills();
                const includeDigital = currentBills.includeDigital || false;
                const salesTotal = salesFisico + (includeDigital ? salesDigital : 0);
                
                return (
                  <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 space-y-3">
                    <div>
                      <Label className="text-sm text-muted-foreground">Vendas do Mês Selecionado</Label>
                      <p className="text-2xl font-bold text-green-500">
                        {salesTotal > 0 
                          ? `R$ ${salesTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          : 'Não informado'
                        }
                      </p>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm border-t pt-3">
                      <div>
                        <span className="text-muted-foreground">Físico:</span>
                        <span className="ml-2 font-semibold">
                          R$ {salesFisico.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Digital:</span>
                        <span className={`ml-2 font-semibold ${includeDigital ? 'text-green-400' : 'text-muted-foreground'}`}>
                          R$ {salesDigital.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          {includeDigital && ' ✓'}
                        </span>
                      </div>
                    </div>
                    {salesDigital > 0 && (
                      <div className="pt-2">
                        <Button
                          type="button"
                          variant={includeDigital ? "default" : "outline"}
                          size="sm"
                          onClick={() => {
                            handleUpdateMonthBills('includeDigital', !includeDigital);
                          }}
                          className="w-full"
                        >
                          {includeDigital ? '✓ Incluindo Digital no Cálculo' : 'Adicionar Faturamento Digital ao Cálculo'}
                        </Button>
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground mt-2">
                      Preencha na aba "Registro de Vendas"
                    </p>
                  </div>
                );
              })()}

              {/* Boletos do Mês */}
              {(() => {
                const currentBills = getCurrentMonthBills();
                const monthDate = getAvailableMonths().find(m => m.key === selectedMonth)?.date;
                const isDecember = monthDate && monthDate.getMonth() === 11; // Dezembro = mês 11
                
                // Calcular valores para comparação
                const ammFinal = Math.max(0, parseFloat(currentBills.amm || 0) - parseFloat(currentBills.ammDiscount || 0));
                const fpp = parseFloat(currentBills.fpp || 0);
                const cond = parseFloat(currentBills.cond || 0);
                const expectedValues = calculateExpectedValues();
                
                const ammDiff = expectedValues ? Math.abs(ammFinal - expectedValues.expectedAMM) : 0;
                const fppDiff = expectedValues ? Math.abs(fpp - expectedValues.expectedFPP) : 0;
                const condDiff = expectedValues ? Math.abs(cond - expectedValues.expectedCond) : 0;
                
                const ammOk = !expectedValues || ammDiff === 0;
                const fppOk = !expectedValues || fppDiff === 0;
                const condOk = !expectedValues || condDiff === 0;
                
                const noteText = isDecember 
                  ? '⚠️ Dezembro: Este mês tem aluguel em dobro. Informe o AMM como o dobro do aluguel mínimo (o boleto vence em janeiro).'
                  : '';

                return (
                  <div className="space-y-4">
                    {noteText && (
                      <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3">
                        <p className="text-sm text-blue-400">{noteText}</p>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="amm">AMM - Aluguel Mínimo Mensal (R$)</Label>
                          {expectedValues && (
                            <span className={`text-xs ${ammOk ? 'text-green-400' : 'text-orange-400'}`}>
                              {ammOk ? '✅' : `⚠️ Diferença: R$ ${ammDiff.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </span>
                          )}
                        </div>
                        <Input
                          id="amm"
                          type="number"
                          step="0.01"
                          value={currentBills.amm || ''}
                          onChange={(e) => handleUpdateMonthBills('amm', e.target.value)}
                          placeholder="Ex: 15000.00"
                          className={`bg-background ${!ammOk ? 'border-orange-500/50' : ''}`}
                        />
                        {expectedValues && (
                          <p className={`text-xs ${ammOk ? 'text-green-400' : 'text-orange-400'}`}>
                            Esperado: R$ {expectedValues.expectedAMM.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            {!ammOk && ` | Pago: R$ ${ammFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          </p>
                        )}
                        {isDecember && (
                          <p className="text-xs text-yellow-500">
                            ⚠️ Em dezembro, este valor será o dobro do aluguel mínimo
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="ammDiscount">Desconto no AMM (R$)</Label>
                        <Input
                          id="ammDiscount"
                          type="number"
                          step="0.01"
                          value={currentBills.ammDiscount || ''}
                          onChange={(e) => handleUpdateMonthBills('ammDiscount', e.target.value)}
                          placeholder="Ex: 500.00 (opcional)"
                          className="bg-background"
                        />
                        <p className="text-xs text-muted-foreground">Desconto aplicado sobre o AMM quando houver</p>
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="fpp">FPP - Fundo de Promoção (R$)</Label>
                          {expectedValues && (
                            <span className={`text-xs ${fppOk ? 'text-green-400' : 'text-orange-400'}`}>
                              {fppOk ? '✅' : `⚠️ Diferença: R$ ${fppDiff.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </span>
                          )}
                        </div>
                        <Input
                          id="fpp"
                          type="number"
                          step="0.01"
                          value={currentBills.fpp || ''}
                          onChange={(e) => handleUpdateMonthBills('fpp', e.target.value)}
                          placeholder="Ex: 5000.00"
                          className={`bg-background ${!fppOk ? 'border-orange-500/50' : ''}`}
                        />
                        {expectedValues && (
                          <p className={`text-xs ${fppOk ? 'text-green-400' : 'text-orange-400'}`}>
                            Esperado: R$ {expectedValues.expectedFPP.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            {!fppOk && ` | Pago: R$ ${fpp.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="cond">COND - Condomínio (R$)</Label>
                          {expectedValues && (
                            <span className={`text-xs ${condOk ? 'text-green-400' : 'text-orange-400'}`}>
                              {condOk ? '✅' : `⚠️ Diferença: R$ ${condDiff.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                            </span>
                          )}
                        </div>
                        <Input
                          id="cond"
                          type="number"
                          step="0.01"
                          value={currentBills.cond || ''}
                          onChange={(e) => handleUpdateMonthBills('cond', e.target.value)}
                          placeholder="Ex: 3000.00"
                          className={`bg-background ${!condOk ? 'border-orange-500/50' : ''}`}
                        />
                        {expectedValues && (
                          <p className={`text-xs ${condOk ? 'text-green-400' : 'text-orange-400'}`}>
                            Esperado: R$ {expectedValues.expectedCond.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            {!condOk && ` | Pago: R$ ${cond.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="paidValue">Valor Complementar Pago (R$)</Label>
                        <Input
                          id="paidValue"
                          type="number"
                          step="0.01"
                          value={currentBills.paidValue || ''}
                          onChange={(e) => handleUpdateMonthBills('paidValue', e.target.value)}
                          placeholder="Ex: 35000.00"
                          className="bg-background"
                        />
                        <p className="text-xs text-muted-foreground">Valor complementar que foi efetivamente pago no boleto (não interfere no cálculo)</p>
                      </div>
                    </div>

                    {/* Custos Adicionais */}
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h4 className="text-md font-semibold">Custos Adicionais do Boleto</h4>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleAddAdditionalCost}
                          className="gap-2"
                        >
                          <Plus className="w-4 h-4" />
                          Adicionar Custo
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground mb-4">
                        Adicione outros custos que aparecem no boleto deste mês (ex: IPTU, Seguro, Taxa de Serviço, etc.)
                      </p>
                      {(!currentBills.additionalCosts || currentBills.additionalCosts.length === 0) ? (
                        <div className="bg-background/50 p-6 rounded-lg border border-border text-center">
                          <p className="text-muted-foreground text-sm">Nenhum custo adicional cadastrado para este mês</p>
                          <p className="text-xs text-muted-foreground mt-1">Clique em "Adicionar Custo" para incluir</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {currentBills.additionalCosts.map((cost) => (
                            <div key={cost.id} className="flex items-center gap-3 p-3 bg-background rounded-lg border border-border">
                              <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Descrição do Custo</Label>
                                  <Input
                                    value={cost.description || ''}
                                    onChange={(e) => handleUpdateAdditionalCost(cost.id, 'description', e.target.value)}
                                    placeholder="Ex: IPTU, Seguro, Taxa de Serviço..."
                                    className="bg-secondary"
                                  />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs text-muted-foreground">Valor (R$)</Label>
                                  <Input
                                    type="number"
                                    step="0.01"
                                    value={cost.value || ''}
                                    onChange={(e) => handleUpdateAdditionalCost(cost.id, 'value', e.target.value)}
                                    placeholder="Ex: 500.00"
                                    className="bg-secondary"
                                  />
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleRemoveAdditionalCost(cost.id)}
                                className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Resumo e Cálculo */}
              {monthData && (
                <div className="space-y-4 pt-4 border-t">
                  {/* Percentual do CTO Mensal - DESTAQUE */}
                  <div className="bg-primary/10 border-2 border-primary/30 rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-lg font-semibold">Percentual do CTO Mensal:</span>
                      <span className={`text-4xl font-bold ${
                        monthData.percentualCTO > 12 
                          ? 'text-red-500' 
                          : monthData.percentualCTO >= 10 
                          ? 'text-yellow-500' 
                          : 'text-green-500'
                      }`}>
                        {monthData.percentualCTO > 0 
                          ? `${monthData.percentualCTO.toFixed(2)}%`
                          : 'Preencha os valores'
                        }
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Cálculo: CTO do Boleto ÷ Vendas do Mês × 100
                      <br />
                      <span className="text-xs">(CTO do Boleto = AMM Final + FPP + COND, sem custos adicionais)</span>
                      <br />
                      <span className={`text-xs font-semibold ${
                        monthData.percentualCTO > 12 
                          ? 'text-red-500' 
                          : monthData.percentualCTO >= 10 
                          ? 'text-yellow-500' 
                          : 'text-green-500'
                      }`}>
                        {monthData.percentualCTO > 12 
                          ? '⚠️ Acima de 12% - Atenção!' 
                          : monthData.percentualCTO >= 10 
                          ? '⚡ Entre 10-12% - Monitorar' 
                          : monthData.percentualCTO > 0
                          ? '✓ Abaixo de 10% - Saudável'
                          : ''
                        }
                      </span>
                    </div>
                  </div>

                  {/* Comparação com Valor Complementar Pago */}
                  {monthData.paidValue > 0 && monthData.valorComplementarCalculado > 0 && (
                    <div className={`border-2 rounded-lg p-6 ${
                      Math.abs(monthData.diferencaValor) === 0
                        ? 'bg-green-500/10 border-green-500/30'
                        : monthData.diferencaValor > 0
                        ? 'bg-orange-500/10 border-orange-500/30'
                        : 'bg-blue-500/10 border-blue-500/30'
                    }`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg font-semibold">Comparação com Valor Complementar Pago:</span>
                        <span className={`text-2xl font-bold ${
                          Math.abs(monthData.diferencaValor) === 0
                            ? 'text-green-500'
                            : monthData.diferencaValor > 0
                            ? 'text-orange-500'
                            : 'text-blue-500'
                        }`}>
                          {monthData.diferencaValor > 0 
                            ? `+R$ ${Math.abs(monthData.diferencaValor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : monthData.diferencaValor < 0
                            ? `-R$ ${Math.abs(monthData.diferencaValor).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : 'R$ 0,00'
                          }
                        </span>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm mb-3">
                        <div>
                          <span className="text-muted-foreground">Valor Calculado (Complementar):</span>
                          <p className="font-semibold text-lg">
                            R$ {monthData.valorComplementarCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            (Vendas {monthData.sales.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} - PE {monthData.pe.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}) × {monthData.aluguelPercentual}%
                          </p>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Valor Complementar Pago:</span>
                          <p className="font-semibold text-lg">
                            R$ {monthData.paidValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </p>
                        </div>
                      </div>
                      <div className="mt-3 text-xs font-semibold">
                        {Math.abs(monthData.diferencaValor) === 0 ? (
                          <span className="text-green-500">✓ Valores coincidem perfeitamente</span>
                        ) : monthData.diferencaValor > 0 ? (
                          <span className="text-orange-500">⚠️ Pagaram a MENOS: O valor pago é menor que o calculado</span>
                        ) : (
                          <span className="text-blue-500">ℹ️ Pagaram a MAIS: O valor pago é maior que o calculado</span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Resumo do Mês */}
                  <div className="bg-secondary/50 p-4 rounded-lg space-y-2">
                    <div className="text-sm font-semibold mb-2">Resumo do Mês:</div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-muted-foreground">AMM Final:</span>
                        <p className="font-semibold">
                          R$ {monthData.ammFinal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">FPP:</span>
                        <p className="font-semibold">
                          R$ {monthData.fpp.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">COND:</span>
                        <p className="font-semibold">
                          R$ {monthData.cond.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">CTO Boleto:</span>
                        <p className="font-semibold text-primary">
                          R$ {monthData.ctoBoleto.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      {monthData.additionalCosts > 0 && (
                        <>
                          <div>
                            <span className="text-muted-foreground">Custos Adic.:</span>
                            <p className="font-semibold">
                              R$ {monthData.additionalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">CTO Total:</span>
                            <p className="font-semibold text-primary">
                              R$ {monthData.ctoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* PE - Informação */}
                  {monthData.pe > 0 && (
                    <div className="bg-secondary/30 p-3 rounded-lg">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Ponto de Equilíbrio (PE):</span>
                        <span className="font-semibold">
                          R$ {monthData.pe.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      {monthData.sales > 0 && (
                        <div className="mt-1 text-xs text-muted-foreground">
                          Status: <span className={monthData.acimaPE ? 'text-green-500' : 'text-red-500'}>
                            {monthData.acimaPE ? '✓ Acima do PE' : '✗ Abaixo do PE'}
                          </span>
                          <span className="ml-2">
                            ({((monthData.sales / monthData.pe) * 100).toFixed(1)}% do PE)
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => {
                  setSelectedStore(null);
                  setSelectedMonth('');
                  setMonthlyBills({});
                }}>
                  Cancelar
                </Button>
                <Button onClick={handleSave} disabled={saving} className="gap-2">
                  <Save className="w-4 h-4" />
                  {saving ? 'Salvando...' : 'Salvar Boletos do Mês'}
                </Button>
              </div>
            </div>
          )}

          {selectedStore && !selectedMonth && (
            <div className="text-center py-8 text-muted-foreground">
              Selecione um mês para preencher os boletos
            </div>
          )}

          {!selectedStore && (
            <div className="text-center py-8 text-muted-foreground">
              Selecione uma loja para começar
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default StoresCTO;
