import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, UserX, Lock, Unlock, Trash2, KeyRound } from 'lucide-react';
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
    const { users, addUser, stores, toggleUserStatus, deleteUser: contextDeleteUser, resetUserPassword } = useData();
    const { toast } = useToast();
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState('');
    const [storeId, setStoreId] = useState('');
    const [resetEmail, setResetEmail] = useState('');
    const [showResetDialog, setShowResetDialog] = useState(false);
    const [selectedUserId, setSelectedUserId] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if(role === 'loja' && !storeId) {
            toast({ title: 'Erro', description: 'Para o perfil LOJA, é preciso selecionar uma loja.', variant: 'destructive'});
            return;
        }

        try {
            // Validar se o role foi selecionado
            if (!role) {
                toast({ 
                    title: 'Erro', 
                    description: 'Por favor, selecione um perfil para o usuário.', 
                    variant: 'destructive'
                });
                return;
            }
            
            // DEBUG: Log dos dados que serão enviados
            console.log('📝 Dados do formulário:', {
                email,
                username,
                role,
                storeId: role === 'loja' ? storeId : null
            });
            
            // Senha é opcional - se não fornecida, será usada a senha padrão "afeet10"
            await addUser(email, password || '', { 
                username, 
                role: role, // Garantir que o role seja passado explicitamente
                store_id: role === 'loja' ? storeId : null 
            });
            
            // Limpar formulário apenas se a criação foi bem-sucedida
            setEmail('');
            setUsername('');
            setPassword('');
            setRole('');
            setStoreId('');
        } catch (error) {
            // Erro já é tratado no DataContext, mas vamos garantir que a mensagem seja exibida
            console.error('Erro ao criar usuário:', error);
            
            // Se a mensagem de erro contiver instruções sobre o SQL, exibir toast mais detalhado
            if (error.message?.includes('SOLUCAO_COMPLETA.sql') || error.message?.includes('foreign key')) {
                toast({ 
                    title: 'Erro de Configuração do Banco de Dados', 
                    description: 'É necessário executar o script SQL no Supabase. Veja as instruções no console ou no arquivo INSTRUCOES_CORRECAO.md',
                    variant: 'destructive',
                    duration: 10000
                });
            }
        }
    }
    
    const handleToggleStatus = (userId) => {
        toggleUserStatus(userId);
        toast({ title: 'Status Alterado', description: 'O status do usuário foi atualizado.'});
    }
    
    const handleDeleteUser = async (userId) => {
        try {
            await contextDeleteUser(userId);
            // Toast já é exibido no DataContext
        } catch (error) {
            // Erro já é tratado no DataContext
            console.error('Erro ao excluir usuário:', error);
        }
    }
    
    const handleResetPasswordClick = (userId, userEmail = '') => {
        setSelectedUserId(userId);
        setResetEmail(userEmail);
        setShowResetDialog(true);
    }
    
    const confirmResetPassword = async () => {
        if (!resetEmail) {
            toast({ title: 'Erro', description: 'Por favor, insira o email do usuário.', variant: 'destructive'});
            return;
        }
        
        try {
            await resetUserPassword(resetEmail);
            closeResetDialog();
        } catch (error) {
            // Erro já é tratado no contexto
        }
    }
    
    const closeResetDialog = () => {
        setShowResetDialog(false);
        setResetEmail('');
        setSelectedUserId(null);
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
        // Se status for null/undefined, tratar como 'active' para compatibilidade
        const userStatus = status || 'active';
        return userStatus === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400';
    }
    
    const getStatusLabel = (status) => {
        // Se status for null/undefined, tratar como 'active' para compatibilidade
        const userStatus = status || 'active';
        return userStatus === 'active' ? 'Ativo' : 'Bloqueado';
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
                        <Label htmlFor="email">E-mail</Label>
                        <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required className="bg-secondary" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="username">Nome de Usuário</Label>
                        <Input id="username" value={username} onChange={e => setUsername(e.target.value)} required className="bg-secondary" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="password">Senha (Opcional)</Label>
                        <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="bg-secondary" placeholder="Deixe em branco para usar senha padrão: afeet10" />
                        <p className="text-xs text-muted-foreground">Se não informar, será usada a senha padrão "afeet10". O usuário precisará definir uma nova senha no primeiro acesso.</p>
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
                                <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                        <span className="font-medium text-foreground">{user.username}</span>
                                    </div>
                                    <div className="flex items-center gap-2 mt-1">
                                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getRoleBadgeColor(user.role)}`}>{user.role}</span>
                                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusBadgeColor(user.status)}`}>{getStatusLabel(user.status)}</span>
                                    </div>
                                </div>
                                {user.role !== 'admin' && (
                                    <div className="flex items-center gap-2">
                                        <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(user.id)} title={(user.status || 'active') === 'active' ? 'Bloquear' : 'Desbloquear'}>
                                          {(user.status || 'active') === 'active' ? <Lock className="w-4 h-4 text-yellow-400" /> : <Unlock className="w-4 h-4 text-green-400" />}
                                        </Button>
                                        <AlertDialog open={showResetDialog && selectedUserId === user.id} onOpenChange={(open) => {
                                            if (!open) {
                                                closeResetDialog();
                                            }
                                        }}>
                                            <AlertDialogTrigger asChild>
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    title="Resetar senha"
                                                    onClick={() => handleResetPasswordClick(user.id, '')}
                                                >
                                                    <KeyRound className="w-4 h-4 text-blue-400" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent aria-describedby="reset-password-description">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Resetar Senha</AlertDialogTitle>
                                                    <AlertDialogDescription id="reset-password-description">
                                                        Digite o email do usuário "<strong>{user.username}</strong>" para resetar a senha para a senha padrão "afeet10".
                                                        <br /><br />
                                                        <strong>Importante:</strong> A senha será resetada imediatamente para "afeet10". O usuário poderá fazer login com essa senha e será redirecionado para definir uma nova senha no primeiro acesso.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <div className="space-y-4 py-4">
                                                    <div className="space-y-2">
                                                        <Label htmlFor="resetEmail">E-mail do usuário</Label>
                                                        <Input 
                                                            id="resetEmail" 
                                                            type="email" 
                                                            value={resetEmail} 
                                                            onChange={(e) => setResetEmail(e.target.value)}
                                                            placeholder="usuario@email.com"
                                                            className="bg-secondary"
                                                            required
                                                        />
                                                        <p className="text-xs text-muted-foreground">
                                                            O email do usuário é necessário para resetar a senha. A senha será resetada para "afeet10" imediatamente.
                                                        </p>
                                                    </div>
                                                </div>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel onClick={closeResetDialog}>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={confirmResetPassword} className="bg-primary hover:bg-primary/90">
                                                        Resetar Senha para "afeet10"
                                                    </AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="ghost" size="icon" title="Excluir usuário">
                                                    <Trash2 className="w-4 h-4 text-destructive" />
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent aria-describedby="delete-user-description">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Excluir Usuário</AlertDialogTitle>
                                                    <AlertDialogDescription id="delete-user-description">
                                                        Esta ação não pode ser desfeita. Isso irá excluir permanentemente o usuário "<strong>{user.username}</strong>" do sistema (tanto do servidor quanto do web).
                                                        <br /><br />
                                                        <strong>Importante:</strong> O usuário será excluído completamente de auth.users e app_users. Esta ação é irreversível.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteUser(user.id)} className="bg-destructive hover:bg-destructive/90">
                                                        Excluir Usuário
                                                    </AlertDialogAction>
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