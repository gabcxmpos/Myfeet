import React, { useState, useEffect, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Route, AlertCircle, CheckSquare, Store, Calendar } from 'lucide-react';
import * as checklistService from '@/lib/checklistService';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const MotoristaChecklist = () => {
  const { user } = useAuth();
  const { stores } = useData();
  const { toast } = useToast();
  const [routes, setRoutes] = useState([]);
  const [execution, setExecution] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));

  // Carregar rotas e execução
  const loadData = async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const routesData = await checklistService.fetchMotoristaRoutes(user.id);
      // Filtrar rotas pela data selecionada
      const todayRoutes = routesData?.filter(r => {
        if (r.route_date) {
          return format(parseISO(r.route_date), 'yyyy-MM-dd') === selectedDate;
        }
        return false;
      }) || [];
      
      const executionData = await checklistService.fetchMotoristaExecution(user.id);
      
      setRoutes(todayRoutes);
      setExecution(executionData);
    } catch (error) {
      console.error('Erro ao carregar checklist:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao carregar checklist.',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role === 'motorista' || user?.role === 'admin') {
      loadData();
    }
  }, [user, selectedDate]);

  // Obter todas as lojas das rotas do dia
  const todayStores = useMemo(() => {
    const storeIds = new Set();
    routes.forEach(route => {
      const storesArray = Array.isArray(route.stores_selected) 
        ? route.stores_selected 
        : (route.stores_selected || []);
      storesArray.forEach(storeId => storeIds.add(storeId));
    });
    
    // Mapear store_ids para objetos de loja com informações
    return Array.from(storeIds).map(storeId => {
      const store = stores?.find(s => s.id === storeId);
      return {
        storeId,
        storeName: store ? `${store.code || ''} - ${store.name || ''}`.trim() : storeId,
        store: store || null
      };
    });
  }, [routes, stores]);

  // Status das lojas (execution.routes é um JSONB {store_id: true/false})
  const storesStatus = useMemo(() => {
    if (!execution || !execution.routes) return {};
    return execution.routes;
  }, [execution]);

  // Estatísticas
  const stats = useMemo(() => {
    const total = todayStores.length;
    const completed = Object.keys(storesStatus).filter(storeId => storesStatus[storeId] === true).length;
    const percentage = total > 0 ? (completed / total) * 100 : 0;
    
    return { total, completed, percentage };
  }, [todayStores, storesStatus]);

  // Alternar status de uma loja
  const handleToggleStore = async (storeId) => {
    if (saving) return;
    
    const newStatus = {
      ...storesStatus,
      [storeId]: !storesStatus[storeId]
    };

    setSaving(true);
    try {
      const updated = await checklistService.upsertMotoristaExecution(user.id, newStatus);
      setExecution(updated);
      toast({
        title: 'Sucesso!',
        description: 'Checklist atualizado.',
      });
    } catch (error) {
      console.error('Erro ao atualizar checklist:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao atualizar checklist.',
      });
    } finally {
      setSaving(false);
    }
  };

  if (user?.role !== 'motorista' && user?.role !== 'admin') {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <AlertCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <div className="text-muted-foreground">Carregando checklist...</div>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Checklist de Rotas - MYFEET</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Checklist de Rotas</h1>
            <p className="text-muted-foreground mt-2">
              Marque as lojas conforme você as visita
            </p>
          </div>
        </div>

        {/* Seletor de Data */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <Label htmlFor="checklist-date" className="text-base font-medium flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Data da Rota:
              </Label>
              <Input
                id="checklist-date"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-[200px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Estatísticas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Route className="w-5 h-5" />
              Progresso - {format(parseISO(selectedDate), "dd/MM/yyyy", { locale: ptBR })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-foreground">
                  {stats.completed} de {stats.total} loja(s) visitada(s)
                </span>
                <Badge variant={stats.percentage === 100 ? 'default' : 'secondary'}>
                  {stats.percentage.toFixed(0)}%
                </Badge>
              </div>
              <Progress value={stats.percentage} className="h-2" />
              {execution?.completed_at && (
                <p className="text-xs text-muted-foreground">
                  Última atualização: {format(new Date(execution.completed_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lista de Lojas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="w-5 h-5" />
              Lojas da Rota ({todayStores.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {todayStores.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Nenhuma loja cadastrada para esta data. O admin precisa cadastrar a rota primeiro.
              </div>
            ) : (
              <div className="space-y-3">
                {todayStores.map((storeInfo, index) => {
                  const isCompleted = storesStatus[storeInfo.storeId] === true;
                  
                  return (
                    <motion.div
                      key={storeInfo.storeId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`flex items-center gap-3 p-4 border rounded-lg transition-colors ${
                        isCompleted
                          ? 'bg-primary/10 border-primary/20'
                          : 'bg-card border-border hover:bg-accent/50'
                      }`}
                    >
                      <Checkbox
                        checked={isCompleted}
                        onCheckedChange={() => handleToggleStore(storeInfo.storeId)}
                        disabled={saving}
                        className="w-5 h-5"
                      />
                      <Label
                        htmlFor={`store-${storeInfo.storeId}`}
                        className={`flex-1 cursor-pointer ${
                          isCompleted ? 'line-through text-muted-foreground' : 'text-foreground'
                        }`}
                        onClick={() => handleToggleStore(storeInfo.storeId)}
                      >
                        <div className="flex items-center gap-2">
                          <Store className="w-4 h-4" />
                          <span className="font-medium">{storeInfo.storeName}</span>
                          {storeInfo.store?.city && (
                            <span className="text-xs text-muted-foreground">
                              - {storeInfo.store.city}{storeInfo.store.state ? `/${storeInfo.store.state}` : ''}
                            </span>
                          )}
                        </div>
                      </Label>
                      {isCompleted && (
                        <Badge variant="default" className="gap-1">
                          <CheckSquare className="w-3 h-3" />
                          Visitada
                        </Badge>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default MotoristaChecklist;
