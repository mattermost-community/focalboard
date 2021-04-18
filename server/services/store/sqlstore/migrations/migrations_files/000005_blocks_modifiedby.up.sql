ALTER TABLE {{.prefix}}blocks
ADD COLUMN modified_by VARCHAR(36);
