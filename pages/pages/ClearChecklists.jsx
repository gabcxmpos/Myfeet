import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { CheckSquare, Route, RotateCcw, AlertTriangle, X } from 'lucide-react';
import * as checklistService from '@/lib/checklistService';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import * as api from '@/lib/supabaseService';

const ClearChecklists = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [clearDialog, setClearDialog] = useState(null);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [users, setUsers] = useState([]);

  React.useEffect(() => {
    if (user?.role === 'admin') {
      loadUsers();
    }
  }, [user]);

  const loadUsers = async () => {
    try {
      const allUsers = await api.fetchAppUsers();
      setUsers(allUsers || []);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  };

  const handleClear = async (type, userId = null) => {
    setLoading(true);
    try {
      switch (type) {
        case 'devolucoes':
          await checklistService.clearDevolucoesExecution(userId);
          break;
        case 'motorista':
          await checklistService.clearMotoristaExecution(userId);
          break;
        default:
          throw new Error('Tipo de checklist inválido');
      }
      
      toast({
        title: 'Sucesso!',
        description: userId 
          ? 'Checklist limpo para o usuário selecionado.' 
          : 'Todos os checklists foram limpos.',
      });
      setClearDialog(null);
      setSelectedUserId('');
    } catch (error) {
      console.error('Erro ao limpar checklist:', error);
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: error.message || 'Erro ao limpar checklist.',
      });
    } finally {
      setLoading(false);
    }
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
        <title>Limpar Checklists - MYFEET</title>
      </Helmet>

      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Limpar Checklists</h1>
          <p className="text-muted-foreground mt-2">
            Limpe/zerar os checklists quando necessário. Você pode limpar para todos os usuários ou para um usuário específico.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* Checklist de Devoluções */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckSquare className="w-5 h-5" />
                Checklist de Devoluções
              </CardTitle>
              <CardDescription>
                Limpar checklists de devoluções
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setClearDialog({ type: 'devolucoes', scope: 'all' })}
                disabled={loading}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Limpar Todos
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setClearDialog({ type: 'devolucoes', scope: 'user' })}
                disabled={loading}
              >
                Limpar por Usuário
              </Button>
            </CardContent>
          </Card>

          {/* Checklist de Motorista */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Route className="w-5 h-5" />
                Checklist de Motorista
              </CardTitle>
              <CardDescription>
                Limpar checklists de rotas
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => setClearDialog({ type: 'motorista', scope: 'all' })}
                disabled={loading}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Limpar Todos
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() => setClearDialog({ type: 'motorista', scope: 'user' })}
                disabled={loading}
              >
                Limpar por Usuário
              </Button>
            </CardContent>
          </Card>

        </div>

        {/* Dialog de confirmação */}
        <AlertDialog open={!!clearDialog} onOpenChange={(open) => !open && setClearDialog(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-destructive" />
                Confirmar Limpeza
              </AlertDialogTitle>
              <AlertDialogDescription className="space-y-4">
                {clearDialog?.scope === 'all' ? (
                  <div>
                    <p className="font-semibold text-foreground mb-2">
                      Você está prestes a limpar TODOS os checklists de {clearDialog?.type === 'devolucoes' ? 'Devoluções' : 'Motorista'}.
                    </p>
                    <p className="text-destructive">
                      Esta ação não pode ser desfeita. Todos os dados de execução serão perdidos.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="font-semibold text-foreground mb-2">
                      Limpar checklist para um usuário específico:
                    </p>
                    <Label htmlFor="user-select">Selecione o usuário</Label>
                    <Select value={selectedUserId} onValueChange={setSelectedUserId}>
                      <SelectTrigger id="user-select">
                        <SelectValue placeholder="Selecione um usuário" />
                      </SelectTrigger>
                      <SelectContent>
                        {users.map((u) => (
                          <SelectItem key={u.id} value={u.id}>
                            {u.name || u.email}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {!selectedUserId && (
                      <p className="text-sm text-muted-foreground">
                        Por favor, selecione um usuário para continuar.
                      </p>
                    )}
                  </div>
                )}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={loading}>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  if (clearDialog?.scope === 'user' && !selectedUserId) {
                    toast({
                      variant: 'destructive',
                      title: 'Erro',
                      description: 'Por favor, selecione um usuário.',
                    });
                    return;
                  }
                  handleClear(clearDialog?.type, clearDialog?.scope === 'user' ? selectedUserId : null);
                }}
                disabled={loading || (clearDialog?.scope === 'user' && !selectedUserId)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {loading ? 'Limpando...' : 'Confirmar Limpeza'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
};

export default ClearChecklists;

