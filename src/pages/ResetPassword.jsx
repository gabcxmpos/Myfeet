import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { supabase } from '@/lib/customSupabaseClient';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft } from 'lucide-react';

const ResetPassword = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [searchParams] = useSearchParams();
  const { updatePassword } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Verificar se há token na URL (hash ou query params)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const accessToken = hashParams.get('access_token');
    const type = hashParams.get('type');
    const code = searchParams.get('code');

    console.log('🔍 [ResetPassword] Verificando token de recuperação:', {
      hasHash: !!window.location.hash,
      hasAccessToken: !!accessToken,
      type,
      hasCode: !!code,
      hash: window.location.hash.substring(0, 50) + '...',
      search: window.location.search
    });

    // O Supabase processa automaticamente tokens no hash (#)
    // Mas precisamos verificar se a sessão foi estabelecida
    const checkSession = async () => {
      if (type === 'recovery' && accessToken) {
        console.log('✅ [ResetPassword] Token de recuperação encontrado no hash');
        // Aguardar um pouco para o Supabase processar o token automaticamente
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('❌ [ResetPassword] Erro ao verificar sessão:', sessionError);
          setError('Erro ao processar o link de recuperação. Solicite um novo reset de senha.');
          return;
        }
        
        if (!session) {
          console.warn('⚠️ [ResetPassword] Sessão não encontrada após processar token');
          setError('Link inválido ou expirado. Solicite um novo reset de senha.');
        } else {
          console.log('✅ [ResetPassword] Sessão estabelecida com sucesso');
        }
      } else if (code) {
        console.log('✅ [ResetPassword] Código de recuperação encontrado nos query params');
        // Se houver código nos query params, tentar trocar por sessão
        try {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          
          if (exchangeError) {
            console.error('❌ [ResetPassword] Erro ao trocar código por sessão:', exchangeError);
            setError('Código inválido ou expirado. Solicite um novo reset de senha.');
            return;
          }
          
          if (data.session) {
            console.log('✅ [ResetPassword] Sessão estabelecida via código');
          } else {
            console.warn('⚠️ [ResetPassword] Código trocado mas sem sessão');
            setError('Erro ao estabelecer sessão. Solicite um novo reset de senha.');
          }
        } catch (err) {
          console.error('❌ [ResetPassword] Erro ao processar código:', err);
          setError('Erro ao processar o código de recuperação. Solicite um novo reset de senha.');
        }
      } else {
        // Verificar se há sessão ativa (usuário pode ter chegado aqui de outra forma)
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.warn('⚠️ [ResetPassword] Nenhum token ou código encontrado, e sem sessão ativa');
          setError('Link inválido. Solicite um novo reset de senha através da página de login.');
        } else {
          console.log('✅ [ResetPassword] Sessão ativa encontrada (usuário já autenticado)');
        }
      }
    };

    checkSession();
  }, [searchParams]);

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

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    setIsLoading(true);

    try {
      const result = await updatePassword(password);
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else if (result.error) {
        setError(result.error.message || 'Erro ao atualizar senha');
      }
    } catch (error) {
      console.error('Reset password error:', error);
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Redefinir senha - MYFEET</title>
        <meta name="description" content="Redefina sua senha" />
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
              <p className="text-muted-foreground">Redefinir Senha</p>
            </div>

            {success ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 text-center">
                    Senha redefinida com sucesso! Redirecionando para o login...
                  </p>
                </div>
              </div>
            ) : (
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
                      Atualizando...
                    </>
                  ) : (
                    'Redefinir Senha'
                  )}
                </Button>

                <div className="text-center">
                  <Link 
                    to="/login" 
                    className="text-sm text-primary hover:underline flex items-center justify-center gap-1"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar para o login
                  </Link>
                </div>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default ResetPassword;


