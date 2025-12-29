import React, { useEffect, useState } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Trash2, Users2, CheckCircle, Plane, UserX } from 'lucide-react';
import { motion } from 'framer-motion';

const Collaborators = () => {
  const { user } = useAuth();
  const { collaborators, addCollaborator, updateCollaborator, deleteCollaborator, jobRoles } = useData();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [cpf, setCpf] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (!jobRoles || jobRoles.length === 0) {
      setRole('');
      return;
    }
    if (role && !jobRoles.includes(role)) {
      setRole('');
    }
  }, [jobRoles, role]);

  const storeCollaborators = collaborators.filter(c => c.storeId === user?.storeId || c.store_id === user?.storeId);
  
  // Garantir que todos os colaboradores tenham status (padrão: 'ativo')
  const collaboratorsWithStatus = storeCollaborators.map(c => ({
    ...c,
    status: c.status || 'ativo'
  }));

  const formatCPF = (value) => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 11) {
      return numbers.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
    }
    return value;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!jobRoles || jobRoles.length === 0) {
      toast({ title: 'Configuração pendente', description: 'Nenhum cargo foi configurado pelo administrador. Solicite o cadastro de cargos antes de continuar.', variant: 'destructive' });
      return;
    }
    if (!name || !role) {
      toast({ title: 'Erro', description: 'Informe o nome e selecione um cargo.', variant: 'destructive' });
      return;
    }
    
    if (!user?.storeId) {
      toast({ title: 'Erro', description: 'Usuário não possui loja associada.', variant: 'destructive' });
      return;
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: 'Erro', description: 'Email inválido.', variant: 'destructive' });
      return;
    }
    
    try {
      await addCollaborator({ 
        name, 
        role, 
        store_id: user.storeId, // Usar snake_case (padrão do banco)
        cpf: cpf || null,
        email: email || null
      });
      toast({ title: 'Sucesso!', description: 'Colaborador adicionado.' });
      setName('');
      setRole('');
      setCpf('');
      setEmail('');
    } catch (error) {
      console.error('Erro ao adicionar colaborador:', error);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await updateCollaborator(id, { status: newStatus });
      toast({ title: 'Status atualizado!', description: `Colaborador marcado como ${newStatus === 'ativo' ? 'Ativo' : newStatus === 'ferias' ? 'Férias' : 'Afastado'}.` });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
      if (error.message?.includes('status') || error.code === 'PGRST204') {
        toast({ 
          variant: 'destructive', 
          title: 'Coluna não encontrada', 
          description: 'A coluna status ainda não foi criada no banco de dados. Execute o script ADICIONAR_STATUS_COLABORADORES.sql no Supabase.' 
        });
      } else {
        toast({ 
          variant: 'destructive', 
          title: 'Erro ao atualizar status', 
          description: error.message || 'Não foi possível atualizar o status do colaborador.' 
        });
      }
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja remover este colaborador?')) {
      deleteCollaborator(id);
      toast({ title: 'Removido!', description: 'Colaborador removido.', variant: 'destructive' });
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'ativo': { label: 'Ativo', icon: CheckCircle, variant: 'default', color: 'text-green-500' },
      'ferias': { label: 'Férias', icon: Plane, variant: 'secondary', color: 'text-blue-500' },
      'afastado': { label: 'Afastado', icon: UserX, variant: 'outline', color: 'text-yellow-500' }
    };
    const statusInfo = statusMap[status] || statusMap['ativo'];
    const Icon = statusInfo.icon;
    return (
      <Badge variant={statusInfo.variant} className={`flex items-center gap-1 ${statusInfo.color}`}>
        <Icon className="w-3 h-3" />
        {statusInfo.label}
      </Badge>
    );
  };

  return (
    <>
      <Helmet><title>Colaboradores - MYFEET</title></Helmet>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Colaboradores</h1>
          <p className="text-muted-foreground mt-1">Gerencie a equipe da sua loja.</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <motion.form 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            onSubmit={handleSubmit} 
            className="lg:col-span-1 bg-card p-6 rounded-xl shadow-lg border border-border space-y-4 h-fit"
          >
            <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground"><UserPlus /> Novo Colaborador</h2>
            <div className="space-y-2">
              <Label htmlFor="name">Nome Completo</Label>
              <Input id="name" value={name} onChange={e => setName(e.target.value)} required className="bg-secondary" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Cargo</Label>
              <Select value={role} onValueChange={setRole} disabled={!jobRoles || jobRoles.length === 0}>
                <SelectTrigger id="role" className="bg-secondary">
                  <SelectValue placeholder={jobRoles && jobRoles.length > 0 ? 'Selecione um cargo' : 'Nenhum cargo disponível'} />
                </SelectTrigger>
                <SelectContent>
                  {(jobRoles || []).map(roleOption => (
                    <SelectItem key={roleOption} value={roleOption}>
                      {roleOption}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {(!jobRoles || jobRoles.length === 0) && (
                <p className="text-xs text-muted-foreground">
                  Nenhum cargo configurado. Solicite ao administrador para liberar esta etapa.
                </p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF (Opcional)</Label>
              <Input 
                id="cpf" 
                value={cpf} 
                onChange={e => setCpf(formatCPF(e.target.value))} 
                placeholder="000.000.000-00"
                maxLength={14}
                className="bg-secondary" 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email (Opcional)</Label>
              <Input 
                id="email" 
                type="email"
                value={email} 
                onChange={e => setEmail(e.target.value)} 
                placeholder="colaborador@exemplo.com"
                className="bg-secondary" 
              />
            </div>
            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-blue-500 text-primary-foreground">Adicionar Colaborador</Button>
          </motion.form>

          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-2 bg-card p-6 rounded-xl shadow-lg border border-border"
          >
            <h2 className="text-lg font-semibold mb-4 text-foreground">Equipe</h2>
            <div className="space-y-3 max-h-[60vh] overflow-y-auto pr-2">
              {collaboratorsWithStatus.length > 0 ? collaboratorsWithStatus.map(c => {
                const currentStatus = c.status || 'ativo';
                return (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                    <div className="flex items-center gap-3 flex-1">
                      <Users2 className="w-5 h-5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <p className="font-medium text-foreground">{c.name}</p>
                          {getStatusBadge(currentStatus)}
                        </div>
                        <p className="text-xs text-muted-foreground">{c.role}</p>
                        {c.cpf && <p className="text-xs text-muted-foreground">CPF: {c.cpf}</p>}
                        {c.email && <p className="text-xs text-muted-foreground">Email: {c.email}</p>}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Select value={currentStatus} onValueChange={(value) => handleStatusChange(c.id, value)}>
                        <SelectTrigger className="w-[120px] h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="ativo">
                            <div className="flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-500" />
                              Ativo
                            </div>
                          </SelectItem>
                          <SelectItem value="ferias">
                            <div className="flex items-center gap-2">
                              <Plane className="w-4 h-4 text-blue-500" />
                              Férias
                            </div>
                          </SelectItem>
                          <SelectItem value="afastado">
                            <div className="flex items-center gap-2">
                              <UserX className="w-4 h-4 text-yellow-500" />
                              Afastado
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                );
              }) : (
                <p className="text-muted-foreground text-center py-8">Nenhum colaborador cadastrado.</p>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Collaborators;
