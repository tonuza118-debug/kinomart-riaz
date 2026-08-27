import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { pool } from './db.js';
import { TABLES, isKnownTable, normalizeRow } from './tables.js';

dotenv.config();

const app = express();
app.use(express.json({ limit: '10mb' }));

const allowedOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);
app.use(cors({
  origin: allowedOrigins.length ? allowedOrigins : true,
}));

function requireTable(req, res, next) {
  const { table } = req.params;
  if (!isKnownTable(table)) {
    return res.status(404).json({ error: `Unknown table "${table}"` });
  }
  next();
}

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// SELECT * FROM :table [LIMIT n]
app.get('/api/:table', requireTable, async (req, res) => {
  const { table } = req.params;
  const limit = req.query.limit ? Math.min(parseInt(req.query.limit, 10) || 0, 1000) : null;
  try {
    const sql = `SELECT * FROM ${table} ORDER BY created_at ASC${limit ? ' LIMIT $1' : ''}`;
    const { rows } = limit ? await pool.query(sql, [limit]) : await pool.query(sql);
    res.json({ data: rows, error: null });
  } catch (err) {
    res.status(500).json({ data: null, error: { message: err.message } });
  }
});

// Upsert-style insert: INSERT ... ON CONFLICT (pk) DO UPDATE
app.post('/api/:table', requireTable, async (req, res) => {
  const { table } = req.params;
  const def = TABLES[table];
  const rowsIn = Array.isArray(req.body) ? req.body : [req.body];

  try {
    const results = [];
    for (const payload of rowsIn) {
      const pkVal = payload[def.pk];
      if (pkVal === undefined || pkVal === null || pkVal === '') {
        throw new Error(`Missing primary key "${def.pk}" in payload`);
      }
      const { data, flat } = normalizeRow(table, payload);
      const cols = [def.pk, 'data', ...Object.keys(flat), 'updated_at'];
      const vals = [pkVal, data, ...Object.values(flat), new Date()];
      const placeholders = vals.map((_, i) => `$${i + 1}`);
      const updateSet = cols
        .filter((c) => c !== def.pk)
        .map((c) => `${c} = EXCLUDED.${c}`)
        .join(', ');
      const sql = `
        INSERT INTO ${table} (${cols.join(', ')})
        VALUES (${placeholders.join(', ')})
        ON CONFLICT (${def.pk}) DO UPDATE SET ${updateSet}
        RETURNING *`;
      const { rows } = await pool.query(sql, vals);
      results.push(rows[0]);
    }
    res.json({ data: results, error: null });
  } catch (err) {
    res.status(400).json({ data: null, error: { message: err.message } });
  }
});

// Update by primary key in the path: PATCH /api/products/abc123
app.patch('/api/:table/:id', requireTable, async (req, res) => {
  await updateByMatch(req, res);
});

// Update by an arbitrary column: PATCH /api/orders?match_column=order_number&match_value=KM-12345
app.patch('/api/:table', requireTable, async (req, res) => {
  await updateByMatch(req, res);
});

async function updateByMatch(req, res) {
  const { table, id } = req.params;
  const def = TABLES[table];
  const matchColumn = id ? def.pk : (req.query.match_column || def.pk);
  const matchValue = id !== undefined ? id : req.query.match_value;

  if (matchValue === undefined) {
    return res.status(400).json({ data: null, error: { message: 'No match column/value provided' } });
  }

  try {
    const { rows: existingRows } = await pool.query(
      `SELECT * FROM ${table} WHERE ${matchColumn} = $1`,
      [matchValue]
    );
    if (existingRows.length === 0) {
      return res.json({ data: [], error: null, count: 0 });
    }
    const existing = existingRows[0];
    const mergedPayload = { ...req.body };
    if (mergedPayload.data === undefined) {
      mergedPayload.data = existing.data;
    } else if (typeof mergedPayload.data !== 'string' && typeof existing.data === 'object') {
      mergedPayload.data = { ...existing.data, ...mergedPayload.data };
    }
    const { data, flat } = normalizeRow(table, { ...existing, ...mergedPayload });

    const setCols = ['data', ...Object.keys(flat), 'updated_at'];
    const setVals = [data, ...Object.values(flat), new Date()];
    const setClause = setCols.map((c, i) => `${c} = $${i + 1}`).join(', ');
    const sql = `UPDATE ${table} SET ${setClause} WHERE ${matchColumn} = $${setCols.length + 1} RETURNING *`;
    const { rows } = await pool.query(sql, [...setVals, matchValue]);
    res.json({ data: rows, error: null, count: rows.length });
  } catch (err) {
    res.status(400).json({ data: null, error: { message: err.message }, count: null });
  }
}

// Delete by primary key
app.delete('/api/:table/:id', requireTable, async (req, res) => {
  const { table, id } = req.params;
  const def = TABLES[table];
  try {
    const { rowCount } = await pool.query(`DELETE FROM ${table} WHERE ${def.pk} = $1`, [id]);
    res.json({ data: null, error: null, count: rowCount });
  } catch (err) {
    res.status(400).json({ data: null, error: { message: err.message } });
  }
});

// Delete by an arbitrary column: DELETE /api/orders?match_column=order_number&match_value=KM-12345
app.delete('/api/:table', requireTable, async (req, res) => {
  const { table } = req.params;
  const def = TABLES[table];
  const matchColumn = req.query.match_column || def.pk;
  const matchValue = req.query.match_value;
  if (matchValue === undefined) {
    return res.status(400).json({ data: null, error: { message: 'match_value is required' } });
  }
  try {
    const { rowCount } = await pool.query(`DELETE FROM ${table} WHERE ${matchColumn} = $1`, [matchValue]);
    res.json({ data: null, error: null, count: rowCount });
  } catch (err) {
    res.status(400).json({ data: null, error: { message: err.message } });
  }
});

export default app;
