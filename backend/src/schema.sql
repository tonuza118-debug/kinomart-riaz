-- KinoMart schema
-- Pattern: each table has a stable id + a few indexed "flat" columns used for
-- filtering/sorting, plus a `data` JSONB column holding the full object exactly
-- as the frontend's Product/Category/Order/... types expect it. The frontend
-- always reads from `data` first and falls back to the flat columns, so this
-- mirrors what it already assumed from Supabase.

CREATE TABLE IF NOT EXISTS products (
  id            text PRIMARY KEY,
  name          text NOT NULL DEFAULT '',
  price         numeric NOT NULL DEFAULT 0,
  category      text NOT NULL DEFAULT '',
  sub_category  text NOT NULL DEFAULT '',
  stock         integer NOT NULL DEFAULT 0,
  thumbnail     text NOT NULL DEFAULT '',
  status        text NOT NULL DEFAULT 'ACTIVE',
  data          jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS categories (
  id                  text PRIMARY KEY,
  name                text NOT NULL DEFAULT '',
  image               text NOT NULL DEFAULT '',
  position            integer NOT NULL DEFAULT 1,
  is_visible_on_home  boolean NOT NULL DEFAULT true,
  sub_categories      jsonb NOT NULL DEFAULT '[]'::jsonb,
  data                jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);

-- Rows keyed by purpose: id='main' -> StoreSettings, id='hero_slides' -> HeroSlide[],
-- id='promo_banner' -> PromoBannerConfig. Matches how the frontend already reads this table.
CREATE TABLE IF NOT EXISTS settings (
  id          text PRIMARY KEY,
  data        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS coupons (
  id          text PRIMARY KEY,
  code        text NOT NULL DEFAULT '',
  data        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS coupons_code_idx ON coupons ((upper(code)));

CREATE TABLE IF NOT EXISTS team (
  id          text PRIMARY KEY,
  name        text NOT NULL DEFAULT '',
  data        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id              text PRIMARY KEY,
  order_number    text NOT NULL DEFAULT '',
  customer_phone  text NOT NULL DEFAULT '',
  status          text NOT NULL DEFAULT 'Pending',
  call_status     text NOT NULL DEFAULT 'Not Called',
  data            jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS orders_order_number_idx ON orders (order_number);
CREATE INDEX IF NOT EXISTS orders_customer_phone_idx ON orders (customer_phone);

CREATE TABLE IF NOT EXISTS customer_profiles (
  phone       text PRIMARY KEY,
  data        jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now()
);
