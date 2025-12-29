-- Create incomes table for income tracking
CREATE TABLE IF NOT EXISTS incomes (
  id BIGSERIAL PRIMARY KEY,
  user_id TEXT NOT NULL,
  amount DECIMAL(15, 2) NOT NULL,
  source TEXT NOT NULL,
  description TEXT,
  date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add RLS (Row Level Security) policies
ALTER TABLE incomes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own incomes
CREATE POLICY "Users can view their own incomes"
  ON incomes FOR SELECT
  USING (auth.uid()::text = user_id);

-- Policy: Users can insert their own incomes
CREATE POLICY "Users can insert their own incomes"
  ON incomes FOR INSERT
  WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can update their own incomes
CREATE POLICY "Users can update their own incomes"
  ON incomes FOR UPDATE
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

-- Policy: Users can delete their own incomes
CREATE POLICY "Users can delete their own incomes"
  ON incomes FOR DELETE
  USING (auth.uid()::text = user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_incomes_user_id ON incomes(user_id);
CREATE INDEX IF NOT EXISTS idx_incomes_date ON incomes(date);
CREATE INDEX IF NOT EXISTS idx_incomes_user_date ON incomes(user_id, date);

-- If table already exists, update the amount column to support larger numbers
-- Run this if you get errors with large numbers
ALTER TABLE incomes ALTER COLUMN amount TYPE DECIMAL(15, 2);

