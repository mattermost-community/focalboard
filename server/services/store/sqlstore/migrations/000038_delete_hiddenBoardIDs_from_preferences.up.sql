{{if or .postgres .mysql}}
    DELETE FROM Preferences WHERE category = 'focalboard' AND name = 'hiddenBoardIDs';
{{end}}

{{if .sqlite}}
    DELETE FROM {{.prefix}}preferences WHERE category = 'focalboard' AND name = 'hiddenBoardIDs';
{{end}}