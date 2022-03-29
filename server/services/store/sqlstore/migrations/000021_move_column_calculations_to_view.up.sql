{{if .mysql}}
UPDATE {{.prefix}}blocks SET
fields = JSON_SET(fields, '$.columnCalculations', (SELECT column_calculations FROM {{.prefix}}boards b WHERE b.id = board_id))
WHERE type = 'view'
AND board_id IN (SELECT id FROM {{.prefix}}boards WHERE json_length(column_calculations) > 0);
{{end}}

{{if .postgres}}
UPDATE {{.prefix}}blocks SET
fields = (fields::jsonb - 'columnCalculations' || jsonb_build_object('columnCalculations', (select column_calculations from {{.prefix}}boards b where b.id = board_id)::jsonb))::json
WHERE type = 'view'
AND board_id IN (SELECT id FROM {{.prefix}}boards WHERE column_calculations != '{}');
{{end}}
