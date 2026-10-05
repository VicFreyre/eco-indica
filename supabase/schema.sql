-- ============================================================
-- ECO INDICA — schema completo (rodar no SQL Editor do Supabase)
-- ============================================================

-- ---------- ENUMS ----------
do $$ begin create type public.app_role as enum ('indicador','admin'); exception when duplicate_object then null; end $$;
do $$ begin create type public.tipo_indicacao as enum ('pesquisador','empresa'); exception when duplicate_object then null; end $$;
do $$ begin create type public.tipo_movimentacao as enum ('entrada','saida'); exception when duplicate_object then null; end $$;

-- ---------- PROFILES ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nome_completo text not null,
  email text not null,
  cpf text not null unique,
  role public.app_role not null default 'indicador',
  telefone text,
  chave_pix text,
  created_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

-- ---------- CONFIGURACAO DE BONIFICACOES ----------
create table if not exists public.configuracoes_bonificacao (
  id smallint primary key default 1 check (id = 1),
  valor_pesquisador numeric(12,2) not null default 20.00 check (valor_pesquisador >= 0),
  valor_empresa numeric(12,2) not null default 50.00 check (valor_empresa >= 0),
  updated_at timestamptz not null default now()
);
insert into public.configuracoes_bonificacao (id)
values (1)
on conflict (id) do nothing;
grant select on public.configuracoes_bonificacao to anon, authenticated;
grant update on public.configuracoes_bonificacao to authenticated;
grant all on public.configuracoes_bonificacao to service_role;
alter table public.configuracoes_bonificacao enable row level security;

-- ---------- USER ROLES (fonte de verdade de permissão) ----------
create table if not exists public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(auth.uid(), 'admin')
$$;

-- espelha user_roles em profiles.role (apenas exibição)
create or replace function public.sync_profile_role()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.profiles
     set role = case when public.has_role(new.user_id,'admin') then 'admin'::public.app_role else 'indicador'::public.app_role end
   where id = new.user_id;
  return new;
end $$;
drop trigger if exists trg_sync_profile_role on public.user_roles;
create trigger trg_sync_profile_role after insert or update on public.user_roles
for each row execute function public.sync_profile_role();

