import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, UserX, Lock, Unlock, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const UserManagement = () => {
    const { users, addUser, stores, toggleUserStatus, deleteUser: contextDeleteUser } = useData();
    const { toast } = useToast();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [storeId, setStoreId] = useState('');

    const handleSubmit = (e) => {
        e.preventDefault();
        if(role === 'loja' && !storeId) {
            toast({ title: 'Erro', description: 'Para o perfil LOJA, é preciso selecionar uma loja.', variant: 'destructive'});
            return;
        }

        addUser({ username, password, role, storeId: role === 'loja' ? storeId : undefined });
        toast({ title: 'Sucesso!', description: `Usuário ${username} criado.`});
        setUsername('');
        setPassword('');
        setRole('');
        setStoreId('');
    }
    
    const handleToggleStatus = (userId) => {
        toggleUserStatus(userId);
        toast({ title: 'Status Alterado', description: 'O status do usuário foi atualizado.'});
    }
    
    const handleDeleteUser = (userId) => {
        contextDeleteUser(userId);
        toast({ title: 'Usuário Excluído', description: 'O usuário foi removido do sistema.', variant: 'destructive'});
    }

    const getRoleBadgeColor = (role) => {
        switch (role) {
            case 'admin': return 'bg-red-500/20 text-red-400';
            case 'supervisor': return 'bg-blue-500/20 text-blue-400';
            case 'loja': return 'bg-green-500/20 text-green-400';
            default: return 'bg-secondary text-muted-foreground';
        }
    }
    
    const getStatusBadgeColor = (status) => {
        return status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400';
    }

    return (
        <>
        <Helmet>
            <title>Gestão de Usuários - MYFEET</title>
            <meta name="description" content="Crie e gerencie usuários do sistema." />
        </Helmet>
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-foreground">Gestão de Usuários</h1>
                <p className="text-muted-foreground mt-1">Crie e gerencie os acessos ao painel.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <form onSubmit={handleSubmit} className="lg:col-span-1 bg-card p-6 rounded-xl shadow-lg border border-border space-y-4">
                    <h2 className="text-lg font-semibold flex items-center gap-2 text-foreground"><UserPlus /> Novo Usuário</h2>
                    <div className="space-y-2">
                        <Label htmlFor="username">Usuário</Label>
                        <Input id="username" value={username} onChange={e => setUsername(e.target.value)} required className="bg-secondary" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Senha</Label>
                        <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} required className="bg-secondary" />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="role">Perfil</Label>
                        <Select onValueChange={setRole} value={role}>
                            <SelectTrigger className="bg-secondary"><SelectValue placeholder="Selecione um perfil..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="admin">Admin</SelectItem>
                                <SelectItem value="supervisor">Supervisor</SelectItem>
                                <SelectItem value="loja">Loja</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {role === 'loja' && (
                        <div className="space-y-2">
                            <Label htmlFor="storeId">Loja</Label>
                            <Select onValueChange={setStoreId} value={storeId}>
                                <SelectTrigger className="bg-secondary"><SelectValue placeholder="Selecione a loja..." /></SelectTrigger>
                                <SelectContent>
                                    {stores.map(store => (
                                        <SelectItem key={store.id} value={store.id}>{store.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    )}
                    <Button type="submit" className="w-full bg-gradient-to-r from-primary to-blue-500 text-primary-foreground">Criar Usuário</Button>
                </form>

                <div className="lg:col-span-2 bg-card p-6 rounded-xl shadow-lg border border-border">
                    <h2 className="text-lg font-semibold mb-4 text-foreground">Usuários Cadastrados</h2>
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                        {users.map(user => (
                            <div key={user.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                                <div>
                                    <span className="font-medium text-foreground">{user.username}</span>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>{user.role}</span>
                                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusBadgeColor(user.status)}`}>{user.status === 'active' ? 'Ativo' : 'Bloqueado'}</span>
                                    </div>
                                </div>
                                {user.role !== 'admin' && (
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(user.id)} title={user.status === 'active' ? 'Bloquear' : 'Desbloquear'}>
                                          {user.status === 'active' ? <Lock className="w-4 h-4 text-yellow-400" /> : <Unlock className="w-4 h-4 text-green-400" />}
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" title="Excluir">
                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Você tem certeza?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Esta ação não pode ser desfeita. Isso irá excluir permanentemente o usuário "{user.username}".
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive hover:bg-destructive/90">Excluir</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
        </>
    )
}

export default UserManagement;