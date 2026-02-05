import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, CheckSquare, DollarSign, Package, Store, Calendar, FileText, User, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import MultiSelectFilter from '@/components/MultiSelectFilter';
import { cn } from '@/lib/utils';
import { useOptimizedRefresh } from '@/lib/useOptimizedRefresh';
import { supabase } from '@/lib/customSupabaseClient';

const ReturnsFinancial = () => {
  const { stores, returnsPlanner, updateReturnsPlanner, fetchData } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  
  const [filters, setFilters] = useState({
    store: [],
    supervisor: [],
    brand: [],
  });

  useOptimizedRefresh(fetchData);

  // Subscription em tempo real para atualizações na tabela returns_planner
  useEffect(() => {
    const channel = supabase
      .channel('returns_planner_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'returns_planner',
          filter: `status=in.(Coletado,Aguardando coleta)`
        },
        (payload) => {
          console.log('🔄 [ReturnsFinancial] Mudança detectada em returns_planner:', payload);
          // Atualizar dados imediatamente quando houver mudança
          fetchData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  // Filtrar devoluções coletadas E aguardando coleta (pagas e não pagas)
  const collectedReturns = useMemo(() => {
    let filtered = (returnsPlanner || []).filter(item => 
      item.status === 'Coletado' || item.status === 'Aguardando coleta'
    );

    // Filtro de busca
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(item => 
        item.case_number?.toLowerCase().includes(term) ||
        item.invoice_number?.toLowerCase().includes(term) ||
        stores.find(s => s.id === item.store_id)?.name?.toLowerCase().includes(term) ||
        item.supervisor?.toLowerCase().includes(term) ||
        item.brand?.toLowerCase().includes(term)
      );
    }

    // Filtro por loja
    if (filters.store.length > 0) {
      filtered = filtered.filter(item => filters.store.includes(item.store_id));
    }

    // Filtro por supervisor
    if (filters.supervisor.length > 0) {
      filtered = filtered.filter(item => item.supervisor && filters.supervisor.includes(item.supervisor));
    }

    // Filtro por marca
    if (filters.brand.length > 0) {
      filtered = filtered.filter(item => item.brand && filters.brand.includes(item.brand));
    }

    return filtered.sort((a, b) => {
      try {
        if (!a.opening_date || !b.opening_date) return 0;
        const dateA = new Date(a.opening_date);
        const dateB = new Date(b.opening_date);
        if (isNaN(dateA.getTime()) || isNaN(dateB.getTime())) return 0;
        return dateB - dateA; // Mais recente primeiro
      } catch (e) {
        return 0;
      }
    });
  }, [returnsPlanner, searchTerm, filters, stores]);

  // Estatísticas
  const stats = useMemo(() => {
    const coletados = collectedReturns.filter(item => item.status === 'Coletado');
    const aguardandoColeta = collectedReturns.filter(item => item.status === 'Aguardando coleta');
    const paidReturns = coletados.filter(item => item.paid_by_brand_at);
    const unpaidReturns = coletados.filter(item => !item.paid_by_brand_at);
    
    return {
      total: collectedReturns.length,
      coletados: coletados.length,
      aguardandoColeta: aguardandoColeta.length,
      paid: paidReturns.length,
      unpaid: unpaidReturns.length,
      totalValue: collectedReturns.reduce((sum, item) => sum + (parseFloat(item.return_value) || 0), 0),
      coletadosValue: coletados.reduce((sum, item) => sum + (parseFloat(item.return_value) || 0), 0),
      aguardandoColetaValue: aguardandoColeta.reduce((sum, item) => sum + (parseFloat(item.return_value) || 0), 0),
      paidValue: paidReturns.reduce((sum, item) => sum + (parseFloat(item.return_value) || 0), 0),
      unpaidValue: unpaidReturns.reduce((sum, item) => sum + (parseFloat(item.return_value) || 0), 0),
      totalQuantity: collectedReturns.reduce((sum, item) => sum + (parseInt(item.items_quantity) || 0), 0),
    };
  }, [collectedReturns]);

  // Opções de filtro
  const filterOptions = useMemo(() => {
    const storesList = stores || [];
    const allBrands = [...new Set((returnsPlanner || [])
      .filter(item => item.status === 'Coletado' || item.status === 'Aguardando coleta')
      .map(item => item.brand)
      .filter(Boolean))].sort();
    
    return {
      stores: storesList.map(s => ({ value: s.id, label: s.name })),
      supervisors: [...new Set(storesList.map(s => s.supervisor).filter(Boolean))].map(s => ({ value: s, label: s })),
      brands: allBrands.map(b => ({ value: b, label: b }))
    };
  }, [stores, returnsPlanner]);

  // Marcar como pago pela marca
  const handleMarkAsPaid = async (itemId) => {
    if (window.confirm('Confirmar que esta devolução foi paga pela marca?')) {
      try {
        await updateReturnsPlanner(itemId, {
          paid_by_brand_at: new Date().toISOString(),
          paid_by_brand_user_id: user?.id
        });
        toast({
          title: 'Sucesso!',
          description: 'Devolução marcada como paga pela marca.',
        });
      } catch (error) {
        console.error('Erro ao marcar como pago:', error);
        toast({
          variant: 'destructive',
          title: 'Erro',
          description: error.message || 'Erro ao marcar devolução como paga.',
        });
      }
    }
  };

  const getTypeBadge = (type) => {
    const configs = {
      'COMERCIAL': { label: 'COMERCIAL', class: 'bg-purple-500/10 text-purple-500 border-purple-500/20' },
      'DEFEITO': { label: 'DEFEITO', class: 'bg-red-500/10 text-red-500 border-red-500/20' },
      'FALTA_FISICA': { label: 'FALTA FÍSICA', class: 'bg-orange-500/10 text-orange-500 border-orange-500/20' },
    };
    const config = configs[type] || configs['COMERCIAL'];
    return (
      <Badge variant="outline" className={cn("px-2 py-1 rounded-full text-xs font-medium border", config.class)}>
        {config.label}
      </Badge>
    );
  };

  return (
    <>
      <Helmet>
        <title>Devoluções em Processo - MYFEET</title>
      </Helmet>
      
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-foreground">Devoluções em Processo</h2>
            <p className="text-muted-foreground mt-1">
              Devoluções coletadas e aguardando coleta - gerencie o pagamento pela marca
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Buscar por caso, NF, loja..." 
              className="pl-9 w-64 bg-card" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
            />
          </div>
        </div>

        {/* Dashboard */}
        <Card className="p-6 border-2 border-blue-500/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <motion.div
              className="bg-card p-4 rounded-xl border border-border"
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-sm font-medium">Total</span>
                <Package className="w-5 h-5 text-blue-400" />
              </div>
              <span className="font-bold text-3xl text-foreground">{stats.total}</span>
              <p className="text-xs text-muted-foreground mt-1">Devoluções em processo</p>
            </motion.div>
            <motion.div
              className="bg-card p-4 rounded-xl border border-green-500/30"
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-sm font-medium">Coletadas</span>
                <CheckSquare className="w-5 h-5 text-green-400" />
              </div>
              <span className="font-bold text-3xl text-green-500">{stats.coletados}</span>
              <p className="text-xs text-muted-foreground mt-1">Status: Coletado</p>
            </motion.div>
            <motion.div
              className="bg-card p-4 rounded-xl border border-orange-500/30"
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-sm font-medium">Aguardando Coleta</span>
                <Clock className="w-5 h-5 text-orange-400" />
              </div>
              <span className="font-bold text-3xl text-orange-500">{stats.aguardandoColeta}</span>
              <p className="text-xs text-muted-foreground mt-1">Aguardando coleta</p>
            </motion.div>
            <motion.div
              className="bg-card p-4 rounded-xl border border-yellow-500/30"
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-sm font-medium">Aguardando Pagamento</span>
                <AlertCircle className="w-5 h-5 text-yellow-400" />
              </div>
              <span className="font-bold text-3xl text-yellow-500">{stats.unpaid}</span>
              <p className="text-xs text-muted-foreground mt-1">Coletadas não pagas</p>
            </motion.div>
            <motion.div
              className="bg-card p-4 rounded-xl border border-border"
              whileHover={{ y: -5 }}
            >
              <div className="flex items-center justify-between text-muted-foreground mb-2">
                <span className="text-sm font-medium">Valor Total</span>
                <DollarSign className="w-5 h-5 text-green-400" />
              </div>
              <span className="font-bold text-3xl text-foreground">
                R$ {stats.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
              <p className="text-xs text-muted-foreground mt-1">Valor das devoluções</p>
            </motion.div>
          </div>
        </Card>

        {/* Filtros */}
        <Card className="p-4 bg-secondary/50 border border-blue-500/30">
          <h4 className="font-semibold text-foreground mb-3 text-sm">Filtros</h4>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
              <Label className="text-xs">Supervisor</Label>
              <MultiSelectFilter
                options={filterOptions.supervisors}
                selected={filters.supervisor}
                onChange={(selected) => setFilters({ ...filters, supervisor: selected })}
                placeholder="Todos os supervisores"
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
          </div>
        </Card>

        {/* Lista de devoluções */}
        {collectedReturns.length === 0 ? (
          <Card className="p-12 text-center">
            <CheckSquare className="w-16 h-16 text-muted-foreground mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              Nenhuma devolução em processo
            </h3>
            <p className="text-muted-foreground">
              {searchTerm ? 'Tente ajustar os filtros de busca.' : 'Não há devoluções coletadas ou aguardando coleta no momento.'}
            </p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {collectedReturns.map((item, index) => {
              const store = stores.find(s => s.id === item.store_id);
              const isPaid = !!item.paid_by_brand_at;
              const isColetado = item.status === 'Coletado';
              const isAguardandoColeta = item.status === 'Aguardando coleta';
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                  className={`bg-card rounded-xl shadow-lg border p-5 flex flex-col justify-between ${
                    isColetado && isPaid 
                      ? 'border-green-500/30 bg-green-500/5' 
                      : isColetado && !isPaid
                      ? 'border-yellow-500/30 bg-yellow-500/5'
                      : 'border-orange-500/30 bg-orange-500/5'
                  }`}
                >
                  <div>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          {getTypeBadge(item.return_type)}
                          {isAguardandoColeta && (
                            <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">
                              ⏳ Aguardando coleta
                            </Badge>
                          )}
                          {isColetado && isPaid && (
                            <Badge className="bg-green-500/10 text-green-500 border-green-500/20">
                              ✓ Pago pela marca
                            </Badge>
                          )}
                          {isColetado && !isPaid && (
                            <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">
                              ⏳ Aguardando pagamento
                            </Badge>
                          )}
                        </div>
                        <h3 className="font-semibold text-foreground mb-1">{item.brand || 'Sem marca'}</h3>
                        {item.case_number && (
                          <p className="text-sm text-muted-foreground">Caso: {item.case_number}</p>
                        )}
                        {item.invoice_number && (
                          <p className="text-sm text-muted-foreground">NF: {item.invoice_number}</p>
                        )}
                        <p className="text-sm text-muted-foreground mt-1">
                          {store?.name || 'Loja não encontrada'}
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2 text-sm mb-4">
                      {item.supervisor && (
                        <div className="flex items-center gap-2">
                          <User className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Supervisor:</span>
                          <span className="font-medium text-foreground">{item.supervisor}</span>
                        </div>
                      )}
                      {item.opening_date && (
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Abertura:</span>
                          <span className="font-medium text-foreground">
                            {format(new Date(item.opening_date), 'dd/MM/yyyy', { locale: ptBR })}
                          </span>
                        </div>
                      )}
                      {item.return_value && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Valor:</span>
                          <span className="font-medium text-foreground">
                            R$ {parseFloat(item.return_value).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                          </span>
                        </div>
                      )}
                      {item.items_quantity && (
                        <div className="flex items-center gap-2">
                          <Package className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Quantidade:</span>
                          <span className="font-medium text-foreground">{item.items_quantity} itens</span>
                        </div>
                      )}
                      {isPaid && item.paid_by_brand_at && (
                        <div className="flex items-center gap-2 mt-2 p-2 bg-green-500/10 rounded-md border border-green-500/20">
                          <CheckSquare className="w-4 h-4 text-green-500" />
                          <span className="text-muted-foreground text-xs">Pago em:</span>
                          <span className="font-medium text-green-500 text-xs">
                            {format(new Date(item.paid_by_brand_at), 'dd/MM/yyyy HH:mm', { locale: ptBR })}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {isAguardandoColeta ? (
                    <div className="w-full p-2 bg-orange-500/10 border border-orange-500/20 rounded-md text-center">
                      <span className="text-sm font-medium text-orange-500">
                        ⏳ Aguardando coleta
                      </span>
                    </div>
                  ) : isColetado && !isPaid ? (
                    <Button
                      onClick={() => handleMarkAsPaid(item.id)}
                      className="w-full gap-2 bg-green-500 hover:bg-green-600 text-white"
                    >
                      <CheckSquare className="w-4 h-4" />
                      MARCAR COMO PAGO
                    </Button>
                  ) : isColetado && isPaid ? (
                    <div className="w-full p-2 bg-green-500/10 border border-green-500/20 rounded-md text-center">
                      <span className="text-sm font-medium text-green-500">
                        ✓ Pagamento confirmado
                      </span>
                    </div>
                  ) : null}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
};

export default ReturnsFinancial;
