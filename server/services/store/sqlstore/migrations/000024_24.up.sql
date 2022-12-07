UPDATE {{.prefix}}blocks b
  JOIN (
    SELECT id, fields->'$.columnCalculations' as board_calculations from {{.prefix}}blocks
    WHERE fields -> '$.columnCalculations' <> cast('{}' as json)
  ) AS s on s.id = b.root_id
  SET fields = JSON_SET(fields, '$.columnCalculations', cast(s.board_calculations as json))
  WHERE b.fields->'$.viewType' = 'table'
  AND b.type = 'view';