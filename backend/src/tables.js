// Table registry: primary key column + "flat" columns kept alongside the
// jsonb `data` blob, purely so simple WHERE/ORDER BY queries stay fast.
// Everything else about a row lives in `data`.
export const TABLES = {
  products: {
    pk: 'id',
    columns: {
      name: { type: 'text', default: '' },
      price: { type: 'numeric', default: 0 },
      category: { type: 'text', default: '' },
      sub_category: { type: 'text', default: '' },
      stock: { type: 'int', default: 0 },
      thumbnail: { type: 'text', default: '' },
      status: { type: 'text', default: 'ACTIVE' },
    },
  },
  categories: {
    pk: 'id',
    columns: {
      name: { type: 'text', default: '' },
      image: { type: 'text', default: '' },
      position: { type: 'int', default: 1 },
      is_visible_on_home: { type: 'bool', default: true, dataKey: 'isVisibleOnHome' },
      sub_categories: { type: 'json', default: [], dataKey: 'subCategories' },
    },
  },
  settings: { pk: 'id', columns: {} },
  coupons: {
    pk: 'id',
    columns: { code: { type: 'text', default: '' } },
  },
  team: {
    pk: 'id',
    columns: { name: { type: 'text', default: '' } },
  },
  orders: {
    pk: 'id',
    columns: {
      order_number: { type: 'text', default: '', dataKey: 'orderNumber' },
      customer_phone: { type: 'text', default: '', dataKey: 'customerPhone' },
      status: { type: 'text', default: 'Pending' },
      call_status: { type: 'text', default: 'Not Called', dataKey: 'callStatus' },
    },
  },
  customer_profiles: { pk: 'phone', columns: {} },
};

export function isKnownTable(name) {
  return Object.prototype.hasOwnProperty.call(TABLES, name);
}

function castValue(raw, type) {
  if (raw === undefined || raw === null) return raw;
  switch (type) {
    case 'int':
      return parseInt(raw, 10);
    case 'numeric':
      return Number(raw);
    case 'bool':
      return raw === true || raw === 'true' || raw === 't';
    case 'json':
      if (typeof raw === 'string') {
        try { return JSON.parse(raw); } catch { return raw; }
      }
      return raw;
    default:
      return raw;
  }
}

// Given an incoming payload (e.g. { id, name, price, data: {...} }) and the
// table definition, work out the full jsonb `data` object (merging any
// top-level fields the caller sent that aren't already in `data`) and the
// value for each flat column, falling back to what's inside `data`, then to
// the column default.
export function normalizeRow(table, payload) {
  const def = TABLES[table];
  let data = payload.data;
  if (typeof data === 'string') {
    try { data = JSON.parse(data); } catch { data = {}; }
  }
  data = (data && typeof data === 'object') ? { ...data } : {};

  for (const [key, val] of Object.entries(payload)) {
    if (key === 'data' || key === def.pk) continue;
    if (data[key] === undefined) data[key] = val;
  }

  const flat = {};
  for (const [col, spec] of Object.entries(def.columns)) {
    const dataKey = spec.dataKey || col;
    let val = payload[col];
    if (val === undefined) val = data[dataKey];
    if (val === undefined) val = spec.default;
    flat[col] = castValue(val, spec.type);
  }

  return { data, flat };
}
