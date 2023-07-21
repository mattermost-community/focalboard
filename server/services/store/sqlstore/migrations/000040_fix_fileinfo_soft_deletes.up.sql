{{if .plugin}}
  UPDATE FileInfo
     SET DeleteAt = 0
   WHERE CreatorId = 'boards'
     AND DeleteAt != 0;
{{else}}
SELECT 1;
{{end}}
