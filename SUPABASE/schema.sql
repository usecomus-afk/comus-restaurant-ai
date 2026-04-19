-- Comus CRM — Supabase Schema
-- Supabase SQL Editor'da çalıştır.

CREATE TABLE IF NOT EXISTS conversations (
  id          uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id text NOT NULL,
  table_number  text NOT NULL,
  messages    jsonb DEFAULT '[]',
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS orders (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id text NOT NULL,
  table_number  text NOT NULL,
  items         jsonb NOT NULL,
  total         integer NOT NULL DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS feedback (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id text NOT NULL,
  table_number  text NOT NULL DEFAULT '',
  rating        integer NOT NULL CHECK (rating BETWEEN 1 AND 5),
  guest_name    text,
  phone         text,
  message       text,
  created_at    timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS menu_items (
  id            uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id text NOT NULL,
  item_id       text NOT NULL,
  category      text NOT NULL,
  name          text NOT NULL,
  price         integer DEFAULT 0,
  description   text,
  allergens     text[] DEFAULT '{}',
  is_active     boolean DEFAULT true,
  updated_at    timestamptz DEFAULT now(),
  created_at    timestamptz DEFAULT now(),
  UNIQUE(restaurant_id, item_id)
);

-- İndeksler
CREATE INDEX IF NOT EXISTS idx_conversations_restaurant ON conversations(restaurant_id, table_number);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant        ON orders(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_restaurant      ON feedback(restaurant_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant    ON menu_items(restaurant_id, item_id);
