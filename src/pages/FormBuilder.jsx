
import React, { useState } from 'react';
import { Helmet } from 'react-helmet';
import { useData } from '@/contexts/DataContext';
import { useToast } from '@/components/ui/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, FileText, Check, AlignLeft, CheckSquare, List, Star, Edit, MoreVertical, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

const questionTypes = [
    { type: 'multiple-choice', label: 'Múltipla Escolha', icon: List },
    { type: 'checkbox', label: 'Caixa de Seleção', icon: CheckSquare },
    { type: 'text', label: 'Caixa de Texto', icon: AlignLeft },
    { type: 'satisfaction', label: 'Régua de Satisfação', icon: Star },
];

const FormEditor = ({ initialForm, onSave, onCancel }) => {
    const [formTitle, setFormTitle] = useState(initialForm?.title || '');
    const [pillar, setPillar] = useState(initialForm?.pillar || '');
    const [questions, setQuestions] = useState(initialForm?.questions || [{ id: Date.now(), type: 'satisfaction', text: '', subtitle: '' }]);
    const { toast } = useToast();
    
    const addQuestion = (type) => {
        let newQuestion;
        switch(type) {
            case 'text':
                newQuestion = { id: Date.now(), type: 'text', text: '', subtitle: '' };
                break;
            case 'satisfaction':
                newQuestion = { id: Date.now(), type: 'satisfaction', text: '', subtitle: '' };
                break;
            default:
                newQuestion = { id: Date.now(), type, text: '', subtitle: '', options: [{ text: '', value: 0 }] };
        }
        setQuestions([...questions, newQuestion]);
    };

    const handleQuestionChange = (id, field, value) => {
        setQuestions(questions.map(q => q.id === id ? { ...q, [field]: value } : q));
    };

    const handleRemoveQuestion = (id) => {
        setQuestions(questions.filter(q => q.id !== id));
    };
    
    const handleOptionChange = (qId, oIndex, field, value) => {
        setQuestions(questions.map(q => {
            if (q.id === qId) {
                const updatedOptions = q.options.map((opt, index) => index === oIndex ? {...opt, [field]: value} : opt);
                return {...q, options: updatedOptions};
            }
            return q;
        }));
    };

    const addOption = (qId) => {
        setQuestions(questions.map(q => q.id === qId ? {...q, options: [...q.options, {text: '', value: 0}] } : q));
    };
    
    const removeOption = (qId, oIndex) => {
        setQuestions(questions.map(q => {
            if (q.id === qId) {
                return {...q, options: q.options.filter((_, index) => index !== oIndex) };
            }
            return q;
        }));
    };
    
    const handleSubmit = (e) => {
        e.preventDefault();
        if (!formTitle || !pillar || questions.some(q => !q.text)) {
            toast({ title: 'Erro', description: 'Preencha todos os campos obrigatórios.', variant: 'destructive'});
            return;
        }
        onSave({ id: initialForm?.id, title: formTitle, pillar, questions });
    };

    return (
        <DialogContent className="max-w-4xl bg-card border-border">
            <DialogHeader><DialogTitle>{initialForm ? 'Editar' : 'Criar'} Formulário</DialogTitle></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-6 mt-4 max-h-[80vh] overflow-y-auto pr-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="formTitle">Título do Formulário</Label>
                        <Input id="formTitle" value={formTitle} onChange={e => setFormTitle(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pillar">Pilar</Label>
                        <Select onValueChange={setPillar} value={pillar} required>
                            <SelectTrigger><SelectValue placeholder="Selecione um pilar..." /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Pessoas">Pessoas</SelectItem>
                                <SelectItem value="Ambientação">Ambientação</SelectItem>
                                <SelectItem value="Digital">Digital</SelectItem>
                                <SelectItem value="Performance">Performance</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <AnimatePresence>
                {questions.map((q, qIndex) => (
                    <motion.div 
                        key={q.id} layout
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -300 }}
                        className="p-4 border border-secondary rounded-lg bg-background/50 space-y-3"
                    >
                        <div className="flex justify-between items-center">
                            <Label className="font-semibold text-foreground">Pergunta {qIndex + 1}</Label>
                            <Button type="button" variant="ghost" size="sm" onClick={() => handleRemoveQuestion(q.id)}><Trash2 className="w-4 h-4 text-destructive"/></Button>
                        </div>
                        <Input value={q.text} onChange={e => handleQuestionChange(q.id, 'text', e.target.value)} placeholder="Título da Pergunta (Ex: Limpeza)" required/>
                        <Input value={q.subtitle} onChange={e => handleQuestionChange(q.id, 'subtitle', e.target.value)} placeholder="Subtítulo/Pergunta detalhada (Ex: A loja estava limpa?)" />
                        
                         {(q.type === 'multiple-choice' || q.type === 'checkbox') && (
                            <div className="space-y-2 pt-2">
                                <Label className="text-xs text-muted-foreground">Opções de Resposta</Label>
                                {q.options.map((opt, oIndex) => (
                                    <div key={oIndex} className="flex items-center gap-2">
                                        <Input value={opt.text} onChange={(e) => handleOptionChange(q.id, oIndex, 'text', e.target.value)} placeholder={`Opção ${oIndex + 1}`} className="flex-grow bg-secondary/50"/>
                                        <Input type="number" value={opt.value} onChange={(e) => handleOptionChange(q.id, oIndex, 'value', parseInt(e.target.value) || 0)} className="w-20 bg-secondary/50" placeholder="Valor"/>
                                        <Button type="button" variant="ghost" size="icon" onClick={() => removeOption(q.id, oIndex)}><Minus className="w-4 h-4 text-muted-foreground"/></Button>
                                    </div>
                                ))}
                                <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => addOption(q.id)}><Plus className="w-4 h-4"/>Adicionar Opção</Button>
                            </div>
                        )}

                    </motion.div>
                ))}
                </AnimatePresence>

                <div className="flex flex-wrap gap-2 justify-center pt-4">
                    {questionTypes.map(({type, label, icon: Icon}) => (
                        <Button key={type} type="button" onClick={() => addQuestion(type)} variant="outline" className="gap-2">
                            <Icon className="w-4 h-4"/> {label}
                        </Button>
                    ))}
                </div>

                <div className="flex justify-end gap-2 pt-4">
                    <Button type="button" variant="ghost" onClick={onCancel}>Cancelar</Button>
                    <Button type="submit"><Check className="w-4 h-4 mr-2" />Salvar Formulário</Button>
                </div>
            </form>
        </DialogContent>
    );
};


