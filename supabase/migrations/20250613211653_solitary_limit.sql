/*
  # Create virtual cards table

  1. New Tables
    - `virtual_cards`
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `cardholder_id` (text, Stripe cardholder ID)
      - `card_id` (text, Stripe card ID)
      - `last4` (text, last 4 digits of card)
      - `status` (text, card status)
      - `is_locked` (boolean, whether card is locked)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  2. Security
    - Enable RLS on `virtual_cards` table
    - Add policy for authenticated users to read their own data
*/

-- Create virtual_cards table if it doesn't exist
CREATE TABLE IF NOT EXISTS virtual_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  cardholder_id text,
  card_id text,
  last4 text,
  status text DEFAULT 'active',
  is_locked boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE virtual_cards ENABLE ROW LEVEL SECURITY;

-- Create policy for users to view their own virtual cards
CREATE POLICY "Users can view their own virtual cards"
  ON virtual_cards
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);