INSERT INTO focalboard_blocks
(id, board_id, channel_id, created_by, modified_by, type, title, create_at, update_at, delete_at, fields)
VALUES
('image-3-1', 'board-1', '', 'user-id', 'user-id', 'image', 'image-3-1', 123, 123, 0, '{"fileId":"7fileinfo-3-1.png"}'),
('image-3-2', 'board-1', '', 'user-id', 'user-id', 'image', 'image-3-2', 123, 123, 0, '{"attachmentId":"7fileinfo-3-2.png"}'),
('image-3-3', 'board-1', '', 'user-id', 'user-id', 'image', 'image-3-3', 123, 123, 0, '{"fileId":"7fileinfo-3-3.png"}');

INSERT INTO FileInfo
(id, creatorid, createat, updateat, deleteat)
VALUES
('fileinfo-1', 'boards', 1, 1, 1000),
('fileinfo-2-1', 'boards', 1, 1, 2000),
('fileinfo-2-2', 'boards', 1, 1, 2000),
('fileinfo-3-1', 'boards', 1, 1, 3000),
('fileinfo-3-2', 'boards', 1, 1, 3000),
('fileinfo-3-3', 'boards', 1, 1, 3000),
('fileinfo-3-4', 'boards', 1, 1, 3000);
