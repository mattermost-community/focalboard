{{if .mysql}}
    UPDATE {{.prefix}}category_boards AS fcb 
        JOIN Preferences p 
        ON fcb.user_id = p.userid
        AND p.category = 'focalboard'
        AND p.name = 'hiddenBoardIDs'
        SET hidden = true
        WHERE p.value LIKE concat('%', fcb.board_id, '%');
{{end}}

{{if .postgres}}
    UPDATE {{.prefix}}category_boards fcb 
    SET hidden = true
    FROM preferences p
    WHERE p.userid = fcb.user_id 
    AND p.category = 'focalboard'
    AND p.name = 'hiddenBoardIDs'
    AND p.value like concat('%', fcb.board_id, '%');
{{end}}

{{if .sqlite}}
SELECT 1;
{{end}}