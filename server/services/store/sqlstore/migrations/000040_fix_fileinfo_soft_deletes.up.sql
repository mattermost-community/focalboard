{{if .plugin}}
  {{if .mysql}}
  UPDATE FileInfo SET DeleteAt = 0 WHERE Id IN (
    SELECT fileinfoids.Id
      FROM {{.prefix}}blocks b
      JOIN (
        SELECT Id FROM FileInfo WHERE DeleteAt IN (
          SELECT DeleteAt
            FROM FileInfo
           WHERE CreatorId = 'boards'
             AND DeleteAt != 0
        GROUP BY DeleteAt
          HAVING COUNT(DeleteAt) > 1
        )
      ) AS fileinfoids
      ON JSON_EXTRACT(b.fields, '$.fileId') LIKE CONCAT('%', fileinfoids.Id, '%')
      OR JSON_EXTRACT(b.fields, '$.attachmentId') LIKE CONCAT('%', fileinfoids.Id, '%')
  );
  {{end}}

  {{if .postgres}}
  WITH fileinfoids AS (
    SELECT Id FROM FileInfo WHERE DeleteAt IN (
      SELECT DeleteAt
        FROM FileInfo
       WHERE CreatorId = 'boards'
         AND DeleteAt != 0
    GROUP BY DeleteAt
      HAVING count(DeleteAt) > 1
    )
  )
  UPDATE FileInfo SET DeleteAt = 0 WHERE Id IN (
    SELECT fileinfoids.Id
      FROM {{.prefix}}blocks b
      JOIN fileinfoids
        ON b.fields->>'fileId' LIKE '%' || fileinfoids.Id || '%'
        OR b.fields->>'attachmentId' LIKE '%' || fileinfoids.Id || '%'
  );
  {{end}}
{{else}}
SELECT 1;
{{end}}
