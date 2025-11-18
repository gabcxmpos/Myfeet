import React, { useState, useMemo } from 'react';
import { ChevronsUpDown, X } from 'lucide-react';
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

const MultiSelectFilter = ({ options, selected, onChange, placeholder, className }) => {
  const [open, setOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Garantir que selected seja sempre um array
  const selectedArray = Array.isArray(selected) ? selected : [];

  // Filtrar opções baseado no termo de busca
  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options;
    const term = searchTerm.toLowerCase();
    return options.filter(option => 
      option.label?.toLowerCase().includes(term) ||
      option.value?.toString().toLowerCase().includes(term)
    );
  }, [options, searchTerm]);

  const handleToggle = (value) => {
    const newSelected = new Set(selectedArray);
    if (newSelected.has(value)) {
      newSelected.delete(value);
    } else {
      newSelected.add(value);
    }
    onChange(Array.from(newSelected));
  };

  const handleClear = () => {
    onChange([]);
  };

  const selectedValues = options.filter(option => selectedArray.includes(option.value));

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
            {selectedValues.length > 0 ? (
              selectedValues.map(option => (
                <Badge
                  key={option.value}
                  variant="secondary"
                  className="rounded-sm px-1 font-normal"
                >
                  {option.label}
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
        <div data-popover-content className="flex flex-col max-h-[300px]">
          <div className="flex items-center border-b p-2 gap-2">
            <Input
              placeholder="Pesquisar..."
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
            {filteredOptions.length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                Nenhum resultado encontrado.
              </div>
            ) : (
              <div className="space-y-1">
                {filteredOptions.map((option) => {
                  const isSelected = selectedArray.includes(option.value);
                  return (
                    <div
                      key={option.value}
                      className="flex items-center space-x-2 p-2 rounded-md hover:bg-accent cursor-pointer"
                      onClick={() => handleToggle(option.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleToggle(option.value);
                        }
                      }}
                      tabIndex={0}
                      role="checkbox"
                      aria-checked={isSelected}
                    >
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => handleToggle(option.value)}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <label
                        className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {option.label}
                      </label>
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

export default MultiSelectFilter;
