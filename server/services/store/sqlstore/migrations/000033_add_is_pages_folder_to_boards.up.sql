ALTER TABLE {{.prefix}}boards ADD COLUMN is_pages_folder BOOLEAN DEFAULT false;
ALTER TABLE {{.prefix}}boards_history ADD COLUMN is_pages_folder BOOLEAN DEFAULT false;
