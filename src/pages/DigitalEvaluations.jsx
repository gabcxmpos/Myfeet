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
import { Smartphone, Search, Calendar, Store, TrendingUp, Award, AlertCircle, Filter } from 'lucide-react';
import { filterStoresByUserType } from '@/lib/storeTypeHelper';
import { useOptimizedRefresh } from '@/lib/useOptimizedRefresh';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const DigitalEvaluations = () => {
  const { stores, evaluations, forms, fetchData } = useData();
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStore, setSelectedStore] = useState('all');
  const [selectedForm, setSelectedForm] = useState('all');
  const [periodFilter, setPeriodFilter] = useState({
    startDate: '',
    endDate: ''
  });
  const [selectedEvaluation, setSelectedEvaluation] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);

  useOptimizedRefresh(fetchData);

  // Filtrar apenas avaliações do pilar Digital
  const digitalEvaluations = useMemo(() => {
    return evaluations.filter(e => 
      e.pillar === 'Digital' && 
      e.status === 'approved'
    );
  }, [evaluations]);

  // Filtrar lojas por tipo de usuário
  const availableStores = useMemo(() => {
    return filterStoresByUserType(stores, user?.role, user?.storeId);
  }, [stores, user?.role, user?.storeId]);

  // Filtrar formulários do pilar Digital
  const digitalForms = useMemo(() => {
    return forms.filter(f => f.pillar === 'Digital');
  }, [forms]);

  // Aplicar filtros
  const filteredEvaluations = useMemo(() => {
    let filtered = [...digitalEvaluations];

    // Filtro de busca (nome da loja)
    if (searchTerm) {
      filtered = filtered.filter(e => {
        const store = stores.find(s => s.id === e.storeId);
        return store?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
               store?.code?.toLowerCase().includes(searchTerm.toLowerCase());
      });
    }

    // Filtro de loja
    if (selectedStore && selectedStore !== 'all') {
      filtered = filtered.filter(e => e.storeId === selectedStore);
    }

    // Filtro de formulário
    if (selectedForm && selectedForm !== 'all') {
      filtered = filtered.filter(e => e.formId === selectedForm);
    }

    // Filtro de período
    if (periodFilter.startDate) {
      const start = new Date(periodFilter.startDate);
      start.setHours(0, 0, 0, 0);
      filtered = filtered.filter(e => {
        const evalDate = new Date(e.date || e.created_at);
        evalDate.setHours(0, 0, 0, 0);
        return evalDate >= start;
      });
    }

    if (periodFilter.endDate) {
      const end = new Date(periodFilter.endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter(e => {
        const evalDate = new Date(e.date || e.created_at);
        evalDate.setHours(23, 59, 59, 999);
        return evalDate <= end;
      });
    }

    // Ordenar por data (mais recente primeiro)
    return filtered.sort((a, b) => {
      const dateA = new Date(a.date || a.created_at);
      const dateB = new Date(b.date || b.created_at);
      return dateB - dateA;
    });
  }, [digitalEvaluations, stores, searchTerm, selectedStore, selectedForm, periodFilter]);

  // Estatísticas gerais
  const statistics = useMemo(() => {
    const total = filteredEvaluations.length;
    const avgScore = total > 0
      ? filteredEvaluations.reduce((sum, e) => sum + e.score, 0) / total
      : 0;
    
    const storesCount = new Set(filteredEvaluations.map(e => e.storeId)).size;
    
    const scoreRanges = {
      excellent: filteredEvaluations.filter(e => e.score >= 90).length,
      good: filteredEvaluations.filter(e => e.score >= 70 && e.score < 90).length,
      regular: filteredEvaluations.filter(e => e.score >= 50 && e.score < 70).length,
      poor: filteredEvaluations.filter(e => e.score < 50).length,
    };

    return {
      total,
      avgScore: Math.round(avgScore * 10) / 10,
      storesCount,
      scoreRanges
    };
  }, [filteredEvaluations]);


  // Abrir modal de detalhes
  const handleViewDetails = (evaluation) => {
    setSelectedEvaluation(evaluation);
    setIsDetailModalOpen(true);
  };

  return (
    <>
      <Helmet>
        <title>Avaliações Digital - MYFEET</title>
      </Helmet>
      <div className="container mx-auto p-6 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-6"
        >
          <div className="flex items-center gap-3">
            <Smartphone className="w-8 h-8 text-purple-400" />
            <div>
              <h1 className="text-3xl font-bold">Avaliações do Pilar Digital</h1>
              <p className="text-muted-foreground">Histórico completo de todas as lojas</p>
            </div>
          </div>
        </motion.div>

        {/* Estatísticas */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total de Avaliações</p>
                  <p className="text-2xl font-bold">{statistics.total}</p>
                </div>
                <Award className="w-8 h-8 text-primary" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Pontuação Média</p>
                  <p className="text-2xl font-bold">{statistics.avgScore.toFixed(1)}</p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Lojas Avaliadas</p>
                  <p className="text-2xl font-bold">{statistics.storesCount}</p>
                </div>
                <Store className="w-8 h-8 text-blue-400" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Excelente (≥90)</p>
                  <p className="text-2xl font-bold text-green-400">{statistics.scoreRanges.excellent}</p>
                </div>
                <AlertCircle className="w-8 h-8 text-green-400" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filtros */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar Loja</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    id="search"
                    placeholder="Nome ou código da loja..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="store">Loja</Label>
                <Select value={selectedStore} onValueChange={setSelectedStore}>
                  <SelectTrigger id="store">
                    <SelectValue placeholder="Todas as lojas" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as lojas</SelectItem>
                    {availableStores.map(store => (
                      <SelectItem key={store.id} value={store.id}>
                        {store.name} {store.code ? `(${store.code})` : ''}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="form">Formulário</Label>
                <Select value={selectedForm} onValueChange={setSelectedForm}>
                  <SelectTrigger id="form">
                    <SelectValue placeholder="Todos os formulários" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os formulários</SelectItem>
                    {digitalForms.map(form => (
                      <SelectItem key={form.id} value={form.id}>
                        {form.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="startDate">Data Inicial</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={periodFilter.startDate}
                  onChange={(e) => setPeriodFilter({ ...periodFilter, startDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data Final</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={periodFilter.endDate}
                  onChange={(e) => setPeriodFilter({ ...periodFilter, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedStore('all');
                  setSelectedForm('all');
                  setPeriodFilter({ startDate: '', endDate: '' });
                }}
              >
                Limpar Filtros
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Avaliações */}
        <Card>
          <CardHeader>
            <CardTitle>
              Avaliações ({filteredEvaluations.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {filteredEvaluations.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Smartphone className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Nenhuma avaliação encontrada</p>
                <p className="text-sm">Tente ajustar os filtros para visualizar mais resultados.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {filteredEvaluations.map((evaluation) => {
                  const store = stores.find(s => s.id === evaluation.storeId);
                  const form = forms.find(f => f.id === evaluation.formId);
                  
                  return (
                    <motion.div
                      key={evaluation.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                      onClick={() => handleViewDetails(evaluation)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Store className="w-5 h-5 text-muted-foreground" />
                            <h3 className="font-semibold text-lg">{store?.name || 'Loja não encontrada'}</h3>
                            {store?.code && (
                              <span className="text-sm text-muted-foreground">({store.code})</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {format(new Date(evaluation.date || evaluation.created_at), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                            </div>
                            {form && (
                              <div className="flex items-center gap-1">
                                <Smartphone className="w-4 h-4" />
                                {form.title}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className={cn(
                            "text-2xl font-bold",
                            evaluation.score >= 90 ? 'text-green-400' :
                            evaluation.score >= 70 ? 'text-blue-400' :
                            evaluation.score >= 50 ? 'text-yellow-400' :
                            'text-red-400'
                          )}>
                            {evaluation.score?.toFixed(1) || '0'}
                          </div>
                          <div className="text-xs text-muted-foreground">pontos</div>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Modal de Detalhes */}
      <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Detalhes da Avaliação</DialogTitle>
            <DialogDescription>
              Visualize todos os detalhes e respostas desta avaliação do pilar Digital.
            </DialogDescription>
          </DialogHeader>
          {selectedEvaluation && (() => {
            const store = stores.find(s => s.id === selectedEvaluation.storeId);
            const form = forms.find(f => f.id === selectedEvaluation.formId);
            
            return (
              <div className="space-y-4 mt-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Loja</p>
                    <p className="font-semibold">{store?.name || 'Não encontrada'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Pontuação</p>
                    <p className="text-2xl font-bold text-primary">{selectedEvaluation.score?.toFixed(1) || '0'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Data</p>
                    <p className="font-semibold">
                      {format(new Date(selectedEvaluation.date || selectedEvaluation.created_at), "dd 'de' MMMM 'de' yyyy 'às' HH:mm", { locale: ptBR })}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Formulário</p>
                    <p className="font-semibold">{form?.title || 'Não encontrado'}</p>
                  </div>
                </div>

                {form && form.questions && (
                  <div className="mt-6 space-y-4">
                    <h3 className="font-semibold text-lg">Respostas</h3>
                    {form.questions.map((question) => {
                      const answer = selectedEvaluation.answers?.[question.id];
                      let displayAnswer = 'Não respondida';
                      
                      if (answer !== undefined && answer !== null) {
                        if (question.type === 'satisfaction') {
                          displayAnswer = `${answer}/10`;
                        } else if (question.type === 'multiple-choice') {
                          displayAnswer = answer;
                        } else if (question.type === 'checkbox') {
                          displayAnswer = Array.isArray(answer) ? answer.join(', ') : answer;
                        } else if (question.type === 'text') {
                          displayAnswer = answer || 'Sem texto';
                        }
                      }

                      return (
                        <div key={question.id} className="border border-border rounded-lg p-4">
                          <h4 className="font-semibold mb-1">{question.text}</h4>
                          {question.subtitle && (
                            <p className="text-sm text-muted-foreground mb-2">{question.subtitle}</p>
                          )}
                          <p className="text-sm bg-secondary p-2 rounded">{displayAnswer}</p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DigitalEvaluations;

