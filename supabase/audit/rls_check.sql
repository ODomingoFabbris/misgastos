-- Auditoría de seguridad de la base (Paso 6). Solo LEE: no modifica nada.
-- Se ejecuta en el SQL Editor de Supabase, bloque por bloque, y se comparan los
-- resultados con lo que dice "Esperado". Cualquier diferencia es un problema a corregir
-- con una migración nueva (0003...), nunca editando 0001 ni 0002.

-- 1) RLS activo en todas las tablas propias ---------------------------------------------
-- Esperado: rls_activo = true en categories, expenses, incomes, budgets,
-- recurring_items y settlements. Cualquier `false` expone la tabla.
select c.relname as tabla, c.relrowsecurity as rls_activo
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
order by c.relname;

-- 2) Políticas ---------------------------------------------------------------------------
-- Esperado: una política por tabla, cmd = ALL, roles = {authenticated},
-- y qual / with_check con (user_id = auth.uid()).
-- En expenses, recurring_items y budgets, el with_check también debe verificar que la
-- categoría pertenezca al mismo usuario. Ninguna política debe incluir el rol anon/public.
select tablename, policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;

-- 3) Tablas sin columna user_id ----------------------------------------------------------
-- Esperado: ninguna fila (toda tabla propia lleva user_id).
select c.relname as tabla_sin_user_id
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relkind = 'r'
  and not exists (
    select 1 from information_schema.columns col
    where col.table_schema = 'public' and col.table_name = c.relname and col.column_name = 'user_id'
  );

-- 4) Privilegios del rol anónimo ---------------------------------------------------------
-- Supabase da permisos amplios a anon por defecto; es seguro SOLO porque RLS está activo
-- y no hay políticas para anon (resultado del punto 2). Se lista para dejarlo a la vista.
select table_name, string_agg(privilege_type, ', ' order by privilege_type) as privilegios
from information_schema.role_table_grants
where table_schema = 'public' and grantee = 'anon'
group by table_name
order by table_name;

-- 5) Funciones: quién puede ejecutarlas --------------------------------------------------
-- Esperado:
--  - generate_recurring_expenses: security_definer = false, anon_puede = false, auth_puede = true.
--  - La función del disparador de usuarios nuevos (on_auth_user_created) suele ser
--    security_definer = true; lo deseable es que anon_puede sea false.
select p.proname as funcion,
       pg_get_function_identity_arguments(p.oid) as argumentos,
       p.prosecdef as security_definer,
       has_function_privilege('anon', p.oid, 'execute') as anon_puede,
       has_function_privilege('authenticated', p.oid, 'execute') as auth_puede
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
order by p.proname;

-- 6) Prueba de aislamiento entre usuarios (manual) -------------------------------------
-- Con DOS cuentas de prueba distintas:
--   a) En la app, con la cuenta A, cargar un gasto.
--   b) Reemplazar <UUID_B> por el id de la cuenta B (Authentication > Users) y ejecutar:
--
--      begin;
--      set local role authenticated;
--      set local request.jwt.claims = '{"sub":"<UUID_B>","role":"authenticated"}';
--      select count(*) as gastos_visibles_para_B from public.expenses;
--      rollback;
--
--   Esperado: solo los gastos de B (0 si B no cargó ninguno), nunca los de A.
