import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2 } from 'lucide-react';

const FirstAccess = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { updatePassword, user, isAuthenticated, loading: authLoading, session } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Aguardar o carregamento da autenticação
    if (authLoading) {
      return;
    }

    // Se não estiver autenticado ou não tiver sessão, redirecionar para login
    if (!authLoading && (!isAuthenticated || !user || !session)) {
      console.log('🔒 Primeiro acesso: Usuário não autenticado, redirecionando para login');
      navigate('/login', { replace: true });
    }
  }, [isAuthenticated, user, session, authLoading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!password || !confirmPassword) {
      setError('Por favor, preencha todos os campos');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    // Validar se a senha não é a senha padrão
    if (password === 'afeet10') {
      setError('A senha não pode ser a senha padrão. Por favor, escolha uma senha diferente.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🔐 Primeiro acesso: Tentando atualizar senha...');
      const result = await updatePassword(password);
      
      if (result.success) {
        console.log('✅ Primeiro acesso: Senha atualizada com sucesso');
        // Aguardar um pouco para garantir que a sessão foi atualizada
        await new Promise(resolve => setTimeout(resolve, 500));
        // Redirecionar para a página inicial após definir a senha
        navigate('/home', { replace: true });
      } else if (result.error) {
        console.error('❌ Primeiro acesso: Erro ao atualizar senha:', result.error);
        setError(result.error.message || 'Erro ao definir senha');
      } else {
        console.error('❌ Primeiro acesso: Resultado inesperado:', result);
        setError('Erro ao definir senha. Tente novamente.');
      }
    } catch (error) {
      console.error('❌ Primeiro acesso: Erro inesperado:', error);
      setError(error.message || 'Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  // Mostrar loading enquanto verifica autenticação
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, mostrar loading (será redirecionado pelo useEffect)
  if (!isAuthenticated || !user || !session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Primeiro Acesso - MYFEET</title>
        <meta name="description" content="Defina sua senha" />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-sm"
        >
          <div className="bg-card rounded-2xl shadow-2xl p-8 border border-border/50">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent mb-2">
                MYFEET
              </h1>
              <p className="text-muted-foreground">Defina sua senha</p>
              <p className="text-sm text-muted-foreground mt-2">
                Você está usando a senha padrão. Por favor, defina uma nova senha segura para sua conta.
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Nova Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError('');
                  }}
                  required
                  disabled={isLoading}
                  className={`bg-secondary border-border/50 ${error ? 'border-red-500' : ''}`}
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">Mínimo de 6 caracteres</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => {
                    setConfirmPassword(e.target.value);
                    setError('');
                  }}
                  required
                  disabled={isLoading}
                  className={`bg-secondary border-border/50 ${error ? 'border-red-500' : ''}`}
                  minLength={6}
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-primary to-blue-500 hover:opacity-90 transition-opacity"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  'Definir Senha'
                )}
              </Button>
            </form>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default FirstAccess;

