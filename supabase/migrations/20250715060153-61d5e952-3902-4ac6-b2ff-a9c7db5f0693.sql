-- Add a primary key to the prospects table to enable updates and deletes
ALTER TABLE prospects ADD COLUMN id SERIAL PRIMARY KEY;