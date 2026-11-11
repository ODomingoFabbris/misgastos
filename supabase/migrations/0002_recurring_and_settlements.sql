-- 0002: gastos fijos automáticos y saldo con el hermano (Paso 5).
-- Se aplica una sola vez desde el SQL Editor de Supabase. No edita 0001: solo agrega.

-- 1) Seguimiento de la generación mensual de gastos fijos -------------------------------
-- Guarda el primer día del último mes para el que ya se generó el gasto. Así, si el usuario
-- borra a mano un gasto generado, no se vuelve a crear en ese mes.
alter table public.recurring_items
  add column if not exists last_generated_month date;

-- 2) Liquidaciones con el hermano --------------------------------------------------------
-- Cada fila es plata que el hermano devolvió. Saldo = suma de (amount_total - my_share) de los
-- gastos compartidos menos la suma de estas liquidaciones.
create table if not exists public.settlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  amount bigint not null check (amount > 0),
  settled_on date not null default (timezone('America/Argentina/Cordoba', now()))::date,
  note text check (note is null or char_length(note) <= 200),
  created_at timestamptz not null default now()
);

create index if not exists settlements_user_date_idx
  on public.settlements (user_id, settled_on desc);

alter table public.settlements enable row level security;

drop policy if exists "settlements: solo el dueño" on public.settlements;
create policy "settlements: solo el dueño"
  on public.settlements
  for all
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- 3) Generación de gastos fijos ----------------------------------------------------------
-- La llama la app al abrirse con la fecha de hoy en Córdoba. Para cada gasto fijo activo del
-- usuario cuyo día del mes ya llegó y que todavía no se generó este mes, inserta un gasto.
--
-- - Corre con los permisos del usuario (security invoker): rigen las reglas por fila (RLS).
-- - Es idempotente y segura ante llamadas simultáneas: el UPDATE bloquea la fila y la segunda
--   llamada ya ve `last_generated_month` actualizado.
-- - No genera hacia atrás: un gasto fijo creado después de su día de vencimiento empieza a
--   generarse el mes siguiente.
-- Devuelve la cantidad de gastos creados.
create or replace function public.generate_recurring_expenses(p_today date)
returns integer
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_month_start date := p_today - (extract(day from p_today)::int - 1);
  v_count integer;
begin
  if auth.uid() is null then
    raise exception 'No autenticado';
  end if;

  with due as (
    update public.recurring_items r
       set last_generated_month = v_month_start
     where r.user_id = auth.uid()
       and r.active
       and (r.last_generated_month is null or r.last_generated_month < v_month_start)
       and (v_month_start + (r.day_of_month - 1)) <= p_today
       and (v_month_start + (r.day_of_month - 1))
             >= (r.created_at at time zone 'America/Argentina/Cordoba')::date
    returning r.id, r.category_id, r.name, r.amount, r.is_shared, r.my_share,
              (v_month_start + (r.day_of_month - 1)) as due_on
  ), ins as (
    insert into public.expenses
      (category_id, amount_total, my_share, is_shared, spent_on, note, recurring_id)
    select d.category_id, d.amount, d.my_share, d.is_shared, d.due_on, left(d.name, 200), d.id
      from due d
    returning 1
  )
  select count(*) into v_count from ins;

  return v_count;
end;
$$;

revoke all on function public.generate_recurring_expenses(date) from public, anon;
grant execute on function public.generate_recurring_expenses(date) to authenticated;
