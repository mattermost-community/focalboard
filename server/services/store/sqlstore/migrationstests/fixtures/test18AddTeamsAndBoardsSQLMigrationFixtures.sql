INSERT INTO Channels (Id, CreateAt, UpdateAt, DeleteAt, TeamId, Type, Name, CreatorId) VALUES ('chan-id', 123, 123, 0, 'team-id', 'O', 'channel', 'user-id');

INSERT INTO focalboard_blocks
(id, workspace_id, root_id, parent_id, created_by, modified_by, type, title, create_at, update_at, delete_at)
VALUES
('board-id', 'chan-id', 'board-id', 'board-id', 'user-id', 'user-id', 'board', 'My Board', 123, 123, 0),
('card-id', 'chan-id', 'board-id', 'board-id', 'user-id', 'user-id', 'card', 'A card', 123, 123, 0);
