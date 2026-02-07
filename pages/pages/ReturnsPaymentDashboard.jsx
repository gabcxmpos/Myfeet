import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import { DollarSign, TrendingUp, TrendingDown, Package, CheckSquare, AlertCircle, BarChart3, PieChart as PieChartIcon, Calendar } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { useOptimizedRefresh } from '@/lib/useOptimizedRefresh';
import { supabase } from '@/lib/customSupabaseClient';
import { ResponsiveContainer, BarChart, XAxis, YAxis, Bar, Cell, Tooltip, PieChart, Pie, Legend, LineChart, Line } from 'recharts';

const ReturnsPaymentDashboard = () => {
  const { stores, returnsPlanner, fetchData } = useData();
  const { user } = useAuth();

  const [filters, setFilters] = useState({
    store: [],
    brand: [],
    estado: [],
  });

  const [dateRange, setDateRange] = useState({
    startDate: format(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), 'yyyy-MM-dd'), // 30 dias atrás
    endDate: format(new Date(), 'yyyy-MM-dd'), // Hoje
  });

  useOptimizedRefresh(fetchData);

  // Subscription em tempo real
  useEffect(() => {
    const channel = supabase
      .channel('returns_planner_payment_dashboard_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'returns_planner',
          filter: `status=eq.Coletado`
        },
        () => {
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  // Filtrar apenas devoluções coletadas
  const collectedReturns = useMemo(() => {
    let filtered = (returnsPlanner || []).filter(item => item.status === 'Coletado');

    // Filtro por período (data de abertura)
    if (dateRange.startDate || dateRange.endDate) {
      filtered = filtered.filter(item => {
        if (!item.opening_date) return false;
        try {
          const itemDate = format(parseISO(item.opening_date), 'yyyy-MM-dd');
          const start = dateRange.startDate || '1900-01-01';
          const end = dateRange.endDate || '9999-12-31';
          return itemDate >= start && itemDate <= end;
        } catch (e) {
          return false;
        }
      });
    }

    // Filtro por loja
    if (filters.store.length > 0) {
      filtered = filtered.filter(item => filters.store.includes(item.store_id));
    }

    // Filtro por marca
    if (filters.brand.length > 0) {
      filtered = filtered.filter(item => item.brand && filters.brand.includes(item.brand));
    }

    // Filtro por estado
    if (filters.estado.length > 0) {
      filtered = filtered.filter(item => {
        const store = stores.find(s => s.id === item.store_id);
        return store && filters.estado.includes(store.estado);
      });
    }

    return filtered;
  }, [returnsPlanner, filters, stores, dateRange]);

  // Análise completa de pagamentos
  const paymentAnalysis = useMemo(() => {
    const total = collectedReturns.length;
    const paid = collectedReturns.filter(item => item.paid_by_brand_at);
    const unpaid = collectedReturns.filter(item => !item.paid_by_brand_at);

    // Valor que deveríamos receber (valor total das devoluções coletadas)
    const expectedValue = collectedReturns.reduce((sum, item) => sum + (parseFloat(item.return_value) || 0), 0);

    // Valor que recebemos (valor pago pela marca)
    const receivedValue = paid.reduce((sum, item) => sum + (parseFloat(item.paid_by_brand_value) || 0), 0);

    // Diferença
    const difference = expectedValue - receivedValue;
    const differencePercentage = expectedValue > 0 ? (difference / expectedValue) * 100 : 0;

    // Análise por marca
    const byBrand = collectedReturns.reduce((acc, item) => {
      const brand = item.brand || 'Sem marca';
      if (!acc[brand]) {
        acc[brand] = {
          expected: 0,
          received: 0,
          count: 0,
          paidCount: 0,
        };
      }
      acc[brand].expected += parseFloat(item.return_value) || 0;
      acc[brand].count += 1;
      if (item.paid_by_brand_at) {
        acc[brand].received += parseFloat(item.paid_by_brand_value) || 0;
        acc[brand].paidCount += 1;
      }
      return acc;
    }, {});

    // Análise por estado
    const byEstado = collectedReturns.reduce((acc, item) => {
      const store = stores.find(s => s.id === item.store_id);
      const estado = store?.estado || 'Sem estado';
      if (!acc[estado]) {
        acc[estado] = {
          expected: 0,
          received: 0,
          count: 0,
          paidCount: 0,
        };
      }
      acc[estado].expected += parseFloat(item.return_value) || 0;
      acc[estado].count += 1;
      if (item.paid_by_brand_at) {
        acc[estado].received += parseFloat(item.paid_by_brand_value) || 0;
        acc[estado].paidCount += 1;
      }
      return acc;
    }, {});

    return {
      total,
      paid: paid.length,
      unpaid: unpaid.length,
      expectedValue,
      receivedValue,
      difference,
      differencePercentage,
      byBrand,
      byEstado,
    };
  }, [collectedReturns, stores]);

  // Opções de filtro
  const filterOptions = useMemo(() => {
    const storesList = stores || [];
    const allBrands = [...new Set((returnsPlanner || [])
      .filter(item => item.status === 'Coletado')
      .map(item => item.brand)
      .filter(Boolean))].sort();
    
    const allEstados = [...new Set(storesList.map(s => s.estado).filter(Boolean))].sort();

    return {
      stores: storesList.map(s => ({ value: s.id, label: s.name })),
      brands: allBrands.map(b => ({ value: b, label: b })),
      estados: allEstados.map(e => ({ value: e, label: e })),
    };
  }, [stores, returnsPlanner]);

  // Dados para gráficos
  const chartDataByBrand = useMemo(() => {
    return Object.entries(paymentAnalysis.byBrand)
      .map(([brand, data]) => ({
        name: brand,
        'Deveríamos Receber': data.expected,
        'Recebemos': data.received,
        'Diferença': data.expected - data.received,
      }))
      .sort((a, b) => b['Deveríamos Receber'] - a['Deveríamos Receber'])
      .slice(0, 10); // Top 10 marcas
  }, [paymentAnalysis.byBrand]);

  const chartDataByEstado = useMemo(() => {
    return Object.entries(paymentAnalysis.byEstado)
      .map(([estado, data]) => ({
        name: estado,
        'Deveríamos Receber': data.expected,
        'Recebemos': data.received,
        'Diferença': data.expected - data.received,
      }))
      .sort((a, b) => b['Deveríamos Receber'] - a['Deveríamos Receber']);
  }, [paymentAnalysis.byEstado]);

  const pieData = useMemo(() => {
    return [
      { name: 'Recebido', value: paymentAnalysis.receivedValue, color: '#22c55e' },
      { name: 'Pendente', value: paymentAnalysis.difference, color: '#eab308' },
    ];
  }, [paymentAnalysis]);

  return (
    <>
      <Helmet>
        <title>Dashboard Pagamento Devoluções - MYFEET</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Dashboard Pagamento Devoluções</h2>
          <p className="text-muted-foreground mt-1">
            Análise completa de pagamentos: quanto deveríamos receber vs quanto recebemos
          </p>
        </div>

        {/* Filtros */}
        <Card className="p-4 bg-secondary/50 border border-blue-500/30">
          <h4 className="font-semibold text-foreground mb-3 text-sm">Filtros</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Data Inicial
              </Label>
              <Input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange({ ...dateRange, startDate: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                Data Final
              </Label>
              <Input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange({ ...dateRange, endDate: e.target.value })}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Loja</Label>
              <MultiSelectFilter
                options={filterOptions.stores}
                selected={filters.store}
                onChange={(selected) => setFilters({ ...filters, store: selected })}
                placeholder="Todas as lojas"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Marca</Label>
              <MultiSelectFilter
                options={filterOptions.brands}
                selected={filters.brand}
                onChange={(selected) => setFilters({ ...filters, brand: selected })}
                placeholder="Todas as marcas"
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs">Estado</Label>
              <MultiSelectFilter
                options={filterOptions.estados}
                selected={filters.estado}
                onChange={(selected) => setFilters({ ...filters, estado: selected })}
                placeholder="Todos os estados"
                className="bg-background"
              />
            </div>
          </div>
        </Card>

        {/* Cards de Resumo */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            className="bg-card p-4 rounded-xl border border-border"
            whileHover={{ y: -5 }}
          >
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-sm font-medium">Total Coletadas</span>
              <Package className="w-5 h-5 text-blue-400" />
            </div>
            <span className="font-bold text-3xl text-foreground">{paymentAnalysis.total}</span>
            <p className="text-xs text-muted-foreground mt-1">Devoluções coletadas</p>
          </motion.div>

          <motion.div
            className="bg-card p-4 rounded-xl border border-green-500/30"
            whileHover={{ y: -5 }}
          >
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-sm font-medium">Deveríamos Receber</span>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <span className="font-bold text-3xl text-green-500">
              R$ {paymentAnalysis.expectedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-xs text-muted-foreground mt-1">Valor total das devoluções</p>
          </motion.div>

          <motion.div
            className="bg-card p-4 rounded-xl border border-blue-500/30"
            whileHover={{ y: -5 }}
          >
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-sm font-medium">Recebemos</span>
              <DollarSign className="w-5 h-5 text-blue-400" />
            </div>
            <span className="font-bold text-3xl text-blue-500">
              R$ {paymentAnalysis.receivedValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-xs text-muted-foreground mt-1">Valor pago pela marca</p>
          </motion.div>

          <motion.div
            className={`bg-card p-4 rounded-xl border ${
              paymentAnalysis.difference >= 0 
                ? 'border-yellow-500/30' 
                : 'border-green-500/30'
            }`}
            whileHover={{ y: -5 }}
          >
            <div className="flex items-center justify-between text-muted-foreground mb-2">
              <span className="text-sm font-medium">Diferença</span>
              {paymentAnalysis.difference >= 0 ? (
                <TrendingDown className="w-5 h-5 text-yellow-400" />
              ) : (
                <TrendingUp className="w-5 h-5 text-green-400" />
              )}
            </div>
            <span className={`font-bold text-3xl ${
              paymentAnalysis.difference >= 0 ? 'text-yellow-500' : 'text-green-500'
            }`}>
              R$ {Math.abs(paymentAnalysis.difference).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <p className="text-xs text-muted-foreground mt-1">
              {paymentAnalysis.difference >= 0 ? 'Pendente' : 'Acima do esperado'} 
              {' '}({Math.abs(paymentAnalysis.differencePercentage).toFixed(1)}%)
            </p>
          </motion.div>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Gráfico de Pizza - Recebido vs Pendente */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <PieChartIcon className="w-5 h-5" />
              Distribuição de Pagamentos
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          {/* Gráfico de Barras - Por Marca */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Análise por Marca (Top 10)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartDataByBrand}>
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
                <YAxis />
                <Tooltip
                  formatter={(value) => `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                />
                <Legend />
                <Bar dataKey="Deveríamos Receber" fill="#22c55e" />
                <Bar dataKey="Recebemos" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>

        {/* Gráfico por Estado */}
        {chartDataByEstado.length > 0 && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              Análise por Estado
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartDataByEstado}>
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip
                  formatter={(value) => `R$ ${parseFloat(value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                />
                <Legend />
                <Bar dataKey="Deveríamos Receber" fill="#22c55e" />
                <Bar dataKey="Recebemos" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        )}

        {/* Tabela Detalhada por Marca */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">Análise Detalhada por Marca</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left p-2 text-sm font-medium text-muted-foreground">Marca</th>
                  <th className="text-right p-2 text-sm font-medium text-muted-foreground">Quantidade</th>
                  <th className="text-right p-2 text-sm font-medium text-muted-foreground">Pagas</th>
                  <th className="text-right p-2 text-sm font-medium text-muted-foreground">Deveríamos Receber</th>
                  <th className="text-right p-2 text-sm font-medium text-muted-foreground">Recebemos</th>
                  <th className="text-right p-2 text-sm font-medium text-muted-foreground">Diferença</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(paymentAnalysis.byBrand)
                  .sort((a, b) => b[1].expected - a[1].expected)
                  .map(([brand, data]) => {
                    const diff = data.expected - data.received;
                    return (
                      <tr key={brand} className="border-b border-border/50 hover:bg-secondary/50">
                        <td className="p-2 font-medium">{brand}</td>
                        <td className="p-2 text-right">{data.count}</td>
                        <td className="p-2 text-right">
                          <Badge variant={data.paidCount === data.count ? 'default' : 'secondary'}>
                            {data.paidCount}/{data.count}
                          </Badge>
                        </td>
                        <td className="p-2 text-right">
                          R$ {data.expected.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className="p-2 text-right">
                          R$ {data.received.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                        <td className={`p-2 text-right font-medium ${
                          diff >= 0 ? 'text-yellow-500' : 'text-green-500'
                        }`}>
                          R$ {Math.abs(diff).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </>
  );
};

export default ReturnsPaymentDashboard;
