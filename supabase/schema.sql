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
  status        text default 'active',
  created_at    timestamptz not null default now()
);

alter table public.roles
  add column if not exists status text default 'active';

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

create table if not exists public.settings (
  id                               bigint primary key default 1,
  app_name                         text,
  app_logo                         text,
  company_name                     text,
  company_address                  text,
  company_phone                    text,
  company_email                    text,
  company_website                  text,
  company_tax_code                 text,
  company_representative           text,
  company_representative_position  text,
  company_bank_account             text,
  company_bank_name                text,
  company_bank_branch              text,
  notes                            text,
  created_at                       timestamptz default now(),
  updated_at                       timestamptz default now()
);

create table if not exists public.permission_modules (
  id            bigserial primary key,
  module_code   text not null unique,
  module_name   text not null,
  group_label   text,
  created_at    timestamptz default now()
);

create table if not exists public.permission_actions (
  id             bigserial primary key,
  module_id      bigint not null references public.permission_modules(id) on delete cascade,
  action         text not null,
  action_label   text not null,
  sort_order     integer default 0,
  created_at     timestamptz default now(),
  unique (module_id, action)
);

create table if not exists public.role_permissions (
  id                    bigserial primary key,
  role_id               bigint not null references public.roles(id) on delete cascade,
  permission_action_id  bigint not null references public.permission_actions(id) on delete cascade,
  created_at            timestamptz default now(),
  unique (role_id, permission_action_id)
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

alter table public.branches
  add column if not exists updated_at timestamptz default now();

alter table public.branches
  add column if not exists notes text;

alter table public.branches
  add column if not exists representative_name text;

alter table public.branches
  add column if not exists representative_position text;

alter table public.branches
  add column if not exists representative_id_card text;

alter table public.branches
  add column if not exists representative_phone text;

alter table public.branches
  add column if not exists representative_address text;

alter table public.branches
  add column if not exists account_number text;

alter table public.branches
  add column if not exists account_holder text;

alter table public.branches
  add column if not exists bank_name text;

alter table public.branches
  add column if not exists bank_branch text;

alter table public.branches
  add column if not exists qr_code text;

create unique index if not exists idx_branches_name on public.branches (lower(name));

with new_branches as (
  select *
  from (values
    (
      'Chi nhánh Trung Tâm',
      '123 Lê Lợi, Quận 1, TP.HCM',
      '0901 234 567',
      'Nguyễn Thị Quản Lý',
      'active',
      'Trần Thị Thanh',
      'Giám đốc',
      '0799 123 456',
      '079123456789',
      '12 Nguyễn Huệ, Quận 1, TP.HCM',
      null,
      null,
      null,
      null
    ),
    (
      'Chi nhánh Bình Thạnh',
      '45 Điện Biên Phủ, Quận Bình Thạnh, TP.HCM',
      '0908 765 432',
      'Lê Văn Bình',
      'active',
      'Phạm Ngọc Ánh',
      'Quản lý chi nhánh',
      '0988 765 432',
      '088765432198',
      '45 Điện Biên Phủ, Quận Bình Thạnh, TP.HCM',
      null,
      null,
      null,
      null
    )
  ) as v(name, address, phone, manager_name, status, representative_name, representative_position, representative_phone, representative_id_card, representative_address, account_number, account_holder, bank_name, bank_branch)
)
insert into public.branches (
  name,
  address,
  phone,
  manager_name,
  status,
  representative_name,
  representative_position,
  representative_phone,
  representative_id_card,
  representative_address,
  account_number,
  account_holder,
  bank_name,
  bank_branch
)
select
  nb.name,
  nb.address,
  nb.phone,
  nb.manager_name,
  nb.status,
  nb.representative_name,
  nb.representative_position,
  nb.representative_phone,
  nb.representative_id_card,
  nb.representative_address,
  nb.account_number,
  nb.account_holder,
  nb.bank_name,
  nb.bank_branch
from new_branches nb
where not exists (
  select 1 from public.branches b where lower(b.name) = lower(nb.name)
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

alter table public.rooms
  add column if not exists updated_at timestamptz default now();

create unique index if not exists idx_rooms_branch_room_number
  on public.rooms (branch_id, lower(room_number));

with branch_lookup as (
  select id, lower(name) as name_key
  from public.branches
),
new_room_def as (
  select *
  from (values
    ('chi nhánh trung tâm', '101', 1, 20, 1500000, 2000000, 'occupied', 'Phòng rộng với cửa sổ lớn', 'Điều hòa, Tủ lạnh'),
    ('chi nhánh trung tâm', '102', 1, 18, 1300000, 1500000, 'available', 'Phòng thoáng mát, view đường phố', 'Điều hòa, Wifi'),
    ('chi nhánh bình thạnh', '201', 2, 22, 1700000, 2500000, 'maintenance', 'Phòng đang bảo trì hệ thống điện', 'Điều hòa'),
    ('chi nhánh bình thạnh', '202', 2, 19, 1400000, 1500000, 'available', 'Phòng ban công, đầy đủ nội thất', 'Điều hòa, Máy giặt')
  ) as v(branch_name_key, room_number, floor, area, price, deposit, status, description, amenities)
),
new_rooms as (
  select
    bl.id as branch_id,
    def.room_number,
    def.floor,
    def.area,
    def.price,
    def.deposit,
    def.status,
    def.description,
    def.amenities
  from new_room_def def
  join branch_lookup bl on bl.name_key = def.branch_name_key
)
insert into public.rooms (
  branch_id, room_number, floor, area, price, deposit, status, description, amenities
)
select
  nr.branch_id,
  nr.room_number,
  nr.floor,
  nr.area,
  nr.price,
  nr.deposit,
  nr.status,
  nr.description,
  nr.amenities
from new_rooms nr
where not exists (
  select 1
  from public.rooms r
  where r.branch_id = nr.branch_id
    and lower(r.room_number) = lower(nr.room_number)
);

alter table public.rooms enable row level security;

drop policy if exists rooms_select on public.rooms;
drop policy if exists rooms_insert on public.rooms;
drop policy if exists rooms_update on public.rooms;
drop policy if exists rooms_delete on public.rooms;

create policy rooms_select on public.rooms
  for select using ( public.app_has_permission('rooms', 'view') );

create policy rooms_insert on public.rooms
  for insert with check ( public.app_has_permission('rooms', 'create') );

create policy rooms_update on public.rooms
  for update using ( public.app_has_permission('rooms', 'update') )
  with check ( public.app_has_permission('rooms', 'update') );

create policy rooms_delete on public.rooms
  for delete using ( public.app_has_permission('rooms', 'delete') );

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

alter table public.branches
  add column if not exists account_id bigint references public.accounts (id) on delete set null;

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
create index if not exists idx_permission_actions_module on public.permission_actions (module_id);
create index if not exists idx_role_permissions_role on public.role_permissions (role_id);
create index if not exists idx_role_permissions_permission on public.role_permissions (permission_action_id);

-- === Optional helper seed ==================================================

insert into public.roles (code, name, description)
values
  ('admin', 'Quản trị viên', 'Quyền truy cập đầy đủ hệ thống'),
  ('manager', 'Quản lý', 'Quản lý chi nhánh và phòng trọ'),
  ('accountant', 'Kế toán', 'Quản lý tài chính và hóa đơn'),
  ('staff', 'Nhân viên', 'Nhân viên vận hành'),
  ('office_staff', 'Nhân viên văn phòng', 'Xử lý hợp đồng và khách thuê')
on conflict (code) do nothing;

insert into public.settings (id, app_name, created_at, updated_at)
values (1, 'Nhà Trọ', now(), now())
on conflict (id) do nothing;

insert into public.permission_modules (module_code, module_name, group_label)
values
  ('dashboard', 'Dashboard', 'Tổng quan'),
  ('branches', 'Chi nhánh', 'Chi nhánh & Phòng'),
  ('rooms', 'Phòng', 'Chi nhánh & Phòng'),
  ('assets', 'Tài sản', 'Chi nhánh & Phòng'),
  ('images', 'Hình ảnh', 'Chi nhánh & Phòng'),
  ('services', 'Dịch vụ', 'Chi nhánh & Phòng'),
  ('meter-readings', 'Ghi chỉ số', 'Chi nhánh & Phòng'),
  ('tenants', 'Khách thuê', 'Khách thuê'),
  ('vehicles', 'Phương tiện', 'Khách thuê'),
  ('tasks', 'Công việc', 'Công việc'),
  ('contracts', 'Hợp đồng', 'Tài chính'),
  ('invoices', 'Hóa đơn', 'Tài chính'),
  ('accounts', 'Tài khoản', 'Tài chính'),
  ('transactions', 'Giao dịch', 'Tài chính'),
  ('financial-categories', 'Danh mục tài chính', 'Tài chính'),
  ('profit-loss', 'Lãi lỗ', 'Báo cáo'),
  ('accounts-receivable', 'Công nợ', 'Báo cáo'),
  ('revenue', 'Doanh thu', 'Báo cáo'),
  ('cashflow', 'Dòng tiền', 'Báo cáo'),
  ('settings', 'Thiết lập', 'Thiết lập'),
  ('users', 'Người dùng', 'Thiết lập'),
  ('roles', 'Vai trò', 'Thiết lập'),
  ('permissions', 'Phân quyền', 'Thiết lập')
on conflict (module_code) do update set module_name = excluded.module_name, group_label = excluded.group_label;

with action_defs as (
  select *
  from (values
    ('dashboard', 'view', 'Xem', 1),
    ('branches', 'view', 'Xem', 1), ('branches', 'create', 'Thêm', 2), ('branches', 'update', 'Sửa', 3), ('branches', 'delete', 'Xóa', 4),
    ('rooms', 'view', 'Xem', 1), ('rooms', 'create', 'Thêm', 2), ('rooms', 'update', 'Sửa', 3), ('rooms', 'delete', 'Xóa', 4),
    ('assets', 'view', 'Xem', 1), ('assets', 'create', 'Thêm', 2), ('assets', 'update', 'Sửa', 3), ('assets', 'delete', 'Xóa', 4),
    ('images', 'view', 'Xem', 1), ('images', 'create', 'Thêm', 2), ('images', 'update', 'Sửa', 3), ('images', 'delete', 'Xóa', 4),
    ('services', 'view', 'Xem', 1), ('services', 'create', 'Thêm', 2), ('services', 'update', 'Sửa', 3), ('services', 'delete', 'Xóa', 4),
    ('meter-readings', 'view', 'Xem', 1), ('meter-readings', 'create', 'Thêm', 2), ('meter-readings', 'update', 'Sửa', 3), ('meter-readings', 'delete', 'Xóa', 4),
    ('tenants', 'view', 'Xem', 1), ('tenants', 'create', 'Thêm', 2), ('tenants', 'update', 'Sửa', 3), ('tenants', 'delete', 'Xóa', 4),
    ('vehicles', 'view', 'Xem', 1), ('vehicles', 'create', 'Thêm', 2), ('vehicles', 'update', 'Sửa', 3), ('vehicles', 'delete', 'Xóa', 4),
    ('tasks', 'view', 'Xem', 1), ('tasks', 'create', 'Thêm', 2), ('tasks', 'update', 'Sửa', 3), ('tasks', 'delete', 'Xóa', 4),
    ('contracts', 'view', 'Xem', 1), ('contracts', 'create', 'Thêm', 2), ('contracts', 'update', 'Sửa', 3), ('contracts', 'delete', 'Xóa', 4),
    ('invoices', 'view', 'Xem', 1), ('invoices', 'create', 'Thêm', 2), ('invoices', 'update', 'Sửa', 3), ('invoices', 'delete', 'Xóa', 4),
    ('accounts', 'view', 'Xem', 1), ('accounts', 'create', 'Thêm', 2), ('accounts', 'update', 'Sửa', 3), ('accounts', 'delete', 'Xóa', 4),
    ('transactions', 'view', 'Xem', 1), ('transactions', 'create', 'Thêm', 2), ('transactions', 'update', 'Sửa', 3), ('transactions', 'delete', 'Xóa', 4),
    ('financial-categories', 'view', 'Xem', 1), ('financial-categories', 'create', 'Thêm', 2), ('financial-categories', 'update', 'Sửa', 3), ('financial-categories', 'delete', 'Xóa', 4),
    ('profit-loss', 'view', 'Xem', 1),
    ('accounts-receivable', 'view', 'Xem', 1),
    ('revenue', 'view', 'Xem', 1),
    ('cashflow', 'view', 'Xem', 1),
    ('settings', 'view', 'Xem', 1), ('settings', 'update', 'Sửa', 2),
    ('users', 'view', 'Xem', 1), ('users', 'create', 'Thêm', 2), ('users', 'update', 'Sửa', 3), ('users', 'delete', 'Xóa', 4),
    ('roles', 'view', 'Xem', 1), ('roles', 'create', 'Thêm', 2), ('roles', 'update', 'Sửa', 3), ('roles', 'delete', 'Xóa', 4),
    ('permissions', 'view', 'Xem', 1), ('permissions', 'update', 'Sửa', 2)
  ) as vals(module_code, action, action_label, sort_order)
)
insert into public.permission_actions (module_id, action, action_label, sort_order)
select pm.id, vals.action, vals.action_label, vals.sort_order
from public.permission_modules pm
join action_defs vals on pm.module_code = vals.module_code
on conflict (module_id, action) do update
set action_label = excluded.action_label,
    sort_order = excluded.sort_order;


