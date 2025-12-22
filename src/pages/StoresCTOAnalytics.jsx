import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Calculator, BarChart3, DollarSign, Calendar, ArrowLeft, Store } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { format, startOfYear, endOfYear, eachMonthOfInterval, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, Legend, CartesianGrid } from 'recharts';
import { filterStoresByUserType } from '@/lib/storeTypeHelper';

const StoresCTOAnalytics = () => {
  const { stores } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const storeIdParam = searchParams.get('store');
  
  const [selectedStoreId, setSelectedStoreId] = useState(storeIdParam || '');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());

  // Filtrar lojas por tipo de usuário
  const filteredStores = useMemo(() => {
    return filterStoresByUserType(stores, user?.role, user?.storeId);
  }, [stores, user?.role, user?.storeId]);

  const selectedStore = useMemo(() => {
    return filteredStores.find(s => s.id === selectedStoreId) || filteredStores[0];
  }, [filteredStores, selectedStoreId]);

  // Calcular dados mensais
  const monthlyData = useMemo(() => {
    if (!selectedStore) return [];

    const year = parseInt(selectedYear);
    const startDate = startOfYear(new Date(year, 0, 1));
    const endDate = endOfYear(new Date(year, 11, 31));
    const months = eachMonthOfInterval({ start: startDate, end: endDate });

    const ctoData = selectedStore.cto_data || {};
    const basicInfo = ctoData.basicInfo || {};
    const monthYear = year.toString();
    const yearBasicInfo = basicInfo[monthYear] || {};
    
    // Usar informações básicas do ano (ou campos antigos para compatibilidade)
    const aluguelMin = yearBasicInfo.aluguelMin || parseFloat(ctoData.aluguelMin) || 0;
    const aluguelPercentual = yearBasicInfo.aluguelPercentual || parseFloat(ctoData.aluguelPercentual) || 0;
    const expectedFPP = yearBasicInfo.fundoParticipacao || 0;
    const expectedCond = yearBasicInfo.condominio || 0;

    // Buscar vendas mensais do cto_data (nova estrutura: objeto com fisico e digital)
    const monthlySalesData = ctoData.monthlySales || {};
    
    // Buscar boletos mensais (nova estrutura)
    const monthlyBillsData = ctoData.monthlyBills || {};

    return months.map(month => {
      const monthKey = format(month, 'yyyy-MM');
      const monthDate = month;
      const isDecember = monthDate.getMonth() === 11;
      
      // Obter vendas (suportando estrutura antiga e nova)
      const salesData = monthlySalesData[monthKey];
      let salesFisico = 0;
      let salesDigital = 0;
      
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
      
      // Verificar se o botão digital está ativo para este mês
      const monthBills = monthlyBillsData[monthKey] || {};
      const includeDigital = monthBills.includeDigital || false;
      
      // Faturamento total: físico + digital (se botão ativo)
      const faturamento = salesFisico + (includeDigital ? salesDigital : 0);
      
      // Valores esperados baseado nas informações básicas
      const expectedAMM = isDecember ? aluguelMin * 2 : aluguelMin;
      const amm = parseFloat(monthBills.amm || 0);
      const ammDiscount = parseFloat(monthBills.ammDiscount || 0);
      const ammFinal = Math.max(0, amm - ammDiscount);
      const fpp = parseFloat(monthBills.fpp || 0);
      const cond = parseFloat(monthBills.cond || 0);
      const paidValue = parseFloat(monthBills.paidValue || 0);
      
      // PONTO DE EQUILÍBRIO: valor mínimo de vendas para que o aluguel percentual seja maior que o mínimo
      // PE = AMM / (percentual / 100)
      // Se vendas > PE, então aluguel percentual > AMM, então precisa pagar complementar
      const pe = aluguelPercentual > 0 ? aluguelMin / (aluguelPercentual / 100) : 0;
      
      // ALUGUEL CALCULADO BASEADO NAS VENDAS (para saber se tem complementar)
      // Se vendas * percentual > AMM, então o aluguel seria vendas * percentual
      // Caso contrário, seria apenas o AMM
      const aluguelPercentualCalculado = aluguelPercentual > 0 && faturamento > 0
        ? faturamento * (aluguelPercentual / 100)
        : 0;
      
      // ALUGUEL EFETIVO: usar o valor do boleto (AMM) quando preenchido
      // Se não tiver boleto preenchido, calcular baseado nas vendas
      const aluguelEfetivo = ammFinal > 0 
        ? ammFinal  // Usar valor do boleto quando preenchido
        : (aluguelPercentualCalculado > 0 && aluguelPercentualCalculado >= aluguelMin
          ? aluguelPercentualCalculado  // Se vendas * % >= mínimo, usar percentual
          : aluguelMin);  // Caso contrário, usar mínimo
      
      // COMPLEMENTAR CALCULADO: diferença entre aluguel percentual e AMM (quando vendas > PE)
      // Cálculo: (Vendas - PE) × Aluguel Percentual
      const diferencaVendas = (faturamento && pe && faturamento > pe) ? faturamento - pe : 0;
      const valorComplementarCalculado = diferencaVendas > 0 && aluguelPercentual > 0 
        ? diferencaVendas * (aluguelPercentual / 100) 
        : 0;
      
      // Calcular custos adicionais do mês
      const additionalCosts = monthBills.additionalCosts || [];
      const totalAdditionalCosts = additionalCosts.reduce((sum, cost) => sum + (parseFloat(cost.value) || 0), 0);
      
      // CTO TOTAL = AMM Final + FPP + COND + Custos Adicionais
      const ctoTotal = ammFinal + fpp + cond + totalAdditionalCosts;
      
      // CTO TOTAL ESPERADO = Expected AMM + Expected FPP + Expected COND + Custos Adicionais
      const ctoTotalEsperado = expectedAMM + expectedFPP + expectedCond + totalAdditionalCosts;
      
      // PERCENTUAL DO CTO MENSAL = (CTO do Boleto / Vendas do Mês) × 100
      // CTO do Boleto = AMM Final + FPP + COND (sem custos adicionais)
      const ctoBoleto = ammFinal + fpp + cond;
      const percentualCTO = ctoBoleto > 0 && faturamento > 0 ? (ctoBoleto / faturamento) * 100 : 0;
      
      const margem = faturamento > 0 ? ((faturamento - ctoTotal) / faturamento) * 100 : 0;
      const acimaPE = faturamento >= pe;

      return {
        mes: format(month, 'MMM/yyyy', { locale: ptBR }),
        mesKey: monthKey,
        faturamento,
        aluguelEfetivo, // Aluguel efetivo (do boleto ou calculado)
        aluguelPercentualCalculado, // Aluguel calculado baseado nas vendas
        valorComplementarCalculado, // Valor complementar calculado (a pagar)
        paidValue, // Valor complementar pago
        complemento: valorComplementarCalculado, // Mantido para compatibilidade
        amm: ammFinal, // AMM já com desconto aplicado
        ammOriginal: amm,
        ammDiscount,
        fpp,
        cond,
        additionalCosts: totalAdditionalCosts,
        ctoBoleto, // CTO do Boleto (sem custos adicionais)
        ctoTotal,
        ctoTotalEsperado, // CTO Total Esperado
        percentualCTO, // Percentual do CTO Mensal
        pe,
        diferencaPE: faturamento > pe ? faturamento - pe : 0, // Diferença entre vendas e PE
        percentualPE: pe > 0 ? (faturamento / pe) * 100 : 0, // Percentual do PE
        margem,
        acimaPE,
        lucro: faturamento - ctoTotal,
        // Vendas separadas
        salesFisico,
        salesDigital,
        includeDigital,
        // Valores esperados
        expectedAMM,
        expectedFPP,
        expectedCond,
      };
    });
  }, [selectedStore, selectedYear]);

  // Calcular totais anuais e estatísticas relevantes
  const annualTotals = useMemo(() => {
    const totals = monthlyData.reduce((acc, month) => ({
      faturamento: acc.faturamento + month.faturamento,
      ctoTotal: acc.ctoTotal + month.ctoTotal,
      ctoBoleto: acc.ctoBoleto + (month.ctoBoleto || 0),
      ctoTotalEsperado: acc.ctoTotalEsperado + (month.ctoTotalEsperado || 0),
      lucro: acc.lucro + month.lucro,
      mesesAcimaPE: acc.mesesAcimaPE + (month.acimaPE ? 1 : 0),
      // Valores pagos
      ammPago: acc.ammPago + month.amm,
      fppPago: acc.fppPago + month.fpp,
      condPago: acc.condPago + month.cond,
      complementarPago: acc.complementarPago + (month.paidValue || 0),
      outrosPago: acc.outrosPago + month.additionalCosts,
      // Diferenças
      diffAMM: acc.diffAMM + (month.expectedAMM ? (month.amm - month.expectedAMM) : 0),
      diffFPP: acc.diffFPP + (month.expectedFPP ? (month.fpp - month.expectedFPP) : 0),
      diffCond: acc.diffCond + (month.expectedCond ? (month.cond - month.expectedCond) : 0),
      diffComplementar: acc.diffComplementar + (month.valorComplementarCalculado > 0 ? ((month.paidValue || 0) - month.valorComplementarCalculado) : 0),
      diffCTO: acc.diffCTO + (month.ctoTotalEsperado ? (month.ctoTotal - month.ctoTotalEsperado) : 0),
    }), {
      faturamento: 0,
      ctoTotal: 0,
      ctoBoleto: 0,
      ctoTotalEsperado: 0,
      lucro: 0,
      mesesAcimaPE: 0,
      ammPago: 0,
      fppPago: 0,
      condPago: 0,
      complementarPago: 0,
      outrosPago: 0,
      diffAMM: 0,
      diffFPP: 0,
      diffCond: 0,
      diffComplementar: 0,
      diffCTO: 0,
    });

    // Encontrar maiores diferenças
    const maioresDiferencas = monthlyData
      .map(month => ({
        mes: month.mes,
        diffAMM: month.expectedAMM ? Math.abs(month.amm - month.expectedAMM) : 0,
        diffFPP: month.expectedFPP ? Math.abs(month.fpp - month.expectedFPP) : 0,
        diffCond: month.expectedCond ? Math.abs(month.cond - month.expectedCond) : 0,
        diffComplementar: month.valorComplementarCalculado > 0 ? Math.abs((month.paidValue || 0) - month.valorComplementarCalculado) : 0,
        diffCTO: month.ctoTotalEsperado ? Math.abs(month.ctoTotal - month.ctoTotalEsperado) : 0,
      }))
      .filter(m => m.diffAMM > 0 || m.diffFPP > 0 || m.diffCond > 0 || m.diffComplementar > 0 || m.diffCTO > 0)
      .sort((a, b) => {
        const maxA = Math.max(a.diffAMM, a.diffFPP, a.diffCond, a.diffComplementar, a.diffCTO);
        const maxB = Math.max(b.diffAMM, b.diffFPP, b.diffCond, b.diffComplementar, b.diffCTO);
        return maxB - maxA;
      })
      .slice(0, 3);

    return {
      ...totals,
      maioresDiferencas,
    };
  }, [monthlyData]);

  // Verificar permissões
  if (user?.role !== 'admin' && user?.role !== 'financeiro') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <p className="text-muted-foreground">Acesso negado. Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  // Gerar anos disponíveis (últimos 3 anos + ano atual + próximo ano)
  const availableYears = useMemo(() => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let i = currentYear - 2; i <= currentYear + 1; i++) {
      years.push(i.toString());
    }
    return years;
  }, []);

  return (
    <>
      <Helmet>
        <title>Análise CTO - MYFEET</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/stores-cto')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                <BarChart3 className="w-8 h-8 text-primary" />
                Análise CTO Mensal/Anual
              </h1>
              <p className="text-muted-foreground mt-1">
                Dashboard de análise de CTO por loja
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Loja</Label>
                <Select value={selectedStoreId} onValueChange={setSelectedStoreId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma loja" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStores.map(store => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Ano</Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableYears.map(year => (
                      <SelectItem key={year} value={year}>{year}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {selectedStore && (
          <>
            {/* Resumo Anual - Cards Principais */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-l-4 border-l-green-500 bg-gradient-to-br from-background to-green-500/5">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Faturamento Anual</p>
                      <p className="text-3xl font-bold text-foreground mt-2">
                        R$ {annualTotals.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="p-3 bg-green-500/10 rounded-lg">
                      <DollarSign className="w-8 h-8 text-green-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-orange-500 bg-gradient-to-br from-background to-orange-500/5">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">CTO Total Pago</p>
                      <p className="text-3xl font-bold text-foreground mt-2">
                        R$ {annualTotals.ctoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        {annualTotals.mesesAcimaPE} de {monthlyData.length} meses acima do PE
                      </p>
                    </div>
                    <div className="p-3 bg-orange-500/10 rounded-lg">
                      <Calculator className="w-8 h-8 text-orange-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-l-4 border-l-blue-500 bg-gradient-to-br from-background to-blue-500/5">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground font-medium">Percentual CTO Médio</p>
                      <p className={`text-3xl font-bold mt-2 ${
                        annualTotals.faturamento > 0 && annualTotals.ctoBoleto > 0
                          ? (() => {
                              const percentualMedio = (annualTotals.ctoBoleto / annualTotals.faturamento) * 100;
                              return percentualMedio > 12 
                                ? 'text-red-500' 
                                : percentualMedio >= 10 
                                ? 'text-yellow-500' 
                                : 'text-green-500';
                            })()
                          : 'text-foreground'
                      }`}>
                        {annualTotals.faturamento > 0 && annualTotals.ctoBoleto > 0
                          ? `${((annualTotals.ctoBoleto / annualTotals.faturamento) * 100).toFixed(2)}%`
                          : '-'
                        }
                      </p>
                      <p className="text-xs text-muted-foreground mt-2">
                        CTO do Boleto ÷ Faturamento
                      </p>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                      <BarChart3 className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Cards de Informações Relevantes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Valores Pagos */}
              <Card className="bg-gradient-to-br from-background to-purple-500/5">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-purple-500/10 rounded-lg">
                        <DollarSign className="w-5 h-5 text-purple-500" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">Valores Pagos</p>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">AMM:</span>
                        <span className="font-semibold text-green-500">
                          R$ {annualTotals.ammPago.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">FPP:</span>
                        <span className="font-semibold text-green-500">
                          R$ {annualTotals.fppPago.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">COND:</span>
                        <span className="font-semibold text-green-500">
                          R$ {annualTotals.condPago.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Complementar:</span>
                        <span className="font-semibold text-green-500">
                          R$ {annualTotals.complementarPago.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Custos com Outros */}
              <Card className="bg-gradient-to-br from-background to-yellow-500/5">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-yellow-500/10 rounded-lg">
                        <Calculator className="w-5 h-5 text-yellow-500" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">Custos com Outros</p>
                    </div>
                    <div className="space-y-2">
                      <p className="text-2xl font-bold text-yellow-500">
                        R$ {annualTotals.outrosPago.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {annualTotals.outrosPago > 0 
                          ? `${((annualTotals.outrosPago / annualTotals.ctoTotal) * 100).toFixed(2)}% do CTO Total`
                          : 'Sem custos adicionais'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Diferenças Totais */}
              <Card className="bg-gradient-to-br from-background to-red-500/5">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-red-500/10 rounded-lg">
                        <BarChart3 className="w-5 h-5 text-red-500" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">Diferenças Totais</p>
                    </div>
                    <div className="space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">CTO Total:</span>
                        <span className={`font-semibold ${annualTotals.diffCTO < 0 ? 'text-red-500' : annualTotals.diffCTO > 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                          {annualTotals.diffCTO !== 0 
                            ? `${annualTotals.diffCTO > 0 ? '+' : ''}R$ ${annualTotals.diffCTO.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : 'R$ 0,00'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">AMM:</span>
                        <span className={`font-semibold ${annualTotals.diffAMM < 0 ? 'text-red-500' : annualTotals.diffAMM > 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                          {annualTotals.diffAMM !== 0 
                            ? `${annualTotals.diffAMM > 0 ? '+' : ''}R$ ${annualTotals.diffAMM.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : 'R$ 0,00'
                          }
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Complementar:</span>
                        <span className={`font-semibold ${annualTotals.diffComplementar < 0 ? 'text-red-500' : annualTotals.diffComplementar > 0 ? 'text-green-500' : 'text-muted-foreground'}`}>
                          {annualTotals.diffComplementar !== 0 
                            ? `${annualTotals.diffComplementar > 0 ? '+' : ''}R$ ${annualTotals.diffComplementar.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : 'R$ 0,00'
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Maiores Diferenças */}
              <Card className="bg-gradient-to-br from-background to-orange-500/5">
                <CardContent className="p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 bg-orange-500/10 rounded-lg">
                        <BarChart3 className="w-5 h-5 text-orange-500" />
                      </div>
                      <p className="text-sm font-semibold text-foreground">Maiores Diferenças</p>
                    </div>
                    <div className="space-y-2 text-xs">
                      {annualTotals.maioresDiferencas && annualTotals.maioresDiferencas.length > 0 ? (
                        annualTotals.maioresDiferencas.map((diff, idx) => {
                          const maxDiff = Math.max(diff.diffAMM, diff.diffFPP, diff.diffCond, diff.diffComplementar, diff.diffCTO);
                          return (
                            <div key={idx} className="flex justify-between items-center">
                              <span className="text-muted-foreground">{diff.mes}:</span>
                              <span className="font-semibold text-orange-500">
                                R$ {maxDiff.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                            </div>
                          );
                        })
                      ) : (
                        <p className="text-muted-foreground text-xs">Sem diferenças significativas</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico Modernizado */}
            <Card className="border-2 border-primary/20">
              <CardHeader className="bg-gradient-to-r from-primary/10 to-transparent border-b">
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" />
                  Análise Visual: Faturamento vs CTO Mensal
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Visualização comparativa com valores pagos, diferenças e custos adicionais
                </p>
              </CardHeader>
              <CardContent className="pt-6">
                <ResponsiveContainer width="100%" height={400}>
                  <LineChart data={monthlyData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.2} />
                    <XAxis 
                      dataKey="mes" 
                      stroke="#9ca3af"
                      style={{ fontSize: '12px' }}
                    />
                    <YAxis 
                      stroke="#9ca3af"
                      style={{ fontSize: '12px' }}
                      tickFormatter={(value) => `R$ ${(value / 1000).toFixed(0)}k`}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'rgba(17, 24, 39, 0.95)', 
                        border: '1px solid rgba(59, 130, 246, 0.3)',
                        borderRadius: '8px',
                        padding: '12px'
                      }}
                      formatter={(value, name) => {
                        if (name === 'faturamento') return [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Faturamento'];
                        if (name === 'ctoTotal') return [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'CTO Total Pago'];
                        if (name === 'ctoTotalEsperado') return [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'CTO Total Esperado'];
                        if (name === 'outros') return [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Custos Outros'];
                        return [`R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, name];
                      }}
                      labelStyle={{ color: '#e5e7eb', fontWeight: 'bold' }}
                    />
                    <Legend 
                      wrapperStyle={{ paddingTop: '20px' }}
                      iconType="line"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="faturamento" 
                      stroke="#22c55e" 
                      name="Faturamento" 
                      strokeWidth={3}
                      dot={{ fill: '#22c55e', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="ctoTotal" 
                      stroke="#f97316" 
                      name="CTO Total Pago" 
                      strokeWidth={3}
                      dot={{ fill: '#f97316', r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="ctoTotalEsperado" 
                      stroke="#3b82f6" 
                      name="CTO Total Esperado" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ fill: '#3b82f6', r: 3 }}
                      opacity={0.7}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="additionalCosts" 
                      stroke="#eab308" 
                      name="Custos Outros" 
                      strokeWidth={2}
                      dot={{ fill: '#eab308', r: 3 }}
                      opacity={0.8}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="pe" 
                      stroke="#ef4444" 
                      name="Ponto de Equilíbrio" 
                      strokeWidth={2} 
                      strokeDasharray="8 4"
                      dot={false}
                      opacity={0.6}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tabela Única: Detalhamento Mensal Completo */}
            <Card>
              <CardHeader>
                <CardTitle>Detalhamento Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/50">
                      <tr>
                        <th className="p-3 text-left">Mês</th>
                        <th className="p-3 text-right">Faturamento</th>
                        <th className="p-3 text-right">Aluguel (AMM)</th>
                        <th className="p-3 text-right">Complementar</th>
                        <th className="p-3 text-right">FPP</th>
                        <th className="p-3 text-right">COND</th>
                        <th className="p-3 text-right">Outros</th>
                        <th className="p-3 text-right">CTO Total</th>
                        <th className="p-3 text-right">% CTO Mensal</th>
                        <th className="p-3 text-right">PE</th>
                        <th className="p-3 text-right">Passou do PE</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyData.map((month, index) => (
                        <tr key={index} className="border-b border-border/50 hover:bg-accent/50">
                          <td className="p-3 font-medium">
                            {month.mes}
                            {month.includeDigital && (
                              <span className="ml-2 text-xs text-blue-400" title="Incluindo faturamento digital">
                                📱
                              </span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex flex-col items-end">
                              <span className="font-semibold">
                                R$ {month.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                              </span>
                              {month.salesDigital > 0 && (
                                <div className="text-xs text-muted-foreground mt-1">
                                  <div>Físico: R$ {month.salesFisico.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
                                  <div className={month.includeDigital ? 'text-blue-400' : 'text-muted-foreground'}>
                                    Digital: R$ {month.salesDigital.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    {month.includeDigital && ' ✓'}
                                  </div>
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            {month.expectedAMM ? (
                              <div className="flex flex-col items-end gap-1">
                                <div>
                                  <span className="text-xs text-muted-foreground">Esperado:</span>
                                  <span className="ml-1 text-foreground">
                                    R$ {month.expectedAMM.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-xs text-muted-foreground">Pago:</span>
                                  <span className="ml-1 text-green-500">
                                    R$ {month.amm.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                                {Math.abs(month.amm - month.expectedAMM) > 0.01 && (
                                  <div>
                                    <span className="text-xs text-muted-foreground">Diferença:</span>
                                    <span className={`ml-1 ${(month.amm - month.expectedAMM) < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                      {(month.amm - month.expectedAMM) < 0 
                                        ? `-R$ ${Math.abs(month.amm - month.expectedAMM).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                        : `+R$ ${(month.amm - month.expectedAMM).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                      }
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {month.valorComplementarCalculado > 0 ? (
                              <div className="flex flex-col items-end gap-1">
                                <div>
                                  <span className="text-xs text-muted-foreground">Esperado:</span>
                                  <span className="ml-1 text-foreground">
                                    R$ {month.valorComplementarCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                                {month.paidValue > 0 ? (
                                  <>
                                    <div>
                                      <span className="text-xs text-muted-foreground">Pago:</span>
                                      <span className="ml-1 text-green-500">
                                        R$ {month.paidValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                    {Math.abs(month.valorComplementarCalculado - month.paidValue) > 0.01 && (
                                      <div>
                                        <span className="text-xs text-muted-foreground">Diferença:</span>
                                        <span className={`ml-1 ${(month.paidValue - month.valorComplementarCalculado) < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                          {(month.paidValue - month.valorComplementarCalculado) < 0 
                                            ? `-R$ ${Math.abs(month.paidValue - month.valorComplementarCalculado).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                            : `+R$ ${(month.paidValue - month.valorComplementarCalculado).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                          }
                                        </span>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div>
                                    <span className="text-xs text-muted-foreground">Diferença:</span>
                                    <span className="ml-1 text-red-500">
                                      -R$ {month.valorComplementarCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {month.expectedFPP ? (
                              <div className="flex flex-col items-end gap-1">
                                <div>
                                  <span className="text-xs text-muted-foreground">Esperado:</span>
                                  <span className="ml-1 text-foreground">
                                    R$ {month.expectedFPP.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-xs text-muted-foreground">Pago:</span>
                                  <span className="ml-1 text-green-500">
                                    R$ {month.fpp.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                                {Math.abs(month.fpp - month.expectedFPP) > 0.01 && (
                                  <div>
                                    <span className="text-xs text-muted-foreground">Diferença:</span>
                                    <span className={`ml-1 ${(month.fpp - month.expectedFPP) < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                      {(month.fpp - month.expectedFPP) < 0 
                                        ? `-R$ ${Math.abs(month.fpp - month.expectedFPP).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                        : `+R$ ${(month.fpp - month.expectedFPP).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                      }
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {month.expectedCond ? (
                              <div className="flex flex-col items-end gap-1">
                                <div>
                                  <span className="text-xs text-muted-foreground">Esperado:</span>
                                  <span className="ml-1 text-foreground">
                                    R$ {month.expectedCond.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-xs text-muted-foreground">Pago:</span>
                                  <span className="ml-1 text-green-500">
                                    R$ {month.cond.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                                {Math.abs(month.cond - month.expectedCond) > 0.01 && (
                                  <div>
                                    <span className="text-xs text-muted-foreground">Diferença:</span>
                                    <span className={`ml-1 ${(month.cond - month.expectedCond) < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                      {(month.cond - month.expectedCond) < 0 
                                        ? `-R$ ${Math.abs(month.cond - month.expectedCond).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                        : `+R$ ${(month.cond - month.expectedCond).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                      }
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {month.additionalCosts > 0 ? (
                              <div className="flex flex-col items-end gap-1">
                                <div>
                                  <span className="text-xs text-muted-foreground">Pago:</span>
                                  <span className="ml-1 text-green-500">
                                    R$ {month.additionalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-3 text-right">
                            {month.ctoTotalEsperado > 0 || month.ctoTotal > 0 ? (
                              <div className="flex flex-col items-end gap-1">
                                <div>
                                  <span className="text-xs text-muted-foreground">Esperado:</span>
                                  <span className="ml-1 text-foreground">
                                    R$ {month.ctoTotalEsperado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                                {month.ctoTotal > 0 ? (
                                  <>
                                    <div>
                                      <span className="text-xs text-muted-foreground">Pago:</span>
                                      <span className="ml-1 text-green-500">
                                        R$ {month.ctoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                    {Math.abs(month.ctoTotalEsperado - month.ctoTotal) > 0.01 && (
                                      <div>
                                        <span className="text-xs text-muted-foreground">Diferença:</span>
                                        <span className={`ml-1 ${(month.ctoTotal - month.ctoTotalEsperado) < 0 ? 'text-red-500' : 'text-green-500'}`}>
                                          {(month.ctoTotal - month.ctoTotalEsperado) < 0 
                                            ? `-R$ ${Math.abs(month.ctoTotal - month.ctoTotalEsperado).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                            : `+R$ ${(month.ctoTotal - month.ctoTotalEsperado).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                          }
                                        </span>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div>
                                    <span className="text-xs text-muted-foreground">Diferença:</span>
                                    <span className="ml-1 text-red-500">
                                      -R$ {month.ctoTotalEsperado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className={`p-3 text-right font-semibold ${
                            month.percentualCTO > 12 
                              ? 'text-red-500' 
                              : month.percentualCTO >= 10 
                              ? 'text-yellow-500' 
                              : month.percentualCTO > 0
                              ? 'text-green-500'
                              : 'text-muted-foreground'
                          }`}>
                            {month.percentualCTO > 0 ? `${month.percentualCTO.toFixed(2)}%` : '-'}
                          </td>
                          <td className="p-3 text-right">
                            R$ {month.pe.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right">
                            {month.diferencaPE > 0 ? (
                              <>
                                <div className="font-semibold">
                                  R$ {month.diferencaPE.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  (+{(month.percentualPE - 100).toFixed(1)}% acima do PE)
                                </span>
                              </>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </>
  );
};

export default StoresCTOAnalytics;

