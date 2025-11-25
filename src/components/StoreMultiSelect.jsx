import React, { useState, useMemo } from 'react';
import { ChevronsUpDown, X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';

const StoreMultiSelect = ({ stores, selected, onChange, placeholder, className }) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Garantir que selected seja sempre um array
  const selectedArray = Array.isArray(selected) ? selected : [];

  // Filtrar lojas baseado no termo de busca
  const filteredStores = useMemo(() => {
    if (!searchTerm) return stores;
    const term = searchTerm.toLowerCase();
    return stores.filter(store => 
      store.name?.toLowerCase().includes(term) ||
      store.code?.toLowerCase().includes(term) ||
      store.bandeira?.toLowerCase().includes(term)
    );
  }, [stores, searchTerm]);

  // Agrupar lojas filtradas por bandeira
  const filteredStoresByBandeira = useMemo(() => {
    const grouped = {};
    filteredStores.forEach(store => {
      const bandeira = store.bandeira || 'Sem Bandeira';
      if (!grouped[bandeira]) {
        grouped[bandeira] = [];
      }
      grouped[bandeira].push(store);
    });
    return grouped;
  }, [filteredStores]);

  const handleToggle = (storeId) => {
    const newSelected = new Set(selectedArray);
    if (newSelected.has(storeId)) {
      newSelected.delete(storeId);
    } else {
      newSelected.add(storeId);
    }
    onChange(Array.from(newSelected));
  };

  const handleSelectAllByBandeira = (bandeira) => {
    const storesInBandeira = stores.filter(s => s.bandeira === bandeira);
    const storeIdsInBandeira = storesInBandeira.map(s => s.id);
    const allSelected = storeIdsInBandeira.every(id => selectedArray.includes(id));
    
    const newSelected = new Set(selectedArray);
    if (allSelected) {
      // Desmarcar todas
      storeIdsInBandeira.forEach(id => newSelected.delete(id));
    } else {
      // Marcar todas
      storeIdsInBandeira.forEach(id => newSelected.add(id));
    }
    onChange(Array.from(newSelected));
  };

  const handleClear = () => {
    onChange([]);
  };

  const selectedStores = stores.filter(store => selectedArray.includes(store.id));

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("w-full justify-between bg-card border-border h-auto min-h-10", className)}
        >
          <div className="flex gap-1 flex-wrap">
            {selectedStores.length > 0 ? (
              selectedStores.map(store => (
                <Badge
                  key={store.id}
                  variant="secondary"
                  className="rounded-sm px-1 font-normal flex items-center gap-1"
                >
                  <span>{store.code || store.name}</span>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleToggle(store.id);
                    }}
                    className="ml-1 hover:bg-destructive/20 rounded-full p-0.5"
                    title="Remover"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))
            ) : (
              <span className="text-muted-foreground">{placeholder}</span>
            )}
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent 
        className="w-[--radix-popover-trigger-width] p-0"
        onInteractOutside={(e) => {
          // Não fechar ao clicar dentro do popover
          if (e.target.closest('[data-popover-content]')) {
            e.preventDefault();
          }
        }}
      >
        <div data-popover-content className="flex flex-col max-h-[400px]">
          <div className="flex items-center border-b p-2 gap-2">
            <Input
              placeholder="Buscar loja..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 h-8"
            />
            {selectedArray.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 text-xs"
                onClick={handleClear}
                type="button"
              >
                Limpar
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => setOpen(false)}
              type="button"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <div className="overflow-y-auto p-2">
            {Object.keys(filteredStoresByBandeira).length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                Nenhuma loja encontrada.
              </div>
            ) : (
              <div className="space-y-2">
                {Object.entries(filteredStoresByBandeira).map(([bandeira, bandeiraStores]) => {
                  const allSelected = bandeiraStores.every(s => selectedArray.includes(s.id));
                  const someSelected = bandeiraStores.some(s => selectedArray.includes(s.id));
                  
                  return (
                    <div key={bandeira} className="space-y-1">
                      <div
                        className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer font-semibold"
                        onClick={() => handleSelectAllByBandeira(bandeira)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSelectAllByBandeira(bandeira);
                          }
                        }}
                        tabIndex={0}
                        role="checkbox"
                        aria-checked={allSelected}
                      >
                        <Checkbox
                          checked={allSelected}
                          onCheckedChange={() => handleSelectAllByBandeira(bandeira)}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <label
                          className="text-sm font-semibold leading-none cursor-pointer flex-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {allSelected ? 'Desmarcar' : 'Selecionar'} Todas as {bandeira}
                        </label>
                      </div>
                      {bandeiraStores.map((store) => {
                        const isSelected = selectedArray.includes(store.id);
                        return (
                          <div
                            key={store.id}
                            className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer ml-4"
                            onClick={() => handleToggle(store.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                handleToggle(store.id);
                              }
                            }}
                            tabIndex={0}
                            role="checkbox"
                            aria-checked={isSelected}
                          >
                            <Checkbox
                              checked={isSelected}
                              onCheckedChange={() => handleToggle(store.id)}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <div className="flex flex-col flex-1">
                              <label
                                className="text-sm font-medium leading-none cursor-pointer"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {store.name}
                              </label>
                              <span className="text-xs text-muted-foreground">
                                {store.code} - {store.bandeira}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default StoreMultiSelect;
