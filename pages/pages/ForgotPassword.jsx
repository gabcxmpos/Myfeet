import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Loader2, ArrowLeft } from 'lucide-react';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const { resetPassword } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const sanitizedEmail = email.trim().toLowerCase();

      if (!sanitizedEmail) {
        setError('Por favor, insira seu email');
        setIsLoading(false);
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(sanitizedEmail)) {
        setError('Por favor, insira um email válido');
        setIsLoading(false);
        return;
      }

      const result = await resetPassword(sanitizedEmail);
      if (result.success) {
        setSuccess(true);
      } else if (result.error) {
        setError(result.error.message || 'Erro ao resetar senha');
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      setError('Ocorreu um erro inesperado. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Esqueci minha senha - MYFEET</title>
        <meta name="description" content="Recupere sua senha" />
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
              <p className="text-muted-foreground">Recuperação de Senha</p>
            </div>

            {success ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 text-center">
                    Senha resetada com sucesso! A senha foi resetada para a senha padrão "afeet10". Você pode fazer login com essa senha agora.
                  </p>
                </div>
                <Link to="/login">
                  <Button variant="outline" className="w-full">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Ir para o login
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <div className="p-3 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg">
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
                      setError('');
                    }}
                    required
                    disabled={isLoading}
                    className={`bg-secondary border-border/50 ${error ? 'border-red-500' : ''}`}
                  />
                  <p className="text-xs text-muted-foreground">
                    Sua senha será resetada para a senha padrão "afeet10". Você poderá fazer login com essa senha.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-gradient-to-r from-primary to-blue-500 hover:opacity-90 transition-opacity"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Resetando...
                    </>
                  ) : (
                    'Resetar Senha para "afeet10"'
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

export default ForgotPassword;

