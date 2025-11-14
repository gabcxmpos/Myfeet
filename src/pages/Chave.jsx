import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useAuth } from '@/contexts/SupabaseAuthContext';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Save } from 'lucide-react';
import { motion } from 'framer-motion';

const Chave = () => {
    const { user } = useAuth();
    const { chaveContent, updateChaveContent } = useData();
    const { toast } = useToast();
    // Garantir que content nunca seja undefined ou null
    const [content, setContent] = useState(chaveContent || '');
    const [isEditing, setIsEditing] = useState(false);

    const isAdmin = user?.role === 'admin';

    useEffect(() => {
        // Garantir que sempre tenha um valor string
        setContent(chaveContent || '');
    }, [chaveContent]);

    const handleSave = () => {
        updateChaveContent(content);
        setIsEditing(false);
        toast({
            title: "Sucesso!",
            description: "Conteúdo da página CHAVE atualizado.",
        });
    };

    return (
        <>
            <Helmet><title>CHAVE - A Jornada do Cliente - MYFEET</title></Helmet>
            <div className="space-y-8 max-w-5xl mx-auto">
                <motion.div 
                    className="rounded-xl overflow-hidden shadow-2xl border border-border/50"
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <img alt="Jornada de Atendimento CHAVE"
                        className="w-full h-auto object-contain" src="https://horizons-cdn.hostinger.com/2a1a9cc4-20e5-4b6b-b3bc-5a324fe603e6/e63e6e6940c9558e3ef10c9c371d8e71.jpg" />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-card p-8 rounded-xl shadow-lg border border-border"
                >
                    <h2 className="text-2xl font-bold text-foreground mb-4">Detalhes da Jornada</h2>
                    {isAdmin && !isEditing ? (
                        <div 
                            className="prose prose-invert max-w-none text-muted-foreground" 
                            dangerouslySetInnerHTML={{ 
                                __html: (content || '').replace(/\n/g, '<br />').replace(/### (.*)/g, '<h3>$1</h3>') 
                            }} 
                        />
                    ) : isAdmin && isEditing ? (
                        <Textarea
                            value={content || ''}
                            onChange={(e) => setContent(e.target.value)}
                            className="w-full min-h-[300px] bg-secondary text-base leading-relaxed"
                            autoFocus
                        />
                    ) : (
                         <div 
                            className="prose prose-invert max-w-none text-muted-foreground" 
                            dangerouslySetInnerHTML={{ 
                                __html: (content || '').replace(/\n/g, '<br />').replace(/### (.*)/g, '<h3>$1</h3>') 
                            }} 
                        />
                    )}

                    {isAdmin && (
                        <div className="mt-6 text-right">
                            {isEditing ? (
                                <div className="flex gap-2 justify-end">
                                    <Button variant="ghost" onClick={() => { setIsEditing(false); setContent(chaveContent || ''); }}>Cancelar</Button>
                                    <Button onClick={handleSave} className="gap-2">
                                        <Save className="w-4 h-4" /> Salvar
                                    </Button>
                                </div>
                            ) : (
                                <Button onClick={() => setIsEditing(true)}>Editar Conteúdo</Button>
                            )}
                        </div>
                    )}
                </motion.div>
            </div>
        </>
    );
};

export default Chave;