-- Add archived column to messages table for message archiving feature
ALTER TABLE messages ADD COLUMN IF NOT EXISTS archived BOOLEAN DEFAULT false;
