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
    const aluguelMin = parseFloat(ctoData.aluguelMin) || 0;
    const aluguelPercentual = parseFloat(ctoData.aluguelPercentual) || 0;

    // Buscar vendas mensais do cto_data (independente do store_results)
    const monthlySalesData = ctoData.monthlySales || {};
    
    // Buscar boletos mensais (nova estrutura)
    const monthlyBillsData = ctoData.monthlyBills || {};

    return months.map(month => {
      const monthKey = format(month, 'yyyy-MM');
      // Usar vendas do cto_data ao invés de store_results
      const faturamento = parseFloat(monthlySalesData[monthKey] || 0);
      
      // Buscar boletos do mês específico
      const monthBills = monthlyBillsData[monthKey] || {};
      const amm = parseFloat(monthBills.amm || 0);
      const ammDiscount = parseFloat(monthBills.ammDiscount || 0);
      const ammFinal = Math.max(0, amm - ammDiscount);
      const fpp = parseFloat(monthBills.fpp || 0);
      const cond = parseFloat(monthBills.cond || 0);
      const paidValue = parseFloat(monthBills.paidValue || 0);
      
      // PONTO DE EQUILÍBRIO: valor mínimo de vendas para que o aluguel percentual seja maior que o mínimo
      // PE = AMM / (percentual / 100)
      // Se vendas > PE, então aluguel percentual > AMM, então precisa pagar complemento
      const pe = aluguelPercentual > 0 ? aluguelMin / (aluguelPercentual / 100) : 0;
      
      // ALUGUEL CALCULADO BASEADO NAS VENDAS (para saber se tem complemento)
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
      
      // COMPLEMENTO CALCULADO: diferença entre aluguel percentual e AMM (quando vendas > PE)
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
        percentualCTO, // Percentual do CTO Mensal
        pe,
        diferencaPE: faturamento > pe ? faturamento - pe : 0, // Diferença entre vendas e PE
        percentualPE: pe > 0 ? (faturamento / pe) * 100 : 0, // Percentual do PE
        margem,
        acimaPE,
        lucro: faturamento - ctoTotal
      };
    });
  }, [selectedStore, selectedYear]);

  // Calcular totais anuais
  const annualTotals = useMemo(() => {
    return monthlyData.reduce((acc, month) => ({
      faturamento: acc.faturamento + month.faturamento,
      ctoTotal: acc.ctoTotal + month.ctoTotal,
      ctoBoleto: acc.ctoBoleto + (month.ctoBoleto || 0),
      lucro: acc.lucro + month.lucro,
      mesesAcimaPE: acc.mesesAcimaPE + (month.acimaPE ? 1 : 0)
    }), {
      faturamento: 0,
      ctoTotal: 0,
      ctoBoleto: 0,
      lucro: 0,
      mesesAcimaPE: 0
    });
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
            {/* Resumo Anual */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Faturamento Anual</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        R$ {annualTotals.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                    <DollarSign className="w-8 h-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">CTO Total Anual</p>
                      <p className="text-2xl font-bold text-foreground mt-1">
                        R$ {annualTotals.ctoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {annualTotals.mesesAcimaPE} de {monthlyData.length} meses acima do PE
                      </p>
                    </div>
                    <Calculator className="w-8 h-8 text-orange-500" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Percentual CTO Médio</p>
                      <p className={`text-2xl font-bold mt-1 ${
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
                      <p className="text-xs text-muted-foreground mt-1">
                        CTO do Boleto ÷ Faturamento
                      </p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Gráfico */}
            <Card>
              <CardHeader>
                <CardTitle>Faturamento vs CTO Mensal</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={monthlyData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="mes" />
                    <YAxis />
                    <Tooltip 
                      formatter={(value) => `R$ ${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="faturamento" stroke="#22c55e" name="Faturamento" strokeWidth={2} />
                    <Line type="monotone" dataKey="ctoTotal" stroke="#f97316" name="CTO Total" strokeWidth={2} />
                    <Line type="monotone" dataKey="pe" stroke="#ef4444" name="Ponto de Equilíbrio" strokeWidth={2} strokeDasharray="5 5" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Tabela Detalhada */}
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
                        <th className="p-3 text-right">Complemento</th>
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
                          <td className="p-3 font-medium">{month.mes}</td>
                          <td className="p-3 text-right">
                            R$ {month.faturamento.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex flex-col items-end">
                              {month.ammDiscount > 0 ? (
                                <>
                                  <span className="text-xs text-muted-foreground line-through">
                                    R$ {month.ammOriginal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                  <span className="text-green-500 font-semibold">
                                    R$ {month.amm.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                  <span className="text-xs text-green-500">
                                    (-R$ {month.ammDiscount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })})
                                  </span>
                                </>
                              ) : (
                                <span>R$ {month.amm.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                              )}
                            </div>
                          </td>
                          <td className="p-3 text-right">
                            {month.valorComplementarCalculado > 0 ? (
                              <div className="flex flex-col items-end gap-1">
                                <div>
                                  <span className="text-xs text-muted-foreground">Calculado:</span>
                                  <span className="ml-1 font-semibold text-foreground">
                                    R$ {month.valorComplementarCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                  </span>
                                </div>
                                {month.paidValue > 0 ? (
                                  <>
                                    <div>
                                      <span className="text-xs text-muted-foreground">Pago:</span>
                                      <span className="ml-1 font-semibold text-green-500">
                                        R$ {month.paidValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                      </span>
                                    </div>
                                    {Math.abs(month.valorComplementarCalculado - month.paidValue) >= 100 && (
                                      <div>
                                        <span className="text-xs text-muted-foreground">Diferença:</span>
                                        <span className="ml-1 font-semibold text-orange-500">
                                          {month.paidValue < month.valorComplementarCalculado 
                                            ? `-R$ ${(month.valorComplementarCalculado - month.paidValue).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                            : `+R$ ${(month.paidValue - month.valorComplementarCalculado).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                                          }
                                        </span>
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <div>
                                    <span className="text-xs text-muted-foreground">Diferença:</span>
                                    <span className="ml-1 font-semibold text-orange-500">
                                      R$ {month.valorComplementarCalculado.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                    </span>
                                    <span className="text-xs text-orange-500 block mt-0.5">(a pagar)</span>
                                  </div>
                                )}
                              </div>
                            ) : (
                              '-'
                            )}
                          </td>
                          <td className="p-3 text-right">
                            R$ {month.fpp.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right">
                            R$ {month.cond.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right">
                            R$ {month.additionalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </td>
                          <td className="p-3 text-right font-semibold">
                            R$ {month.ctoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