-- ---------- INDICACOES ----------
create table if not exists public.indicacoes (
  id uuid primary key default gen_random_uuid(),
  indicador_id uuid not null references public.profiles(id) on delete cascade,
  tipo public.tipo_indicacao not null,
  status text not null,
  data_registro timestamptz not null default now(),
  validade date,
  autorreferencia boolean not null default false,
  suspeita_fraude boolean not null default false,
  duplicada_de uuid references public.indicacoes(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_indicacoes_indicador on public.indicacoes(indicador_id);
create index if not exists idx_indicacoes_status on public.indicacoes(status);
create index if not exists idx_indicacoes_tipo on public.indicacoes(tipo);
create index if not exists idx_indicacoes_data on public.indicacoes(data_registro desc);
grant select, insert on public.indicacoes to authenticated;
grant all on public.indicacoes to service_role;
alter table public.indicacoes enable row level security;

-- ---------- INDICACAO PESQUISADOR ----------
create table if not exists public.indicacao_pesquisador (
  id uuid primary key default gen_random_uuid(),
  indicacao_id uuid not null unique references public.indicacoes(id) on delete cascade,
  nome text not null,
  jornada text not null,
  telefone text not null,
  email text not null,
  cidade text not null,
  estado text not null,
  observacoes text
);
alter table public.indicacao_pesquisador
  drop constraint if exists indicacao_pesquisador_jornada_check;
create index if not exists idx_pesq_email on public.indicacao_pesquisador(lower(email));
create index if not exists idx_pesq_tel on public.indicacao_pesquisador(telefone);
grant select, insert on public.indicacao_pesquisador to authenticated;
grant all on public.indicacao_pesquisador to service_role;
alter table public.indicacao_pesquisador enable row level security;

-- ---------- INDICACAO EMPRESA ----------
create table if not exists public.indicacao_empresa (
  id uuid primary key default gen_random_uuid(),
  indicacao_id uuid not null unique references public.indicacoes(id) on delete cascade,
  nome_empresa text not null,
  cnpj text not null,
  segmento text not null,
  cidade text not null,
  estado text not null,
  site_instagram text,
  unidades integer,
  responsavel_nome text not null,
  responsavel_cargo text,
  telefone text not null,
  email text not null,
  possui_contato boolean not null default false,
  como_conhece text,
  solucao_interesse text,
  observacoes text
);
create index if not exists idx_emp_cnpj on public.indicacao_empresa(cnpj);
create index if not exists idx_emp_nome on public.indicacao_empresa(lower(nome_empresa));
grant select, insert on public.indicacao_empresa to authenticated;
grant all on public.indicacao_empresa to service_role;
alter table public.indicacao_empresa enable row level security;

-- ---------- OPORTUNIDADES COMERCIAIS ----------
create table if not exists public.oportunidades_comerciais (
  id uuid primary key default gen_random_uuid(),
  indicacao_id uuid not null unique references public.indicacoes(id) on delete cascade,
  responsavel_id uuid references public.profiles(id),
  responsavel_nome text,
  status text not null default 'Nova',
  contatos text,
  proposta text,
  negociacao text,
  fechamento text,
  data_fechamento date,
  observacoes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select on public.oportunidades_comerciais to authenticated;
grant all on public.oportunidades_comerciais to service_role;
alter table public.oportunidades_comerciais enable row level security;

-- ---------- BONIFICACOES ----------
create table if not exists public.bonificacoes (
  id uuid primary key default gen_random_uuid(),
  indicacao_id uuid not null unique references public.indicacoes(id) on delete cascade,
  indicador_id uuid not null references public.profiles(id) on delete cascade,
  valor numeric(12,2) not null,
  status text not null default 'Pendente',
  data_aprovacao timestamptz,
  data_pagamento timestamptz,
  observacoes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_bonif_indicador on public.bonificacoes(indicador_id);
create index if not exists idx_bonif_status on public.bonificacoes(status);
grant select on public.bonificacoes to authenticated;
grant all on public.bonificacoes to service_role;
alter table public.bonificacoes enable row level security;

-- ---------- MOVIMENTACOES FINANCEIRAS ----------
create table if not exists public.movimentacoes_financeiras (
  id uuid primary key default gen_random_uuid(),
  tipo public.tipo_movimentacao not null,
  categoria text not null,
  descricao text not null,
  valor numeric(12,2) not null,
  data date not null default current_date,
  status text not null default 'Pendente',
  indicador_id uuid references public.profiles(id) on delete set null,
  indicacao_id uuid references public.indicacoes(id) on delete set null,
  observacoes text,
  created_at timestamptz not null default now()
);
create index if not exists idx_mov_indicador on public.movimentacoes_financeiras(indicador_id);
create index if not exists idx_mov_data on public.movimentacoes_financeiras(data desc);
grant select on public.movimentacoes_financeiras to authenticated;
grant all on public.movimentacoes_financeiras to service_role;
alter table public.movimentacoes_financeiras enable row level security;

-- ---------- HISTORICO ----------
create table if not exists public.historico_indicacoes (
  id uuid primary key default gen_random_uuid(),
  indicacao_id uuid not null references public.indicacoes(id) on delete cascade,
  usuario_id uuid references public.profiles(id) on delete set null,
  status_anterior text,
  status_novo text,
  observacao text,
  created_at timestamptz not null default now()
);
create index if not exists idx_hist_indicacao on public.historico_indicacoes(indicacao_id, created_at desc);
grant select on public.historico_indicacoes to authenticated;
grant all on public.historico_indicacoes to service_role;
alter table public.historico_indicacoes enable row level security;

-- ---------- NOTIFICACOES ----------
create table if not exists public.notificacoes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  titulo text not null,
  mensagem text not null,
  indicacao_id uuid references public.indicacoes(id) on delete cascade,
  lida boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists idx_notif_user on public.notificacoes(user_id, lida, created_at desc);
grant select, update on public.notificacoes to authenticated;
grant all on public.notificacoes to service_role;
alter table public.notificacoes enable row level security;

-- ============================================================
-- POLICIES
-- ============================================================
drop policy if exists "config_bonificacao_read" on public.configuracoes_bonificacao;
create policy "config_bonificacao_read" on public.configuracoes_bonificacao for select to anon, authenticated
  using (true);
drop policy if exists "config_bonificacao_update_admin" on public.configuracoes_bonificacao;
create policy "config_bonificacao_update_admin" on public.configuracoes_bonificacao for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "profiles_select" on public.profiles;
create policy "profiles_select" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own" on public.profiles for update to authenticated
  using (id = auth.uid() or public.is_admin()) with check (id = auth.uid() or public.is_admin());

drop policy if exists "roles_select" on public.user_roles;
create policy "roles_select" on public.user_roles for select to authenticated
  using (user_id = auth.uid() or public.is_admin());

drop policy if exists "ind_select" on public.indicacoes;
create policy "ind_select" on public.indicacoes for select to authenticated
  using (indicador_id = auth.uid() or public.is_admin());
drop policy if exists "ind_insert" on public.indicacoes;
create policy "ind_insert" on public.indicacoes for insert to authenticated
  with check (indicador_id = auth.uid());
drop policy if exists "ind_update_admin" on public.indicacoes;
create policy "ind_update_admin" on public.indicacoes for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create or replace function public.owns_indicacao(_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.indicacoes i where i.id = _id and i.indicador_id = auth.uid())
$$;

drop policy if exists "pesq_select" on public.indicacao_pesquisador;
create policy "pesq_select" on public.indicacao_pesquisador for select to authenticated
  using (public.owns_indicacao(indicacao_id) or public.is_admin());
drop policy if exists "pesq_insert" on public.indicacao_pesquisador;
create policy "pesq_insert" on public.indicacao_pesquisador for insert to authenticated
  with check (public.owns_indicacao(indicacao_id));

drop policy if exists "emp_select" on public.indicacao_empresa;
create policy "emp_select" on public.indicacao_empresa for select to authenticated
  using (public.owns_indicacao(indicacao_id) or public.is_admin());
drop policy if exists "emp_insert" on public.indicacao_empresa;
create policy "emp_insert" on public.indicacao_empresa for insert to authenticated
  with check (public.owns_indicacao(indicacao_id));

drop policy if exists "op_select" on public.oportunidades_comerciais;
create policy "op_select" on public.oportunidades_comerciais for select to authenticated
  using (public.owns_indicacao(indicacao_id) or public.is_admin());
drop policy if exists "op_all_admin" on public.oportunidades_comerciais;
create policy "op_all_admin" on public.oportunidades_comerciais for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "bonif_select" on public.bonificacoes;
create policy "bonif_select" on public.bonificacoes for select to authenticated
  using (indicador_id = auth.uid() or public.is_admin());
drop policy if exists "bonif_all_admin" on public.bonificacoes;
create policy "bonif_all_admin" on public.bonificacoes for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "mov_select" on public.movimentacoes_financeiras;
create policy "mov_select" on public.movimentacoes_financeiras for select to authenticated
  using (public.is_admin() or (indicador_id = auth.uid()));
drop policy if exists "mov_all_admin" on public.movimentacoes_financeiras;
create policy "mov_all_admin" on public.movimentacoes_financeiras for all to authenticated
  using (public.is_admin()) with check (public.is_admin());

drop policy if exists "hist_select" on public.historico_indicacoes;
create policy "hist_select" on public.historico_indicacoes for select to authenticated
  using (public.owns_indicacao(indicacao_id) or public.is_admin());
drop policy if exists "hist_insert_admin" on public.historico_indicacoes;
create policy "hist_insert_admin" on public.historico_indicacoes for insert to authenticated
  with check (public.is_admin());

drop policy if exists "notif_select" on public.notificacoes;
create policy "notif_select" on public.notificacoes for select to authenticated
  using (user_id = auth.uid());
drop policy if exists "notif_update" on public.notificacoes;
create policy "notif_update" on public.notificacoes for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- ============================================================
-- TRIGGERS / AUTOMACOES
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, nome_completo, email, cpf)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'nome_completo','Sem nome'),
    new.email,
    coalesce(new.raw_user_meta_data->>'cpf', replace(new.id::text,'-',''))
  )
  on conflict (id) do nothing;
  insert into public.user_roles (user_id, role) values (new.id,'indicador')
  on conflict do nothing;
  return new;
end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.handle_new_user();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
drop trigger if exists trg_touch_indicacoes on public.indicacoes;
create trigger trg_touch_indicacoes before update on public.indicacoes
for each row execute function public.touch_updated_at();
drop trigger if exists trg_touch_op on public.oportunidades_comerciais;
create trigger trg_touch_op before update on public.oportunidades_comerciais
for each row execute function public.touch_updated_at();
drop trigger if exists trg_touch_config_bonificacao on public.configuracoes_bonificacao;
create trigger trg_touch_config_bonificacao before update on public.configuracoes_bonificacao
for each row execute function public.touch_updated_at();

-- cria bonificação pendente + histórico + notificação ao registrar indicação
create or replace function public.after_indicacao_insert()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_valor numeric(12,2);
begin
  select case
    when new.tipo = 'pesquisador' then valor_pesquisador
    else valor_empresa
  end
  into v_valor
  from public.configuracoes_bonificacao
  where id = 1;

  if not found then
    raise exception 'A configuração de bonificações não foi encontrada.';
  end if;

  insert into public.bonificacoes (indicacao_id, indicador_id, valor, status)
  values (new.id, new.indicador_id, v_valor, 'Pendente') on conflict do nothing;

  if new.tipo = 'empresa' then
    insert into public.oportunidades_comerciais (indicacao_id, status) values (new.id, new.status)
    on conflict do nothing;
  end if;

  insert into public.historico_indicacoes (indicacao_id, usuario_id, status_anterior, status_novo, observacao)
  values (new.id, new.indicador_id, null, new.status, 'Indicação registrada');

  insert into public.notificacoes (user_id, titulo, mensagem, indicacao_id)
  values (new.indicador_id, 'Indicação recebida',
          'Sua indicação foi registrada com sucesso e está em análise.', new.id);
  return new;
end $$;
drop trigger if exists trg_after_indicacao_insert on public.indicacoes;
create trigger trg_after_indicacao_insert after insert on public.indicacoes
for each row execute function public.after_indicacao_insert();

-- histórico + notificação em mudança de status
create or replace function public.after_indicacao_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into public.historico_indicacoes (indicacao_id, usuario_id, status_anterior, status_novo)
    values (new.id, auth.uid(), old.status, new.status);
    insert into public.notificacoes (user_id, titulo, mensagem, indicacao_id)
    values (new.indicador_id, 'Status atualizado',
            'Sua indicação mudou para: ' || new.status, new.id);
  end if;
  return new;
end $$;
drop trigger if exists trg_after_indicacao_update on public.indicacoes;
create trigger trg_after_indicacao_update after update on public.indicacoes
for each row execute function public.after_indicacao_update();

-- notificações e lançamento financeiro das bonificações
create or replace function public.after_bonificacao_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    insert into public.notificacoes (user_id, titulo, mensagem, indicacao_id)
    values (new.indicador_id,
            case new.status when 'Aprovada' then 'Bonificação aprovada'
                            when 'Paga' then 'Bonificação paga'
                            else 'Bonificação atualizada' end,
            'Bonificação de R$ ' || to_char(new.valor,'FM999990.00') || ' — ' || new.status,
            new.indicacao_id);
    if new.status = 'Paga' then
      insert into public.movimentacoes_financeiras (tipo, categoria, descricao, valor, data, status, indicador_id, indicacao_id)
      values ('saida','Bonificação','Pagamento de bonificação ao indicador', new.valor,
              coalesce(new.data_pagamento::date, current_date), 'Pago', new.indicador_id, new.indicacao_id);
    end if;
  end if;
  return new;
end $$;
drop trigger if exists trg_after_bonificacao_update on public.bonificacoes;
create trigger trg_after_bonificacao_update after update on public.bonificacoes
for each row execute function public.after_bonificacao_update();

-- autorreferência e duplicidade (pesquisador)
create or replace function public.check_pesquisador()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_ind uuid; v_email text; v_dup uuid;
begin
  select indicador_id into v_ind from public.indicacoes where id = new.indicacao_id;
  select lower(email) into v_email from public.profiles where id = v_ind;
  if v_email = lower(new.email) then
    update public.indicacoes set autorreferencia = true, suspeita_fraude = true where id = new.indicacao_id;
  end if;
  select p.indicacao_id into v_dup from public.indicacao_pesquisador p
    join public.indicacoes i on i.id = p.indicacao_id
   where (lower(p.email) = lower(new.email) or p.telefone = new.telefone)
     and p.indicacao_id <> new.indicacao_id
   order by i.data_registro asc limit 1;
  if v_dup is not null then
    update public.indicacoes set duplicada_de = v_dup where id = new.indicacao_id;
  end if;
  return new;
end $$;
drop trigger if exists trg_check_pesquisador on public.indicacao_pesquisador;
create trigger trg_check_pesquisador after insert on public.indicacao_pesquisador
for each row execute function public.check_pesquisador();

-- autorreferência e duplicidade (empresa)
create or replace function public.check_empresa()
returns trigger language plpgsql security definer set search_path = public as $$
declare v_ind uuid; v_email text; v_dup uuid;
begin
  select indicador_id into v_ind from public.indicacoes where id = new.indicacao_id;
  select lower(email) into v_email from public.profiles where id = v_ind;
  if v_email = lower(new.email) then
    update public.indicacoes set autorreferencia = true where id = new.indicacao_id;
  end if;
  select e.indicacao_id into v_dup from public.indicacao_empresa e
    join public.indicacoes i on i.id = e.indicacao_id
   where regexp_replace(e.cnpj,'\D','','g') = regexp_replace(new.cnpj,'\D','','g')
     and e.indicacao_id <> new.indicacao_id
   order by i.data_registro asc limit 1;
  if v_dup is not null then
    update public.indicacoes set duplicada_de = v_dup, status = 'Duplicada' where id = new.indicacao_id;
  end if;
  return new;
end $$;
drop trigger if exists trg_check_empresa on public.indicacao_empresa;
create trigger trg_check_empresa after insert on public.indicacao_empresa
for each row execute function public.check_empresa();

-- ============================================================
-- PROMOVER ADMIN (troque o e-mail)
-- ============================================================
-- insert into public.user_roles (user_id, role)
-- select id, 'admin' from auth.users where email = 'seu-email@exemplo.com'
-- on conflict do nothing;
