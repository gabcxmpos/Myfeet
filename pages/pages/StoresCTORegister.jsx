import React, { useState, useMemo } from 'react';
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
import { Store, Search, Download, FileSpreadsheet, Calendar } from 'lucide-react';
import { filterStoresByUserType } from '@/lib/storeTypeHelper';
import { useOptimizedRefresh } from '@/lib/useOptimizedRefresh';
import { format, eachMonthOfInterval, startOfYear, endOfYear } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const StoresCTORegister = () => {
  const { stores, fetchData } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

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

  // Gerar meses do ano selecionado
  const months = useMemo(() => {
    const start = startOfYear(new Date(selectedYear, 0, 1));
    const end = endOfYear(new Date(selectedYear, 11, 31));
    return eachMonthOfInterval({ start, end });
  }, [selectedYear]);

  // Preparar dados para tabela Excel
  const tableData = useMemo(() => {
    return filteredStores.map(store => {
      const ctoData = store.cto_data || {};
      const monthlySales = ctoData.monthlySales || {};
      const monthlyBills = ctoData.monthlyBills || {};
      const aluguelMin = parseFloat(ctoData.aluguelMin) || 0;
      const aluguelPercentual = parseFloat(ctoData.aluguelPercentual) || 0;

      const monthData = months.map(month => {
        const monthKey = format(month, 'yyyy-MM');
        const sales = parseFloat(monthlySales[monthKey] || 0);
        const bills = monthlyBills[monthKey] || {};
        
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
        const percentualCTO = ctoBoleto > 0 && sales > 0 ? (ctoBoleto / sales) * 100 : 0;
        const pe = aluguelPercentual > 0 ? aluguelMin / (aluguelPercentual / 100) : 0;
        const lucro = sales - ctoTotal;
        const margem = sales > 0 ? ((sales - ctoTotal) / sales) * 100 : 0;

        return {
          monthKey,
          monthLabel: format(month, 'MMM/yyyy', { locale: ptBR }),
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
          pe,
          lucro,
          margem,
          acimaPE: sales >= pe
        };
      });

      return {
        store: {
          id: store.id,
          name: store.name,
          code: store.code,
          m2: ctoData.m2 || '',
          aluguelMin,
          aluguelPercentual
        },
        months: monthData
      };
    });
  }, [filteredStores, months]);

  // Exportar para Excel (CSV)
  const handleExportCSV = () => {
    const headers = [
      'Loja',
      'Código',
      'm²',
      'Aluguel Mín.',
      'Aluguel %',
      ...months.map(m => format(m, 'MMM/yyyy', { locale: ptBR }))
    ];

    // Criar linhas de dados
    const rows = [];
    
    // Cabeçalhos principais
    rows.push(['', '', '', '', '', ...months.map(() => '')]);
    
    // Para cada loja
    tableData.forEach(({ store, months: monthData }) => {
      // Linha de identificação da loja
      rows.push([
        store.name,
        store.code || '',
        store.m2 || '',
        store.aluguelMin || '',
        store.aluguelPercentual ? `${store.aluguelPercentual}%` : '',
        ...months.map(() => '')
      ]);

      // Linhas de dados mensais
      const dataTypes = [
        { label: 'Vendas', key: 'sales', format: (v) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
        { label: 'AMM', key: 'amm', format: (v) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
        { label: 'Desconto AMM', key: 'ammDiscount', format: (v) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
        { label: 'AMM Final', key: 'ammFinal', format: (v) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
        { label: 'FPP', key: 'fpp', format: (v) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
        { label: 'COND', key: 'cond', format: (v) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
        { label: 'CTO Boleto', key: 'ctoBoleto', format: (v) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
        { label: 'Custos Adicionais', key: 'additionalCosts', format: (v) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
        { label: 'CTO Total', key: 'ctoTotal', format: (v) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
        { label: '% CTO', key: 'percentualCTO', format: (v) => `${v.toFixed(2)}%` },
        { label: 'PE', key: 'pe', format: (v) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
        { label: 'Lucro', key: 'lucro', format: (v) => `R$ ${v.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` },
        { label: 'Margem %', key: 'margem', format: (v) => `${v.toFixed(2)}%` },
        { label: 'Status PE', key: 'acimaPE', format: (v) => v ? 'Acima' : 'Abaixo' }
      ];

      dataTypes.forEach(({ label, key, format }) => {
        rows.push([
          label,
          '',
          '',
          '',
          '',
          ...monthData.map(m => format(m[key]))
        ]);
      });

      // Linha em branco entre lojas
      rows.push(['', '', '', '', '', ...months.map(() => '')]);
    });

    // Converter para CSV
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `CTO_Registro_${selectedYear}.csv`;
    link.click();

    toast({
      title: 'Sucesso!',
      description: 'Arquivo CSV exportado com sucesso.'
    });
  };

  return (
    <>
      <Helmet>
        <title>Livro de Registro CTO - MYFEET</title>
      </Helmet>
      <div className="container mx-auto p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="w-8 h-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Livro de Registro CTO</h1>
              <p className="text-muted-foreground">Registro completo mês a mês de todas as lojas</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Select value={selectedYear.toString()} onValueChange={(v) => setSelectedYear(parseInt(v))}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[2023, 2024, 2025, 2026].map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={handleExportCSV} className="gap-2">
              <Download className="w-4 h-4" />
              Exportar CSV
            </Button>
          </div>
        </motion.div>

        {/* Filtros */}
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Buscar Loja</Label>
                <div className="relative mt-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="Digite o nome ou código da loja..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabela de Registro */}
        <div className="w-full overflow-x-auto" style={{ overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          <div className="inline-block align-middle" style={{ minWidth: `${(5 + months.length) * 110}px` }}>
            <table className="divide-y divide-border bg-card border border-border" style={{ width: 'auto', minWidth: '100%' }}>
              <thead className="bg-secondary">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider sticky left-0 bg-secondary z-10 border-r border-border whitespace-nowrap">
                    Loja
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider border-r border-border whitespace-nowrap">
                    Código
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider border-r border-border whitespace-nowrap">
                    m²
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider border-r border-border whitespace-nowrap">
                    Aluguel Mín.
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-foreground uppercase tracking-wider border-r border-border whitespace-nowrap">
                    Aluguel %
                  </th>
                  {months.map((month, idx) => (
                    <th
                      key={month.getTime()}
                      className={`px-3 py-3 text-center text-xs font-semibold text-foreground uppercase tracking-wider border-r border-border whitespace-nowrap ${
                        idx === months.length - 1 ? '' : ''
                      }`}
                      style={{ minWidth: '110px' }}
                    >
                      {format(month, 'MMM/yyyy', { locale: ptBR })}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {tableData.map(({ store, months: monthData }) => (
                  <React.Fragment key={store.id}>
                    {/* Linha de identificação da loja */}
                    <tr className="bg-primary/5 hover:bg-primary/10">
                      <td className="px-4 py-3 text-sm font-semibold sticky left-0 bg-primary/5 z-10 border-r border-border whitespace-nowrap">
                        {store.name}
                      </td>
                      <td className="px-4 py-3 text-sm border-r border-border whitespace-nowrap">{store.code || '-'}</td>
                      <td className="px-4 py-3 text-sm border-r border-border whitespace-nowrap">{store.m2 || '-'}</td>
                      <td className="px-4 py-3 text-sm border-r border-border whitespace-nowrap">
                        {store.aluguelMin ? `R$ ${parseFloat(store.aluguelMin).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                      </td>
                      <td className="px-4 py-3 text-sm border-r border-border whitespace-nowrap">
                        {store.aluguelPercentual ? `${store.aluguelPercentual}%` : '-'}
                      </td>
                      {monthData.map((month) => (
                        <td key={month.monthKey} className="px-3 py-3 text-sm text-center border-r border-border whitespace-nowrap" style={{ minWidth: '110px' }}>
                          {/* Vendas */}
                          <div className="font-semibold text-green-600">
                            {month.sales > 0 ? `R$ ${month.sales.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '-'}
                          </div>
                          {/* % CTO */}
                          <div className={`text-xs font-bold ${
                            month.percentualCTO > 12 
                              ? 'text-red-500' 
                              : month.percentualCTO >= 10 
                              ? 'text-yellow-500' 
                              : month.percentualCTO > 0
                              ? 'text-green-500'
                              : 'text-muted-foreground'
                          }`}>
                            {month.percentualCTO > 0 ? `${month.percentualCTO.toFixed(1)}%` : '-'}
                          </div>
                        </td>
                      ))}
                    </tr>
                    
                    {/* Linhas de detalhes mensais */}
                    {['AMM Final', 'FPP', 'COND', 'CTO Boleto', 'Custos Adic.', 'CTO Total'].map((label, idx) => (
                      <tr key={`${store.id}-${label}`} className="hover:bg-accent/50">
                        <td className="px-4 py-2 text-xs text-muted-foreground sticky left-0 bg-card z-10 border-r border-border pl-8 whitespace-nowrap">
                          {label}
                        </td>
                        <td colSpan="4" className="px-4 py-2 border-r border-border"></td>
                        {monthData.map((month) => {
                          let value = '-';
                          if (label === 'AMM Final') value = month.ammFinal > 0 ? `R$ ${month.ammFinal.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '-';
                          else if (label === 'FPP') value = month.fpp > 0 ? `R$ ${month.fpp.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '-';
                          else if (label === 'COND') value = month.cond > 0 ? `R$ ${month.cond.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '-';
                          else if (label === 'CTO Boleto') value = month.ctoBoleto > 0 ? `R$ ${month.ctoBoleto.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '-';
                          else if (label === 'Custos Adic.') value = month.additionalCosts > 0 ? `R$ ${month.additionalCosts.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '-';
                          else if (label === 'CTO Total') value = month.ctoTotal > 0 ? `R$ ${month.ctoTotal.toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : '-';
                          
                          return (
                            <td key={month.monthKey} className="px-3 py-2 text-xs text-center border-r border-border whitespace-nowrap" style={{ minWidth: '110px' }}>
                              {value}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                    
                    {/* Linha separadora */}
                    <tr>
                      <td colSpan={5 + months.length} className="h-2 bg-border"></td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {tableData.length === 0 && (
          <Card>
            <CardContent className="p-8 text-center">
              <Store className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhuma loja encontrada</p>
            </CardContent>
          </Card>
        )}
      </div>
    </>
  );
};

export default StoresCTORegister;

