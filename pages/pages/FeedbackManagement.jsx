import React, { useState, useMemo, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { motion } from 'framer-motion';
import { Diamond, Frown, Meh, Smile, Laugh, Search, Download, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useOptimizedRefresh } from '@/lib/useOptimizedRefresh';
import { useToast } from '@/components/ui/use-toast';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';

const satisfactionIcons = {
  1: { icon: Frown, color: 'text-red-400', label: 'Ruim' },
  2: { icon: Meh, color: 'text-orange-400', label: 'Razoável' },
  3: { icon: Smile, color: 'text-yellow-400', label: 'Bom' },
  4: { icon: Laugh, color: 'text-green-400', label: 'Excelente' },
};

const FeedbackCard = ({ feedback, store, collaborator, onDelete, canDelete }) => {
  const managerSatValue = feedback.managerSatisfaction ?? feedback.manager_satisfaction ?? null;
  const ManagerSatisfactionIcon = managerSatValue ? (satisfactionIcons[managerSatValue]?.icon || Meh) : Meh;
  const managerSatisfactionColor = managerSatValue ? (satisfactionIcons[managerSatValue]?.color || 'text-muted-foreground') : 'text-muted-foreground';
  
  const collaboratorSatValue = feedback.collaboratorSatisfaction ?? feedback.collaborator_satisfaction ?? null;
  const CollaboratorSatisfactionIcon = collaboratorSatValue ? (satisfactionIcons[collaboratorSatValue]?.icon || Meh) : Meh;
  const collaboratorSatisfactionColor = collaboratorSatValue ? (satisfactionIcons[collaboratorSatValue]?.color || 'text-muted-foreground') : 'text-muted-foreground';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card p-5 rounded-xl border border-border shadow-sm relative"
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-foreground">{collaborator?.name || 'Colaborador não encontrado'}</h3>
            {/* Satisfação do Colaborador ao lado do nome */}
            {collaboratorSatValue !== null && collaboratorSatValue !== undefined && (
              <div className="flex items-center gap-1.5 px-2 py-0.5 bg-purple-500/10 border border-purple-500/20 rounded-md">
                <CollaboratorSatisfactionIcon className={cn("w-4 h-4", collaboratorSatisfactionColor)} />
                <span className="text-xs font-medium text-foreground">
                  {satisfactionIcons[collaboratorSatValue]?.label || 'N/A'}
                </span>
              </div>
            )}
          </div>
          <p className="text-sm text-muted-foreground">{store?.name || 'Loja não encontrada'}</p>
          <p className="text-xs text-muted-foreground">{new Date(feedback.date).toLocaleString()}</p>
        </div>
        <div className="flex items-center gap-2">
          {feedback.isPromotionCandidate && <Diamond className="w-5 h-5 text-yellow-400" />}
          {canDelete && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10 ml-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Excluir Feedback</AlertDialogTitle>
                  <AlertDialogDescription>
                    Tem certeza que deseja excluir este feedback? Esta ação não pode ser desfeita.
                    <br />
                    <br />
                    <strong>Colaborador:</strong> {collaborator?.name || 'N/A'}
                    <br />
                    <strong>Loja:</strong> {store?.name || 'N/A'}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(feedback.id);
                    }}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Excluir
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </div>
      </div>
      
      {/* Satisfação do Gerente embaixo */}
      {managerSatValue !== null && managerSatValue !== undefined && (
        <div className="mt-3 mb-4 flex items-center gap-2 p-2 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <span className="text-xs font-medium text-muted-foreground">Satisfação do gerente:</span>
          <ManagerSatisfactionIcon className={cn("w-5 h-5", managerSatisfactionColor)} />
          <span className="text-sm font-semibold text-foreground">
            {satisfactionIcons[managerSatValue]?.label || 'N/A'}
          </span>
        </div>
      )}
      
      <div className="mt-4 space-y-3 text-sm">
        <div>
          <p className="font-semibold text-foreground">Pontos Positivos:</p>
          <p className="text-muted-foreground">{feedback.feedbackText}</p>
        </div>
        {feedback.developmentPoint && (
          <div>
            <p className="font-semibold text-foreground">Ponto a Desenvolver:</p>
            <p className="text-muted-foreground">{feedback.developmentPoint}</p>
          </div>
        )}
      </div>
    </motion.div>
  );
};

