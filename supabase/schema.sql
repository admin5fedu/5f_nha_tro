-- Supabase base schema converted from legacy SQLite definitions
-- Execute this script from the Supabase SQL editor or via `supabase db push`

-- Optional extensions
create extension if not exists "uuid-ossp";

-- === Core reference tables =================================================

create table if not exists public.roles (
  id            bigserial primary key,
  code          text not null unique,
  name          text not null,
  description   text,
  created_at    timestamptz not null default now()
);

create table if not exists public.users (
  id             bigserial primary key,
  auth_user_id   uuid unique references auth.users (id) on delete set null,
  username       text not null unique,
  email          text not null unique,
  full_name      text not null,
  phone          text,
  address        text,
  role_id        bigint references public.roles (id) on delete set null,
  status         text not null default 'active',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

create table if not exists public.branches (
  id            bigserial primary key,
  name          text not null,
  address       text,
  phone         text,
  manager_name  text,
  status        text not null default 'active',
  created_at    timestamptz not null default now()
);

create table if not exists public.user_branches (
  id         bigserial primary key,
  user_id    bigint not null references public.users (id) on delete cascade,
  branch_id  bigint not null references public.branches (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, branch_id)
);

-- === Room / tenancy domain =================================================

create table if not exists public.rooms (
  id             bigserial primary key,
  branch_id      bigint not null references public.branches (id) on delete cascade,
  room_number    text not null,
  floor          integer,
  area           numeric,
  price          numeric not null,
  deposit        numeric default 0,
  status         text not null default 'available',
  description    text,
  amenities      text,
  created_at     timestamptz not null default now()
);

create table if not exists public.tenants (
  id                  bigserial primary key,
  full_name           text not null,
  phone               text,
  email               text,
  id_card             text,
  address             text,
  hometown            text,
  emergency_contact   text,
  has_temp_residence  text default 'no',
  notes               text,
  tenant_type         text not null default 'owner',
  owner_tenant_id     bigint references public.tenants (id) on delete set null,
  created_at          timestamptz not null default now()
);

create table if not exists public.contracts (
  id             bigserial primary key,
  branch_id      bigint not null references public.branches (id) on delete cascade,
  room_id        bigint not null references public.rooms (id) on delete cascade,
  tenant_id      bigint not null references public.tenants (id) on delete cascade,
  start_date     date not null,
  end_date       date,
  monthly_rent   numeric not null,
  deposit        numeric default 0,
  status         text not null default 'active',
  notes          text,
  created_at     timestamptz not null default now()
);

create table if not exists public.payments (
  id             bigserial primary key,
  contract_id    bigint not null references public.contracts (id) on delete cascade,
  amount         numeric not null,
  payment_type   text not null default 'rent',
  payment_date   date not null,
  due_date       date,
  status         text not null default 'paid',
  payment_method text,
  notes          text,
  created_at     timestamptz not null default now()
);

-- === Finance domain ========================================================

create table if not exists public.accounts (
  id              bigserial primary key,
  name            text not null,
  type            text not null,
  account_number  text,
  account_holder  text,
  bank_name       text,
  bank_branch     text,
  qr_code         text,
  opening_balance numeric default 0,
  current_balance numeric default 0,
  status          text not null default 'active',
  created_at      timestamptz not null default now()
);

create table if not exists public.financial_categories (
  id            bigserial primary key,
  name          text not null,
  code          text unique,
  type          text not null,
  description   text,
  status        text not null default 'active',
  created_at    timestamptz not null default now()
);

-- === Assets & services =====================================================

create table if not exists public.assets (
  id              bigserial primary key,
  name            text not null,
  type            text not null,
  description     text,
  value           numeric default 0,
  status          text not null default 'good',
  purchase_date   date,
  location_type   text not null,
  room_id         bigint references public.rooms (id) on delete set null,
  branch_id       bigint references public.branches (id) on delete set null,
  serial_number   text,
  manufacturer    text,
  model           text,
  warranty_expiry date,
  notes           text,
  created_at      timestamptz not null default now()
);

create table if not exists public.images (
  id             bigserial primary key,
  name           text not null,
  description    text,
  image_url      text not null,
  location_type  text not null,
  room_id        bigint references public.rooms (id) on delete set null,
  branch_id      bigint references public.branches (id) on delete set null,
  created_at     timestamptz not null default now()
);

create table if not exists public.services (
  id          bigserial primary key,
  name        text not null,
  unit        text not null,
  unit_name   text not null,
  description text,
  status      text not null default 'active',
  created_at  timestamptz not null default now()
);

create table if not exists public.contract_services (
  id          bigserial primary key,
  contract_id bigint not null references public.contracts (id) on delete cascade,
  service_id  bigint not null references public.services (id) on delete cascade,
  price       numeric not null,
  quantity    numeric default 1,
  notes       text,
  created_at  timestamptz not null default now(),
  unique (contract_id, service_id)
);

-- === Vehicles ==============================================================

create table if not exists public.vehicles (
  id            bigserial primary key,
  tenant_id     bigint not null references public.tenants (id) on delete cascade,
  vehicle_type  text not null,
  brand         text,
  model         text,
  license_plate text,
  color         text,
  description   text,
  image_url     text,
  created_at    timestamptz not null default now()
);

-- === Meter readings ========================================================

create table if not exists public.meter_readings (
  id            bigserial primary key,
  room_id       bigint not null references public.rooms (id) on delete cascade,
  service_id    bigint not null references public.services (id) on delete cascade,
  invoice_id    bigint references public.invoices (id) on delete set null,
  reading_date  date not null,
  meter_start   numeric not null,
  meter_end     numeric not null,
  meter_usage   numeric not null,
  recorded_by   bigint references public.users (id) on delete set null,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- === Notifications =========================================================

create table if not exists public.notifications (
  id          bigserial primary key,
  title       text not null,
  body        text,
  type        text,
  link_type   text,
  link_id     bigint,
  metadata    jsonb,
  unique_key  text unique,
  created_by  bigint references public.users (id) on delete set null,
  created_at  timestamptz not null default now()
);

create table if not exists public.notification_recipients (
  id              bigserial primary key,
  notification_id bigint not null references public.notifications (id) on delete cascade,
  user_id         bigint not null references public.users (id) on delete cascade,
  is_read         boolean not null default false,
  read_at         timestamptz,
  created_at      timestamptz not null default now(),
  unique (notification_id, user_id)
);

-- === Invoices ==============================================================

create table if not exists public.invoices (
  id               bigserial primary key,
  contract_id      bigint not null references public.contracts (id) on delete cascade,
  invoice_number   text not null unique,
  invoice_date     date not null,
  due_date         date not null,
  period_month     integer not null,
  period_year      integer not null,
  actual_days      integer,
  rent_amount      numeric not null,
  service_amount   numeric default 0,
  previous_debt    numeric default 0,
  total_amount     numeric not null,
  paid_amount      numeric default 0,
  remaining_amount numeric not null,
  status           text not null default 'pending',
  qr_code          text,
  notes            text,
  created_at       timestamptz not null default now()
);

create table if not exists public.invoice_services (
  id            bigserial primary key,
  invoice_id    bigint not null references public.invoices (id) on delete cascade,
  service_id    bigint references public.services (id) on delete set null,
  service_name  text not null,
  price         numeric not null,
  quantity      numeric default 1,
  amount        numeric not null,
  meter_start   numeric,
  meter_end     numeric,
  meter_usage   numeric,
  created_at    timestamptz not null default now()
);

-- === Tasks =================================================================

create table if not exists public.tasks (
  id            bigserial primary key,
  title         text not null,
  description   text,
  assigned_by   bigint not null references public.users (id) on delete cascade,
  assigned_to   bigint not null references public.users (id) on delete cascade,
  branch_id     bigint references public.branches (id) on delete set null,
  room_id       bigint references public.rooms (id) on delete set null,
  status        text not null default 'pending',
  priority      text not null default 'medium',
  due_date      date,
  progress      integer default 0,
  result        text,
  notes         text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- === Indexes ===============================================================

create index if not exists idx_rooms_branch on public.rooms (branch_id);
create index if not exists idx_contracts_room on public.contracts (room_id);
create index if not exists idx_contracts_tenant on public.contracts (tenant_id);
create index if not exists idx_contracts_branch on public.contracts (branch_id);
create index if not exists idx_payments_contract on public.payments (contract_id);
create index if not exists idx_user_branches_user on public.user_branches (user_id);
create index if not exists idx_user_branches_branch on public.user_branches (branch_id);
create index if not exists idx_assets_room on public.assets (room_id);
create index if not exists idx_assets_branch on public.assets (branch_id);
create index if not exists idx_images_room on public.images (room_id);
create index if not exists idx_images_branch on public.images (branch_id);
create index if not exists idx_tenants_owner on public.tenants (owner_tenant_id);
create index if not exists idx_services_status on public.services (status);
create index if not exists idx_notifications_type on public.notifications (type);
create index if not exists idx_notifications_created_at on public.notifications (created_at desc);
create index if not exists idx_notification_recipients_user on public.notification_recipients (user_id, is_read);
create index if not exists idx_meter_readings_room on public.meter_readings (room_id);
create index if not exists idx_meter_readings_service on public.meter_readings (service_id);
create index if not exists idx_meter_readings_invoice on public.meter_readings (invoice_id);
create index if not exists idx_meter_readings_date on public.meter_readings (reading_date);
create index if not exists idx_meter_readings_recorded_by on public.meter_readings (recorded_by);
create index if not exists idx_invoices_contract on public.invoices (contract_id);
create index if not exists idx_invoices_period on public.invoices (period_year, period_month);
create index if not exists idx_invoices_status on public.invoices (status);
create index if not exists idx_invoice_services_invoice on public.invoice_services (invoice_id);
create index if not exists idx_financial_categories_type on public.financial_categories (type);
create index if not exists idx_financial_categories_status on public.financial_categories (status);
create index if not exists idx_tasks_assigned_by on public.tasks (assigned_by);
create index if not exists idx_tasks_assigned_to on public.tasks (assigned_to);
create index if not exists idx_tasks_branch on public.tasks (branch_id);
create index if not exists idx_tasks_room on public.tasks (room_id);
create index if not exists idx_tasks_status on public.tasks (status);
create index if not exists idx_tasks_priority on public.tasks (priority);

-- === Optional helper seed ==================================================

insert into public.roles (code, name, description)
values
  ('admin', 'Quản trị viên', 'Quyền truy cập đầy đủ hệ thống'),
  ('manager', 'Quản lý', 'Quản lý chi nhánh và phòng trọ'),
  ('accountant', 'Kế toán', 'Quản lý tài chính và hóa đơn'),
  ('staff', 'Nhân viên', 'Nhân viên vận hành'),
  ('office_staff', 'Nhân viên văn phòng', 'Xử lý hợp đồng và khách thuê')
on conflict (code) do nothing;


