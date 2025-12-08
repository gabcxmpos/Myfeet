import React, { useState, useMemo } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Search, Edit, CheckCircle, Clock, Store, AlertCircle, Filter, BarChart3, MapPin, Flag, UserCheck, TrendingUp, Trash2 } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const MOTIVOS_ACIONAMENTO = [
  'ATRASO NO AVANÇO DO PEDIDO',
  'CONTATO LOJAS',
  'DEVOLUÇÃO',
  'DÚVIDAS AÇÃO',
  'GOMUS',
  'LANÇAMENTO NÃO RESPEITADO',
  'LANÇAMETO',
  'LINK HAASS',
  'LOCALIZAÇÃO DE PEDIDO',
  'PEDIDOS OMNI',
  'SAC - RELACIONAMENTO',
  'SUPORTE AGENDA E CATÁLOGO',
  'SUPORTE CADASTRO',
  'SUPORTE CONSULTORA',
  'SUPORTE CRM',
  'SUPORTE HAASS / HIS',
  'SUPORTE SOL',
  'SUPORTE UPDI',
  'SUPORTE VM / MARKETING',
  'TROCAS, DIRECIONAMENTO ETC'
];

const Acionamentos = () => {
  const { acionamentos, stores, addAcionamento, updateAcionamento, deleteAcionamento, fetchData } = useData();
  const { toast } = useToast();
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all'); // 'all', 'em_tratativa', 'finalizada'
  const [modalState, setModalState] = useState({ type: null, data: null });

  // Filtrar acionamentos
  const filteredAcionamentos = useMemo(() => {
    let filtered = acionamentos || [];

    // Filtro por busca (loja ou motivo)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(ac => {
        const store = stores.find(s => s.id === ac.store_id);
        const storeName = store?.name?.toLowerCase() || '';
        const storeCode = store?.code?.toLowerCase() || '';
        const motivo = ac.motivo?.toLowerCase() || '';
        return storeName.includes(term) || storeCode.includes(term) || motivo.includes(term);
      });
    }

    // Filtro por status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(ac => ac.status === statusFilter);
    }

    return filtered.sort((a, b) => {
      // Ordenar por data de criação (mais recente primeiro)
      const dateA = new Date(a.created_at || a.createdAt || 0);
      const dateB = new Date(b.created_at || b.createdAt || 0);
      return dateB - dateA;
    });
  }, [acionamentos, stores, searchTerm, statusFilter]);

  const handleSave = (formData) => {
    if (formData.id) {
      updateAcionamento(formData.id, formData);
      toast({ title: "Acionamento atualizado!", description: "O acionamento foi atualizado com sucesso." });
    } else {
      addAcionamento(formData);
      toast({ title: "Acionamento criado!", description: "O acionamento foi criado com sucesso." });
    }
    setModalState({ type: null, data: null });
  };

  const handleDelete = async (id) => {
    if (window.confirm('Tem certeza que deseja excluir este acionamento? Esta ação não pode ser desfeita.')) {
      try {
        await deleteAcionamento(id);
      } catch (error) {
        console.error('Erro ao excluir acionamento:', error);
      }
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'finalizada') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-500 border border-green-500/30">
          <CheckCircle className="w-3 h-3" />
          Finalizada
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-500 border border-yellow-500/30">
        <Clock className="w-3 h-3" />
        Em Tratativa
      </span>
    );
  };

  const getStoreName = (storeId) => {
    const store = stores.find(s => s.id === storeId);
    return store ? `${store.code} - ${store.name}` : 'Loja não encontrada';
  };

  // Estatísticas para o Dashboard
  const dashboardStats = useMemo(() => {
    const allAcionamentos = acionamentos || [];
    
    // Totais
    const total = allAcionamentos.length;
    const emTratativa = allAcionamentos.filter(a => a.status === 'em_tratativa').length;
    const finalizadas = allAcionamentos.filter(a => a.status === 'finalizada').length;

    // Por UF
    const porUF = {};
    allAcionamentos.forEach(ac => {
      const store = stores.find(s => s.id === ac.store_id);
      const uf = store?.estado || 'Não informado';
      porUF[uf] = (porUF[uf] || 0) + 1;
    });

    // Por Bandeira
    const porBandeira = {};
    allAcionamentos.forEach(ac => {
      const store = stores.find(s => s.id === ac.store_id);
      const bandeira = store?.bandeira || 'Não informado';
      porBandeira[bandeira] = (porBandeira[bandeira] || 0) + 1;
    });

    // Por Supervisão
    const porSupervisao = {};
    allAcionamentos.forEach(ac => {
      const store = stores.find(s => s.id === ac.store_id);
      const supervisor = store?.supervisor || 'Não informado';
      porSupervisao[supervisor] = (porSupervisao[supervisor] || 0) + 1;
    });

    // Lojas mais acionadas
    const porLoja = {};
    allAcionamentos.forEach(ac => {
      const store = stores.find(s => s.id === ac.store_id);
      if (store) {
        const key = `${store.code} - ${store.name}`;
        porLoja[key] = {
          count: (porLoja[key]?.count || 0) + 1,
          storeId: store.id,
          uf: store.estado,
          bandeira: store.bandeira,
          supervisor: store.supervisor
        };
      }
    });

    const lojasMaisAcionadas = Object.entries(porLoja)
      .map(([nome, data]) => ({ nome, ...data }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return {
      total,
      emTratativa,
      finalizadas,
      porUF: Object.entries(porUF)
        .map(([uf, count]) => ({ uf, count }))
        .sort((a, b) => b.count - a.count),
      porBandeira: Object.entries(porBandeira)
        .map(([bandeira, count]) => ({ bandeira, count }))
        .sort((a, b) => b.count - a.count),
      porSupervisao: Object.entries(porSupervisao)
        .map(([supervisor, count]) => ({ supervisor, count }))
        .sort((a, b) => b.count - a.count),
      lojasMaisAcionadas
    };
  }, [acionamentos, stores]);

  return (
    <>
      <Helmet><title>Acionamentos - MYFEET</title></Helmet>

      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Acionamentos</h1>
            <p className="text-muted-foreground mt-1">Gerencie acionamentos de lojas.</p>
          </div>
          <Button 
            onClick={() => setModalState({ type: 'edit', data: null })} 
            className="gap-2 bg-gradient-to-r from-primary to-blue-500 text-primary-foreground hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Novo Acionamento
          </Button>
        </div>

        <Tabs defaultValue="lista" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="lista">Lista</TabsTrigger>
            <TabsTrigger value="dashboard">Dashboard</TabsTrigger>
          </TabsList>

          <TabsContent value="lista" className="space-y-6 mt-6">
            {/* Filtros */}
            <div className="flex flex-wrap items-center gap-4 bg-card p-4 rounded-xl border border-border">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  placeholder="Buscar por loja ou motivo..." 
                  className="pl-9 bg-secondary" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-[180px] bg-secondary">
                    <SelectValue placeholder="Filtrar por status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="em_tratativa">Em Tratativa</SelectItem>
                    <SelectItem value="finalizada">Finalizada</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Lista de Acionamentos */}
            <div className="grid grid-cols-1 gap-4">
              {filteredAcionamentos.length > 0 ? (
                filteredAcionamentos.map((acionamento, index) => (
                  <motion.div
                    key={acionamento.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-card rounded-xl shadow-lg border border-border p-6 hover:shadow-xl transition-shadow"
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <Store className="w-5 h-5 text-primary" />
                              <h3 className="text-lg font-semibold text-foreground">
                                {getStoreName(acionamento.store_id)}
                              </h3>
                            </div>
                            <div className="flex items-center gap-2 mb-3">
                              {getStatusBadge(acionamento.status)}
                              <span className="text-xs text-muted-foreground">
                                {new Date(acionamento.created_at || acionamento.createdAt).toLocaleDateString('pt-BR', {
                                  day: '2-digit',
                                  month: '2-digit',
                                  year: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="bg-secondary/50 p-4 rounded-lg border border-border/50">
                          <Label className="text-xs text-muted-foreground mb-1 block">Motivo do Acionamento</Label>
                          <p className="text-sm text-foreground whitespace-pre-wrap">{acionamento.motivo || 'Sem motivo informado'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setModalState({ type: 'edit', data: acionamento })}
                          className="gap-2"
                        >
                          <Edit className="w-4 h-4" />
                          Editar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(acionamento.id)}
                          className="gap-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-4 h-4" />
                          Excluir
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                ))
              ) : (
                <div className="bg-card rounded-xl border border-border p-12 text-center">
                  <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    {searchTerm || statusFilter !== 'all' 
                      ? 'Nenhum acionamento encontrado com os filtros aplicados.' 
                      : 'Nenhum acionamento cadastrado ainda.'}
                  </p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6 mt-6">
            <AcionamentosDashboard stats={dashboardStats} />
          </TabsContent>
        </Tabs>
      </div>

      {/* Modal de Edição/Criação */}
      <Dialog open={modalState.type === 'edit'} onOpenChange={(isOpen) => !isOpen && setModalState({ type: null, data: null })}>
        <AcionamentoFormModal
          acionamento={modalState.data}
          stores={stores}
          onSave={handleSave}
          onOpenChange={(isOpen) => !isOpen && setModalState({ type: null, data: null })}
        />
      </Dialog>
    </>
  );
};

const AcionamentoFormModal = ({ acionamento, stores, onSave, onOpenChange }) => {
  // Verificar se o motivo atual está na lista de motivos pré-definidos
  const motivoAtual = acionamento?.motivo || '';
  const motivoTipoInicial = MOTIVOS_ACIONAMENTO.includes(motivoAtual) ? motivoAtual : '';
  const motivoLivreInicial = MOTIVOS_ACIONAMENTO.includes(motivoAtual) ? '' : motivoAtual;

  const [formData, setFormData] = useState({
    store_id: acionamento?.store_id || '',
    motivo_tipo: motivoTipoInicial,
    motivo: motivoLivreInicial,
    status: acionamento?.status || 'em_tratativa',
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (name, value) => {
    if (name === 'motivo_tipo') {
      // Quando seleciona um motivo tipo, limpa o campo motivo livre
      setFormData(prev => ({ ...prev, [name]: value, motivo: '' }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.store_id) {
      alert('Por favor, selecione uma loja.');
      return;
    }
    if (!formData.motivo_tipo && !formData.motivo) {
      alert('Por favor, selecione ou informe o motivo do acionamento.');
      return;
    }
    // Se tiver motivo_tipo, usar ele como motivo principal, senão usar o campo motivo (texto livre)
    const motivoFinal = formData.motivo_tipo || formData.motivo;
    onSave(acionamento ? { ...formData, motivo: motivoFinal, id: acionamento.id } : { ...formData, motivo: motivoFinal });
  };

  return (
    <DialogContent className="max-w-2xl bg-card border-border">
      <DialogHeader>
        <DialogTitle>{acionamento ? 'Editar Acionamento' : 'Novo Acionamento'}</DialogTitle>
        <DialogDescription>
          {acionamento ? 'Edite as informações do acionamento abaixo.' : 'Preencha os dados para criar um novo acionamento.'}
        </DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4 mt-4">
        <div className="space-y-2">
          <Label htmlFor="store_id">Loja *</Label>
          <Select onValueChange={(value) => handleSelectChange('store_id', value)} value={formData.store_id}>
            <SelectTrigger id="store_id" className="bg-secondary">
              <SelectValue placeholder="Selecione a loja..." />
            </SelectTrigger>
            <SelectContent>
              {stores && stores.length > 0 ? (
                stores.map(store => (
                  <SelectItem key={store.id} value={store.id}>
                    {store.code} - {store.name}
                  </SelectItem>
                ))
              ) : (
                <div className="px-2 py-1.5 text-sm text-muted-foreground">Nenhuma loja disponível</div>
              )}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="status">Status *</Label>
          <Select onValueChange={(value) => handleSelectChange('status', value)} value={formData.status}>
            <SelectTrigger id="status" className="bg-secondary">
              <SelectValue placeholder="Selecione o status..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="em_tratativa">Em Tratativa</SelectItem>
              <SelectItem value="finalizada">Finalizada</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="motivo_tipo">Tipo de Acionamento *</Label>
          <Select onValueChange={(value) => handleSelectChange('motivo_tipo', value)} value={formData.motivo_tipo}>
            <SelectTrigger id="motivo_tipo" className="bg-secondary">
              <SelectValue placeholder="Selecione o tipo de acionamento..." />
            </SelectTrigger>
            <SelectContent>
              {MOTIVOS_ACIONAMENTO.map(motivo => (
                <SelectItem key={motivo} value={motivo}>
                  {motivo}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Ou preencha um motivo personalizado abaixo</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="motivo">Motivo Personalizado (Opcional)</Label>
          <Textarea
            id="motivo"
            name="motivo"
            value={formData.motivo}
            onChange={handleChange}
            placeholder="Descreva o motivo do acionamento (se não selecionou um tipo acima)..."
            className="bg-secondary min-h-[100px]"
            disabled={!!formData.motivo_tipo}
          />
        </div>

        <div className="flex gap-2 justify-end pt-4">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button type="submit" className="bg-primary text-primary-foreground hover:bg-primary/90">
            {acionamento ? 'Salvar Alterações' : 'Criar Acionamento'}
          </Button>
        </div>
      </form>
    </DialogContent>
  );
};

const AcionamentosDashboard = ({ stats }) => {
  return (
    <div className="space-y-6">
      {/* Cards de Totais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Acionamentos</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">Total geral</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Em Tratativa</CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-500">{stats.emTratativa}</div>
            <p className="text-xs text-muted-foreground">{stats.total > 0 ? `${((stats.emTratativa / stats.total) * 100).toFixed(1)}% do total` : '0% do total'}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Finalizadas</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.finalizadas}</div>
            <p className="text-xs text-muted-foreground">{stats.total > 0 ? `${((stats.finalizadas / stats.total) * 100).toFixed(1)}% do total` : '0% do total'}</p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos/Tabelas */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Por UF */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="w-5 h-5 text-primary" />
              Acionamentos por UF
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.porUF.length > 0 ? (
                stats.porUF.map((item, index) => (
                  <div key={item.uf} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                        {index + 1}
                      </div>
                      <span className="font-medium">{item.uf}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary">{item.count}</span>
                      <span className="text-xs text-muted-foreground">acionamentos</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">Nenhum dado disponível</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Por Bandeira */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flag className="w-5 h-5 text-primary" />
              Acionamentos por Bandeira
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.porBandeira.length > 0 ? (
                stats.porBandeira.map((item, index) => (
                  <div key={item.bandeira} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                        {index + 1}
                      </div>
                      <span className="font-medium">{item.bandeira}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary">{item.count}</span>
                      <span className="text-xs text-muted-foreground">acionamentos</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">Nenhum dado disponível</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Por Supervisão */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-primary" />
              Acionamentos por Supervisão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.porSupervisao.length > 0 ? (
                stats.porSupervisao.map((item, index) => (
                  <div key={item.supervisor} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                        {index + 1}
                      </div>
                      <span className="font-medium">{item.supervisor}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary">{item.count}</span>
                      <span className="text-xs text-muted-foreground">acionamentos</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">Nenhum dado disponível</p>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Lojas Mais Acionadas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-primary" />
              Lojas Mais Acionadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.lojasMaisAcionadas.length > 0 ? (
                stats.lojasMaisAcionadas.map((item, index) => (
                  <div key={item.storeId} className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-sm font-bold text-primary">
                        {index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{item.nome}</p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          {item.uf && <span>{item.uf}</span>}
                          {item.bandeira && <span>• {item.bandeira}</span>}
                          {item.supervisor && <span>• {item.supervisor}</span>}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-2xl font-bold text-primary">{item.count}</span>
                      <span className="text-xs text-muted-foreground">vezes</span>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">Nenhum dado disponível</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Acionamentos;

