-- Transportes Hermanos Ordaz — base de datos de viajes
-- Pegar completo en Supabase → SQL Editor → Run.

-- 1. Choferes autorizados -------------------------------------------------
-- Solo los usuarios que estén en esta tabla pueden ver y aceptar viajes.
create table if not exists public.drivers (
  user_id uuid primary key references auth.users (id) on delete cascade,
  name    text not null,
  phone   text not null
);

alter table public.drivers enable row level security;

create or replace function public.is_driver()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.drivers where user_id = auth.uid());
$$;

drop policy if exists "drivers see drivers" on public.drivers;
create policy "drivers see drivers" on public.drivers
  for select to authenticated using (public.is_driver());

-- 2. Viajes ---------------------------------------------------------------
create table if not exists public.rides (
  id               uuid primary key default gen_random_uuid(),
  created_at       timestamptz not null default now(),
  customer_name    text not null check (char_length(customer_name) between 1 and 80),
  customer_phone   text not null check (char_length(customer_phone) between 7 and 20),
  service          text not null check (char_length(service) <= 40),
  pickup_lat       double precision check (pickup_lat between -90 and 90),
  pickup_lng       double precision check (pickup_lng between -180 and 180),
  pickup_accuracy  double precision,
  pickup_text      text check (char_length(pickup_text) <= 200),
  destination      text not null check (char_length(destination) between 1 and 200),
  scheduled_for    timestamptz,
  passengers       smallint not null default 1 check (passengers between 1 and 15),
  notes            text check (char_length(notes) <= 500),
  status           text not null default 'pending'
                   check (status in ('pending', 'accepted', 'completed', 'cancelled')),
  driver_id        uuid references public.drivers (user_id) on delete set null,
  driver_name      text,
  driver_phone     text,
  accepted_at      timestamptz,
  completed_at     timestamptz,
  -- Hace falta GPS o una dirección escrita.
  constraint pickup_present check (
    (pickup_lat is not null and pickup_lng is not null) or pickup_text is not null
  )
);

create index if not exists rides_created_at_idx on public.rides (created_at desc);

alter table public.rides enable row level security;

-- Cualquiera (clientes sin cuenta) puede CREAR un viaje en espera, nada más.
drop policy if exists "public can request" on public.rides;
create policy "public can request" on public.rides
  for insert to anon, authenticated
  with check (status = 'pending' and driver_id is null and driver_name is null
              and driver_phone is null and accepted_at is null and completed_at is null);

-- Solo los choferes leen los viajes.
drop policy if exists "drivers read rides" on public.rides;
create policy "drivers read rides" on public.rides
  for select to authenticated using (public.is_driver());

-- Sin política de UPDATE/DELETE: los cambios pasan por las funciones de abajo.

-- 3. Acciones de los choferes ---------------------------------------------
-- Aceptar: solo funciona si el viaje sigue en espera. Si dos hermanos
-- tocan "Aceptar" al mismo tiempo, solo uno se lo queda.
create or replace function public.accept_ride(ride_id uuid)
returns public.rides
language plpgsql
security definer
set search_path = public
as $$
declare
  d public.drivers;
  r public.rides;
begin
  select * into d from public.drivers where user_id = auth.uid();
  if not found then raise exception 'not a driver'; end if;

  update public.rides
     set status = 'accepted', driver_id = d.user_id, driver_name = d.name,
         driver_phone = d.phone, accepted_at = now()
   where id = ride_id and status = 'pending'
  returning * into r;

  return r; -- null si otro hermano ya lo tomó
end;
$$;

-- Soltar un viaje aceptado para que otro lo tome.
create or replace function public.release_ride(ride_id uuid)
returns public.rides
language plpgsql
security definer
set search_path = public
as $$
declare r public.rides;
begin
  update public.rides
     set status = 'pending', driver_id = null, driver_name = null,
         driver_phone = null, accepted_at = null
   where id = ride_id and status = 'accepted' and driver_id = auth.uid()
  returning * into r;
  return r;
end;
$$;

-- Marcar como terminado o cancelado.
create or replace function public.finish_ride(ride_id uuid, new_status text)
returns public.rides
language plpgsql
security definer
set search_path = public
as $$
declare r public.rides;
begin
  if new_status not in ('completed', 'cancelled') then
    raise exception 'invalid status';
  end if;
  if not public.is_driver() then raise exception 'not a driver'; end if;

  update public.rides
     set status = new_status, completed_at = now()
   where id = ride_id
     and (driver_id = auth.uid() or (status = 'pending' and new_status = 'cancelled'))
  returning * into r;
  return r;
end;
$$;

-- 4. Estado para el cliente -----------------------------------------------
-- El cliente solo conoce el id (uuid aleatorio) de su propio viaje.
create or replace function public.ride_status(ride_id uuid)
returns table (status text, driver_name text, driver_phone text)
language sql
stable
security definer
set search_path = public
as $$
  select r.status, r.driver_name, r.driver_phone
    from public.rides r
   where r.id = ride_id;
$$;

revoke all on function public.accept_ride(uuid) from public, anon;
revoke all on function public.release_ride(uuid) from public, anon;
revoke all on function public.finish_ride(uuid, text) from public, anon;
grant execute on function public.accept_ride(uuid) to authenticated;
grant execute on function public.release_ride(uuid) to authenticated;
grant execute on function public.finish_ride(uuid, text) to authenticated;
grant execute on function public.ride_status(uuid) to anon, authenticated;

-- 5. Tiempo real ----------------------------------------------------------
do $$
begin
  alter publication supabase_realtime add table public.rides;
exception when duplicate_object then null;
end $$;

-- 6. Dar de alta a los 4 hermanos ------------------------------------------
-- Primero crea cada usuario en Authentication → Users → "Add user"
-- (correo + contraseña, marca "Auto Confirm User"). Luego corre esto
-- cambiando los correos:
--
-- insert into public.drivers (user_id, name, phone)
-- select id, 'Hermano 1', '7328291070' from auth.users where email = 'hermano1@correo.com';
-- insert into public.drivers (user_id, name, phone)
-- select id, 'Hermano 2', '7327205723' from auth.users where email = 'hermano2@correo.com';
-- insert into public.drivers (user_id, name, phone)
-- select id, 'Hermano 3', '8483305501' from auth.users where email = 'hermano3@correo.com';
-- insert into public.drivers (user_id, name, phone)
-- select id, 'Hermano 4', '7325275019' from auth.users where email = 'hermano4@correo.com';
