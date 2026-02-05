
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label.jsx';
import { Input } from '@/components/ui/input';
import { Loader2, Sun, Moon } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { signIn, isAuthenticated, loading: authLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/home';

  useEffect(() => {
    if (isAuthenticated && !authLoading) {
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate, from]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      // Sanitizar email e senha (remover espaços em branco)
      const sanitizedEmail = email.trim().toLowerCase();
      const sanitizedPassword = password.trim();

      // Validação básica
      if (!sanitizedEmail || !sanitizedPassword) {
        setError('Por favor, preencha todos os campos');
        setIsLoading(false);
        return;
      }

      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(sanitizedEmail)) {
        setError('Por favor, insira um email válido');
        setIsLoading(false);
        return;
      }

      const result = await signIn(sanitizedEmail, sanitizedPassword);
      if (result.success) {
        // Se for primeiro acesso, redirecionar para página de definição de senha
        if (result.firstAccess) {
          navigate('/first-access', { replace: true });
        } else {
          navigate(from, { replace: true });
        }
      } else if (result.error) {
        // O erro já é mostrado pelo toast no contexto, mas podemos mostrar aqui também se necessário
        setError(result.error.message || 'Credenciais inválidas');
      }
    } catch (error) {
      console.error('Login error:', error);
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Login - MYFEET Painel PPAD</title>
        <meta name="description" content="Acesse o Painel PPAD" />
      </Helmet>
      
      <div className="min-h-screen flex items-center justify-center bg-background p-4 relative">
        {/* Botão de Toggle de Tema - Canto superior direito */}
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleTheme}
          aria-label={theme === 'dark' ? 'Ativar tema claro' : 'Ativar tema escuro'}
          title={theme === 'dark' ? 'Tema claro' : 'Tema escuro'}
          className="absolute top-4 right-4 z-10"
        >
          {theme === 'dark' ? (
            <Sun className="w-5 h-5 text-yellow-500" />
          ) : (
            <Moon className="w-5 h-5 text-blue-600" />
          )}
        </Button>

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
              <p className="text-muted-foreground">Painel de Performance PPAD</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {error && (
                <div className="p-3 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg">
                  {error}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setError(''); // Limpar erro quando o usuário começar a digitar
                  }}
                  required
                  disabled={isLoading}
                  className={`bg-secondary border-border/50 ${error ? 'border-red-500' : ''}`}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(''); // Limpar erro quando o usuário começar a digitar
                  }}
                  required
                  disabled={isLoading}
                  className={`bg-secondary border-border/50 ${error ? 'border-red-500' : ''}`}
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
                    Entrando...
                  </>
                ) : (
                  'Entrar'
                )}
              </Button>
              
              <div className="text-center">
                <Link 
                  to="/forgot-password" 
                  className="text-sm text-primary hover:underline"
                >
                  Esqueci minha senha
                </Link>
              </div>
            </form>

            <div className="mt-6 p-4 bg-secondary/50 rounded-lg">
              <p className="text-xs text-muted-foreground text-center mb-2">Informações:</p>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p className="text-center">Novos usuários recebem a senha padrão: <strong>afeet10</strong></p>
                <p className="text-center">É necessário definir uma nova senha no primeiro acesso.</p>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </>
  );
};

export default Login;