const FeedbackManagement = () => {
  const { feedbacks, collaborators, stores, fetchData, deleteFeedback, deleteFeedbacksBySatisfaction } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showHighlights, setShowHighlights] = useState(false);
  const [managerSatisfactionFilter, setManagerSatisfactionFilter] = useState([]);
  const [collaboratorSatisfactionFilter, setCollaboratorSatisfactionFilter] = useState([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [periodFilter, setPeriodFilter] = useState({
    startDate: '',
    endDate: ''
  });

  // Refresh automático otimizado para mobile
  useOptimizedRefresh(fetchData);

  const groupedFeedbacks = useMemo(() => {
    const filtered = feedbacks
      .map(fb => ({
        ...fb,
        collaborator: collaborators.find(c => c.id === fb.collaboratorId),
        store: stores.find(s => s.id === fb.storeId),
      }))
      .filter(fb => {
        if (showHighlights && !fb.isPromotionCandidate) return false;
        
        // Filtro por data
        if (periodFilter.startDate) {
          const start = new Date(periodFilter.startDate);
          start.setHours(0, 0, 0, 0);
          const fbDate = new Date(fb.date || fb.created_at);
          fbDate.setHours(0, 0, 0, 0);
          if (fbDate < start) return false;
        }
        
        if (periodFilter.endDate) {
          const end = new Date(periodFilter.endDate);
          end.setHours(23, 59, 59, 999);
          const fbDate = new Date(fb.date || fb.created_at);
          fbDate.setHours(23, 59, 59, 999);
          if (fbDate > end) return false;
        }
        
        // Filtro por satisfação do gerente
        if (managerSatisfactionFilter.length > 0) {
          const managerSat = fb.managerSatisfaction ?? fb.manager_satisfaction ?? null;
          // Se o filtro está ativo mas o feedback não tem essa satisfação, filtrar
          if (managerSat === null || managerSat === undefined) {
            return false; // Feedback sem satisfação do gerente não passa no filtro
          }
          // Verificar se a satisfação do gerente está nos filtros selecionados
          if (!managerSatisfactionFilter.includes(String(managerSat))) {
            return false;
          }
        }
        
        // Filtro por satisfação do colaborador
        if (collaboratorSatisfactionFilter.length > 0) {
          const collaboratorSat = fb.collaboratorSatisfaction ?? fb.collaborator_satisfaction ?? null;
          // Se o filtro está ativo mas o feedback não tem essa satisfação, filtrar
          if (collaboratorSat === null || collaboratorSat === undefined) {
            return false; // Feedback sem satisfação do colaborador não passa no filtro
          }
          // Verificar se a satisfação do colaborador está nos filtros selecionados
          if (!collaboratorSatisfactionFilter.includes(String(collaboratorSat))) {
            return false;
          }
        }
        
        const search = searchTerm.toLowerCase();
        if (!search) return true;

        return (
          fb.collaborator?.name.toLowerCase().includes(search) ||
          fb.store?.name.toLowerCase().includes(search) ||
          fb.feedbackText.toLowerCase().includes(search) ||
          (fb.developmentPoint && fb.developmentPoint.toLowerCase().includes(search))
        );
      });

    return filtered.reduce((acc, fb) => {
        if (!fb.store) return acc;
        if (!acc[fb.storeId]) {
            acc[fb.storeId] = { storeInfo: fb.store, feedbacks: [] };
        }
        acc[fb.storeId].feedbacks.push(fb);
        return acc;
    }, {});
  }, [feedbacks, collaborators, stores, searchTerm, showHighlights, managerSatisfactionFilter, collaboratorSatisfactionFilter, periodFilter]);

  const handleExport = () => {
    toast({
      title: 'Exportação em andamento!',
      description: '🚧 Esta funcionalidade ainda não foi implementada. Mas não se preocupe, você pode solicitá-la no próximo prompt! 🚀',
    });
  };

  const handleDeleteFeedback = async (feedbackId) => {
    try {
      await deleteFeedback(feedbackId);
    } catch (error) {
      console.error('Erro ao excluir feedback:', error);
    }
  };

  const handleDeleteAllBySatisfaction = async () => {
    if (managerSatisfactionFilter.length === 0 && collaboratorSatisfactionFilter.length === 0) {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: 'Selecione pelo menos um filtro de satisfação para excluir.',
      });
      return;
    }

    // Contar quantos feedbacks serão excluídos
    const filteredCount = Object.values(groupedFeedbacks).reduce((total, { feedbacks: storeFeedbacks }) => {
      return total + storeFeedbacks.length;
    }, 0);

    if (filteredCount === 0) {
      toast({
        title: 'Aviso',
        description: 'Nenhum feedback encontrado para excluir com os filtros selecionados.',
      });
      return;
    }

    setIsDeleting(true);
    try {
      // Combinar ambos os filtros para exclusão
      const combinedFilters = [...managerSatisfactionFilter, ...collaboratorSatisfactionFilter];
      await deleteFeedbacksBySatisfaction(combinedFilters);
      // Limpar filtros após exclusão bem-sucedida
      setManagerSatisfactionFilter([]);
      setCollaboratorSatisfactionFilter([]);
    } catch (error) {
      console.error('Erro ao excluir feedbacks:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const canDelete = user?.role === 'admin' || user?.role === 'supervisor';
  
  // Contar feedbacks filtrados
  const filteredCount = Object.values(groupedFeedbacks).reduce((total, { feedbacks: storeFeedbacks }) => {
    return total + storeFeedbacks.length;
  }, 0);
  
  const storeIdsWithFeedbacks = Object.keys(groupedFeedbacks);

  return (
    <>
      <Helmet>
        <title>Gestão de Feedbacks - MYFEET</title>
        <meta name="description" content="Visualize e gerencie os feedbacks dos colaboradores." />
      </Helmet>
      <div className="space-y-6">
        <div className="flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-foreground">Gestão de Feedbacks</h1>
                    <p className="text-muted-foreground mt-1">Visualize e filtre os feedbacks enviados pelas lojas.</p>
                </div>
                <Button onClick={handleExport} variant="outline" className="gap-2">
                  <Download className="w-4 h-4" /> Extrair PDF
                </Button>
            </div>
            <div className="bg-card border border-border p-4 rounded-lg space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        placeholder="Buscar por loja, colaborador ou texto..."
                        className="pl-9 w-full bg-background"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                      />
                    </div>
                     <div className="flex items-center space-x-2 justify-end">
                        <Switch id="highlights-only" checked={showHighlights} onCheckedChange={setShowHighlights} />
                        <Label htmlFor="highlights-only" className="flex items-center gap-2">
                            <Diamond className="w-4 h-4 text-yellow-400" /> Apenas Destaques
                        </Label>
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="startDate">Data Inicial</Label>
                    <Input
                      id="startDate"
                      type="date"
                      value={periodFilter.startDate}
                      onChange={(e) => setPeriodFilter({ ...periodFilter, startDate: e.target.value })}
                      className="bg-secondary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="endDate">Data Final</Label>
                    <Input
                      id="endDate"
                      type="date"
                      value={periodFilter.endDate}
                      onChange={(e) => setPeriodFilter({ ...periodFilter, endDate: e.target.value })}
                      className="bg-secondary"
                    />
                  </div>
                </div>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold">Filtros de Satisfação</Label>
                        {canDelete && (managerSatisfactionFilter.length > 0 || collaboratorSatisfactionFilter.length > 0) && (
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="sm"
                                disabled={isDeleting || filteredCount === 0}
                                className="gap-2"
                              >
                                <Trash2 className="w-4 h-4" />
                                {isDeleting ? 'Excluindo...' : `Excluir Todos (${filteredCount})`}
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Confirmar Exclusão em Lote</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Você está prestes a excluir <strong>{filteredCount} feedback(s)</strong> com os filtros selecionados.
                                  <br />
                                  <br />
                                  <span className="text-destructive font-bold">
                                    ⚠️ Esta ação não pode ser desfeita!
                                  </span>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDeleteAllBySatisfaction}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Excluir {filteredCount} Feedback(s)
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Filtro Satisfação do Gerente */}
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                                Satisfação do Gerente com o Colaborador
                            </Label>
                            <ToggleGroup 
                                type="multiple" 
                                variant="outline" 
                                value={managerSatisfactionFilter} 
                                onValueChange={setManagerSatisfactionFilter}
                                className="flex-wrap"
                            >
                                {Object.entries(satisfactionIcons).map(([level, {icon: Icon, label, color}]) => (
                                    <ToggleGroupItem 
                                        key={level} 
                                        value={level} 
                                        aria-label={`Filtrar por ${label}`} 
                                        className="flex gap-1.5 text-xs"
                                    >
                                        <Icon className={cn("w-4 h-4", color)} /> {label}
                                    </ToggleGroupItem>
                                ))}
                            </ToggleGroup>
                        </div>
                        
                        {/* Filtro Satisfação do Colaborador */}
                        <div className="space-y-2">
                            <Label className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                                <span className="w-2 h-2 rounded-full bg-purple-500"></span>
                                Satisfação do Colaborador
                            </Label>
                            <ToggleGroup 
                                type="multiple" 
                                variant="outline" 
                                value={collaboratorSatisfactionFilter} 
                                onValueChange={setCollaboratorSatisfactionFilter}
                                className="flex-wrap"
                            >
                                {Object.entries(satisfactionIcons).map(([level, {icon: Icon, label, color}]) => (
                                    <ToggleGroupItem 
                                        key={level} 
                                        value={level} 
                                        aria-label={`Filtrar por ${label}`} 
                                        className="flex gap-1.5 text-xs"
                                    >
                                        <Icon className={cn("w-4 h-4", color)} /> {label}
                                    </ToggleGroupItem>
                                ))}
                            </ToggleGroup>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {storeIdsWithFeedbacks.length > 0 ? (
          <Accordion type="multiple" className="w-full space-y-4">
            {storeIdsWithFeedbacks.map(storeId => {
              const { storeInfo, feedbacks: storeFeedbacks } = groupedFeedbacks[storeId];
              return (
                <AccordionItem key={storeId} value={storeId} className="bg-card border border-border rounded-lg shadow-sm">
                  <AccordionTrigger className="px-6 hover:no-underline">
                    <div className="flex items-center gap-3">
                        <h2 className="text-lg font-semibold text-foreground">{storeInfo.name}</h2>
                        <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-0.5 rounded-full">{storeFeedbacks.length}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {storeFeedbacks.sort((a,b) => new Date(b.date) - new Date(a.date)).map(feedback => (
                        <FeedbackCard
                          key={feedback.id}
                          feedback={feedback}
                          store={feedback.store}
                          collaborator={feedback.collaborator}
                          onDelete={handleDeleteFeedback}
                          canDelete={canDelete}
                        />
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            })}
          </Accordion>
        ) : (
          <div className="text-center py-16 text-muted-foreground bg-card rounded-lg border border-dashed">
            <p className="text-lg">Nenhum feedback encontrado.</p>
            <p className="text-sm">Tente ajustar seus filtros ou aguarde novos feedbacks.</p>
          </div>
        )}
      </div>
    </>
  );
};

export default FeedbackManagement;