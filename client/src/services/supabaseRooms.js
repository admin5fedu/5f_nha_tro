import supabaseClient, { isSupabaseConfigured } from './supabaseClient';

const ensureClient = () => {
  if (!isSupabaseConfigured || !supabaseClient) {
    throw new Error('Supabase chưa được cấu hình. Vui lòng kiểm tra VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY.');
  }
  return supabaseClient;
};

const listSelect = `
  id,
  branch_id,
  room_number,
  floor,
  area,
  price,
  deposit,
  status,
  description,
  amenities,
  created_at,
  updated_at,
  branches:branch_id ( id, name )
`;

const mapRoom = (row) => {
  if (!row) return null;
  const branch = row.branches || null;
  return {
    id: row.id,
    branch_id: row.branch_id,
    room_number: row.room_number,
    floor: row.floor,
    area: row.area,
    price: row.price,
    deposit: row.deposit,
    status: row.status,
    description: row.description,
    amenities: row.amenities,
    created_at: row.created_at,
    updated_at: row.updated_at,
    branch_name: branch?.name || null
  };
};

export const fetchRooms = async ({ limit = 50, offset = 0 } = {}) => {
  const supabase = ensureClient();
  const rangeEnd = offset + limit - 1;
  const { data, error, count } = await supabase
    .from('rooms')
    .select(listSelect, { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(offset, rangeEnd);

  if (error) throw error;
  const items = (data || []).map(mapRoom);
  const total = typeof count === 'number' ? count : items.length;
  return {
    data: items,
    total,
    hasMore: offset + items.length < total
  };
};

export const fetchRoomById = async (roomId) => {
  if (!roomId) return null;
  const supabase = ensureClient();
  const { data, error } = await supabase
    .from('rooms')
    .select(
      `
        ${listSelect},
        images ( id, name, image_url ),
        assets ( id, name, type, status ),
        tenants:contracts!contracts_room_id_fkey (
          id,
          status,
          start_date,
          end_date,
          tenants:tenant_id ( id, full_name, phone, email )
        )
      `
    )
    .eq('id', roomId)
    .maybeSingle();

  if (error) throw error;
  const room = mapRoom(data);
  if (room && data) {
    room.images = data.images || [];
    room.assets = data.assets || [];
    room.active_contracts =
      data.tenants?.filter?.((c) => c?.status === 'active').map((c) => ({
        id: c.id,
        tenant: c.tenants?.full_name || '',
        tenant_phone: c.tenants?.phone || '',
        tenant_email: c.tenants?.email || '',
        start_date: c.start_date,
        end_date: c.end_date
      })) || [];
  }
  return room;
};

export const createRoom = async (payload) => {
  const supabase = ensureClient();
  const dataToInsert = {
    ...payload,
    branch_id: Number(payload.branch_id),
    floor: payload.floor !== undefined && payload.floor !== null && payload.floor !== '' ? Number(payload.floor) : null,
    area: payload.area !== undefined && payload.area !== null && payload.area !== '' ? Number(payload.area) : null,
    price: payload.price !== undefined ? Number(payload.price) : null,
    deposit: payload.deposit !== undefined && payload.deposit !== null && payload.deposit !== '' ? Number(payload.deposit) : 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('rooms')
    .insert(dataToInsert)
    .select(listSelect)
    .maybeSingle();

  if (error) throw error;
  return mapRoom(data);
};

export const updateRoom = async (roomId, payload) => {
  const supabase = ensureClient();
  const dataToUpdate = {
    ...payload,
    branch_id: Number(payload.branch_id),
    floor: payload.floor !== undefined && payload.floor !== null && payload.floor !== '' ? Number(payload.floor) : null,
    area: payload.area !== undefined && payload.area !== null && payload.area !== '' ? Number(payload.area) : null,
    price: payload.price !== undefined ? Number(payload.price) : null,
    deposit: payload.deposit !== undefined && payload.deposit !== null && payload.deposit !== '' ? Number(payload.deposit) : 0,
    updated_at: new Date().toISOString()
  };

  const { data, error } = await supabase
    .from('rooms')
    .update(dataToUpdate)
    .eq('id', roomId)
    .select(listSelect)
    .maybeSingle();

  if (error) throw error;
  return mapRoom(data);
};

export const deleteRoom = async (roomId) => {
  const supabase = ensureClient();
  const { error } = await supabase.from('rooms').delete().eq('id', roomId);
  if (error) throw error;
};