const FormBuilder = () => {
    const { forms, saveForm, updateForm, deleteForm } = useData();
    const { toast } = useToast();
    const [editorOpen, setEditorOpen] = useState(false);
    const [editingForm, setEditingForm] = useState(null);

    const handleSave = (formData) => {
        if(formData.id) {
            updateForm(formData.id, formData);
            toast({ title: 'Sucesso!', description: 'Formulário atualizado!' });
        } else {
            saveForm(formData);
            toast({ title: 'Sucesso!', description: 'Formulário criado!' });
        }
        setEditorOpen(false);
        setEditingForm(null);
    };

    const handleDelete = (id) => {
        if(window.confirm('Tem certeza que deseja excluir este formulário?')) {
            deleteForm(id);
            toast({ title: 'Excluído!', description: 'Formulário removido.', variant: 'destructive' });
        }
    }
    
    return (
        <>
            <Helmet>
                <title>Criar Formulário - MYFEET</title>
                <meta name="description" content="Crie e gerencie formulários de avaliação personalizados." />
            </Helmet>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Gerenciador de Formulários</h1>
                        <p className="text-muted-foreground mt-1">Crie, edite e remova formulários de avaliação.</p>
                    </div>
                    <Button onClick={() => { setEditingForm(null); setEditorOpen(true); }} className="gap-2">
                        <PlusCircle className="w-4 h-4" /> Criar Novo
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {forms.map(form => (
                        <motion.div 
                            key={form.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-card rounded-lg p-5 border-l-4 border-primary flex flex-col justify-between"
                        >
                            <div>
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-lg text-foreground">{form.title}</h3>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" className="w-8 h-8"><MoreVertical className="w-4 h-4" /></Button></DropdownMenuTrigger>
                                        <DropdownMenuContent>
                                            <DropdownMenuItem onClick={() => { setEditingForm(form); setEditorOpen(true); }}><Edit className="w-4 h-4 mr-2" />Editar</DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDelete(form.id)} className="text-destructive focus:text-destructive"><Trash2 className="w-4 h-4 mr-2" />Excluir</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <p className="text-sm text-primary font-semibold">{form.pillar}</p>
                                <p className="text-xs text-muted-foreground mt-2">{form.questions.length} perguntas</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
            
            <Dialog open={editorOpen} onOpenChange={setEditorOpen}>
                {editorOpen && <FormEditor initialForm={editingForm} onSave={handleSave} onCancel={() => setEditorOpen(false)} />}
            </Dialog>
        </>
    )
}

export default FormBuilder;
