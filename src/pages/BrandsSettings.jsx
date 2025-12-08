import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { motion } from 'framer-motion';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Save, Settings as SettingsIcon, Tag } from 'lucide-react';
import { upsertAppSettings, fetchAppSettings } from '@/lib/supabaseService';
import { AVAILABLE_BRANDS as DEFAULT_BRANDS } from '@/lib/brands';
import { useAuth } from '@/contexts/SupabaseAuthContext';

const BrandsSettings = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [brands, setBrands] = useState(DEFAULT_BRANDS);
  const [newBrand, setNewBrand] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Verificar permissões
  if (user?.role !== 'devoluções' && user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <SettingsIcon className="w-12 h-12 mx-auto mb-4 text-destructive" />
          <p className="text-muted-foreground">Acesso negado. Você não tem permissão para acessar esta página.</p>
        </div>
      </div>
    );
  }

  // Carregar marcas do banco de dados
  useEffect(() => {
    loadBrands();
  }, []);

  const loadBrands = async () => {
    try {
      setLoading(true);
      const savedBrands = await fetchAppSettings('available_brands');

      if (savedBrands && Array.isArray(savedBrands) && savedBrands.length > 0) {
        // Se existir no banco, usar do banco
        setBrands(savedBrands);
      } else {
        // Se não existir, usar padrão e salvar no banco
        setBrands(DEFAULT_BRANDS);
        // Salvar as marcas padrão no banco na primeira vez
        await upsertAppSettings('available_brands', DEFAULT_BRANDS);
      }
    } catch (error) {
      console.error('Erro ao carregar marcas:', error);
      setBrands(DEFAULT_BRANDS);
    } finally {
      setLoading(false);
    }
  };

  const saveBrands = async () => {
    try {
      setSaving(true);
      
      // Salvar no banco de dados usando upsertAppSettings
      await upsertAppSettings('available_brands', brands);

      toast({
        title: 'Sucesso!',
        description: 'Marcas salvas com sucesso. As alterações estarão disponíveis em todos os formulários.'
      });
    } catch (error) {
      console.error('Erro ao salvar marcas:', error);
      toast({
        title: 'Erro',
        description: error.message || 'Erro ao salvar marcas.',
        variant: 'destructive'
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddBrand = () => {
    const trimmed = newBrand.trim().toUpperCase();
    
    if (!trimmed) {
      toast({
        title: 'Erro',
        description: 'Digite o nome da marca.',
        variant: 'destructive'
      });
      return;
    }

    if (brands.includes(trimmed)) {
      toast({
        title: 'Aviso',
        description: 'Esta marca já está cadastrada.',
        variant: 'destructive'
      });
      return;
    }

    setBrands([...brands, trimmed].sort((a, b) => a.localeCompare(b, 'pt-BR')));
    setNewBrand('');
    toast({
      title: 'Marca adicionada',
      description: `${trimmed} foi adicionada à lista. Não esqueça de salvar!`
    });
  };

  const handleRemoveBrand = (brandToRemove) => {
    if (brands.length <= 1) {
      toast({
        title: 'Erro',
        description: 'Deve haver pelo menos uma marca cadastrada.',
        variant: 'destructive'
      });
      return;
    }

    if (window.confirm(`Tem certeza que deseja remover a marca "${brandToRemove}"?`)) {
      setBrands(brands.filter(b => b !== brandToRemove));
      toast({
        title: 'Marca removida',
        description: `${brandToRemove} foi removida da lista. Não esqueça de salvar!`
      });
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddBrand();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <SettingsIcon className="w-12 h-12 mx-auto mb-4 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando configurações...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Configurações de Marcas - MYFEET</title>
      </Helmet>

      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
              <SettingsIcon className="w-8 h-8 text-primary" />
              Configurações de Marcas
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie as marcas disponíveis nos formulários de devoluções
            </p>
          </div>
        </div>

        {/* Card de Gerenciamento */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Tag className="w-5 h-5" />
              Marcas Cadastradas ({brands.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Lista de Marcas */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {brands.map((brand) => (
                <motion.div
                  key={brand}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="flex items-center justify-between bg-secondary/50 rounded-lg p-3 border border-border/50"
                >
                  <span className="font-medium text-foreground">{brand}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveBrand(brand)}
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* Adicionar Nova Marca */}
            <div className="border-t pt-4 space-y-3">
              <Label htmlFor="newBrand">Adicionar Nova Marca</Label>
              <div className="flex gap-2">
                <Input
                  id="newBrand"
                  value={newBrand}
                  onChange={(e) => setNewBrand(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Digite o nome da marca (ex: NIKE)"
                  className="flex-1"
                />
                <Button onClick={handleAddBrand} className="gap-2">
                  <Plus className="w-4 h-4" />
                  Adicionar
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                A marca será convertida para maiúsculas automaticamente
              </p>
            </div>

            {/* Botão Salvar */}
            <div className="flex justify-end pt-4 border-t">
              <Button onClick={saveBrands} disabled={saving} className="gap-2">
                <Save className="w-4 h-4" />
                {saving ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Informações */}
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <SettingsIcon className="w-5 h-5 text-blue-400 mt-0.5" />
              <div className="space-y-2 text-sm">
                <p className="font-semibold text-foreground">Informações</p>
                <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                  <li>As marcas cadastradas aqui estarão disponíveis em todos os formulários de devoluções</li>
                  <li>As alterações só serão aplicadas após clicar em "Salvar Alterações"</li>
                  <li>Você pode adicionar ou remover marcas a qualquer momento</li>
                  <li>Deve haver pelo menos uma marca cadastrada</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
};

export default BrandsSettings;

