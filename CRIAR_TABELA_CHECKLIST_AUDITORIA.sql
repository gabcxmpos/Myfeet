-- Cria tabela para registrar auditorias dos checklists (operacional/gerencial)
create table if not exists public.checklist_audits (
    id uuid default gen_random_uuid() primary key,
    store_id uuid not null references public.stores(id) on delete cascade,
    date date not null,
    checklist_type text not null default 'operacional',
    audited_by uuid null references auth.users(id) on delete set null,
    audited_by_name text null,
    created_at timestamptz not null default timezone('utc', now()),
    updated_at timestamptz not null default timezone('utc', now())
);

-- Evita duplicidade por loja/data/tipo de checklist
create unique index if not exists checklist_audits_store_date_type_idx
    on public.checklist_audits (store_id, date, checklist_type);

-- Trigger para atualizar updated_at automaticamente
create or replace function public.set_updated_at_timestamp()
returns trigger as $$
begin
  new.updated_at = timezone('utc', now());
  return new;
end;
$$ language plpgsql;

drop trigger if exists checklist_audits_set_updated_at on public.checklist_audits;
create trigger checklist_audits_set_updated_at
before update on public.checklist_audits
for each row
execute procedure public.set_updated_at_timestamp();



