import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, X, CheckCircle2, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { fetchUnreadAlerts, markAlertAsViewed } from '@/lib/supabaseService';
import { useToast } from '@/components/ui/use-toast';
import { motion, AnimatePresence } from 'framer-motion';

const AlertsModal = ({ open, onOpenChange, storeId }) => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewingAlert, setViewingAlert] = useState(null);
  const { toast } = useToast();

  useEffect(() => {
    if (open && storeId) {
      loadAlerts();
    }
  }, [open, storeId]);

  const loadAlerts = async () => {
    try {
      setLoading(true);
      const data = await fetchUnreadAlerts(storeId);
      setAlerts(data || []);
    } catch (error) {
      console.error('Erro ao carregar alertas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewAlert = async (alert) => {
    try {
      await markAlertAsViewed(alert.id, storeId);
      // Remover o alerta da lista após visualizar (mesmo se RLS bloqueou, removemos da UI)
      setAlerts(prev => prev.filter(a => a.id !== alert.id));
      
      // Não mostrar toast de sucesso se foi apenas um problema de RLS (a função já trata isso)
      // Apenas remover da lista localmente
      
      // Fechar o modal se não houver mais alertas
      if (alerts.length === 1) {
        setTimeout(() => {
          onOpenChange(false);
        }, 1000);
      }
    } catch (error) {
      // Se for erro de RLS ou tabela não encontrada, apenas remover da lista localmente
      if (error.code === '42501' || error.code === '42P01' || error.code === 'PGRST116') {
        setAlerts(prev => prev.filter(a => a.id !== alert.id));
        // Fechar o modal se não houver mais alertas
        if (alerts.length === 1) {
          setTimeout(() => {
            onOpenChange(false);
          }, 1000);
        }
        return;
      }
      
      // Para outros erros, mostrar mensagem
      console.error('Erro ao marcar alerta como visualizado:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível confirmar a visualização. Tente novamente.',
        variant: 'destructive'
      });
    }
  };

  const isExpired = (alert) => {
    return alert.expires_at && new Date(alert.expires_at) < new Date();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-primary" />
            Alertas e Comunicados
          </DialogTitle>
          <DialogDescription>
            Confirme a visualização de cada alerta para que seja registrado
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Carregando alertas...</p>
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <p className="text-muted-foreground">Nenhum alerta pendente</p>
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {alerts.map((alert) => {
                const expired = isExpired(alert);
                return (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Card className={cn(
                      "hover:shadow-lg transition-shadow",
                      expired && "border-yellow-500/50"
                    )}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <CardTitle className="text-lg">{alert.title}</CardTitle>
                              {expired && (
                                <Badge variant="outline" className="text-yellow-600 border-yellow-600">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Expirado
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {format(new Date(alert.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </span>
                              {alert.expires_at && (
                                <span className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  Expira: {format(new Date(alert.expires_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <p className="text-muted-foreground whitespace-pre-wrap mb-4">{alert.message}</p>
                        <Button
                          onClick={() => handleViewAlert(alert)}
                          className="w-full"
                          variant="default"
                        >
                          <CheckCircle2 className="w-4 h-4 mr-2" />
                          Confirmar Visualização
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AlertsModal;
