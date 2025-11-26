import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Plus, Edit, Trash2, Route, X, Store, Calendar, Search } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import * as checklistService from '@/lib/checklistService';


const MotoristaChecklistManagement = () => {
  const { user } = useAuth();
  const { users, stores } = useData();
  const { toast } = useToast();
  const [selectedUserId, setSelectedUserId] = useState('');
  // Inicializar data uma única vez
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState(null);
  const [deleteRouteId, setDeleteRouteId] = useState(null);
  const [selectedStores, setSelectedStores] = useState([]);
  const [searchStore, setSearchStore] = useState('');

  // Filtrar usuários do perfil motorista
  const motoristaUsers = useMemo(() => {
    return users?.filter(u => u.role === 'motorista') || [];
  }, [users]);

  // Lojas filtradas por busca
  const filteredStores = useMemo(() => {
    if (!stores || stores.length === 0) return [];
    if (!searchStore) return stores;
    const search = searchStore.toLowerCase();
    return stores.filter(store => 
      store.name?.toLowerCase().includes(search) ||
      store.code?.toLowerCase().includes(search) ||
      store.city?.toLowerCase().includes(search)
    );
  }, [stores, searchStore]);

  // Carregar rotas (filtradas por usuário e data)
  useEffect(() => {
    let isMounted = true;

    const loadRoutes = async () => {
      if (!selectedUserId || selectedUserId === '') {
        if (isMounted) {
          setRoutes([]);
          setLoading(false);
        }
        return;
      }
      
      if (isMounted) {
        setLoading(true);
      }
      
      try {
        const data = await checklistService.fetchAllMotoristaRoutes(selectedUserId || null);
        
        if (!isMounted) return;
        
        // Filtrar rotas pela data selecionada
        const routesForDate = data?.filter(r => {
          if (r.route_date && selectedDate) {
            try {
              // Garantir que route_date é uma string válida antes de processar
              const routeDateStr = typeof r.route_date === 'string' ? r.route_date : String(r.route_date);
              // Se for uma data ISO string, usar parseISO, senão usar new Date diretamente
              let routeDate;
              try {
                routeDate = parseISO(routeDateStr);
              } catch {
                routeDate = new Date(routeDateStr);
              }
              const routeDateFormatted = format(routeDate, 'yyyy-MM-dd');
              return routeDateFormatted === selectedDate;
            } catch (e) {
              console.warn('Erro ao processar data da rota:', r.route_date, e);
              return false;
            }
          }
          return false;
        }) || [];
        
        if (isMounted) {
          setRoutes(routesForDate);
        }
      } catch (error) {
        console.error('Erro ao carregar rotas:', error);
        // Não mostrar toast dentro do useEffect para evitar loops
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    if (user?.role === 'admin' && selectedUserId && selectedUserId !== '') {
      loadRoutes();
    } else if (!selectedUserId || selectedUserId === '') {
      setRoutes([]);
      setLoading(false);
    }

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.role, selectedUserId, selectedDate]);

  // Função para recarregar rotas manualmente (chamada após salvar/excluir)
  const reloadRoutes = useCallback(async () => {
    if (!selectedUserId || selectedUserId === '') {
      setRoutes([]);
      setLoading(false);
      return;
    }
    
    setLoading(true);
    try {
      const data = await checklistService.fetchAllMotoristaRoutes(selectedUserId || null);
      const routesForDate = data?.filter(r => {
        if (r.route_date && selectedDate) {
          try {
            const routeDateStr = typeof r.route_date === 'string' ? r.route_date : String(r.route_date);
            let routeDate;
            try {
              routeDate = parseISO(routeDateStr);
            } catch {
              routeDate = new Date(routeDateStr);
            }
            const routeDateFormatted = format(routeDate, 'yyyy-MM-dd');
            return routeDateFormatted === selectedDate;
          } catch (e) {
            return false;
          }
        }
        return false;
      }) || [];
      setRoutes(routesForDate);
    } catch (error) {
      console.error('Erro ao carregar rotas:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Erro ao carregar rotas do checklist.',
      });
    } finally {
      setLoading(false);
    }
  }, [selectedUserId, selectedDate, toast]);

  // Abrir dialog para criar nova rota
  const handleCreate = () => {
    if (!selectedUserId || selectedUserId === '') {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Selecione um usuário antes de criar uma rota.',
      });
      return;
    }
    setEditingRoute(null);
    setSelectedStores([]);
    setSearchStore('');
    setIsDialogOpen(true);
  };

  // Abrir dialog para editar rota
  const handleEdit = (route) => {
    setEditingRoute(route);
    // Carregar lojas selecionadas da rota
    const storesArray = Array.isArray(route.stores_selected) 
      ? route.stores_selected 
      : (route.stores_selected || []);
    setSelectedStores(storesArray);
    setSearchStore('');
    setIsDialogOpen(true);
  };

  // Salvar rota (criar ou atualizar)
  const handleSave = async (e) => {
    e.preventDefault();
    
    if (!selectedUserId || selectedUserId === '') {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'É necessário selecionar um usuário.',
      });
      return;
    }

    if (!selectedStores || selectedStores.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Selecione pelo menos uma loja para a rota.',
      });
      return;
    }

    setSaving(true);
    try {
      const routeData = {
        user_id: selectedUserId,
        route_date: selectedDate,
        stores_selected: selectedStores,
        route_name: `Rota ${format(parseISO(selectedDate), 'dd/MM/yyyy', { locale: ptBR })}`,
        route_order: 0,
        is_active: true,
      };

      if (editingRoute) {
        // Atualizar
        await checklistService.updateMotoristaRoute(editingRoute.id, routeData);
        toast({
          title: 'Sucesso!',
          description: 'Rota atualizada com sucesso.',
        });
      } else {
        // Verificar se já existe rota para esta data e usuário
        const existingRoute = routes.find(r => 
          r.user_id === selectedUserId && 
          r.route_date && 
          format(parseISO(r.route_date), 'yyyy-MM-dd') === selectedDate
        );

        if (existingRoute) {
          // Atualizar rota existente
          await checklistService.updateMotoristaRoute(existingRoute.id, routeData);
          toast({
            title: 'Sucesso!',
            description: 'Rota atualizada com sucesso.',
          });
        } else {
          // Criar nova rota
          await checklistService.createMotoristaRoute({
            ...routeData,
            created_by: user?.id
          });
          toast({
            title: 'Sucesso!',
            description: 'Rota criada com sucesso.',
          });
        }
      }
      
      setIsDialogOpen(false);
      // Recarregar após salvar
      setTimeout(() => reloadRoutes(), 100);
    } catch (error) {
      console.error('Erro ao salvar rota:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Erro ao salvar rota.',
      });
    } finally {
      setSaving(false);
    }
  };

  // Confirmar exclusão
  const handleDelete = async () => {
    if (!deleteRouteId) return;
    
    try {
      await checklistService.deleteMotoristaRoute(deleteRouteId);
      toast({
        title: 'Sucesso!',
        description: 'Rota excluída com sucesso.',
      });
      setDeleteRouteId(null);
      // Recarregar após excluir
      setTimeout(() => reloadRoutes(), 100);
    } catch (error) {
      console.error('Erro ao excluir rota:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Erro ao excluir rota.',
      });
    }
  };

  // Alternar seleção de loja
  const handleToggleStore = useCallback((storeId) => {
    setSelectedStores(prev => {
      const newSelected = new Set(prev);
      if (newSelected.has(storeId)) {
        newSelected.delete(storeId);
      } else {
        newSelected.add(storeId);
      }
      return Array.from(newSelected);
    });
  }, []);

  // Handler para abrir/fechar o dialog
  const handleDialogOpenChange = useCallback((open) => {
    setIsDialogOpen(open);
    if (!open) {
      setEditingRoute(null);
      setSelectedStores([]);
      setSearchStore('');
    }
  }, []);

  // Obter nome da loja pelo ID
  const getStoreName = (storeId) => {
    const store = stores?.find(s => s.id === storeId);
    return store ? `${store.code || ''} - ${store.name || ''}`.trim() : storeId;
  };

  if (user?.role !== 'admin') {
    return (
      <div className="p-6">
        <Card className="p-12 text-center">
          <X className="w-16 h-16 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Acesso Negado</h2>
          <p className="text-muted-foreground">Você não tem permissão para acessar esta página.</p>
        </Card>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Gerenciar Rotas do Motorista - MYFEET</title>
      </Helmet>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gerenciar Rotas do Motorista</h1>
            <p className="text-muted-foreground mt-2">
              Selecione as lojas que farão parte da rota do motorista no dia
            </p>
          </div>
          <Button onClick={handleCreate} className="gap-2" disabled={!selectedUserId || selectedUserId === ''}>
            <Plus className="w-4 h-4" />
            Nova Rota
          </Button>
        </div>

        {/* Seletores: Usuário e Data */}
        <Card>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user-select-motorista" className="text-base font-medium">
                  Selecionar Motorista:
                </Label>
                {motoristaUsers.length > 0 ? (
                  <select
                    id="user-select-motorista"
                    value={selectedUserId || ''}
                    onChange={(e) => setSelectedUserId(e.target.value || '')}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <option value="">Selecione um motorista</option>
                    {motoristaUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.username || u.email || u.id}
                      </option>
                    ))}
                  </select>
                ) : (
                  <Input disabled placeholder="Nenhum motorista disponível" />
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="route-date" className="text-base font-medium">
                  Data da Rota:
                </Label>
                <Input
                  id="route-date"
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full"
                />
              </div>
            </div>
            {selectedUserId && selectedUserId !== '' && (
              <p className="text-sm text-muted-foreground mt-4">
                {(() => {
                  try {
                    const dateFormatted = format(new Date(selectedDate), "dd/MM/yyyy", { locale: ptBR });
                    return routes.length > 0 
                      ? `Rota encontrada para ${dateFormatted} com ${routes[0]?.stores_selected?.length || 0} loja(s).`
                      : `Nenhuma rota cadastrada para ${dateFormatted}. Clique em "Nova Rota" para criar.`;
                  } catch {
                    return 'Selecione uma data válida.';
                  }
                })()}
              </p>
            )}
          </CardContent>
        </Card>

        {/* Lista de Rotas da Data Selecionada */}
        {selectedUserId && selectedUserId !== '' && (
          loading ? (
            <Card className="p-12 text-center">
              <div className="text-muted-foreground">Carregando rotas...</div>
            </Card>
          ) : routes.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Route className="w-5 h-5" />
                  Rota de {format(parseISO(selectedDate), "dd/MM/yyyy", { locale: ptBR })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {routes.map((route) => {
                    const storesArray = Array.isArray(route.stores_selected) 
                      ? route.stores_selected 
                      : (route.stores_selected || []);
                    
                    return (
                      <motion.div
                        key={route.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 border border-border rounded-lg bg-card"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium text-foreground">
                              {storesArray.length} loja(s) selecionada(s)
                            </p>
                            <p className="text-xs text-muted-foreground">
                              Criado em {route.created_at ? format(new Date(route.created_at), "dd/MM/yyyy HH:mm", { locale: ptBR }) : 'N/A'}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleEdit(route)}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteRouteId(route.id)}
                              className="text-destructive hover:text-destructive"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {storesArray.map((storeId) => (
                            <Badge key={storeId} variant="secondary">
                              <Store className="w-3 h-3 mr-1" />
                              {getStoreName(storeId)}
                            </Badge>
                          ))}
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="p-12 text-center">
              <div className="text-muted-foreground">
                Nenhuma rota cadastrada para esta data. Clique em "Nova Rota" para criar.
              </div>
            </Card>
          )
        )}

        {/* Dialog para criar/editar rota com seleção de lojas */}
        <Dialog open={isDialogOpen} onOpenChange={handleDialogOpenChange}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <DialogHeader>
              <DialogTitle>
                {editingRoute ? 'Editar Rota' : 'Nova Rota'} - {format(parseISO(selectedDate), "dd/MM/yyyy", { locale: ptBR })}
              </DialogTitle>
              <DialogDescription>
                Selecione as lojas para esta rota.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSave} className="flex flex-col h-full space-y-4 mt-4">
              <div className="space-y-2">
                <Label htmlFor="store-search">Pesquisar Loja:</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="store-search"
                    placeholder="Digite para pesquisar lojas..."
                    value={searchStore}
                    onChange={(e) => setSearchStore(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div className="flex-1 overflow-y-auto border border-border rounded-lg p-4 space-y-2 max-h-[400px]">
                {filteredStores.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Nenhuma loja encontrada.
                  </div>
                ) : (
                  filteredStores.map((store) => {
                    const isSelected = selectedStores.includes(store.id);
                    return (
                      <div
                        key={store.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-primary/10 border-primary/20'
                            : 'bg-card border-border hover:bg-accent/50'
                        }`}
                        onClick={() => handleToggleStore(store.id)}
                      >
                        <Checkbox
                          checked={isSelected}
                          onCheckedChange={() => handleToggleStore(store.id)}
                          className="w-5 h-5"
                        />
                        <div className="flex-1">
                          <p className="font-medium text-foreground">
                            {store.code || ''} - {store.name || 'Sem nome'}
                          </p>
                          {(store.city || store.state) && (
                            <p className="text-xs text-muted-foreground">
                              {[store.city, store.state].filter(Boolean).join(' - ')}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
              
              <div className="flex items-center justify-between pt-2 border-t">
                <p className="text-sm text-muted-foreground">
                  {selectedStores.length} loja(s) selecionada(s)
                </p>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={() => handleDialogOpenChange(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" disabled={saving || selectedStores.length === 0}>
                    {saving ? 'Salvando...' : (editingRoute ? 'Salvar Alterações' : 'Criar Rota')}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>

        {/* Dialog de confirmação de exclusão */}
        <AlertDialog open={!!deleteRouteId} onOpenChange={(open) => {
          if (!open) {
            setDeleteRouteId(null);
          }
        }}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja excluir esta rota? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDelete}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  Excluir
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default MotoristaChecklistManagement;
