import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UserPlus, Trash2, Users2 } from 'lucide-react';
import { motion } from 'framer-motion';

const Collaborators = () => {
  const { user } = useAuth();
  const { collaborators, addCollaborator, deleteCollaborator } = useData();
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [role, setRole] = useState('');

  const storeCollaborators = collaborators.filter(c => c.storeId === user?.storeId || c.store_id === user?.storeId);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !role) {
      toast({ title: 'Erro', description: 'Preencha nome e cargo.', variant: 'destructive' });
      return;
    }
    
    if (!user?.storeId) {
      toast({ title: 'Erro', description: 'Usuário não possui loja associada.', variant: 'destructive' });
      return;
    }
    
    try {
      await addCollaborator({ name, role, storeId: user.storeId });
      toast({ title: 'Sucesso!', description: 'Colaborador adicionado.' });
      setName('');
      setRole('');
    } catch (error) {
      // Erro já é tratado no DataContext
      console.error('Erro ao adicionar colaborador:', error);
    }
  };

  const handleDelete = (id) => {
    if (window.confirm('Tem certeza que deseja remover este colaborador?')) {
      deleteCollaborator(id);
      toast({ title: 'Removido!', description: 'Colaborador removido.', variant: 'destructive' });
    }
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
              <Input id="role" value={role} onChange={e => setRole(e.target.value)} required className="bg-secondary" />
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
              {storeCollaborators.length > 0 ? storeCollaborators.map(c => (
                <div key={c.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                  <div className="flex items-center gap-3">
                    <Users2 className="w-5 h-5 text-muted-foreground" />
                    <div>
                      <p className="font-medium text-foreground">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{c.role}</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)}>
                    <Trash2 className="w-4 h-4 text-destructive" />
                  </Button>
                </div>
              )) : (
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