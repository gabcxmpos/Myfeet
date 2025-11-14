import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Shield, Award, Medal, Trophy } from 'lucide-react';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const Settings = () => {
  const { patentSettings, updatePatentSettings } = useData();
  const { toast } = useToast();
  const [settings, setSettings] = useState(patentSettings);
  const { user } = useAuth();
  
  if (user.role !== 'admin') {
      // Or a more friendly UI
      return <div>Acesso negado.</div>
  }

  const handleSettingChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({ ...prev, [name]: Number(value) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (settings.bronze >= settings.prata || settings.prata >= settings.ouro || settings.ouro >= settings.platina) {
      toast({
        title: "Erro de Lógica",
        description: "As pontuações das patentes devem ser progressivas (Bronze < Prata < Ouro < Platina).",
        variant: "destructive"
      });
      return;
    }
    updatePatentSettings(settings);
    toast({ title: "Sucesso!", description: "Configurações de patentes atualizadas." });
  };

  const patentFields = [
    { name: 'bronze', label: 'Bronze', icon: Shield, color: 'text-orange-400' },
    { name: 'prata', label: 'Prata', icon: Award, color: 'text-gray-400' },
    { name: 'ouro', label: 'Ouro', icon: Medal, color: 'text-yellow-400' },
    { name: 'platina', label: 'Platina', icon: Trophy, color: 'text-cyan-400' },
  ];

  return (
    <>
      <Helmet>
        <title>Configurações - MYFEET Painel PPAD</title>
      </Helmet>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Configurações</h1>
          <p className="text-muted-foreground mt-1">Ajustes gerais do painel.</p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl"
        >
          <form onSubmit={handleSubmit} className="bg-card rounded-xl shadow-lg border border-border p-8 space-y-6">
            <h2 className="text-xl font-semibold text-foreground">Definição de Patentes</h2>
            <p className="text-sm text-muted-foreground">Defina a pontuação mínima necessária para alcançar cada patente no ranking.</p>
            
            <div className="space-y-4">
              {patentFields.map(field => {
                const Icon = field.icon;
                return (
                  <div key={field.name} className="flex items-center gap-4">
                    <div className="flex items-center gap-2 w-32">
                      <Icon className={`w-5 h-5 ${field.color}`} />
                      <Label htmlFor={field.name} className={`font-bold ${field.color}`}>{field.label}</Label>
                    </div>
                    <Input
                      id={field.name}
                      name={field.name}
                      type="number"
                      value={settings[field.name]}
                      onChange={handleSettingChange}
                      className="flex-1 bg-secondary"
                      placeholder={`Pontuação mínima para ${field.label}`}
                    />
                  </div>
                )
              })}
            </div>

            <Button type="submit" className="w-full bg-gradient-to-r from-primary to-blue-500 text-primary-foreground">
              Salvar Configurações de Patentes
            </Button>
          </form>
        </motion.div>
      </div>
    </>
  );
};

export default Settings;