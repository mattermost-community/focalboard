{{if .plugin}}
    DELETE FROM Preferences WHERE category = 'karmaboard' AND name = 'hiddenBoardIDs';
{{else}}
    DELETE FROM {{.prefix}}preferences WHERE category = 'karmaboard' AND name = 'hiddenBoardIDs';
{{end}}