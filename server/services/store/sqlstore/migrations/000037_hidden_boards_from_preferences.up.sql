{{if .plugin}}
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
        UPDATE {{.prefix}}category_boards as fcb 
            SET hidden = true
            FROM preferences p
            WHERE p.userid = fcb.user_id 
            AND p.category = 'focalboard'
            AND p.name = 'hiddenBoardIDs'
            AND p.value like ('%' || fcb.board_id || '%');
    {{end}}
{{else}}
    {{if .mysql}}
        UPDATE {{.prefix}}category_boards AS fcb 
            JOIN {{.prefix}}preferences p 
            ON fcb.user_id = p.userid
            AND p.category = 'focalboard'
            AND p.name = 'hiddenBoardIDs'
            SET hidden = true
            WHERE p.value LIKE concat('%', fcb.board_id, '%');
    {{end}}

    {{if .postgres}}
        UPDATE {{.prefix}}category_boards as fcb 
            SET hidden = true
            FROM {{.prefix}}preferences p
            WHERE p.userid = fcb.user_id 
            AND p.category = 'focalboard'
            AND p.name = 'hiddenBoardIDs'
            AND p.value like ('%' || fcb.board_id || '%');
    {{end}}
{{end}}

{{if .sqlite}}
    UPDATE {{.prefix}}category_boards
        SET hidden = true
        WHERE (user_id || '_' || board_id)
        IN
        (
            SELECT (fcb.user_id || '_' || fcb.board_id)
            FROM {{.prefix}}category_boards AS fcb
            JOIN {{.prefix}}preferences p 
            ON p.userid = fcb.user_id 
            AND p.category = 'focalboard'
            AND p.name = 'hiddenBoardIDs' WHERE 
            p.value LIKE ('%' || fcb.board_id || '%')
        );
{{end}}