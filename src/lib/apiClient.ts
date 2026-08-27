/// <reference types="vite/client" />

// Drop-in replacement for the Supabase JS client, backed by our own Express +
// Postgres (Neon) API instead of Supabase. It implements only the chain
// methods this codebase actually calls: select / insert / update / upsert /
// delete / eq / limit, plus a no-op realtime channel (live updates already
// fall back to 30s polling in StoreContext, so this is intentionally inert
// rather than a real websocket subscription).

type ApiResult<T = any> = { data: T | null; error: { message: string; code?: string } | null; count?: number | null };

class QueryBuilder {
  private baseUrl: string;
  private table: string;
  private filters: { column: string; value: any }[] = [];
  private limitN: number | null = null;
  private op: 'select' | 'insert' | 'update' | 'upsert' | 'delete' = 'select';
  private payload: any = null;
  private wantCount = false;

  constructor(baseUrl: string, table: string) {
    this.baseUrl = baseUrl;
    this.table = table;
  }

  select(_cols: string = '*') {
    this.op = 'select';
    return this;
  }

  insert(payload: any) {
    this.op = 'insert';
    this.payload = payload;
    return this;
  }

  upsert(payload: any, _opts?: { onConflict?: string }) {
    this.op = 'upsert';
    this.payload = payload;
    return this;
  }

  update(payload: any, opts?: { count?: 'exact' }) {
    this.op = 'update';
    this.payload = payload;
    this.wantCount = opts?.count === 'exact';
    return this;
  }

  delete() {
    this.op = 'delete';
    return this;
  }

  eq(column: string, value: any) {
    this.filters.push({ column, value });
    return this;
  }

  limit(n: number) {
    this.limitN = n;
    return this;
  }

  private async exec(): Promise<ApiResult> {
    try {
      const table = encodeURIComponent(this.table);
      if (this.op === 'select') {
        const qs = this.limitN ? `?limit=${this.limitN}` : '';
        const res = await fetch(`${this.baseUrl}/api/${table}${qs}`);
        const body = await res.json();
        if (!res.ok) return { data: null, error: body.error || { message: `HTTP ${res.status}` } };
        return { data: body.data, error: null };
      }

      if (this.op === 'insert' || this.op === 'upsert') {
        const res = await fetch(`${this.baseUrl}/api/${table}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.payload),
        });
        const body = await res.json();
        if (!res.ok) return { data: null, error: body.error || { message: `HTTP ${res.status}` } };
        return { data: body.data, error: null };
      }

      if (this.op === 'update') {
        const eqFilter = this.filters[0];
        let url: string;
        if (eqFilter && eqFilter.column === 'id') {
          url = `${this.baseUrl}/api/${table}/${encodeURIComponent(eqFilter.value)}`;
        } else if (eqFilter) {
          url = `${this.baseUrl}/api/${table}?match_column=${encodeURIComponent(eqFilter.column)}&match_value=${encodeURIComponent(eqFilter.value)}`;
        } else {
          return { data: null, error: { message: 'update() requires .eq()' } };
        }
        const res = await fetch(url, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(this.payload),
        });
        const body = await res.json();
        if (!res.ok) return { data: null, error: body.error || { message: `HTTP ${res.status}` }, count: null };
        return { data: body.data, error: null, count: this.wantCount ? body.count ?? null : undefined };
      }

      if (this.op === 'delete') {
        const eqFilter = this.filters[0];
        let url: string;
        if (eqFilter && eqFilter.column === 'id') {
          url = `${this.baseUrl}/api/${table}/${encodeURIComponent(eqFilter.value)}`;
        } else if (eqFilter) {
          url = `${this.baseUrl}/api/${table}?match_column=${encodeURIComponent(eqFilter.column)}&match_value=${encodeURIComponent(eqFilter.value)}`;
        } else {
          return { data: null, error: { message: 'delete() requires .eq()' } };
        }
        const res = await fetch(url, { method: 'DELETE' });
        const body = await res.json();
        if (!res.ok) return { data: null, error: body.error || { message: `HTTP ${res.status}` } };
        return { data: body.data, error: null, count: body.count ?? null };
      }

      return { data: null, error: { message: `Unsupported op ${this.op}` } };
    } catch (err: any) {
      return { data: null, error: { message: err?.message || 'Network error' } };
    }
  }

  then<TResult1 = ApiResult, TResult2 = never>(
    onfulfilled?: ((value: ApiResult) => TResult1 | PromiseLike<TResult1>) | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null
  ): Promise<TResult1 | TResult2> {
    return this.exec().then(onfulfilled as any, onrejected as any);
  }
}

// Minimal inert stand-in for supabase-js's realtime channel API. Live updates
// in this app already fall back to a 30s poll (see refreshSupabaseData in
// StoreContext.tsx), so this simply avoids crashing callers that still wire
// up .channel(...).on(...).subscribe() — it never actually pushes events.
class NoopChannel {
  on(_event: string, _filter: any, _cb: (...args: any[]) => void) {
    return this;
  }
  subscribe() {
    return this;
  }
}

export class ApiClient {
  private baseUrl: string;
  constructor(baseUrl: string) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
  }
  from(table: string) {
    return new QueryBuilder(this.baseUrl, table);
  }
  channel(_name: string) {
    return new NoopChannel();
  }
  removeChannel(_channel: any) {
    // no-op
  }
}
